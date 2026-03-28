import type { UsedProduct, UsedProductSpecificationItem } from "@/lib/schema";

function toText(value: unknown, max = 2000): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toOptionalNumber(value: unknown): number | undefined {
    const text = toText(value, 120);
    if (!text) return undefined;
    const raw = Number(text);
    if (!Number.isFinite(raw)) return undefined;
    return Math.max(0, Math.round(raw));
}

function toBoolByCheckbox(formData: FormData, key: string): boolean {
    return formData.get(key) === "on";
}

function buildUsedProductName(brand: string, model: string, type: string): string {
    const normalizedBrand = toText(brand, 120);
    const normalizedModel = toText(model, 120);
    const normalizedType = toText(type, 120);
    const primaryName = [normalizedBrand, normalizedType, normalizedModel].filter((value) => value.length > 0).join(" ");
    if (primaryName) return toText(primaryName, 240);
    return toText([normalizedBrand, normalizedType].filter((value) => value.length > 0).join(" "), 240);
}

function resolveSerialOrImei(formData: FormData): string {
    const unifiedValue = toText(formData.get("serialOrImei"), 120);
    if (unifiedValue) return unifiedValue;
    return toText(formData.get("serialNumber"), 120) || toText(formData.get("imeiNumber"), 120);
}

export function parseSpecificationItems(value: unknown): UsedProductSpecificationItem[] {
    const text = toText(value, 100000);
    if (!text) return [];

    try {
        const parsed = JSON.parse(text) as Array<{ key?: unknown; value?: unknown }>;
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((row) => ({
                key: toText(row.key, 120),
                value: toText(row.value, 240),
            }))
            .filter((row) => row.key.length > 0 || row.value.length > 0)
            .slice(0, 40);
    } catch {
        return [];
    }
}

function buildSpecificationsSummary(items: UsedProductSpecificationItem[]): string {
    const summary = items
        .map((item) => {
            const key = toText(item.key, 120);
            const value = toText(item.value, 240);
            if (!key && !value) return "";
            if (!value) return key;
            if (!key) return value;
            return `${key}: ${value}`;
        })
        .filter((item) => item.length > 0)
        .join(" / ");
    return toText(summary, 2000);
}

export function parseUsedProductFormData(
    formData: FormData,
): Partial<Omit<UsedProduct, "id" | "productCondition" | "createdAt" | "createdBy" | "updatedAt" | "updatedBy">> {
    const specificationItems = parseSpecificationItems(formData.get("specificationItemsJson"));
    const brand = toText(formData.get("brand"), 120);
    const model = toText(formData.get("model"), 120);
    const type = toText(formData.get("type"), 120);
    const explicitName = toText(formData.get("name"), 240);
    const serialOrImei = resolveSerialOrImei(formData);
    const needsRefurbishment = toBoolByCheckbox(formData, "isRefurbished");
    const selectedRefurbishmentStatus = (toText(formData.get("refurbishmentStatus"), 80) as UsedProduct["refurbishmentStatus"]) || "waiting_refurbishment";
    const normalizedRefurbishmentStatus = needsRefurbishment
        ? selectedRefurbishmentStatus === "no_need_refurbishment"
            ? "waiting_refurbishment"
            : selectedRefurbishmentStatus
        : "no_need_refurbishment";

    return {
        name: explicitName || buildUsedProductName(brand, model, type),
        brand,
        model,
        type,
        serialNumber: serialOrImei || undefined,
        imeiNumber: serialOrImei || undefined,

        grade: (toText(formData.get("grade"), 40) as UsedProduct["grade"]) || "GRADE_B",
        gradeLabel: toText(formData.get("gradeLabel"), 120) || undefined,
        conditionNote: toText(formData.get("conditionNote"), 2000) || undefined,
        functionalNote: toText(formData.get("functionalNote"), 2000) || undefined,

        specifications: buildSpecificationsSummary(specificationItems),
        specificationItems,

        isRefurbished: needsRefurbishment,
        refurbishmentStatus: normalizedRefurbishmentStatus,
        refurbishmentNote: toText(formData.get("refurbishmentNote"), 2000) || undefined,

        purchaseDate: toText(formData.get("purchaseDate"), 60),
        purchasePrice: toOptionalNumber(formData.get("purchasePrice")) ?? 0,
        sourceNote: toText(formData.get("sourceNote"), 1000) || undefined,
        inspectedBy: toText(formData.get("inspectedBy"), 120) || undefined,
        inspectionResult: toText(formData.get("inspectionResult"), 2000) || undefined,

        suggestedSalePrice: toOptionalNumber(formData.get("suggestedSalePrice")),
        salePrice: toOptionalNumber(formData.get("salePrice")),
        saleStatus: (toText(formData.get("saleStatus"), 80) as UsedProduct["saleStatus"]) || "draft",
        isSellable: toBoolByCheckbox(formData, "isSellable"),
        isPublished: toBoolByCheckbox(formData, "isPublished"),

        warrantyEnabled: toBoolByCheckbox(formData, "warrantyEnabled"),
        warrantyDuration: toOptionalNumber(formData.get("warrantyDuration")) ?? 0,
        warrantyUnit: (toText(formData.get("warrantyUnit"), 20) as UsedProduct["warrantyUnit"]) || "month",
        warrantyNote: toText(formData.get("warrantyNote"), 2000) || undefined,
    };
}
