export const INVENTORY_STATUSES = ["active", "inactive", "archived"] as const;

export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

export const INVENTORY_KEYS = [
    "productId",
    "sku",
    "productName",
    "categoryId",
    "categoryName",
    "brandId",
    "brandName",
    "modelId",
    "modelName",
    "onHandQty",
    "reservedQty",
    "availableQty",
    "lowStockThreshold",
    "trackInventory",
    "status",
    "companyId",
    "branchId",
    "createdAt",
    "updatedAt",
    "createdBy",
    "updatedBy",
] as const;

export type InventoryKey = (typeof INVENTORY_KEYS)[number];

export type InventoryDocument = {
    productId: string;
    sku: string;
    productName: string;
    categoryId: string | null;
    categoryName: string | null;
    brandId: string | null;
    brandName: string | null;
    modelId: string | null;
    modelName: string | null;
    onHandQty: number;
    reservedQty: number;
    availableQty: number;
    lowStockThreshold: number;
    trackInventory: boolean;
    status: InventoryStatus;
    companyId: string;
    branchId: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    updatedBy: string | null;
};

export type InventoryRecord = InventoryDocument;

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

function toStatus(value: unknown): InventoryStatus {
    if (value === "inactive") return "inactive";
    if (value === "archived") return "archived";
    return "active";
}

export function recomputeAvailableQty(onHandQty: number, reservedQty: number): number {
    return Math.max(toNonNegativeInt(onHandQty) - toNonNegativeInt(reservedQty), 0);
}

export function normalizeInventoryDocument(
    input: Partial<InventoryDocument> & Pick<InventoryDocument, "productId" | "companyId">,
): InventoryDocument {
    const onHandQty = toNonNegativeInt(input.onHandQty);
    const reservedQty = toNonNegativeInt(input.reservedQty);
    const availableQty = recomputeAvailableQty(onHandQty, reservedQty);
    const createdAt = toIsoString(input.createdAt);

    return {
        productId: toText(input.productId, 120),
        sku: toText(input.sku, 120),
        productName: toText(input.productName) || "Untitled Product",
        categoryId: toNullableText(input.categoryId, 120),
        categoryName: toNullableText(input.categoryName),
        brandId: toNullableText(input.brandId, 120),
        brandName: toNullableText(input.brandName),
        modelId: toNullableText(input.modelId, 120),
        modelName: toNullableText(input.modelName),
        onHandQty,
        reservedQty,
        availableQty,
        lowStockThreshold: toNonNegativeInt(input.lowStockThreshold),
        trackInventory: input.trackInventory !== false,
        status: toStatus(input.status),
        companyId: toText(input.companyId, 120),
        branchId: toNullableText(input.branchId, 120),
        createdAt,
        updatedAt: toIsoString(input.updatedAt, Date.parse(createdAt)),
        createdBy: toNullableText(input.createdBy, 120),
        updatedBy: toNullableText(input.updatedBy, 120),
    };
}

export function isInventoryDocument(value: unknown): value is InventoryDocument {
    if (!value || typeof value !== "object") return false;
    const row = value as Record<string, unknown>;
    return Boolean(toText(row.productId, 120) && toText(row.companyId, 120));
}

export function inventoryCollectionPath(companyId: string): string {
    const cleanedCompanyId = toText(companyId, 120);
    return `companies/${cleanedCompanyId}/inventory`;
}
