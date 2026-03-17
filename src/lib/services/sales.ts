import "server-only";
import type { PaymentMethod, PaymentStatus, Sale, SaleActivityRef, SaleCaseRef, SaleLineItem } from "@/lib/types/sale";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import { listTickets, setTicketStatusById } from "@/lib/services/ticket";
import type { Ticket } from "@/lib/types/ticket";

const memory: { salesByCompany: Record<string, Sale[]> } = { salesByCompany: {} };

const MAX_TEXT = 160;
const MAX_QUERY = 120;
const MAX_MONEY = 100000000;
const MAX_ACTIVITY_CONTENT = 800;
const MAX_LINE_ITEMS = 20;
const MAX_CASE_REFS = 20;
const MAX_ACTIVITY_REFS = 20;

type SessionScope = {
    companyId: string;
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
                  return { productId, productName, qty, unitPrice, subtotal };
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
                  };
                  if (activityContent) normalized.activityContent = activityContent;
                  return normalized;
              })
              .filter((row): row is SaleActivityRef => row !== null)
              .slice(0, MAX_ACTIVITY_REFS)
        : [];
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

function companyProductsRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/products`);
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
    const q = safeText(keyword ?? "", MAX_QUERY).toLowerCase();
    if (!q) return sales;
    return sales.filter((sale) => {
        const itemKeywords = (sale.lineItems ?? [])
            .map((row) => [row.productName, row.productId, String(row.qty), String(row.unitPrice), String(row.subtotal)].join(" "))
            .join(" ");
        const caseKeywords = (sale.caseRefs ?? [])
            .map((row) => [row.caseId, row.caseNo, row.caseTitle].join(" "))
            .join(" ");
        const activityKeywords = (sale.activityRefs ?? [])
            .map((row) => [row.activityId, row.activityName, row.activityContent ?? "", row.checkoutStatus ?? "", String(row.storeQty ?? 0)].join(" "))
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
        ]
            .join(" ")
            .toLowerCase();
        return haystack.includes(q);
    });
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

function parseActivitySelections(formData: FormData): SaleActivityRef[] {
    const rawSelections = formData.getAll("activitySelection[]");
    const refs: SaleActivityRef[] = [];
    for (const raw of rawSelections) {
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
            const checkoutStatus = toStr(parsed.status) === "stored" ? "stored" : "settled";
            const storeQty = checkoutStatus === "stored" ? Math.max(1, Math.round(parseMoney(parsed.storeQty))) : 0;
            refs.push({
                activityId,
                activityName,
                activityContent: activityContent || undefined,
                checkoutStatus,
                storeQty,
            });
        } catch {
            const fallbackName = safeText(text, MAX_TEXT);
            if (!fallbackName) continue;
            refs.push({ activityId: "", activityName: fallbackName, checkoutStatus: "settled", storeQty: 0 });
        }
        if (refs.length >= MAX_ACTIVITY_REFS) break;
    }
    return refs;
}

function parseCheckoutLineItems(formData: FormData): SaleLineItem[] {
    const productIds = formData.getAll("lineProductId[]");
    const productNames = formData.getAll("lineProductName[]");
    const quantities = formData.getAll("lineQty[]");
    const unitPrices = formData.getAll("lineUnitPrice[]");
    const items: SaleLineItem[] = [];

    for (let index = 0; index < productNames.length && items.length < MAX_LINE_ITEMS; index += 1) {
        const productId = safeText(toStr(productIds[index]), 120);
        const productName = safeText(toStr(productNames[index]), MAX_TEXT);
        const qty = Math.max(0, Math.round(parseMoney(quantities[index])));
        const unitPrice = parseMoney(unitPrices[index]);
        if (!productName || qty <= 0) continue;
        const subtotal = parseMoney(qty * unitPrice);
        items.push({
            productId,
            productName,
            qty,
            unitPrice,
            subtotal,
        });
    }

    return items;
}

async function applyProductStockDeductions(companyId: string, items: SaleLineItem[]): Promise<void> {
    const db = await getFirestoreDb();
    if (!db) return;

    const grouped = new Map<string, number>();
    for (const item of items) {
        const cleanedId = safeText(item.productId, 120);
        if (!cleanedId) continue;
        grouped.set(cleanedId, (grouped.get(cleanedId) ?? 0) + Math.max(0, item.qty));
    }

    if (grouped.size === 0) return;

    const batch = db.batch();
    for (const [productId, qty] of grouped.entries()) {
        const ref = companyProductsRef(db, companyId).doc(productId);
        const snap = await ref.get();
        if (!snap.exists) continue;
        const raw = snap.data() as { stock?: unknown; updatedAt?: unknown };
        const currentStock = parseMoney(raw.stock);
        const nextStock = Math.max(0, currentStock - qty);
        batch.set(
            ref,
            {
                stock: nextStock,
                updatedAt: now(),
            },
            { merge: true },
        );
    }

    await batch.commit();
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
    const activityRefs = parseActivitySelections(formData);
    const closeCase = toStr(formData.get("closeCase")) === "1";
    const lineItems = parseCheckoutLineItems(formData);

    if (lineItems.length === 0) {
        redirect(`/dashboard/checkout?flash=invalid&ts=${Date.now()}`);
    }

    const amount = lineItems.reduce((sum, row) => sum + row.subtotal, 0);
    if (!Number.isFinite(amount) || amount <= 0) {
        redirect(`/dashboard/checkout?flash=invalid&ts=${Date.now()}`);
    }

    const title = lineItems.length === 1 ? lineItems[0].productName : `${lineItems[0].productName} 等 ${lineItems.length} 項`;
    const receiptNo = buildReceiptNo(checkoutAt);
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
        lineItems,
    };

    try {
        const created = await createInFirebase(scope.companyId, payload);
        if (!created) await createInMemory(scope.companyId, payload);
    } catch {
        await createInMemory(scope.companyId, payload);
    }

    if (closeCase && caseRefs.length > 0) {
        for (const row of caseRefs) {
            await setTicketStatusById(row.caseId, "closed");
        }
    }

    try {
        await applyProductStockDeductions(scope.companyId, lineItems);
    } catch {
        // stock sync failure should not block checkout
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
