import "server-only";
import type {
    CampaignDoc,
    CampaignEntitlementDoc,
    CampaignEntitlementStatus,
    CampaignLifecycleState,
} from "@/lib/types/campaign";
import type { ConsignmentDoc, ConsignmentRedemptionDoc, ConsignmentStatus } from "@/lib/types/consignment";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { normalizeCompanyId } from "@/lib/tenant-scope";
import { getUserCompanyId, getUserDoc, toAccountType } from "@/lib/services/user.service";

const MAX_TEXT = 160;
const MAX_LONG = 800;
const MAX_LIST_SIZE = 500;
const READ_CACHE_TTL_MS = 30_000;

type SessionScope = {
    companyId: string;
    operator: string;
};

const memory: {
    campaignsByCompany: Record<string, CampaignDoc[]>;
    entitlementsByCompany: Record<string, CampaignEntitlementDoc[]>;
    consignmentsByCompany: Record<string, ConsignmentDoc[]>;
    redemptionsByCompany: Record<string, ConsignmentRedemptionDoc[]>;
} = {
    campaignsByCompany: {},
    entitlementsByCompany: {},
    consignmentsByCompany: {},
    redemptionsByCompany: {},
};

const readCacheTouchedAt: {
    campaignsByCompany: Record<string, number>;
    entitlementsByCompany: Record<string, number>;
    consignmentsByCompany: Record<string, number>;
    redemptionsByCompany: Record<string, number>;
} = {
    campaignsByCompany: {},
    entitlementsByCompany: {},
    consignmentsByCompany: {},
    redemptionsByCompany: {},
};

function nowIso(): string {
    return new Date().toISOString();
}

function id(prefix: string): string {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function toText(value: unknown, max = MAX_TEXT): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const item of value) {
        const text = toText(item, MAX_TEXT);
        if (!text) continue;
        const key = text.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(text);
    }
    return out;
}

function toInt(value: unknown, fallback = 0): number {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(0, Math.round(parsed));
}

function toDateMs(value: string | undefined): number | null {
    if (!value) return null;
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) return null;
    return parsed;
}

function toLifecycleState(value: unknown): CampaignLifecycleState | undefined {
    if (value === "running") return "running";
    if (value === "ended_pending_redemption") return "ended_pending_redemption";
    if (value === "fully_closed") return "fully_closed";
    return undefined;
}

function toCampaignStatus(value: unknown): CampaignDoc["status"] {
    if (value === "draft") return "draft";
    if (value === "active") return "active";
    if (value === "ended") return "ended";
    if (value === "archived") return "archived";
    return "draft";
}

function toEntitlementStatus(value: unknown): CampaignEntitlementStatus {
    if (value === "partially_redeemed") return "partially_redeemed";
    if (value === "completed") return "completed";
    if (value === "expired") return "expired";
    if (value === "cancelled") return "cancelled";
    return "active";
}

function toConsignmentStatus(value: unknown): ConsignmentStatus {
    if (value === "partially_redeemed") return "partially_redeemed";
    if (value === "completed") return "completed";
    if (value === "expired") return "expired";
    if (value === "cancelled") return "cancelled";
    return "active";
}

function isSpecificScope(value: unknown): "any" | "specific" {
    return value === "specific" ? "specific" : "any";
}

async function resolveSessionScope(): Promise<SessionScope | null> {
    const session = await getSessionUser();
    if (!session) return null;
    const user = await getUserDoc(session.uid);
    if (!user) return null;
    if (toAccountType(user.role) !== "company") return null;
    const companyId = normalizeCompanyId(getUserCompanyId(user, session.uid));
    if (!companyId) return null;
    return {
        companyId,
        operator: toText(session.email, MAX_TEXT) || "merchant",
    };
}

async function getFirestoreDb() {
    try {
        const mod = await import("@/lib/firebase-server");
        return mod.fbAdminDb;
    } catch {
        return null;
    }
}

function campaignsRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/campaigns`);
}

function entitlementsRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/campaignEntitlements`);
}

function consignmentsRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/consignments`);
}

function redemptionsRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/consignmentRedemptions`);
}

function productsRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/products`);
}

function inventoryMovementsRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/inventoryMovements`);
}

function listFromMemory<T>(store: Record<string, T[]>, companyId: string): T[] {
    return [...(store[companyId] ?? [])];
}

function replaceMemoryList<T>(store: Record<string, T[]>, companyId: string, next: T[]) {
    store[companyId] = [...next];
}

function upsertMemory<T extends { id: string }>(store: Record<string, T[]>, companyId: string, value: T) {
    const list = store[companyId] ?? [];
    store[companyId] = [value, ...list.filter((item) => item.id !== value.id)];
}

function hasFreshReadCache(store: Record<string, number>, companyId: string): boolean {
    const touchedAt = store[companyId] ?? 0;
    return touchedAt > 0 && Date.now() - touchedAt <= READ_CACHE_TTL_MS;
}

function touchReadCache(store: Record<string, number>, companyId: string) {
    store[companyId] = Date.now();
}

function normalizeCampaign(input: Partial<CampaignDoc> & { id: string; companyId: string }): CampaignDoc {
    const createdAt = toText(input.createdAt, 40) || nowIso();
    const name = toText(input.name) || "未命名活動";
    return {
        id: toText(input.id, 120) || id("campaign"),
        companyId: toText(input.companyId, 120),
        name,
        slug: toText(input.slug, 120) || name.toLowerCase().replace(/\s+/g, "-"),
        description: toText(input.description, MAX_LONG) || undefined,
        categoryId: toText(input.categoryId, 120) || undefined,
        categoryName: toText(input.categoryName) || undefined,
        brandScope: isSpecificScope(input.brandScope),
        brandIds: toList(input.brandIds),
        brandNames: toList(input.brandNames),
        modelScope: isSpecificScope(input.modelScope),
        modelIds: toList(input.modelIds),
        modelNames: toList(input.modelNames),
        nameEntryIds: toList(input.nameEntryIds),
        nameEntryNames: toList(input.nameEntryNames),
        allowsCustomItem: Boolean(input.allowsCustomItem),
        stockDeductionTiming: input.stockDeductionTiming === "redeem" ? "redeem" : "checkout",
        startAt: toText(input.startAt, 40) || undefined,
        endAt: toText(input.endAt, 40) || undefined,
        status: toCampaignStatus(input.status),
        lifecycleState: toLifecycleState(input.lifecycleState),
        createdAt,
        updatedAt: toText(input.updatedAt, 40) || createdAt,
    };
}

function normalizeEntitlement(input: Partial<CampaignEntitlementDoc> & { id: string; companyId: string }): CampaignEntitlementDoc {
    const createdAt = toText(input.createdAt, 40) || nowIso();
    const entitledQty = toInt(input.entitledQty, 0);
    const redeemedQty = toInt(input.redeemedQty, 0);
    const remainingQty = Math.max(0, toInt(input.remainingQty, entitledQty - redeemedQty));
    return {
        id: toText(input.id, 120) || id("entitlement"),
        companyId: toText(input.companyId, 120),
        campaignId: toText(input.campaignId, 120),
        campaignName: toText(input.campaignName),
        customerId: toText(input.customerId, 120),
        customerName: toText(input.customerName),
        customerPhone: toText(input.customerPhone, 40) || undefined,
        sourceReceiptId: toText(input.sourceReceiptId, 120) || undefined,
        sourceOrderId: toText(input.sourceOrderId, 120) || undefined,
        sourceTicketId: toText(input.sourceTicketId, 120) || undefined,
        entitledQty,
        redeemedQty,
        remainingQty,
        categoryId: toText(input.categoryId, 120) || undefined,
        categoryName: toText(input.categoryName) || undefined,
        brandScope: isSpecificScope(input.brandScope),
        brandIds: toList(input.brandIds),
        brandNames: toList(input.brandNames),
        modelScope: isSpecificScope(input.modelScope),
        modelIds: toList(input.modelIds),
        modelNames: toList(input.modelNames),
        nameEntryIds: toList(input.nameEntryIds),
        nameEntryNames: toList(input.nameEntryNames),
        allowsCustomItem: Boolean(input.allowsCustomItem),
        isConsignment: Boolean(input.isConsignment),
        activatedAt: toText(input.activatedAt, 40) || createdAt,
        expiresAt: toText(input.expiresAt, 40) || undefined,
        status: toEntitlementStatus(input.status),
        createdAt,
        updatedAt: toText(input.updatedAt, 40) || createdAt,
    };
}

function normalizeConsignment(input: Partial<ConsignmentDoc> & { id: string; companyId: string }): ConsignmentDoc {
    const createdAt = toText(input.createdAt, 40) || nowIso();
    const depositedQty = toInt(input.depositedQty, 0);
    const redeemedQty = toInt(input.redeemedQty, 0);
    const remainingQty = Math.max(0, toInt(input.remainingQty, depositedQty - redeemedQty));
    return {
        id: toText(input.id, 120) || id("consignment"),
        companyId: toText(input.companyId, 120),
        customerId: toText(input.customerId, 120),
        customerName: toText(input.customerName),
        customerPhone: toText(input.customerPhone, 40) || undefined,
        campaignId: toText(input.campaignId, 120) || undefined,
        campaignName: toText(input.campaignName) || undefined,
        entitlementId: toText(input.entitlementId, 120) || undefined,
        title: toText(input.title) || "寄店品項",
        description: toText(input.description, MAX_LONG) || undefined,
        categoryId: toText(input.categoryId, 120) || undefined,
        categoryName: toText(input.categoryName) || undefined,
        brandScope: isSpecificScope(input.brandScope),
        brandIds: toList(input.brandIds),
        brandNames: toList(input.brandNames),
        modelScope: isSpecificScope(input.modelScope),
        modelIds: toList(input.modelIds),
        modelNames: toList(input.modelNames),
        nameEntryIds: toList(input.nameEntryIds),
        nameEntryNames: toList(input.nameEntryNames),
        depositedQty,
        redeemedQty,
        remainingQty,
        deductInventoryOnRedeem: true,
        activatedAt: toText(input.activatedAt, 40) || createdAt,
        expiresAt: toText(input.expiresAt, 40) || undefined,
        status: toConsignmentStatus(input.status),
        createdAt,
        updatedAt: toText(input.updatedAt, 40) || createdAt,
    };
}

function normalizeRedemption(input: Partial<ConsignmentRedemptionDoc> & { id: string; companyId: string }): ConsignmentRedemptionDoc {
    const createdAt = toText(input.createdAt, 40) || nowIso();
    return {
        id: toText(input.id, 120) || id("redeem"),
        companyId: toText(input.companyId, 120),
        consignmentId: toText(input.consignmentId, 120),
        entitlementId: toText(input.entitlementId, 120) || undefined,
        campaignId: toText(input.campaignId, 120) || undefined,
        customerId: toText(input.customerId, 120),
        customerName: toText(input.customerName),
        redeemedQty: Math.max(1, toInt(input.redeemedQty, 1)),
        actualProductId: toText(input.actualProductId, 120) || undefined,
        actualProductName: toText(input.actualProductName) || undefined,
        actualProductSku: toText(input.actualProductSku, 120) || undefined,
        categoryId: toText(input.categoryId, 120) || undefined,
        categoryName: toText(input.categoryName) || undefined,
        brandId: toText(input.brandId, 120) || undefined,
        brandName: toText(input.brandName) || undefined,
        modelId: toText(input.modelId, 120) || undefined,
        modelName: toText(input.modelName) || undefined,
        inventoryMovementId: toText(input.inventoryMovementId, 120) || undefined,
        redeemedAt: toText(input.redeemedAt, 40) || createdAt,
        redeemedBy: toText(input.redeemedBy) || undefined,
        notes: toText(input.notes, MAX_LONG) || undefined,
        createdAt,
        updatedAt: toText(input.updatedAt, 40) || createdAt,
    };
}

export function evaluateCampaignLifecycleState(input: {
    campaign: CampaignDoc;
    entitlements: CampaignEntitlementDoc[];
    consignments: ConsignmentDoc[];
    nowIsoTs?: string;
}): CampaignLifecycleState {
    const nowTs = toDateMs(input.nowIsoTs) ?? Date.now();
    const endTs = toDateMs(input.campaign.endAt);
    const campaignIsEnded = endTs !== null && nowTs > endTs;
    if (!campaignIsEnded) return "running";

    const entitlementPending = input.entitlements
        .filter((item) => item.campaignId === input.campaign.id)
        .some((item) => item.remainingQty > 0 && item.status !== "cancelled" && item.status !== "expired");
    const consignmentPending = input.consignments
        .filter((item) => item.campaignId === input.campaign.id)
        .some((item) => item.remainingQty > 0 && item.status !== "cancelled" && item.status !== "expired");

    // Campaign end date and full closure are intentionally different: pending redemption keeps lifecycle open.
    return entitlementPending || consignmentPending ? "ended_pending_redemption" : "fully_closed";
}

async function listCampaignsFromFirestore(companyId: string): Promise<CampaignDoc[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    const snap = await campaignsRef(db, companyId).orderBy("updatedAt", "desc").limit(MAX_LIST_SIZE).get();
    return snap.docs.map((doc) => normalizeCampaign({ id: doc.id, companyId, ...(doc.data() as Partial<CampaignDoc>) }));
}

async function listEntitlementsFromFirestore(companyId: string): Promise<CampaignEntitlementDoc[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    const snap = await entitlementsRef(db, companyId).orderBy("updatedAt", "desc").limit(MAX_LIST_SIZE).get();
    return snap.docs.map((doc) =>
        normalizeEntitlement({ id: doc.id, companyId, ...(doc.data() as Partial<CampaignEntitlementDoc>) }),
    );
}

async function listConsignmentsFromFirestore(companyId: string): Promise<ConsignmentDoc[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    const snap = await consignmentsRef(db, companyId).orderBy("updatedAt", "desc").limit(MAX_LIST_SIZE).get();
    return snap.docs.map((doc) => normalizeConsignment({ id: doc.id, companyId, ...(doc.data() as Partial<ConsignmentDoc>) }));
}

async function listRedemptionsFromFirestore(companyId: string): Promise<ConsignmentRedemptionDoc[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    const snap = await redemptionsRef(db, companyId).orderBy("updatedAt", "desc").limit(MAX_LIST_SIZE).get();
    return snap.docs.map((doc) =>
        normalizeRedemption({ id: doc.id, companyId, ...(doc.data() as Partial<ConsignmentRedemptionDoc>) }),
    );
}

async function saveCampaign(companyId: string, doc: CampaignDoc): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await campaignsRef(db, companyId).doc(doc.id).set(doc, { merge: true });
    return true;
}

async function saveEntitlement(companyId: string, doc: CampaignEntitlementDoc): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await entitlementsRef(db, companyId).doc(doc.id).set(doc, { merge: true });
    return true;
}

async function saveConsignment(companyId: string, doc: ConsignmentDoc): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await consignmentsRef(db, companyId).doc(doc.id).set(doc, { merge: true });
    return true;
}

async function saveRedemption(companyId: string, doc: ConsignmentRedemptionDoc): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await redemptionsRef(db, companyId).doc(doc.id).set(doc, { merge: true });
    return true;
}

async function saveInventoryMovement(companyId: string, movementId: string, payload: Record<string, unknown>): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await inventoryMovementsRef(db, companyId).doc(movementId).set(payload, { merge: false });
    return true;
}

async function deductProductStock(params: {
    companyId: string;
    productId: string;
    redeemQty: number;
    operator: string;
    notes?: string;
}): Promise<{ movementId: string | null; productName?: string; sku?: string }> {
    const db = await getFirestoreDb();
    if (!db) return { movementId: null };

    const productDocRef = productsRef(db, params.companyId).doc(params.productId);
    const productSnap = await productDocRef.get();
    if (!productSnap.exists) return { movementId: null };
    const raw = productSnap.data() ?? {};
    const beforeStock = Math.max(0, toInt((raw as { stock?: unknown }).stock, 0));
    const beforeStockQty = Math.max(0, toInt((raw as { stockQty?: unknown }).stockQty, beforeStock));
    const afterStock = Math.max(0, beforeStock - params.redeemQty);
    const afterStockQty = Math.max(0, beforeStockQty - params.redeemQty);

    await productDocRef.set(
        {
            stock: afterStock,
            stockQty: afterStockQty,
            updatedAt: nowIso(),
        },
        { merge: true },
    );

    const movementId = id("inv_move");
    await saveInventoryMovement(params.companyId, movementId, {
        id: movementId,
        companyId: params.companyId,
        productId: params.productId,
        movementType: "consignment_redeem",
        qty: params.redeemQty,
        beforeQty: beforeStockQty,
        afterQty: afterStockQty,
        reason: "consignment_redeem",
        referenceId: "",
        operator: params.operator,
        notes: toText(params.notes, MAX_LONG),
        createdAt: nowIso(),
        updatedAt: nowIso(),
    });

    return {
        movementId,
        productName: toText((raw as { name?: unknown }).name),
        sku: toText((raw as { sku?: unknown }).sku, 120),
    };
}

export async function listCampaigns(): Promise<CampaignDoc[]> {
    const scope = await resolveSessionScope();
    if (!scope) return [];
    let list: CampaignDoc[] = [];
    if (hasFreshReadCache(readCacheTouchedAt.campaignsByCompany, scope.companyId)) {
        list = listFromMemory(memory.campaignsByCompany, scope.companyId);
    } else {
        try {
            const fsList = await listCampaignsFromFirestore(scope.companyId);
            if (fsList) {
                list = fsList;
                replaceMemoryList(memory.campaignsByCompany, scope.companyId, fsList);
                touchReadCache(readCacheTouchedAt.campaignsByCompany, scope.companyId);
            } else {
                list = listFromMemory(memory.campaignsByCompany, scope.companyId);
            }
        } catch {
            list = listFromMemory(memory.campaignsByCompany, scope.companyId);
        }
    }

    const [entitlements, consignments] = await Promise.all([listCampaignEntitlements(), listConsignments()]);
    return list
        .map((item) => {
            const normalized = normalizeCampaign(item);
            const lifecycleState = evaluateCampaignLifecycleState({
                campaign: normalized,
                entitlements,
                consignments,
            });
            return normalizeCampaign({ ...normalized, lifecycleState, companyId: scope.companyId });
        })
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export async function createCampaign(input: Partial<CampaignDoc>): Promise<CampaignDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const ts = nowIso();
    const next = normalizeCampaign({
        id: id("campaign"),
        companyId: scope.companyId,
        ...input,
        lifecycleState: "running",
        createdAt: ts,
        updatedAt: ts,
    });
    try {
        const saved = await saveCampaign(scope.companyId, next);
        if (!saved) upsertMemory(memory.campaignsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.campaignsByCompany, scope.companyId, next);
    }
    touchReadCache(readCacheTouchedAt.campaignsByCompany, scope.companyId);
    return next;
}

export async function updateCampaign(campaignId: string, input: Partial<CampaignDoc>): Promise<CampaignDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const current = (await listCampaigns()).find((item) => item.id === toText(campaignId, 120));
    if (!current) return null;
    const next = normalizeCampaign({
        ...current,
        ...input,
        id: current.id,
        companyId: scope.companyId,
        updatedAt: nowIso(),
    });
    try {
        const saved = await saveCampaign(scope.companyId, next);
        if (!saved) upsertMemory(memory.campaignsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.campaignsByCompany, scope.companyId, next);
    }
    touchReadCache(readCacheTouchedAt.campaignsByCompany, scope.companyId);
    return next;
}

export async function listCampaignEntitlements(): Promise<CampaignEntitlementDoc[]> {
    const scope = await resolveSessionScope();
    if (!scope) return [];
    let list: CampaignEntitlementDoc[] = [];
    if (hasFreshReadCache(readCacheTouchedAt.entitlementsByCompany, scope.companyId)) {
        list = listFromMemory(memory.entitlementsByCompany, scope.companyId);
    } else {
        try {
            const fsList = await listEntitlementsFromFirestore(scope.companyId);
            if (fsList) {
                list = fsList;
                replaceMemoryList(memory.entitlementsByCompany, scope.companyId, fsList);
                touchReadCache(readCacheTouchedAt.entitlementsByCompany, scope.companyId);
            } else {
                list = listFromMemory(memory.entitlementsByCompany, scope.companyId);
            }
        } catch {
            list = listFromMemory(memory.entitlementsByCompany, scope.companyId);
        }
    }
    return list.map((item) => normalizeEntitlement(item)).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export async function createCampaignEntitlement(input: Partial<CampaignEntitlementDoc>): Promise<CampaignEntitlementDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const ts = nowIso();
    const next = normalizeEntitlement({
        id: id("entitlement"),
        companyId: scope.companyId,
        ...input,
        activatedAt: toText(input.activatedAt, 40) || ts,
        createdAt: ts,
        updatedAt: ts,
    });
    // Redeem-only stock model: entitlement creation does not deduct inventory immediately.
    try {
        const saved = await saveEntitlement(scope.companyId, next);
        if (!saved) upsertMemory(memory.entitlementsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.entitlementsByCompany, scope.companyId, next);
    }
    touchReadCache(readCacheTouchedAt.entitlementsByCompany, scope.companyId);
    return next;
}

export async function listConsignments(): Promise<ConsignmentDoc[]> {
    const scope = await resolveSessionScope();
    if (!scope) return [];
    let list: ConsignmentDoc[] = [];
    if (hasFreshReadCache(readCacheTouchedAt.consignmentsByCompany, scope.companyId)) {
        list = listFromMemory(memory.consignmentsByCompany, scope.companyId);
    } else {
        try {
            const fsList = await listConsignmentsFromFirestore(scope.companyId);
            if (fsList) {
                list = fsList;
                replaceMemoryList(memory.consignmentsByCompany, scope.companyId, fsList);
                touchReadCache(readCacheTouchedAt.consignmentsByCompany, scope.companyId);
            } else {
                list = listFromMemory(memory.consignmentsByCompany, scope.companyId);
            }
        } catch {
            list = listFromMemory(memory.consignmentsByCompany, scope.companyId);
        }
    }
    return list.map((item) => normalizeConsignment(item)).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export async function createConsignment(input: Partial<ConsignmentDoc>): Promise<ConsignmentDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const ts = nowIso();
    const next = normalizeConsignment({
        id: id("consignment"),
        companyId: scope.companyId,
        ...input,
        activatedAt: toText(input.activatedAt, 40) || ts,
        createdAt: ts,
        updatedAt: ts,
    });
    // Consignment only reserves future fulfillment intent; inventory is deducted at actual redemption.
    try {
        const saved = await saveConsignment(scope.companyId, next);
        if (!saved) upsertMemory(memory.consignmentsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.consignmentsByCompany, scope.companyId, next);
    }
    touchReadCache(readCacheTouchedAt.consignmentsByCompany, scope.companyId);
    return next;
}

export async function listConsignmentRedemptions(): Promise<ConsignmentRedemptionDoc[]> {
    const scope = await resolveSessionScope();
    if (!scope) return [];
    let list: ConsignmentRedemptionDoc[] = [];
    if (hasFreshReadCache(readCacheTouchedAt.redemptionsByCompany, scope.companyId)) {
        list = listFromMemory(memory.redemptionsByCompany, scope.companyId);
    } else {
        try {
            const fsList = await listRedemptionsFromFirestore(scope.companyId);
            if (fsList) {
                list = fsList;
                replaceMemoryList(memory.redemptionsByCompany, scope.companyId, fsList);
                touchReadCache(readCacheTouchedAt.redemptionsByCompany, scope.companyId);
            } else {
                list = listFromMemory(memory.redemptionsByCompany, scope.companyId);
            }
        } catch {
            list = listFromMemory(memory.redemptionsByCompany, scope.companyId);
        }
    }
    return list.map((item) => normalizeRedemption(item)).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export async function redeemConsignment(input: {
    consignmentId: string;
    redeemedQty: number;
    actualProductId?: string;
    notes?: string;
}): Promise<ConsignmentRedemptionDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;

    const consignment = (await listConsignments()).find((item) => item.id === toText(input.consignmentId, 120));
    if (!consignment) return null;
    const redeemQty = Math.max(1, toInt(input.redeemedQty, 1));
    if (consignment.remainingQty < redeemQty) return null;

    let movementId: string | null = null;
    let productName = "";
    let productSku = "";

    if (input.actualProductId) {
        const deducted = await deductProductStock({
            companyId: scope.companyId,
            productId: toText(input.actualProductId, 120),
            redeemQty,
            operator: scope.operator,
            notes: input.notes,
        });
        movementId = deducted.movementId;
        productName = deducted.productName ?? "";
        productSku = deducted.sku ?? "";
    }

    const ts = nowIso();
    const redemption = normalizeRedemption({
        id: id("redeem"),
        companyId: scope.companyId,
        consignmentId: consignment.id,
        entitlementId: consignment.entitlementId,
        campaignId: consignment.campaignId,
        customerId: consignment.customerId,
        customerName: consignment.customerName,
        redeemedQty: redeemQty,
        actualProductId: toText(input.actualProductId, 120) || undefined,
        actualProductName: productName || undefined,
        actualProductSku: productSku || undefined,
        categoryId: consignment.categoryId,
        categoryName: consignment.categoryName,
        inventoryMovementId: movementId || undefined,
        redeemedAt: ts,
        redeemedBy: scope.operator,
        notes: toText(input.notes, MAX_LONG) || undefined,
        createdAt: ts,
        updatedAt: ts,
    });

    const nextConsignment = normalizeConsignment({
        ...consignment,
        redeemedQty: consignment.redeemedQty + redeemQty,
        remainingQty: Math.max(0, consignment.remainingQty - redeemQty),
        status:
            consignment.remainingQty - redeemQty <= 0
                ? "completed"
                : consignment.redeemedQty + redeemQty > 0
                  ? "partially_redeemed"
                  : consignment.status,
        updatedAt: ts,
    });

    try {
        const saved = await saveRedemption(scope.companyId, redemption);
        if (!saved) upsertMemory(memory.redemptionsByCompany, scope.companyId, redemption);
    } catch {
        upsertMemory(memory.redemptionsByCompany, scope.companyId, redemption);
    }
    touchReadCache(readCacheTouchedAt.redemptionsByCompany, scope.companyId);
    try {
        const saved = await saveConsignment(scope.companyId, nextConsignment);
        if (!saved) upsertMemory(memory.consignmentsByCompany, scope.companyId, nextConsignment);
    } catch {
        upsertMemory(memory.consignmentsByCompany, scope.companyId, nextConsignment);
    }
    touchReadCache(readCacheTouchedAt.consignmentsByCompany, scope.companyId);

    if (consignment.entitlementId) {
        const entitlement = (await listCampaignEntitlements()).find((item) => item.id === consignment.entitlementId);
        if (entitlement) {
            const nextRemaining = Math.max(0, entitlement.remainingQty - redeemQty);
            const nextEntitlement = normalizeEntitlement({
                ...entitlement,
                redeemedQty: entitlement.redeemedQty + redeemQty,
                remainingQty: nextRemaining,
                status: nextRemaining <= 0 ? "completed" : entitlement.redeemedQty + redeemQty > 0 ? "partially_redeemed" : entitlement.status,
                updatedAt: ts,
            });
            try {
                const saved = await saveEntitlement(scope.companyId, nextEntitlement);
                if (!saved) upsertMemory(memory.entitlementsByCompany, scope.companyId, nextEntitlement);
            } catch {
                upsertMemory(memory.entitlementsByCompany, scope.companyId, nextEntitlement);
            }
            touchReadCache(readCacheTouchedAt.entitlementsByCompany, scope.companyId);
        }
    }

    return redemption;
}
