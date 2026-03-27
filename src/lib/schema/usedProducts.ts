export const USED_PRODUCT_GRADES = ["GRADE_A", "GRADE_B", "GRADE_C", "GRADE_D", "CUSTOM"] as const;
export const USED_PRODUCT_REFURBISHMENT_STATUSES = [
    "waiting_refurbishment",
    "no_need_refurbishment",
    "refurbished",
    "refurbishing",
] as const;
export const USED_PRODUCT_SALE_STATUSES = [
    "draft",
    "purchased",
    "inspecting",
    "available",
    "reserved",
    "sold",
    "returned",
    "archived",
] as const;
export const USED_PRODUCT_WARRANTY_UNITS = ["day", "month"] as const;

export type UsedProductGrade = (typeof USED_PRODUCT_GRADES)[number];
export type UsedProductRefurbishmentStatus = (typeof USED_PRODUCT_REFURBISHMENT_STATUSES)[number];
export type UsedProductSaleStatus = (typeof USED_PRODUCT_SALE_STATUSES)[number];
export type UsedProductWarrantyUnit = (typeof USED_PRODUCT_WARRANTY_UNITS)[number];

export type UsedProductSpecificationItem = {
    key: string;
    value: string;
};

export type UsedProduct = {
    id: string;

    name: string;
    brand: string;
    model: string;
    type: string;
    productCondition: "used";

    serialNumber?: string;
    imeiNumber?: string;

    grade: UsedProductGrade;
    gradeLabel?: string;
    conditionNote?: string;
    functionalNote?: string;

    specifications: string;
    specificationItems: UsedProductSpecificationItem[];

    isRefurbished: boolean;
    refurbishmentStatus: UsedProductRefurbishmentStatus;
    refurbishmentNote?: string;
    refurbishmentCaseId?: string;

    purchaseDate: string;
    purchasePrice: number;
    sourceNote?: string;
    inspectedBy?: string;
    inspectionResult?: string;

    suggestedSalePrice?: number;
    salePrice?: number;
    saleStatus: UsedProductSaleStatus;
    isSellable: boolean;
    isPublished: boolean;

    warrantyEnabled: boolean;
    warrantyDuration: number;
    warrantyUnit: UsedProductWarrantyUnit;
    warrantyStartsOn: "receipt_issued_at";
    warrantyStartAt?: string;
    warrantyEndAt?: string;
    warrantyNote?: string;

    soldAt?: string;
    soldReceiptId?: string;
    soldOrderId?: string;
    soldCustomerId?: string;

    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
};

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toMoney(value: unknown, fallback = 0): number {
    const raw = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(raw)) return Math.max(0, Math.round(fallback));
    return Math.max(0, Math.round(raw));
}

function toBool(value: unknown, fallback: boolean): boolean {
    if (typeof value === "boolean") return value;
    return fallback;
}

function toIso(value: unknown, fallback: string): string {
    if (typeof value === "string" && value.trim()) {
        const ts = Date.parse(value);
        if (Number.isFinite(ts)) return new Date(ts).toISOString();
    }
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return new Date(Math.round(value)).toISOString();
    }
    return fallback;
}

function toDateOnlyIso(value: unknown, fallbackIso: string): string {
    const iso = toIso(value, fallbackIso);
    return iso.slice(0, 10);
}

function toGrade(value: unknown): UsedProductGrade {
    if (value === "GRADE_A") return "GRADE_A";
    if (value === "GRADE_B") return "GRADE_B";
    if (value === "GRADE_C") return "GRADE_C";
    if (value === "GRADE_D") return "GRADE_D";
    if (value === "CUSTOM") return "CUSTOM";
    return "GRADE_B";
}

function toRefurbishmentStatus(value: unknown): UsedProductRefurbishmentStatus {
    if (value === "no_need_refurbishment") return "no_need_refurbishment";
    if (value === "refurbished") return "refurbished";
    if (value === "refurbishing") return "refurbishing";
    return "waiting_refurbishment";
}

function toSaleStatus(value: unknown): UsedProductSaleStatus {
    if (value === "purchased") return "purchased";
    if (value === "inspecting") return "inspecting";
    if (value === "available") return "available";
    if (value === "reserved") return "reserved";
    if (value === "sold") return "sold";
    if (value === "returned") return "returned";
    if (value === "archived") return "archived";
    return "draft";
}

function toWarrantyUnit(value: unknown): UsedProductWarrantyUnit {
    if (value === "day") return "day";
    return "month";
}

function normalizeSpecificationItems(value: unknown): UsedProductSpecificationItem[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((row) => {
            if (!row || typeof row !== "object") return null;
            const data = row as Record<string, unknown>;
            const key = toText(data.key, 120);
            const itemValue = toText(data.value, 240);
            if (!key && !itemValue) return null;
            return {
                key,
                value: itemValue,
            } satisfies UsedProductSpecificationItem;
        })
        .filter((row): row is UsedProductSpecificationItem => row !== null)
        .slice(0, 40);
}

export function usedProductsCollectionPath(companyId: string): string {
    return `companies/${toText(companyId, 120)}/usedProducts`;
}

export function normalizeUsedProduct(input: Partial<UsedProduct> & Pick<UsedProduct, "id">): UsedProduct {
    const nowIso = new Date().toISOString();
    const createdAt = toIso(input.createdAt, nowIso);
    const specificationItems = normalizeSpecificationItems(input.specificationItems);

    return {
        id: toText(input.id, 120),
        name: toText(input.name, 240) || "未命名二手商品",
        brand: toText(input.brand, 120),
        model: toText(input.model, 160),
        type: toText(input.type, 120) || "其他",
        productCondition: "used",

        serialNumber: toText(input.serialNumber, 120) || undefined,
        imeiNumber: toText(input.imeiNumber, 120) || undefined,

        grade: toGrade(input.grade),
        gradeLabel: toText(input.gradeLabel, 120) || undefined,
        conditionNote: toText(input.conditionNote, 2000) || undefined,
        functionalNote: toText(input.functionalNote, 2000) || undefined,

        specifications: toText(input.specifications, 2000),
        specificationItems,

        isRefurbished: toBool(input.isRefurbished, false),
        refurbishmentStatus: toRefurbishmentStatus(input.refurbishmentStatus),
        refurbishmentNote: toText(input.refurbishmentNote, 2000) || undefined,
        refurbishmentCaseId: toText(input.refurbishmentCaseId, 120) || undefined,

        purchaseDate: toDateOnlyIso(input.purchaseDate, nowIso),
        purchasePrice: toMoney(input.purchasePrice),
        sourceNote: toText(input.sourceNote, 500) || undefined,
        inspectedBy: toText(input.inspectedBy, 120) || undefined,
        inspectionResult: toText(input.inspectionResult, 2000) || undefined,

        suggestedSalePrice: input.suggestedSalePrice === undefined ? undefined : toMoney(input.suggestedSalePrice),
        salePrice: input.salePrice === undefined ? undefined : toMoney(input.salePrice),
        saleStatus: toSaleStatus(input.saleStatus),
        isSellable: toBool(input.isSellable, true),
        isPublished: toBool(input.isPublished, false),

        warrantyEnabled: toBool(input.warrantyEnabled, true),
        warrantyDuration: toMoney(input.warrantyDuration, 3),
        warrantyUnit: toWarrantyUnit(input.warrantyUnit),
        warrantyStartsOn: "receipt_issued_at",
        warrantyStartAt: toText(input.warrantyStartAt, 60) || undefined,
        warrantyEndAt: toText(input.warrantyEndAt, 60) || undefined,
        warrantyNote: toText(input.warrantyNote, 1000) || undefined,

        soldAt: toText(input.soldAt, 60) || undefined,
        soldReceiptId: toText(input.soldReceiptId, 120) || undefined,
        soldOrderId: toText(input.soldOrderId, 120) || undefined,
        soldCustomerId: toText(input.soldCustomerId, 120) || undefined,

        createdAt,
        createdBy: toText(input.createdBy, 120) || "system",
        updatedAt: toIso(input.updatedAt, createdAt),
        updatedBy: toText(input.updatedBy, 120) || "system",
    };
}

export function isUsedProduct(value: unknown): value is UsedProduct {
    if (!value || typeof value !== "object") return false;
    const row = value as Record<string, unknown>;
    return Boolean(toText(row.id, 120) && toText(row.name, 240));
}
