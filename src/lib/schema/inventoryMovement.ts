export const INVENTORY_MOVEMENT_EVENT_TYPES = [
    "purchase_in",
    "manual_adjustment",
    "sale_out",
    "reservation_created",
    "reservation_released",
    "pickup_completed",
    "return_in",
    "entitlement_redemption",
] as const;

export const INVENTORY_MOVEMENT_REFERENCE_TYPES = [
    "receipt",
    "pickupReservation",
    "manualAdjustment",
    "return",
    "entitlementRedemption",
    "purchaseOrder",
    "unknown",
] as const;

export type InventoryMovementEventType = (typeof INVENTORY_MOVEMENT_EVENT_TYPES)[number];
export type InventoryMovementReferenceType = (typeof INVENTORY_MOVEMENT_REFERENCE_TYPES)[number];

export const INVENTORY_MOVEMENT_KEYS = [
    "inventoryMovementId",
    "companyId",
    "branchId",
    "productId",
    "sku",
    "productName",
    "eventType",
    "qtyDelta",
    "qtyBefore",
    "qtyAfter",
    "reservedQtyBefore",
    "reservedQtyAfter",
    "referenceType",
    "referenceId",
    "note",
    "operatorUserId",
    "operatorName",
    "createdAt",
] as const;

export type InventoryMovementKey = (typeof INVENTORY_MOVEMENT_KEYS)[number];

export type InventoryMovementDocument = {
    inventoryMovementId: string;
    id: string;
    companyId: string;
    branchId: string | null;
    productId: string;
    sku: string;
    productName: string;
    eventType: InventoryMovementEventType;
    qtyDelta: number;
    qtyBefore: number;
    qtyAfter: number;
    reservedQtyBefore: number;
    reservedQtyAfter: number;
    referenceType: InventoryMovementReferenceType;
    referenceId: string | null;
    note: string | null;
    operatorUserId: string | null;
    operatorName: string | null;
    createdAt: string;
};

export type InventoryMovementLog = InventoryMovementDocument;

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toNullableText(value: unknown, max = 240): string | null {
    const cleaned = toText(value, max);
    return cleaned || null;
}

function toInt(value: unknown, fallback = 0): number {
    const raw = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(raw)) return Math.round(fallback);
    return Math.round(raw);
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

function toEventType(value: unknown): InventoryMovementEventType {
    if (value === "purchase_in") return "purchase_in";
    if (value === "manual_adjustment") return "manual_adjustment";
    if (value === "sale_out") return "sale_out";
    if (value === "reservation_created") return "reservation_created";
    if (value === "reservation_released") return "reservation_released";
    if (value === "pickup_completed") return "pickup_completed";
    if (value === "return_in") return "return_in";
    if (value === "entitlement_redemption") return "entitlement_redemption";
    return "manual_adjustment";
}

function toReferenceType(value: unknown): InventoryMovementReferenceType {
    if (value === "receipt") return "receipt";
    if (value === "pickupReservation") return "pickupReservation";
    if (value === "manualAdjustment") return "manualAdjustment";
    if (value === "return") return "return";
    if (value === "entitlementRedemption") return "entitlementRedemption";
    if (value === "purchaseOrder") return "purchaseOrder";
    return "unknown";
}

export function normalizeInventoryMovementDocument(
    input: Partial<InventoryMovementDocument> & Pick<InventoryMovementDocument, "companyId" | "productId">,
): InventoryMovementDocument {
    const inventoryMovementId = toText(input.inventoryMovementId || input.id, 120) || `inv_move_${Date.now()}`;

    return {
        inventoryMovementId,
        id: inventoryMovementId,
        companyId: toText(input.companyId, 120),
        branchId: toNullableText(input.branchId, 120),
        productId: toText(input.productId, 120),
        sku: toText(input.sku, 120),
        productName: toText(input.productName) || "Untitled Product",
        eventType: toEventType(input.eventType),
        qtyDelta: toInt(input.qtyDelta),
        qtyBefore: toInt(input.qtyBefore),
        qtyAfter: toInt(input.qtyAfter),
        reservedQtyBefore: toInt(input.reservedQtyBefore),
        reservedQtyAfter: toInt(input.reservedQtyAfter),
        referenceType: toReferenceType(input.referenceType),
        referenceId: toNullableText(input.referenceId, 160),
        note: toNullableText(input.note, 800),
        operatorUserId: toNullableText(input.operatorUserId, 120),
        operatorName: toNullableText(input.operatorName, 120),
        createdAt: toIsoString(input.createdAt),
    };
}

export function isInventoryMovementDocument(value: unknown): value is InventoryMovementDocument {
    if (!value || typeof value !== "object") return false;
    const row = value as Record<string, unknown>;
    return Boolean(toText(row.inventoryMovementId, 120) || toText(row.id, 120));
}

export function inventoryMovementsCollectionPath(companyId: string): string {
    const cleanedCompanyId = toText(companyId, 120);
    return `companies/${cleanedCompanyId}/inventoryMovements`;
}
