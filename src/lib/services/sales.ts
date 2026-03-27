import "server-only";
import { FieldPath } from "firebase-admin/firestore";
import type {
    PaymentMethod,
    PaymentStatus,
    Sale,
    SaleActivityRef,
    SaleAppliedPromotionRef,
    SaleCaseRef,
    SaleCreatedEntitlementRef,
    SaleCreatedPickupReservationRef,
    SaleGiftItem,
    SaleLineItem,
    SalePricingAdjustment,
} from "@/lib/types/sale";
import type { CursorPageResult } from "@/lib/types/pagination";
import type { CheckoutPromotionSelection, PromotionEffectType } from "@/lib/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { createEntitlementsFromCheckoutPromotions } from "@/lib/services/entitlements";
import { adjustInventoryLevels } from "@/lib/services/inventory";
import { createPickupReservationsFromPromotionDrafts } from "@/lib/services/pickupReservations";
import { evaluateCheckoutPromotions } from "@/lib/services/promotions";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import { listTickets, setTicketStatusById } from "@/lib/services/ticket";
import { attachUsedProductToReceipt, getUsedProductById } from "@/lib/services/used-products.service";
import type { Ticket } from "@/lib/types/ticket";

const memory: { salesByCompany: Record<string, Sale[]> } = { salesByCompany: {} };

const MAX_TEXT = 160;
const MAX_QUERY = 120;
const MAX_MONEY = 100000000;
const MAX_ACTIVITY_CONTENT = 800;
const MAX_LINE_ITEMS = 20;
const MAX_CASE_REFS = 20;
const MAX_ACTIVITY_REFS = 20;
const MAX_PROMOTION_REFS = 40;

type SessionScope = {
    companyId: string;
};
type SaleCursor = {
    checkoutAt: number;
    id: string;
};
type CheckoutSalesPageQuery = {
    keyword?: string;
    pageSize?: number;
    cursor?: string;
};

function now() {
    return Date.now();
}

function id() {
    return `s_${Math.random().toString(16).slice(2)}_${now()}`;
}

function toStr(v: unknown): string {
    return typeof v === "string" ? v.trim() : "";
}

function safeText(value: string, max: number): string {
    return value.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, max).trim();
}

function normalizeCompanyId(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/[/?#]/.test(trimmed)) return null;
    return trimmed;
}

function parseMoney(v: unknown): number {
    const n = typeof v === "number" ? v : Number(toStr(v).replace(/,/g, ""));
    if (!Number.isFinite(n)) return 0;
    if (n < 0) return 0;
    if (n > MAX_MONEY) return MAX_MONEY;
    return Math.round(n);
}

function parsePaymentMethod(v: unknown): PaymentMethod {
    return v === "card" ? "card" : "cash";
}

function parsePaymentStatus(v: unknown): PaymentStatus {
    if (v === "unpaid") return "unpaid";
    if (v === "deposit") return "deposit";
    if (v === "installment") return "installment";
    return "paid";
}

function parseCheckoutAt(v: unknown): number {
    const text = toStr(v);
    if (!text) return now();
    const ts = Date.parse(text);
    if (!Number.isFinite(ts)) return now();
    return ts;
}

function parseOptionalTimestamp(v: unknown): number | undefined {
    const text = toStr(v);
    if (!text) return undefined;
    const ts = Date.parse(text);
    if (!Number.isFinite(ts)) return undefined;
    return ts;
}

function parsePromotionEffectType(value: unknown): PromotionEffectType {
    if (value === "bundle_price") return "bundle_price";
    if (value === "gift_item") return "gift_item";
    if (value === "create_entitlement") return "create_entitlement";
    if (value === "create_pickup_reservation") return "create_pickup_reservation";
    return "discount";
}

function normalizePageSize(input: number | undefined, fallback = 20): number {
    const value = Number(input);
    if (!Number.isFinite(value)) return fallback;
    if (value <= 10) return 10;
    if (value <= 20) return 20;
    if (value <= 50) return 50;
    return 100;
}

function encodeSaleCursorValue(cursor: SaleCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeSaleCursorValue(value: string | undefined): SaleCursor | null {
    const text = safeText(toStr(value), 240);
    if (!text) return null;
    try {
        const parsed = JSON.parse(Buffer.from(text, "base64url").toString("utf8")) as Partial<SaleCursor>;
        const checkoutAt = Number(parsed.checkoutAt);
        const idValue = safeText(toStr(parsed.id), 120);
        if (!Number.isFinite(checkoutAt) || checkoutAt <= 0 || !idValue) return null;
        return { checkoutAt: Math.round(checkoutAt), id: idValue };
    } catch {
        return null;
    }
}

function saleMatchesKeyword(sale: Sale, keyword?: string): boolean {
    const q = safeText(keyword ?? "", MAX_QUERY).toLowerCase();
    if (!q) return true;
    const itemKeywords = (sale.lineItems ?? [])
        .map((row) =>
            [
                row.productName,
                row.productId,
                String(row.qty),
                String(row.unitPrice),
                String(row.subtotal),
                row.usedProductId ?? "",
                row.usedBrand ?? "",
                row.usedModel ?? "",
                row.usedGrade ?? "",
                row.usedSerialOrImei ?? "",
                row.isUsedProduct ? "used" : "",
            ].join(" "),
        )
        .join(" ");
    const caseKeywords = (sale.caseRefs ?? [])
        .map((row) => [row.caseId, row.caseNo, row.caseTitle].join(" "))
        .join(" ");
    const activityKeywords = (sale.activityRefs ?? [])
        .map((row) => [row.activityId, row.activityName, row.activityContent ?? "", row.checkoutStatus ?? "", String(row.storeQty ?? 0)].join(" "))
        .join(" ");
    const promotionKeywords = (sale.appliedPromotions ?? [])
        .map((row) => [row.promotionId, row.promotionName, row.effectType].join(" "))
        .join(" ");
    const entitlementKeywords = (sale.createdEntitlements ?? [])
        .map((row) => [row.entitlementId, row.entitlementType, row.scopeType, row.categoryName ?? "", row.productName ?? ""].join(" "))
        .join(" ");
    const reservationKeywords = (sale.createdPickupReservations ?? [])
        .map((row) => [row.reservationId, row.status, String(row.lineItemCount)].join(" "))
        .join(" ");
    const haystack = [
        sale.id,
        sale.item,
        String(sale.amount),
        sale.paymentMethod,
        sale.paymentStatus ?? "",
        sale.receiptNo ?? "",
        sale.source ?? "",
        sale.customerName ?? "",
        sale.customerPhone ?? "",
        sale.customerEmail ?? "",
        sale.caseId ?? "",
        sale.caseTitle ?? "",
        String(sale.checkoutAt),
        String(sale.updatedAt),
        sale.companyId ?? "",
        itemKeywords,
        caseKeywords,
        activityKeywords,
        promotionKeywords,
        entitlementKeywords,
        reservationKeywords,
    ]
        .join(" ")
        .toLowerCase();
    return haystack.includes(q);
}

function normalizeSale(input: Partial<Sale> & { id: string }): Sale {
    const createdAt = typeof input.createdAt === "number" ? input.createdAt : now();
    const checkoutAt = typeof input.checkoutAt === "number" ? input.checkoutAt : createdAt;

    const extra = input as Record<string, unknown>;
    const companyId = safeText(toStr(extra.companyId), 120);
    const lineItems = Array.isArray(input.lineItems)
        ? input.lineItems
              .map((raw) => {
                  const item = raw as Partial<SaleLineItem>;
                  const productId = safeText(toStr(item.productId), 120);
                  const productName = safeText(toStr(item.productName), MAX_TEXT) || "未命名商品";
                  const qty = Math.max(1, Math.round(parseMoney(item.qty)));
                  const unitPrice = parseMoney(item.unitPrice);
                  const subtotal = parseMoney(item.subtotal || qty * unitPrice);
                  return {
                      productId,
                      productName,
                      qty,
                      unitPrice,
                      subtotal,
                      isUsedProduct: item.isUsedProduct === true,
                      usedProductId: safeText(toStr(item.usedProductId), 120) || undefined,
                      usedBrand: safeText(toStr(item.usedBrand), 120) || undefined,
                      usedModel: safeText(toStr(item.usedModel), 120) || undefined,
                      usedGrade: safeText(toStr(item.usedGrade), 80) || undefined,
                      usedSerialOrImei: safeText(toStr(item.usedSerialOrImei), 120) || undefined,
                  } satisfies SaleLineItem;
              })
              .slice(0, MAX_LINE_ITEMS)
        : [];
    const caseRefs = Array.isArray(input.caseRefs)
        ? input.caseRefs
              .map((raw) => {
                  const row = raw as Partial<SaleCaseRef>;
                  const caseId = safeText(toStr(row.caseId), 120);
                  const caseNo = safeText(toStr(row.caseNo), 60);
                  const caseTitle = safeText(toStr(row.caseTitle), MAX_TEXT);
                  if (!caseId) return null;
                  return { caseId, caseNo, caseTitle };
              })
              .filter((row): row is SaleCaseRef => row !== null)
              .slice(0, MAX_CASE_REFS)
        : [];
    const activityRefs = Array.isArray(input.activityRefs)
        ? input.activityRefs
              .map((raw) => {
                  const row = raw as Partial<SaleActivityRef>;
                  const activityId = safeText(toStr(row.activityId), 120);
                  const activityName = safeText(toStr(row.activityName), MAX_TEXT);
                  if (!activityName) return null;
                  const activityContent = safeText(toStr(row.activityContent), MAX_ACTIVITY_CONTENT);
                  const checkoutStatus = row.checkoutStatus === "stored" ? "stored" : "settled";
                  const storeQty = checkoutStatus === "stored" ? Math.max(1, Math.round(parseMoney(row.storeQty))) : 0;
                  const normalized: SaleActivityRef = {
                      activityId,
                      activityName,
                      checkoutStatus,
                      storeQty,
                      effectType: parsePromotionEffectType(row.effectType),
                      note: safeText(toStr(row.note), MAX_ACTIVITY_CONTENT) || undefined,
                  };
                  if (activityContent) normalized.activityContent = activityContent;
                  return normalized;
              })
              .filter((row): row is SaleActivityRef => row !== null)
              .slice(0, MAX_ACTIVITY_REFS)
        : [];
    const appliedPromotions = Array.isArray(input.appliedPromotions)
        ? input.appliedPromotions
              .map((raw) => {
                  const row = raw as Partial<SaleAppliedPromotionRef>;
                  const promotionName = safeText(toStr(row.promotionName), MAX_TEXT);
                  if (!promotionName) return null;
                  return {
                      promotionId: safeText(toStr(row.promotionId), 120),
                      promotionName,
                      effectType: parsePromotionEffectType(row.effectType),
                  } satisfies SaleAppliedPromotionRef;
              })
              .filter((row): row is SaleAppliedPromotionRef => row !== null)
              .slice(0, MAX_PROMOTION_REFS)
        : [];
    const pricingAdjustments = Array.isArray(input.pricingAdjustments)
        ? input.pricingAdjustments
              .map((raw) => {
                  const row = raw as Partial<SalePricingAdjustment>;
                  const promotionName = safeText(toStr(row.promotionName), MAX_TEXT);
                  if (!promotionName) return null;
                  const effectType = row.effectType === "bundle_price" ? "bundle_price" : "discount";
                  return {
                      promotionId: safeText(toStr(row.promotionId), 120),
                      promotionName,
                      effectType,
                      amount: parseMoney(row.amount),
                  } satisfies SalePricingAdjustment;
              })
              .filter((row): row is SalePricingAdjustment => row !== null)
              .slice(0, MAX_PROMOTION_REFS)
        : [];
    const giftItems = Array.isArray(input.giftItems)
        ? input.giftItems
              .map((raw) => {
                  const row = raw as Partial<SaleGiftItem>;
                  const productName = safeText(toStr(row.productName), MAX_TEXT);
                  if (!productName) return null;
                  return {
                      promotionId: safeText(toStr(row.promotionId), 120),
                      promotionName: safeText(toStr(row.promotionName), MAX_TEXT) || "促銷活動",
                      productId: safeText(toStr(row.productId), 120),
                      productName,
                      qty: Math.max(1, parseMoney(row.qty)),
                  } satisfies SaleGiftItem;
              })
              .filter((row): row is SaleGiftItem => row !== null)
              .slice(0, MAX_PROMOTION_REFS)
        : [];
    const createdEntitlements: SaleCreatedEntitlementRef[] = [];
    if (Array.isArray(input.createdEntitlements)) {
        for (const raw of input.createdEntitlements) {
            const row = raw as Partial<SaleCreatedEntitlementRef>;
            const entitlementId = safeText(toStr(row.entitlementId), 120);
            if (!entitlementId) continue;
            createdEntitlements.push({
                entitlementId,
                entitlementType:
                    row.entitlementType === "gift" || row.entitlementType === "discount" || row.entitlementType === "service"
                        ? row.entitlementType
                        : "replacement",
                scopeType: row.scopeType === "product" ? "product" : "category",
                categoryName: safeText(toStr(row.categoryName), MAX_TEXT) || undefined,
                productName: safeText(toStr(row.productName), MAX_TEXT) || undefined,
                remainingQty: Math.max(0, parseMoney(row.remainingQty)),
                expiresAt: typeof row.expiresAt === "number" && Number.isFinite(row.expiresAt) ? Math.round(row.expiresAt) : undefined,
            });
            if (createdEntitlements.length >= MAX_PROMOTION_REFS) break;
        }
    }
    const createdPickupReservations: SaleCreatedPickupReservationRef[] = [];
    if (Array.isArray(input.createdPickupReservations)) {
        for (const raw of input.createdPickupReservations) {
            const row = raw as Partial<SaleCreatedPickupReservationRef>;
            const reservationId = safeText(toStr(row.reservationId), 120);
            if (!reservationId) continue;
            const status =
                row.status === "pending" ||
                row.status === "packed" ||
                row.status === "ready_for_pickup" ||
                row.status === "picked_up" ||
                row.status === "cancelled" ||
                row.status === "expired"
                    ? row.status
                    : "reserved";
            createdPickupReservations.push({
                reservationId,
                status,
                lineItemCount: Math.max(0, parseMoney(row.lineItemCount)),
                expiresAt: typeof row.expiresAt === "number" && Number.isFinite(row.expiresAt) ? Math.round(row.expiresAt) : undefined,
            });
            if (createdPickupReservations.length >= MAX_PROMOTION_REFS) break;
        }
    }
    const legacyCaseId = safeText(toStr(input.caseId), 120);
    const legacyCaseTitle = safeText(toStr(input.caseTitle), MAX_TEXT);
    const normalizedCaseRefs =
        caseRefs.length > 0
            ? caseRefs
            : legacyCaseId
              ? [{ caseId: legacyCaseId, caseNo: legacyCaseId, caseTitle: legacyCaseTitle }]
              : [];

    return {
        id: input.id,
        item: safeText(toStr(input.item), MAX_TEXT) || "Untitled Item",
        amount: parseMoney(input.amount),
        checkoutAt,
        paymentMethod: parsePaymentMethod(input.paymentMethod),
        paymentStatus: parsePaymentStatus(input.paymentStatus),
        source: input.source === "checkout" ? "checkout" : "sales",
        receiptNo: safeText(toStr(input.receiptNo), 60) || undefined,
        customerId: safeText(toStr(input.customerId), 120) || undefined,
        customerName: safeText(toStr(input.customerName), MAX_TEXT) || undefined,
        customerPhone: safeText(toStr(input.customerPhone), 40) || undefined,
        customerEmail: safeText(toStr(input.customerEmail), MAX_TEXT).toLowerCase() || undefined,
        caseId: legacyCaseId || undefined,
        caseTitle: legacyCaseTitle || undefined,
        caseRefs: normalizedCaseRefs,
        activityRefs,
        appliedPromotions,
        pricingAdjustments,
        giftItems,
        createdEntitlements,
        createdPickupReservations,
        lineItems,
        companyId: companyId || undefined,
        createdAt,
        updatedAt: typeof input.updatedAt === "number" ? input.updatedAt : createdAt,
    };
}

function validateInput(payload: {
    item: string;
    amount: string;
    checkoutAt: string;
    paymentMethod: string;
    paymentStatus?: string;
}): {
    item: string;
    amount: number;
    checkoutAt: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    source: "sales";
    lineItems: SaleLineItem[];
} | null {
    const item = safeText(payload.item, MAX_TEXT);
    const amount = parseMoney(payload.amount);
    const checkoutAt = parseCheckoutAt(payload.checkoutAt);
    const paymentMethod = parsePaymentMethod(payload.paymentMethod);
    const paymentStatus = parsePaymentStatus(payload.paymentStatus);

    if (!item) return null;
    return {
        item,
        amount,
        checkoutAt,
        paymentMethod,
        paymentStatus,
        source: "sales",
        lineItems: [
            {
                productId: "",
                productName: item,
                qty: 1,
                unitPrice: amount,
                subtotal: amount,
            },
        ],
    };
}

async function resolveSessionScope(requireCompany = true): Promise<SessionScope | null> {
    const session = await getSessionUser();
    if (!session) return null;

    const user = await getUserDoc(session.uid);
    if (!user) return null;

    const accountType = toAccountType(user.role);
    if (requireCompany && accountType !== "company") return null;

    const companyId = normalizeCompanyId(getShowcaseTenantId(user, session.uid));
    if (!companyId) return null;

    return { companyId };
}

async function getFirestoreDb() {
    try {
        const mod = await import("@/lib/firebase-server");
        return mod.fbAdminDb;
    } catch {
        return null;
    }
}

function companySalesRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/sales`);
}

type CreateSaleParams = {
    item: string;
    amount: number;
    checkoutAt: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    source: "sales" | "checkout";
    receiptNo?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    caseId?: string;
    caseTitle?: string;
    caseRefs?: SaleCaseRef[];
    activityRefs?: SaleActivityRef[];
    appliedPromotions?: SaleAppliedPromotionRef[];
    pricingAdjustments?: SalePricingAdjustment[];
    giftItems?: SaleGiftItem[];
    createdEntitlements?: SaleCreatedEntitlementRef[];
    createdPickupReservations?: SaleCreatedPickupReservationRef[];
    lineItems: SaleLineItem[];
};

function buildSaleRecord(companyId: string, docId: string, params: CreateSaleParams): Sale {
    const ts = now();
    return normalizeSale({
        id: docId,
        item: params.item,
        amount: params.amount,
        checkoutAt: params.checkoutAt,
        paymentMethod: params.paymentMethod,
        paymentStatus: params.paymentStatus,
        source: params.source,
        receiptNo: params.receiptNo,
        customerId: params.customerId,
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        customerEmail: params.customerEmail,
        caseId: params.caseId,
        caseTitle: params.caseTitle,
        caseRefs: params.caseRefs,
        activityRefs: params.activityRefs,
        appliedPromotions: params.appliedPromotions,
        pricingAdjustments: params.pricingAdjustments,
        giftItems: params.giftItems,
        createdEntitlements: params.createdEntitlements,
        createdPickupReservations: params.createdPickupReservations,
        lineItems: params.lineItems,
        companyId,
        createdAt: ts,
        updatedAt: ts,
    });
}

function listFromMemory(companyId: string): Sale[] {
    return [...(memory.salesByCompany[companyId] ?? [])].sort((a, b) => b.checkoutAt - a.checkoutAt);
}

function upsertMemorySale(companyId: string, sale: Sale): void {
    const list = memory.salesByCompany[companyId] ?? [];
    memory.salesByCompany[companyId] = [sale, ...list.filter((item) => item.id !== sale.id)];
}

function removeMemorySale(companyId: string, saleId: string): boolean {
    const list = memory.salesByCompany[companyId] ?? [];
    const next = list.filter((sale) => sale.id !== saleId);
    const removed = next.length !== list.length;
    memory.salesByCompany[companyId] = next;
    return removed;
}

async function listFromFirebase(companyId: string): Promise<Sale[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const snap = await companySalesRef(db, companyId).orderBy("checkoutAt", "desc").limit(200).get();
    return snap.docs.map((doc) => normalizeSale({ id: doc.id, ...(doc.data() as Partial<Sale>) }));
}

async function createInMemory(
    companyId: string,
    params: CreateSaleParams,
): Promise<Sale> {
    const sale = buildSaleRecord(companyId, id(), params);
    upsertMemorySale(companyId, sale);
    return sale;
}

async function createInFirebase(
    companyId: string,
    params: CreateSaleParams,
): Promise<Sale | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const docId = id();
    const sale = buildSaleRecord(companyId, docId, params);

    await companySalesRef(db, companyId).doc(docId).set(sale, { merge: false });
    return sale;
}

async function patchSaleArtifacts(companyId: string, saleId: string, patch: Partial<Sale>): Promise<Sale | null> {
    const targetId = safeText(saleId, 120);
    if (!targetId) return null;

    const memoryList = memory.salesByCompany[companyId] ?? [];
    const memorySale = memoryList.find((sale) => sale.id === targetId);
    if (memorySale) {
        const merged = normalizeSale({
            ...memorySale,
            ...patch,
            id: memorySale.id,
            updatedAt: now(),
        });
        upsertMemorySale(companyId, merged);
    }

    const db = await getFirestoreDb();
    if (!db) return memorySale ? normalizeSale({ ...memorySale, ...patch, id: memorySale.id }) : null;

    const ref = companySalesRef(db, companyId).doc(targetId);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const current = normalizeSale({ id: snap.id, ...(snap.data() as Partial<Sale>) });
    const next = normalizeSale({
        ...current,
        ...patch,
        id: current.id,
        updatedAt: now(),
    });
    await ref.set(next, { merge: true });
    return next;
}

async function deleteInFirebase(companyId: string, saleId: string): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const ref = companySalesRef(db, companyId).doc(saleId);
    const snap = await ref.get();
    if (!snap.exists) return false;
    await ref.delete();
    return true;
}

async function updateInMemory(
    companyId: string,
    params: {
        id: string;
        item?: string;
        amount?: number;
        checkoutAt?: number;
        paymentMethod?: PaymentMethod;
    },
): Promise<Sale | null> {
    const list = memory.salesByCompany[companyId] ?? [];
    const target = list.find((sale) => sale.id === params.id);
    if (!target) return null;

    if (params.item && params.item.trim()) target.item = params.item.trim();
    if (params.amount !== undefined) target.amount = params.amount;
    if (params.checkoutAt !== undefined) target.checkoutAt = params.checkoutAt;
    if (params.paymentMethod !== undefined) target.paymentMethod = params.paymentMethod;
    target.updatedAt = now();
    upsertMemorySale(companyId, target);
    return target;
}

async function updateInFirebase(
    companyId: string,
    params: {
        id: string;
        item?: string;
        amount?: number;
        checkoutAt?: number;
        paymentMethod?: PaymentMethod;
    },
): Promise<Sale | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const ref = companySalesRef(db, companyId).doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) return null;

    const current = normalizeSale({ id: snap.id, ...(snap.data() as Partial<Sale>) });
    const next: Sale = {
        ...current,
        item: params.item && params.item.trim() ? params.item.trim() : current.item,
        amount: params.amount !== undefined ? params.amount : current.amount,
        checkoutAt: params.checkoutAt !== undefined ? params.checkoutAt : current.checkoutAt,
        paymentMethod: params.paymentMethod !== undefined ? params.paymentMethod : current.paymentMethod,
        companyId,
        updatedAt: now(),
    };

    await ref.set(next, { merge: true });
    return next;
}

function filterSales(sales: Sale[], keyword?: string): Sale[] {
    return sales.filter((sale) => saleMatchesKeyword(sale, keyword));
}

async function listCheckoutSalesPageFromFirebase(companyId: string, params: CheckoutSalesPageQuery): Promise<CursorPageResult<Sale> | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const pageSize = normalizePageSize(params.pageSize, 20);
    const batchSize = Math.max(pageSize * 3, 40);
    const decodedCursor = decodeSaleCursorValue(params.cursor);
    const buildBaseQuery = () => companySalesRef(db, companyId).where("source", "==", "checkout").orderBy("checkoutAt", "desc").orderBy(FieldPath.documentId(), "desc");

    let query = buildBaseQuery();
    if (decodedCursor) query = query.startAfter(decodedCursor.checkoutAt, decodedCursor.id);

    const items: Sale[] = [];

    for (let round = 0; round < 8; round += 1) {
        const snap = await query.limit(batchSize).get();
        if (snap.empty) break;

        const docs = snap.docs;
        let lastCursorInBatch: SaleCursor | null = null;

        for (let index = 0; index < docs.length; index += 1) {
            const doc = docs[index];
            const sale = normalizeSale({ id: doc.id, ...(doc.data() as Partial<Sale>) });
            lastCursorInBatch = { checkoutAt: sale.checkoutAt, id: sale.id };
            if (!saleMatchesKeyword(sale, params.keyword)) continue;
            items.push(sale);
            if (items.length >= pageSize) {
                const hasNextPage = index < docs.length - 1 || docs.length === batchSize;
                return {
                    items,
                    pageSize,
                    nextCursor: hasNextPage ? encodeSaleCursorValue(lastCursorInBatch) : "",
                    hasNextPage,
                };
            }
        }

        if (!lastCursorInBatch || docs.length < batchSize) break;
        query = buildBaseQuery().startAfter(lastCursorInBatch.checkoutAt, lastCursorInBatch.id);
    }

    return {
        items,
        pageSize,
        nextCursor: "",
        hasNextPage: false,
    };
}

function listCheckoutSalesPageFromMemory(companyId: string, params: CheckoutSalesPageQuery): CursorPageResult<Sale> {
    const pageSize = normalizePageSize(params.pageSize, 20);
    const currentCursor = decodeSaleCursorValue(params.cursor);
    const ordered = listFromMemory(companyId)
        .filter((sale) => sale.source === "checkout")
        .filter((sale) => saleMatchesKeyword(sale, params.keyword))
        .sort((a, b) => (b.checkoutAt === a.checkoutAt ? b.id.localeCompare(a.id) : b.checkoutAt - a.checkoutAt));
    const startIndex = currentCursor
        ? Math.max(
              0,
              ordered.findIndex((item) => item.checkoutAt === currentCursor.checkoutAt && item.id === currentCursor.id) + 1,
          )
        : 0;
    const items = ordered.slice(startIndex, startIndex + pageSize);
    const lastItem = items.at(-1);
    const hasNextPage = startIndex + pageSize < ordered.length;
    return {
        items,
        pageSize,
        nextCursor: hasNextPage && lastItem ? encodeSaleCursorValue({ checkoutAt: lastItem.checkoutAt, id: lastItem.id }) : "",
        hasNextPage,
    };
}

export async function listSales(): Promise<Sale[]> {
    const scope = await resolveSessionScope(true);
    if (!scope) return [];

    try {
        const firebaseSales = await listFromFirebase(scope.companyId);
        if (firebaseSales) return firebaseSales;
    } catch {
        // fallback to memory
    }

    return listFromMemory(scope.companyId);
}

export async function querySales(keyword?: string): Promise<Sale[]> {
    const sales = await listSales();
    return filterSales(sales, keyword);
}

export async function queryCheckoutSales(keyword?: string): Promise<Sale[]> {
    const sales = await querySales(keyword);
    return sales.filter((sale) => sale.source === "checkout");
}

export async function queryCheckoutSalesPage(params: CheckoutSalesPageQuery = {}): Promise<CursorPageResult<Sale>> {
    const scope = await resolveSessionScope(true);
    if (!scope) {
        return {
            items: [],
            pageSize: normalizePageSize(params.pageSize, 20),
            nextCursor: "",
            hasNextPage: false,
        };
    }

    try {
        const firebasePage = await listCheckoutSalesPageFromFirebase(scope.companyId, params);
        if (firebasePage) return firebasePage;
    } catch {
        // fallback to memory
    }

    return listCheckoutSalesPageFromMemory(scope.companyId, params);
}

function buildReceiptNo(ts: number): string {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const serial = String(ts).slice(-6);
    return `RC-${yyyy}${mm}${dd}-${serial}`;
}

function buildCaseNoFromTicket(ticket: Ticket): string {
    const d = new Date(ticket.createdAt > 0 ? ticket.createdAt : now());
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const suffix = ticket.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "0000";
    return `CASE-${yyyy}${mm}${dd}-${suffix}`;
}

function parsePromotionSelections(formData: FormData): {
    activityRefs: SaleActivityRef[];
    selectedPromotions: CheckoutPromotionSelection[];
} {
    const refs: SaleActivityRef[] = [];
    const promotions: CheckoutPromotionSelection[] = [];
    const rawSelections = formData.getAll("promotionSelection[]");

    for (const raw of rawSelections) {
        const text = toStr(raw);
        if (!text) continue;
        try {
            const parsed = JSON.parse(text) as Record<string, unknown>;
            const promotionId = safeText(toStr(parsed.promotionId ?? parsed.id), 120);
            const promotionName = safeText(toStr(parsed.promotionName ?? parsed.name), MAX_TEXT);
            if (!promotionName) continue;
            const note = safeText(toStr(parsed.note ?? parsed.content), MAX_ACTIVITY_CONTENT);
            const effectType = parsePromotionEffectType(parsed.effectType);
            const scopeType = parsed.scopeType === "product" ? "product" : "category";
            const selection: CheckoutPromotionSelection = {
                promotionId,
                promotionName,
                effectType,
                scopeType,
                entitlementType:
                    parsed.entitlementType === "gift" || parsed.entitlementType === "discount" || parsed.entitlementType === "service"
                        ? parsed.entitlementType
                        : "replacement",
                categoryId: safeText(toStr(parsed.categoryId), 120) || undefined,
                categoryName: safeText(toStr(parsed.categoryName), MAX_TEXT) || undefined,
                productId: safeText(toStr(parsed.productId), 120) || undefined,
                productName: safeText(toStr(parsed.productName), MAX_TEXT) || undefined,
                discountAmount: parseMoney(parsed.discountAmount),
                bundlePriceDiscount: parseMoney(parsed.bundlePriceDiscount),
                giftProductId: safeText(toStr(parsed.giftProductId), 120) || undefined,
                giftProductName: safeText(toStr(parsed.giftProductName), MAX_TEXT) || undefined,
                giftQty: Math.max(1, parseMoney(parsed.giftQty)),
                entitlementQty: Math.max(1, parseMoney(parsed.entitlementQty)),
                entitlementExpiresAt:
                    typeof parsed.entitlementExpiresAt === "number" && Number.isFinite(parsed.entitlementExpiresAt)
                        ? Math.round(parsed.entitlementExpiresAt)
                        : parseOptionalTimestamp(parsed.entitlementExpiresAt),
                reservationQty: Math.max(1, parseMoney(parsed.reservationQty)),
                reservationExpiresAt:
                    typeof parsed.reservationExpiresAt === "number" && Number.isFinite(parsed.reservationExpiresAt)
                        ? Math.round(parsed.reservationExpiresAt)
                        : parseOptionalTimestamp(parsed.reservationExpiresAt),
                note: note || undefined,
            };
            promotions.push(selection);
            refs.push({
                activityId: promotionId,
                activityName: promotionName,
                activityContent: note || undefined,
                checkoutStatus: "settled",
                storeQty: 0,
                effectType,
                note: note || undefined,
            });
        } catch {
            const fallbackName = safeText(text, MAX_TEXT);
            if (!fallbackName) continue;
            promotions.push({
                promotionId: "",
                promotionName: fallbackName,
                effectType: "discount",
                discountAmount: 0,
                giftQty: 1,
                entitlementQty: 1,
                reservationQty: 1,
            });
            refs.push({
                activityId: "",
                activityName: fallbackName,
                checkoutStatus: "settled",
                storeQty: 0,
                effectType: "discount",
            });
        }
        if (refs.length >= MAX_ACTIVITY_REFS) break;
    }

    if (promotions.length > 0) {
        return {
            activityRefs: refs.slice(0, MAX_ACTIVITY_REFS),
            selectedPromotions: promotions.slice(0, MAX_PROMOTION_REFS),
        };
    }

    // Backward compatibility with legacy checkout payload (`activitySelection[]`).
    const legacySelections = formData.getAll("activitySelection[]");
    for (const raw of legacySelections) {
        const text = toStr(raw);
        if (!text) continue;
        try {
            const parsed = JSON.parse(text) as {
                id?: unknown;
                name?: unknown;
                content?: unknown;
                status?: unknown;
                storeQty?: unknown;
            };
            const activityId = safeText(toStr(parsed.id), 120);
            const activityName = safeText(toStr(parsed.name), MAX_TEXT);
            if (!activityName) continue;
            const activityContent = safeText(toStr(parsed.content), MAX_ACTIVITY_CONTENT);
            const status = toStr(parsed.status) === "stored" ? "stored" : "settled";
            const storeQty = status === "stored" ? Math.max(1, Math.round(parseMoney(parsed.storeQty))) : 0;
            const effectType: PromotionEffectType = status === "stored" ? "create_entitlement" : "discount";

            refs.push({
                activityId,
                activityName,
                activityContent: activityContent || undefined,
                checkoutStatus: status,
                storeQty,
                effectType,
                note: activityContent || undefined,
            });
            promotions.push({
                promotionId: activityId,
                promotionName: activityName,
                effectType,
                scopeType: "category",
                entitlementType: "replacement",
                categoryName: activityName,
                entitlementQty: Math.max(1, storeQty || 1),
                discountAmount: 0,
                giftQty: 1,
                reservationQty: 1,
                note: activityContent || undefined,
            });
        } catch {
            const fallbackName = safeText(text, MAX_TEXT);
            if (!fallbackName) continue;
            refs.push({
                activityId: "",
                activityName: fallbackName,
                checkoutStatus: "settled",
                storeQty: 0,
                effectType: "discount",
            });
            promotions.push({
                promotionId: "",
                promotionName: fallbackName,
                effectType: "discount",
                discountAmount: 0,
                giftQty: 1,
                entitlementQty: 1,
                reservationQty: 1,
            });
        }
        if (refs.length >= MAX_ACTIVITY_REFS) break;
    }

    return {
        activityRefs: refs.slice(0, MAX_ACTIVITY_REFS),
        selectedPromotions: promotions.slice(0, MAX_PROMOTION_REFS),
    };
}

function parseCheckoutLineItems(formData: FormData): SaleLineItem[] {
    const productIds = formData.getAll("lineProductId[]");
    const productNames = formData.getAll("lineProductName[]");
    const quantities = formData.getAll("lineQty[]");
    const unitPrices = formData.getAll("lineUnitPrice[]");
    const isUsedFlags = formData.getAll("lineIsUsedProduct[]");
    const usedProductIds = formData.getAll("lineUsedProductId[]");
    const usedBrands = formData.getAll("lineUsedBrand[]");
    const usedModels = formData.getAll("lineUsedModel[]");
    const usedGrades = formData.getAll("lineUsedGrade[]");
    const usedSerials = formData.getAll("lineUsedSerialOrImei[]");
    const items: SaleLineItem[] = [];

    for (let index = 0; index < productNames.length && items.length < MAX_LINE_ITEMS; index += 1) {
        const productId = safeText(toStr(productIds[index]), 120);
        const productName = safeText(toStr(productNames[index]), MAX_TEXT);
        const qty = Math.max(0, Math.round(parseMoney(quantities[index])));
        const unitPrice = parseMoney(unitPrices[index]);
        const isUsedProduct = toStr(isUsedFlags[index]) === "1";
        const usedProductId = safeText(toStr(usedProductIds[index]), 120);
        if (!productName || qty <= 0) continue;
        if (isUsedProduct && qty !== 1) continue;
        const subtotal = parseMoney(qty * unitPrice);
        items.push({
            productId,
            productName,
            qty,
            unitPrice,
            subtotal,
            isUsedProduct,
            usedProductId: usedProductId || undefined,
            usedBrand: safeText(toStr(usedBrands[index]), 120) || undefined,
            usedModel: safeText(toStr(usedModels[index]), 120) || undefined,
            usedGrade: safeText(toStr(usedGrades[index]), 80) || undefined,
            usedSerialOrImei: safeText(toStr(usedSerials[index]), 120) || undefined,
        });
    }

    return items;
}

async function applySaleInventoryDeductions(companyId: string, saleId: string, items: SaleLineItem[]): Promise<void> {
    const grouped = new Map<string, number>();
    for (const item of items) {
        const productId = safeText(item.productId, 120);
        const qty = Math.max(0, Math.round(item.qty));
        if (!productId || qty <= 0) continue;
        grouped.set(productId, (grouped.get(productId) ?? 0) + qty);
    }

    for (const [productId, qty] of grouped.entries()) {
        await adjustInventoryLevels({
            companyId,
            productId,
            eventType: "sale_out",
            qty,
            onHandDelta: -qty,
            reservedDelta: 0,
            referenceType: "sale",
            referenceId: saleId,
            note: `checkout sale ${saleId}`,
            enforceAvailable: true,
        });
    }
}

export async function createCheckoutSale(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    if (!scope) {
        redirect(`/dashboard/checkout?flash=invalid&ts=${Date.now()}`);
    }

    const checkoutAt = parseCheckoutAt(formData.get("checkoutAt"));
    const paymentMethod = parsePaymentMethod(formData.get("paymentMethod"));
    const paymentStatus = parsePaymentStatus(formData.get("paymentStatus"));
    const customerMode = toStr(formData.get("customerMode")) === "customer" ? "customer" : "walkin";

    const customerId = customerMode === "customer" ? safeText(toStr(formData.get("customerId")), 120) : "";
    const customerName = safeText(toStr(formData.get("customerName")), MAX_TEXT) || "過路客";
    const customerPhone = safeText(toStr(formData.get("customerPhone")), 40);
    const customerEmail = safeText(toStr(formData.get("customerEmail")), MAX_TEXT).toLowerCase();
    const selectedCaseIds = formData
        .getAll("caseId[]")
        .map((value) => safeText(toStr(value), 120))
        .filter((value) => value.length > 0)
        .slice(0, MAX_CASE_REFS);
    const selectedCaseIdSet = new Set(selectedCaseIds);
    const tickets = selectedCaseIds.length > 0 ? await listTickets() : [];
    const caseRefs: SaleCaseRef[] = tickets
        .filter((ticket) => selectedCaseIdSet.has(ticket.id))
        .map((ticket) => ({
            caseId: ticket.id,
            caseNo: buildCaseNoFromTicket(ticket),
            caseTitle: `${ticket.device.name} ${ticket.device.model}`.trim() || ticket.title,
        }))
        .slice(0, MAX_CASE_REFS);
    const primaryCase = caseRefs[0];
    const { activityRefs, selectedPromotions } = parsePromotionSelections(formData);
    const closeCase = toStr(formData.get("closeCase")) === "1";
    const lineItems = parseCheckoutLineItems(formData);
    const usedLineItems = lineItems.filter((row) => row.isUsedProduct && row.usedProductId);

    if (lineItems.length === 0) {
        redirect(`/dashboard/checkout?flash=invalid&ts=${Date.now()}`);
    }

    for (const row of usedLineItems) {
        const usedProduct = await getUsedProductById(row.usedProductId ?? "");
        if (!usedProduct) {
            redirect(`/dashboard/checkout?flash=invalid&ts=${Date.now()}`);
        }
        if (usedProduct.saleStatus === "sold" || !usedProduct.isSellable) {
            redirect(`/dashboard/checkout?flash=invalid&ts=${Date.now()}`);
        }
    }

    const subtotal = lineItems.reduce((sum, row) => sum + row.subtotal, 0);
    const receiptNo = buildReceiptNo(checkoutAt);
    const evaluatedPromotion = evaluateCheckoutPromotions({
        selectedPromotions,
        cartLines: lineItems,
        sourceId: receiptNo,
    });
    const pricingAdjustmentTotal = evaluatedPromotion.pricingAdjustments.reduce((sum, row) => sum + Math.max(0, row.amount), 0);
    const amount = Math.max(0, subtotal - pricingAdjustmentTotal);
    if (!Number.isFinite(amount) || amount < 0) {
        redirect(`/dashboard/checkout?flash=invalid&ts=${Date.now()}`);
    }

    const title = lineItems.length === 1 ? lineItems[0].productName : `${lineItems[0].productName} 等 ${lineItems.length} 項`;
    const payload: CreateSaleParams = {
        item: title,
        amount,
        checkoutAt,
        paymentMethod,
        paymentStatus,
        source: "checkout",
        receiptNo,
        customerId: customerId || undefined,
        customerName,
        customerPhone,
        customerEmail,
        caseId: primaryCase?.caseId,
        caseTitle: primaryCase?.caseTitle,
        caseRefs,
        activityRefs,
        appliedPromotions: selectedPromotions.map((promotion) => ({
            promotionId: safeText(toStr(promotion.promotionId), 120),
            promotionName: safeText(toStr(promotion.promotionName), MAX_TEXT) || "促銷活動",
            effectType: parsePromotionEffectType(promotion.effectType),
        })),
        pricingAdjustments: evaluatedPromotion.pricingAdjustments,
        giftItems: evaluatedPromotion.giftItems,
        createdEntitlements: [],
        createdPickupReservations: [],
        lineItems,
    };

    let createdSale: Sale | null = null;
    try {
        createdSale = await createInFirebase(scope.companyId, payload);
        if (!createdSale) createdSale = await createInMemory(scope.companyId, payload);
    } catch {
        createdSale = await createInMemory(scope.companyId, payload);
    }

    if (closeCase && caseRefs.length > 0) {
        for (const row of caseRefs) {
            await setTicketStatusById(row.caseId, "closed");
        }
    }

    const createdEntitlementRefs: SaleCreatedEntitlementRef[] = [];
    const createdPickupReservationRefs: SaleCreatedPickupReservationRef[] = [];
    if (createdSale && customerId) {
        try {
            const entitlements = await createEntitlementsFromCheckoutPromotions({
                customerId,
                sourceId: createdSale.id,
                drafts: evaluatedPromotion.entitlementsToCreate,
                companyId: scope.companyId,
            });
            for (const row of entitlements) {
                createdEntitlementRefs.push({
                    entitlementId: row.id,
                    entitlementType: row.entitlementType,
                    scopeType: row.scopeType,
                    categoryName: row.categoryName ?? undefined,
                    productName: row.productName ?? undefined,
                    remainingQty: row.remainingQty,
                    expiresAt: parseOptionalTimestamp(row.expiresAt),
                });
            }
        } catch {
            // entitlement creation failure should not block checkout
        }

        try {
            const reservations = await createPickupReservationsFromPromotionDrafts({
                customerId,
                drafts: evaluatedPromotion.pickupReservationsToCreate,
                sourceId: createdSale.id,
                companyId: scope.companyId,
            });
            for (const row of reservations) {
                createdPickupReservationRefs.push({
                    reservationId: row.id,
                    status: row.status,
                    lineItemCount: row.lineItems.length,
                    expiresAt: parseOptionalTimestamp(row.expiresAt),
                });
            }
        } catch {
            // reservation creation failure should not block checkout
        }
    }

    if (createdSale && (createdEntitlementRefs.length > 0 || createdPickupReservationRefs.length > 0)) {
        try {
            await patchSaleArtifacts(scope.companyId, createdSale.id, {
                createdEntitlements: createdEntitlementRefs,
                createdPickupReservations: createdPickupReservationRefs,
            });
        } catch {
            // metadata patch failure should not block checkout
        }
    }

    try {
        await applySaleInventoryDeductions(scope.companyId, createdSale?.id ?? receiptNo, lineItems);
    } catch {
        // inventory sync failure should not block checkout
    }

    if (createdSale && usedLineItems.length > 0) {
        for (const row of usedLineItems) {
            try {
                await attachUsedProductToReceipt({
                    id: row.usedProductId ?? "",
                    receiptIssuedAt: checkoutAt,
                    receiptId: createdSale.receiptNo ?? receiptNo,
                    orderId: createdSale.id,
                    customerId: customerId || undefined,
                    salePrice: row.unitPrice,
                });
            } catch {
                // used product sync failure should not block checkout
            }
        }
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/checkout");
    revalidatePath("/dashboard/receipts");
    revalidatePath("/dashboard/customers/detail");
    redirect(`/dashboard/checkout?flash=created&ts=${Date.now()}`);
}

export async function createSale(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    if (!scope) {
        redirect(`/sales?flash=invalid&ts=${Date.now()}`);
    }

    const validated = validateInput({
        item: toStr(formData.get("item")),
        amount: toStr(formData.get("amount")),
        checkoutAt: toStr(formData.get("checkoutAt")),
        paymentMethod: toStr(formData.get("paymentMethod")),
        paymentStatus: toStr(formData.get("paymentStatus")),
    });
    if (!validated) {
        redirect(`/sales?flash=invalid&ts=${Date.now()}`);
    }

    try {
        const created = await createInFirebase(scope.companyId, validated);
        if (!created) await createInMemory(scope.companyId, validated);
    } catch {
        await createInMemory(scope.companyId, validated);
    }

    revalidatePath("/sales");
    redirect(`/sales?flash=created&ts=${Date.now()}`);
}

export async function updateSale(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    if (!scope) {
        redirect(`/sales?flash=invalid&ts=${Date.now()}`);
    }

    const saleId = safeText(toStr(formData.get("id")), 80);
    if (!saleId) {
        redirect(`/sales?flash=invalid&ts=${Date.now()}`);
    }

    const payload = {
        id: saleId,
        item: formData.has("item") ? safeText(toStr(formData.get("item")), MAX_TEXT) : undefined,
        amount: formData.has("amount") ? parseMoney(formData.get("amount")) : undefined,
        checkoutAt: formData.has("checkoutAt") ? parseCheckoutAt(formData.get("checkoutAt")) : undefined,
        paymentMethod: formData.has("paymentMethod") ? parsePaymentMethod(formData.get("paymentMethod")) : undefined,
    };

    try {
        const updated = await updateInFirebase(scope.companyId, payload);
        if (!updated) await updateInMemory(scope.companyId, payload);
    } catch {
        await updateInMemory(scope.companyId, payload);
    }

    revalidatePath("/sales");
    redirect(`/sales?flash=updated&ts=${Date.now()}`);
}

export async function deleteSale(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    if (!scope) {
        redirect(`/sales?flash=invalid&ts=${Date.now()}`);
    }

    const saleId = safeText(toStr(formData.get("id")), 80);
    if (!saleId) {
        redirect(`/sales?flash=invalid&ts=${Date.now()}`);
    }

    try {
        const removed = await deleteInFirebase(scope.companyId, saleId);
        if (removed === null) removeMemorySale(scope.companyId, saleId);
    } catch {
        removeMemorySale(scope.companyId, saleId);
    }

    revalidatePath("/sales");
    redirect(`/sales?flash=deleted&ts=${Date.now()}`);
}
