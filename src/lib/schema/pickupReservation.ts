export const PICKUP_RESERVATION_SOURCE_CHANNELS = ["pos", "manual", "phone", "online"] as const;

export const PICKUP_RESERVATION_STATUSES = [
    "pending",
    "reserved",
    "packed",
    "ready_for_pickup",
    "picked_up",
    "cancelled",
    "expired",
] as const;

export type PickupReservationSourceChannel = (typeof PICKUP_RESERVATION_SOURCE_CHANNELS)[number];
export type PickupReservationStatus = (typeof PICKUP_RESERVATION_STATUSES)[number];

export type PickupReservationCustomerSnapshot = {
    name: string | null;
    phone: string | null;
    email: string | null;
};

export type PickupReservationLineItemProductSnapshot = {
    name: string;
    categoryId: string | null;
    categoryName: string | null;
    brandId: string | null;
    brandName: string | null;
    modelId: string | null;
    modelName: string | null;
};

export type PickupReservationLineItem = {
    lineId: string;
    productId: string;
    sku: string;
    productSnapshot: PickupReservationLineItemProductSnapshot;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    inventoryTracked: boolean;
};

export type PickupReservationDocument = {
    pickupReservationId: string;
    id: string;
    reservationCode: string;
    companyId: string;
    branchId: string | null;
    sourceChannel: PickupReservationSourceChannel;
    status: PickupReservationStatus;
    customerId: string | null;
    customerSnapshot: PickupReservationCustomerSnapshot | null;
    note: string | null;
    internalNote: string | null;
    lineItems: PickupReservationLineItem[];
    totalReservedQty: number;
    totalAmount: number;
    reservedAt: string | null;
    packedAt: string | null;
    readyAt: string | null;
    pickedUpAt: string | null;
    cancelledAt: string | null;
    expiredAt: string | null;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    updatedBy: string | null;
};

export type PickupReservation = PickupReservationDocument;

export type CreatePickupReservationInput = {
    companyId: string;
    branchId?: string | null;
    pickupReservationId?: string;
    id?: string;
    reservationCode?: string;
    sourceChannel: PickupReservationSourceChannel;
    status?: PickupReservationStatus;
    customerId?: string | null;
    customerSnapshot?: PickupReservationCustomerSnapshot | null;
    note?: string | null;
    internalNote?: string | null;
    lineItems: PickupReservationLineItem[];
    reservedAt?: string | null;
    packedAt?: string | null;
    readyAt?: string | null;
    pickedUpAt?: string | null;
    cancelledAt?: string | null;
    expiredAt?: string | null;
    expiresAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string | null;
    updatedBy?: string | null;
};

export type InventoryReservationReference = {
    referenceType: "pickupReservation" | "pickup_reservation" | "pickup_order" | "manual";
    referenceId: string;
    note?: string;
};

export const PICKUP_RESERVATION_KEYS = [
    "pickupReservationId",
    "reservationCode",
    "companyId",
    "branchId",
    "sourceChannel",
    "status",
    "customerId",
    "customerSnapshot",
    "note",
    "internalNote",
    "lineItems",
    "totalReservedQty",
    "totalAmount",
    "reservedAt",
    "packedAt",
    "readyAt",
    "pickedUpAt",
    "cancelledAt",
    "expiredAt",
    "expiresAt",
    "createdAt",
    "updatedAt",
    "createdBy",
    "updatedBy",
] as const;

export type PickupReservationKey = (typeof PICKUP_RESERVATION_KEYS)[number];

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

function toIsoStringOrNull(value: unknown): string | null {
    if (typeof value === "string") {
        const parsed = Date.parse(value);
        if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
        return null;
    }
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return new Date(Math.round(value)).toISOString();
    }
    return null;
}

function toIsoString(value: unknown, fallbackMs = Date.now()): string {
    return toIsoStringOrNull(value) ?? new Date(fallbackMs).toISOString();
}

function toSourceChannel(value: unknown): PickupReservationSourceChannel {
    if (value === "manual") return "manual";
    if (value === "phone") return "phone";
    if (value === "online") return "online";
    return "pos";
}

function toStatus(value: unknown): PickupReservationStatus {
    if (value === "pending") return "pending";
    if (value === "reserved") return "reserved";
    if (value === "packed") return "packed";
    if (value === "ready_for_pickup") return "ready_for_pickup";
    if (value === "picked_up") return "picked_up";
    if (value === "cancelled") return "cancelled";
    if (value === "expired") return "expired";
    return "pending";
}

function normalizeLineItemSnapshot(value: unknown): PickupReservationLineItemProductSnapshot {
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

function normalizeLineItem(value: unknown): PickupReservationLineItem | null {
    if (!value || typeof value !== "object") return null;
    const row = value as Record<string, unknown>;
    const productId = toText(row.productId, 120);
    if (!productId) return null;

    const qty = Math.max(1, toNonNegativeInt(row.qty, 1));
    const unitPrice = toNonNegativeInt(row.unitPrice, 0);
    const lineTotal = toNonNegativeInt(row.lineTotal, qty * unitPrice);

    return {
        lineId: toText(row.lineId, 120) || `line_${Date.now()}`,
        productId,
        sku: toText(row.sku, 120),
        productSnapshot: normalizeLineItemSnapshot(row.productSnapshot),
        qty,
        unitPrice,
        lineTotal,
        inventoryTracked: row.inventoryTracked !== false,
    };
}

function normalizeCustomerSnapshot(value: unknown): PickupReservationCustomerSnapshot | null {
    if (!value || typeof value !== "object") return null;
    const row = value as Record<string, unknown>;
    return {
        name: toNullableText(row.name),
        phone: toNullableText(row.phone, 40),
        email: toNullableText(row.email, 160),
    };
}

export function normalizePickupReservationDocument(
    input: Partial<PickupReservationDocument> & Pick<PickupReservationDocument, "companyId">,
): PickupReservationDocument {
    const pickupReservationId =
        toText(input.pickupReservationId || input.id, 120) || `pickup_reservation_${Date.now()}`;
    const lineItems = Array.isArray(input.lineItems)
        ? input.lineItems
              .map((item) => normalizeLineItem(item))
              .filter((item): item is PickupReservationLineItem => item !== null)
              .slice(0, 80)
        : [];

    const totalReservedQty = lineItems.reduce((sum, row) => sum + row.qty, 0);
    const totalAmount = lineItems.reduce((sum, row) => sum + row.lineTotal, 0);
    const createdAt = toIsoString(input.createdAt);

    return {
        pickupReservationId,
        id: pickupReservationId,
        reservationCode: toText(input.reservationCode, 120) || pickupReservationId,
        companyId: toText(input.companyId, 120),
        branchId: toNullableText(input.branchId, 120),
        sourceChannel: toSourceChannel(input.sourceChannel),
        status: toStatus(input.status),
        customerId: toNullableText(input.customerId, 120),
        customerSnapshot: normalizeCustomerSnapshot(input.customerSnapshot),
        note: toNullableText(input.note, 800),
        internalNote: toNullableText(input.internalNote, 800),
        lineItems,
        totalReservedQty,
        totalAmount,
        reservedAt: toIsoStringOrNull(input.reservedAt),
        packedAt: toIsoStringOrNull(input.packedAt),
        readyAt: toIsoStringOrNull(input.readyAt),
        pickedUpAt: toIsoStringOrNull(input.pickedUpAt),
        cancelledAt: toIsoStringOrNull(input.cancelledAt),
        expiredAt: toIsoStringOrNull(input.expiredAt),
        expiresAt: toIsoStringOrNull(input.expiresAt),
        createdAt,
        updatedAt: toIsoString(input.updatedAt, Date.parse(createdAt)),
        createdBy: toNullableText(input.createdBy, 120),
        updatedBy: toNullableText(input.updatedBy, 120),
    };
}

export function isPickupReservationDocument(value: unknown): value is PickupReservationDocument {
    if (!value || typeof value !== "object") return false;
    const row = value as Record<string, unknown>;
    return Boolean(toText(row.pickupReservationId, 120) || toText(row.id, 120));
}

export function pickupReservationsCollectionPath(companyId: string): string {
    const cleanedCompanyId = toText(companyId, 120);
    return `companies/${cleanedCompanyId}/pickupReservations`;
}
