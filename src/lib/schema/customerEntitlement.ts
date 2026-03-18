export const ENTITLEMENT_SOURCE_TYPES = ["promotion", "after_sale", "manual"] as const;
export const ENTITLEMENT_TYPES = ["replacement", "gift", "discount", "service"] as const;
export const ENTITLEMENT_SCOPE_TYPES = ["category", "product"] as const;
export const CUSTOMER_ENTITLEMENT_STATUSES = ["active", "partially_used", "used_up", "expired", "cancelled"] as const;

export type EntitlementSourceType = (typeof ENTITLEMENT_SOURCE_TYPES)[number];
export type EntitlementType = (typeof ENTITLEMENT_TYPES)[number];
export type EntitlementScopeType = (typeof ENTITLEMENT_SCOPE_TYPES)[number];
export type CustomerEntitlementStatus = (typeof CUSTOMER_ENTITLEMENT_STATUSES)[number];

export type EntitlementCustomerSnapshot = {
    name: string | null;
    phone: string | null;
    email: string | null;
};

export type CustomerEntitlementDocument = {
    entitlementId: string;
    id: string;
    entitlementCode: string | null;
    companyId: string;
    branchId: string | null;
    customerId: string;
    customerSnapshot: EntitlementCustomerSnapshot | null;
    sourceType: EntitlementSourceType;
    sourceId: string | null;
    sourceCode: string | null;
    entitlementType: EntitlementType;
    scopeType: EntitlementScopeType;
    categoryId: string | null;
    categoryName: string | null;
    productId: string | null;
    productName: string | null;
    sku: string | null;
    totalQty: number;
    usedQty: number;
    remainingQty: number;
    status: CustomerEntitlementStatus;
    note: string | null;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    updatedBy: string | null;
};

export type CustomerEntitlement = CustomerEntitlementDocument;

export type CreateCustomerEntitlementInput = {
    companyId: string;
    branchId?: string | null;
    customerId: string;
    customerSnapshot?: EntitlementCustomerSnapshot | null;
    entitlementId?: string;
    id?: string;
    entitlementCode?: string | null;
    sourceType: EntitlementSourceType;
    sourceId?: string | null;
    sourceCode?: string | null;
    entitlementType: EntitlementType;
    scopeType: EntitlementScopeType;
    categoryId?: string | null;
    categoryName?: string | null;
    productId?: string | null;
    productName?: string | null;
    sku?: string | null;
    totalQty: number;
    usedQty?: number;
    remainingQty?: number;
    status?: CustomerEntitlementStatus;
    note?: string | null;
    expiresAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string | null;
    updatedBy?: string | null;
};

export type RedeemEntitlementInput = {
    entitlementId: string;
    productId: string;
    qty: number;
    note?: string;
};

export const CUSTOMER_ENTITLEMENT_KEYS = [
    "entitlementId",
    "entitlementCode",
    "companyId",
    "branchId",
    "customerId",
    "customerSnapshot",
    "sourceType",
    "sourceId",
    "sourceCode",
    "entitlementType",
    "scopeType",
    "categoryId",
    "categoryName",
    "productId",
    "productName",
    "sku",
    "totalQty",
    "usedQty",
    "remainingQty",
    "status",
    "note",
    "expiresAt",
    "createdAt",
    "updatedAt",
    "createdBy",
    "updatedBy",
] as const;

export type CustomerEntitlementKey = (typeof CUSTOMER_ENTITLEMENT_KEYS)[number];

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

function toSourceType(value: unknown): EntitlementSourceType {
    if (value === "after_sale") return "after_sale";
    if (value === "manual") return "manual";
    return "promotion";
}

function toEntitlementType(value: unknown): EntitlementType {
    if (value === "gift") return "gift";
    if (value === "discount") return "discount";
    if (value === "service") return "service";
    return "replacement";
}

function toScopeType(value: unknown): EntitlementScopeType {
    if (value === "product") return "product";
    return "category";
}

function toStatus(value: unknown): CustomerEntitlementStatus {
    if (value === "partially_used") return "partially_used";
    if (value === "used_up") return "used_up";
    if (value === "expired") return "expired";
    if (value === "cancelled") return "cancelled";
    return "active";
}

function normalizeCustomerSnapshot(value: unknown): EntitlementCustomerSnapshot | null {
    if (!value || typeof value !== "object") return null;
    const row = value as Record<string, unknown>;
    return {
        name: toNullableText(row.name),
        phone: toNullableText(row.phone, 40),
        email: toNullableText(row.email, 160),
    };
}

export function evaluateCustomerEntitlementStatus(input: {
    totalQty: number;
    usedQty: number;
    remainingQty: number;
    expiresAt: string | null;
    requestedStatus?: CustomerEntitlementStatus;
}): CustomerEntitlementStatus {
    if (input.requestedStatus === "cancelled") return "cancelled";
    if (input.expiresAt) {
        const expiresMs = Date.parse(input.expiresAt);
        if (Number.isFinite(expiresMs) && expiresMs <= Date.now()) return "expired";
    }
    if (input.remainingQty <= 0 || input.usedQty >= input.totalQty) return "used_up";
    if (input.usedQty > 0) return "partially_used";
    return "active";
}

export function normalizeCustomerEntitlementDocument(
    input: Partial<CustomerEntitlementDocument> & Pick<CustomerEntitlementDocument, "companyId" | "customerId">,
): CustomerEntitlementDocument {
    const entitlementId = toText(input.entitlementId || input.id, 120) || `entitlement_${Date.now()}`;
    const totalQty = Math.max(1, toNonNegativeInt(input.totalQty, 1));
    const usedQty = Math.min(totalQty, toNonNegativeInt(input.usedQty, 0));
    const remainingQty = Math.max(0, toNonNegativeInt(input.remainingQty, totalQty - usedQty));
    const expiresAt = toIsoStringOrNull(input.expiresAt);
    const status = evaluateCustomerEntitlementStatus({
        totalQty,
        usedQty,
        remainingQty,
        expiresAt,
        requestedStatus: toStatus(input.status),
    });
    const createdAt = toIsoString(input.createdAt);

    return {
        entitlementId,
        id: entitlementId,
        entitlementCode: toNullableText(input.entitlementCode, 120),
        companyId: toText(input.companyId, 120),
        branchId: toNullableText(input.branchId, 120),
        customerId: toText(input.customerId, 120),
        customerSnapshot: normalizeCustomerSnapshot(input.customerSnapshot),
        sourceType: toSourceType(input.sourceType),
        sourceId: toNullableText(input.sourceId, 120),
        sourceCode: toNullableText(input.sourceCode, 120),
        entitlementType: toEntitlementType(input.entitlementType),
        scopeType: toScopeType(input.scopeType),
        categoryId: toNullableText(input.categoryId, 120),
        categoryName: toNullableText(input.categoryName),
        productId: toNullableText(input.productId, 120),
        productName: toNullableText(input.productName),
        sku: toNullableText(input.sku, 120),
        totalQty,
        usedQty,
        remainingQty,
        status,
        note: toNullableText(input.note, 800),
        expiresAt,
        createdAt,
        updatedAt: toIsoString(input.updatedAt, Date.parse(createdAt)),
        createdBy: toNullableText(input.createdBy, 120),
        updatedBy: toNullableText(input.updatedBy, 120),
    };
}

export function isCustomerEntitlementDocument(value: unknown): value is CustomerEntitlementDocument {
    if (!value || typeof value !== "object") return false;
    const row = value as Record<string, unknown>;
    return Boolean(toText(row.entitlementId, 120) || toText(row.id, 120));
}

export function customerEntitlementsCollectionPath(companyId: string): string {
    const cleanedCompanyId = toText(companyId, 120);
    return `companies/${cleanedCompanyId}/customerEntitlements`;
}
