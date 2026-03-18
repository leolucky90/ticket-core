import "server-only";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import type {
    CreateCustomerEntitlementInput,
    CustomerEntitlement,
    CustomerEntitlementStatus,
    EntitlementRedemption,
    PromotionEntitlementDraft,
    RedeemEntitlementInput,
} from "@/lib/schema";
import {
    customerEntitlementsCollectionPath,
    entitlementRedemptionsCollectionPath,
    evaluateCustomerEntitlementStatus,
    normalizeCustomerEntitlementDocument,
    normalizeEntitlementRedemptionDocument,
} from "@/lib/schema";
import { adjustInventory, getInventoryByProductId } from "@/lib/services/inventory";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";

type SessionScope = {
    companyId: string;
    operatorName: string;
    operatorUserId: string;
};

type ProductScopeSnapshot = {
    productId: string;
    sku: string;
    productName: string;
    categoryId: string | null;
    categoryName: string | null;
    brandId: string | null;
    brandName: string | null;
    modelId: string | null;
    modelName: string | null;
};

type CreateEntitlementInput = Partial<CreateCustomerEntitlementInput> & {
    customerId: string;
    sourceType: CustomerEntitlement["sourceType"];
    entitlementType: CustomerEntitlement["entitlementType"];
    scopeType: CustomerEntitlement["scopeType"];
    totalQty: number;
};

const memory: {
    entitlementsByCompany: Record<string, CustomerEntitlement[]>;
    redemptionsByCompany: Record<string, EntitlementRedemption[]>;
} = {
    entitlementsByCompany: {},
    redemptionsByCompany: {},
};

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toNullableText(value: unknown, max = 240): string | null {
    const cleaned = toText(value, max);
    return cleaned || null;
}

function toNonNegativeInt(value: unknown, fallback = 0): number {
    const raw = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(raw)) return Math.max(0, Math.round(fallback));
    return Math.max(0, Math.round(raw));
}

function normalizeCompanyId(value: unknown): string | null {
    const cleaned = toText(value, 120);
    if (!cleaned) return null;
    if (/[/?#]/.test(cleaned)) return null;
    return cleaned;
}

function toMs(value: string | null | undefined): number {
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

async function resolveSessionScope(): Promise<SessionScope | null> {
    const session = await getSessionUser();
    if (!session) return null;

    const user = await getUserDoc(session.uid);
    if (!user) return null;
    if (toAccountType(user.role) !== "company") return null;

    const companyId = normalizeCompanyId(getShowcaseTenantId(user, session.uid));
    if (!companyId) return null;

    return {
        companyId,
        operatorName: toText(session.email?.split("@")[0] ?? "", 120) || "operator",
        operatorUserId: toText(session.uid, 120),
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

async function loadProductScopeSnapshot(companyId: string, productIdInput: string): Promise<ProductScopeSnapshot | null> {
    const productId = toText(productIdInput, 120);
    if (!productId) return null;

    const db = await getFirestoreDb();
    if (db) {
        const snap = await db.collection(`companies/${companyId}/products`).doc(productId).get();
        if (snap.exists) {
            const row = (snap.data() ?? {}) as Record<string, unknown>;
            return {
                productId,
                sku: toText(row.sku, 120),
                productName: toText(row.name) || toText(row.productName) || "Untitled Product",
                categoryId: toNullableText(row.categoryId, 120),
                categoryName: toNullableText(row.categoryName),
                brandId: toNullableText(row.brandId, 120),
                brandName: toNullableText(row.brandName),
                modelId: toNullableText(row.modelId, 120),
                modelName: toNullableText(row.modelName),
            };
        }
    }

    const inventory = await getInventoryByProductId(productId, companyId);
    if (!inventory) return null;

    return {
        productId: inventory.productId,
        sku: inventory.sku,
        productName: inventory.productName,
        categoryId: inventory.categoryId,
        categoryName: inventory.categoryName,
        brandId: inventory.brandId,
        brandName: inventory.brandName,
        modelId: inventory.modelId,
        modelName: inventory.modelName,
    };
}

function matchesEntitlementScope(entitlement: CustomerEntitlement, product: ProductScopeSnapshot): boolean {
    if (entitlement.scopeType === "product") {
        return Boolean(entitlement.productId && entitlement.productId === product.productId);
    }

    if (entitlement.categoryId && product.categoryId) return entitlement.categoryId === product.categoryId;
    if (entitlement.categoryName && product.categoryName) {
        return entitlement.categoryName.toLowerCase() === product.categoryName.toLowerCase();
    }
    return false;
}

async function readEntitlements(companyId: string): Promise<CustomerEntitlement[]> {
    const db = await getFirestoreDb();
    if (!db) return [...(memory.entitlementsByCompany[companyId] ?? [])];

    const snap = await db.collection(customerEntitlementsCollectionPath(companyId)).orderBy("updatedAt", "desc").limit(1000).get();
    const rows = snap.docs.map((doc) =>
        normalizeCustomerEntitlementDocument({
            ...(doc.data() as Record<string, unknown>),
            entitlementId: doc.id,
            companyId,
            customerId: toText((doc.data() as Record<string, unknown>).customerId, 120),
        }),
    );
    memory.entitlementsByCompany[companyId] = rows;
    return rows;
}

async function readRedemptions(companyId: string): Promise<EntitlementRedemption[]> {
    const db = await getFirestoreDb();
    if (!db) return [...(memory.redemptionsByCompany[companyId] ?? [])];

    const snap = await db.collection(entitlementRedemptionsCollectionPath(companyId)).orderBy("createdAt", "desc").limit(1200).get();
    const rows = snap.docs.map((doc) =>
        normalizeEntitlementRedemptionDocument({
            ...(doc.data() as Record<string, unknown>),
            entitlementRedemptionId: doc.id,
            companyId,
            entitlementId: toText((doc.data() as Record<string, unknown>).entitlementId, 120),
            customerId: toText((doc.data() as Record<string, unknown>).customerId, 120),
            redeemedProductId: toText((doc.data() as Record<string, unknown>).redeemedProductId, 120),
        }),
    );
    memory.redemptionsByCompany[companyId] = rows;
    return rows;
}

async function saveEntitlement(companyId: string, row: CustomerEntitlement): Promise<void> {
    const list = memory.entitlementsByCompany[companyId] ?? [];
    memory.entitlementsByCompany[companyId] = [row, ...list.filter((item) => item.id !== row.id)];

    const db = await getFirestoreDb();
    if (!db) return;
    await db.collection(customerEntitlementsCollectionPath(companyId)).doc(row.entitlementId).set(row, { merge: true });
}

async function saveRedemption(companyId: string, row: EntitlementRedemption): Promise<void> {
    const list = memory.redemptionsByCompany[companyId] ?? [];
    memory.redemptionsByCompany[companyId] = [row, ...list.filter((item) => item.id !== row.id)];

    const db = await getFirestoreDb();
    if (!db) return;
    await db.collection(entitlementRedemptionsCollectionPath(companyId)).doc(row.entitlementRedemptionId).set(row, { merge: true });
}

export async function listCustomerEntitlements(customerId?: string, companyIdInput?: string): Promise<CustomerEntitlement[]> {
    const scope = await resolveSessionScope();
    const companyId = normalizeCompanyId(companyIdInput) ?? scope?.companyId ?? null;
    if (!companyId) return [];

    const rows = await readEntitlements(companyId);
    const customerIdFilter = toText(customerId, 120);

    return rows
        .filter((row) => (customerIdFilter ? row.customerId === customerIdFilter : true))
        .sort((a, b) => toMs(b.updatedAt) - toMs(a.updatedAt));
}

export async function listEntitlementRedemptions(customerId?: string, companyIdInput?: string): Promise<EntitlementRedemption[]> {
    const scope = await resolveSessionScope();
    const companyId = normalizeCompanyId(companyIdInput) ?? scope?.companyId ?? null;
    if (!companyId) return [];

    const rows = await readRedemptions(companyId);
    const customerIdFilter = toText(customerId, 120);

    return rows
        .filter((row) => (customerIdFilter ? row.customerId === customerIdFilter : true))
        .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
}

export async function createEntitlement(input: CreateEntitlementInput, companyIdInput?: string): Promise<CustomerEntitlement | null> {
    const scope = await resolveSessionScope();
    const companyId = normalizeCompanyId(companyIdInput) ?? normalizeCompanyId(input.companyId) ?? scope?.companyId ?? null;
    if (!companyId) return null;

    const customerId = toText(input.customerId, 120);
    if (!customerId) return null;

    const createdBy = toNullableText(input.createdBy, 120) ?? scope?.operatorUserId ?? null;
    const updatedBy = toNullableText(input.updatedBy, 120) ?? scope?.operatorUserId ?? null;

    const normalized = normalizeCustomerEntitlementDocument({
        entitlementId: toText(input.entitlementId, 120) || `entitlement_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        companyId,
        branchId: toNullableText(input.branchId, 120),
        customerId,
        customerSnapshot: input.customerSnapshot ?? null,
        entitlementCode: toNullableText(input.entitlementCode, 120),
        sourceType: input.sourceType,
        sourceId: toNullableText(input.sourceId, 120),
        sourceCode: toNullableText(input.sourceCode, 120),
        entitlementType: input.entitlementType,
        scopeType: input.scopeType,
        categoryId: toNullableText(input.categoryId, 120),
        categoryName: toNullableText(input.categoryName),
        productId: toNullableText(input.productId, 120),
        productName: toNullableText(input.productName),
        sku: toNullableText(input.sku, 120),
        totalQty: Math.max(1, toNonNegativeInt(input.totalQty, 1)),
        usedQty: toNonNegativeInt(input.usedQty, 0),
        remainingQty: toNonNegativeInt(input.remainingQty, Math.max(1, toNonNegativeInt(input.totalQty, 1))),
        status: input.status,
        note: toNullableText(input.note, 800),
        expiresAt: input.expiresAt,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
        createdBy,
        updatedBy,
    });

    await saveEntitlement(companyId, normalized);
    return normalized;
}

export const createCustomerEntitlement = createEntitlement;

export async function redeemEntitlement(
    input: RedeemEntitlementInput,
    companyIdInput?: string,
): Promise<{ entitlement: CustomerEntitlement; redemption: EntitlementRedemption } | null> {
    const scope = await resolveSessionScope();
    const companyId = normalizeCompanyId(companyIdInput) ?? scope?.companyId ?? null;
    if (!companyId) return null;

    const entitlementId = toText(input.entitlementId, 120);
    const productId = toText(input.productId, 120);
    const qty = Math.max(1, toNonNegativeInt(input.qty, 1));
    if (!entitlementId || !productId) return null;

    const entitlements = await readEntitlements(companyId);
    const current = entitlements.find((row) => row.entitlementId === entitlementId || row.id === entitlementId) ?? null;
    if (!current) return null;

    if (!(current.status === "active" || current.status === "partially_used")) return null;
    if (current.remainingQty <= 0 || current.remainingQty < qty) return null;
    if (current.expiresAt && toMs(current.expiresAt) > 0 && toMs(current.expiresAt) <= Date.now()) return null;

    const productSnapshot = await loadProductScopeSnapshot(companyId, productId);
    if (!productSnapshot) return null;

    if (!matchesEntitlementScope(current, productSnapshot)) return null;

    const inventory = await getInventoryByProductId(productId, companyId);
    if (!inventory) return null;
    if (inventory.availableQty < qty) return null;

    const adjusted = await adjustInventory({
        companyId,
        productId,
        eventType: "entitlement_redemption",
        qty,
        onHandDelta: -qty,
        reservedDelta: 0,
        referenceType: "entitlementRedemption",
        referenceId: current.entitlementId,
        note: toText(input.note, 800) || `redeem entitlement ${current.entitlementId}`,
        operatorUserId: scope?.operatorUserId,
        operatorName: scope?.operatorName,
        enforceAvailable: true,
    });

    if (!adjusted) return null;

    const usedQty = current.usedQty + qty;
    const remainingQty = Math.max(0, current.remainingQty - qty);
    const status: CustomerEntitlementStatus = evaluateCustomerEntitlementStatus({
        totalQty: current.totalQty,
        usedQty,
        remainingQty,
        expiresAt: current.expiresAt,
        requestedStatus: current.status,
    });

    const updatedEntitlement = normalizeCustomerEntitlementDocument({
        ...current,
        entitlementId: current.entitlementId,
        companyId,
        customerId: current.customerId,
        usedQty,
        remainingQty,
        status,
        updatedAt: new Date().toISOString(),
        updatedBy: scope?.operatorUserId ?? current.updatedBy,
    });

    const redemption = normalizeEntitlementRedemptionDocument({
        entitlementRedemptionId: `ent_red_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        companyId,
        branchId: current.branchId,
        entitlementId: current.entitlementId,
        customerId: current.customerId,
        redeemedProductId: productSnapshot.productId,
        redeemedSku: productSnapshot.sku,
        redeemedProductSnapshot: {
            name: productSnapshot.productName,
            categoryId: productSnapshot.categoryId,
            categoryName: productSnapshot.categoryName,
            brandId: productSnapshot.brandId,
            brandName: productSnapshot.brandName,
            modelId: productSnapshot.modelId,
            modelName: productSnapshot.modelName,
        },
        redeemedQty: qty,
        inventoryMovementId: adjusted.movement.inventoryMovementId,
        note: toNullableText(input.note, 800),
        operatorUserId: scope?.operatorUserId ?? null,
        operatorName: scope?.operatorName ?? null,
        createdAt: new Date().toISOString(),
    });

    await Promise.all([saveEntitlement(companyId, updatedEntitlement), saveRedemption(companyId, redemption)]);

    return {
        entitlement: updatedEntitlement,
        redemption,
    };
}

export const redeemCustomerEntitlement = redeemEntitlement;

export async function expireEntitlements(companyIdInput?: string): Promise<number> {
    const scope = await resolveSessionScope();
    const companyId = normalizeCompanyId(companyIdInput) ?? scope?.companyId ?? null;
    if (!companyId) return 0;

    const rows = await readEntitlements(companyId);
    const nowMs = Date.now();
    const targets = rows.filter((row) => {
        if (!(row.status === "active" || row.status === "partially_used")) return false;
        const expiresAtMs = toMs(row.expiresAt);
        return expiresAtMs > 0 && expiresAtMs <= nowMs;
    });

    if (targets.length === 0) return 0;

    await Promise.all(
        targets.map((row) =>
            saveEntitlement(
                companyId,
                normalizeCustomerEntitlementDocument({
                    ...row,
                    entitlementId: row.entitlementId,
                    companyId,
                    customerId: row.customerId,
                    status: "expired",
                    updatedAt: new Date().toISOString(),
                    updatedBy: scope?.operatorUserId ?? row.updatedBy,
                }),
            ),
        ),
    );

    return targets.length;
}

export async function createEntitlementsFromCheckoutPromotions(input: {
    customerId: string;
    sourceId: string;
    drafts: PromotionEntitlementDraft[];
    companyId?: string;
}): Promise<CustomerEntitlement[]> {
    const customerId = toText(input.customerId, 120);
    if (!customerId) return [];

    const created: CustomerEntitlement[] = [];
    for (const draft of input.drafts) {
        const entitlement = await createEntitlement(
            {
                customerId,
                sourceType: draft.sourceType,
                sourceId: draft.sourceId || input.sourceId,
                sourceCode: draft.promotionId,
                entitlementType: draft.entitlementType,
                scopeType: draft.scopeType,
                categoryId: draft.categoryId,
                categoryName: draft.categoryName,
                productId: draft.productId,
                productName: draft.productName,
                totalQty: Math.max(1, toNonNegativeInt(draft.totalQty, 1)),
                usedQty: 0,
                remainingQty: Math.max(1, toNonNegativeInt(draft.totalQty, 1)),
                note: draft.note || `${draft.promotionName} / ${draft.promotionId}`,
                expiresAt: typeof draft.expiresAt === "number" && Number.isFinite(draft.expiresAt) && draft.expiresAt > 0 ? new Date(draft.expiresAt).toISOString() : null,
            },
            input.companyId,
        );
        if (entitlement) created.push(entitlement);
    }

    return created;
}
