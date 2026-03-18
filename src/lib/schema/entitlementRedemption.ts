export type EntitlementRedemptionProductSnapshot = {
    name: string;
    categoryId: string | null;
    categoryName: string | null;
    brandId: string | null;
    brandName: string | null;
    modelId: string | null;
    modelName: string | null;
};

export type EntitlementRedemptionDocument = {
    entitlementRedemptionId: string;
    id: string;
    companyId: string;
    branchId: string | null;
    entitlementId: string;
    customerId: string;
    redeemedProductId: string;
    productId: string;
    redeemedSku: string;
    sku: string;
    redeemedProductSnapshot: EntitlementRedemptionProductSnapshot;
    redeemedQty: number;
    qty: number;
    productName: string;
    inventoryMovementId: string | null;
    note: string | null;
    operatorUserId: string | null;
    operatorName: string | null;
    createdAt: string;
    redeemedAt: string;
};

export type EntitlementRedemption = EntitlementRedemptionDocument;

export const ENTITLEMENT_REDEMPTION_KEYS = [
    "entitlementRedemptionId",
    "companyId",
    "branchId",
    "entitlementId",
    "customerId",
    "redeemedProductId",
    "redeemedSku",
    "redeemedProductSnapshot",
    "redeemedQty",
    "inventoryMovementId",
    "note",
    "operatorUserId",
    "operatorName",
    "createdAt",
] as const;

export type EntitlementRedemptionKey = (typeof ENTITLEMENT_REDEMPTION_KEYS)[number];

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

function toIsoString(value: unknown, fallbackMs = Date.now()): string {
    if (typeof value === "string") {
        const parsed = Date.parse(value);
        if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
    }
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return new Date(Math.round(value)).toISOString();
    }
    return new Date(fallbackMs).toISOString();
}

function normalizeProductSnapshot(value: unknown): EntitlementRedemptionProductSnapshot {
    const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    return {
        name: toText(row.name) || "Untitled Product",
        categoryId: toNullableText(row.categoryId, 120),
        categoryName: toNullableText(row.categoryName),
        brandId: toNullableText(row.brandId, 120),
        brandName: toNullableText(row.brandName),
        modelId: toNullableText(row.modelId, 120),
        modelName: toNullableText(row.modelName),
    };
}

export function normalizeEntitlementRedemptionDocument(
    input: Partial<EntitlementRedemptionDocument> & Pick<EntitlementRedemptionDocument, "companyId" | "entitlementId" | "customerId" | "redeemedProductId">,
): EntitlementRedemptionDocument {
    const entitlementRedemptionId =
        toText(input.entitlementRedemptionId || input.id, 120) || `entitlement_redemption_${Date.now()}`;

    return {
        entitlementRedemptionId,
        id: entitlementRedemptionId,
        companyId: toText(input.companyId, 120),
        branchId: toNullableText(input.branchId, 120),
        entitlementId: toText(input.entitlementId, 120),
        customerId: toText(input.customerId, 120),
        redeemedProductId: toText(input.redeemedProductId, 120),
        productId: toText(input.redeemedProductId || input.productId, 120),
        redeemedSku: toText(input.redeemedSku, 120),
        sku: toText(input.redeemedSku || input.sku, 120),
        redeemedProductSnapshot: normalizeProductSnapshot(input.redeemedProductSnapshot),
        redeemedQty: Math.max(1, toNonNegativeInt(input.redeemedQty, 1)),
        qty: Math.max(1, toNonNegativeInt(input.redeemedQty || input.qty, 1)),
        productName: normalizeProductSnapshot(input.redeemedProductSnapshot).name,
        inventoryMovementId: toNullableText(input.inventoryMovementId, 120),
        note: toNullableText(input.note, 800),
        operatorUserId: toNullableText(input.operatorUserId, 120),
        operatorName: toNullableText(input.operatorName, 120),
        createdAt: toIsoString(input.createdAt),
        redeemedAt: toIsoString(input.createdAt ?? input.redeemedAt),
    };
}

export function isEntitlementRedemptionDocument(value: unknown): value is EntitlementRedemptionDocument {
    if (!value || typeof value !== "object") return false;
    const row = value as Record<string, unknown>;
    return Boolean(toText(row.entitlementRedemptionId, 120) || toText(row.id, 120));
}

export function entitlementRedemptionsCollectionPath(companyId: string): string {
    const cleanedCompanyId = toText(companyId, 120);
    return `companies/${cleanedCompanyId}/entitlementRedemptions`;
}
