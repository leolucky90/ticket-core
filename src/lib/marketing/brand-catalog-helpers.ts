import type { RepairBrand } from "@/lib/types/repair-brand";

export const COMMON_BRAND_TYPE_SUGGESTIONS = [
    "手機配件",
    "車用配件",
    "充電線",
    "充電器",
    "無線充電器",
    "車用充電器",
    "行動電源",
    "保護貼",
    "保護殼",
    "支架",
    "轉接器",
    "傳輸線",
    "耳機",
    "喇叭",
    "筆電配件",
    "平板配件",
    "手錶配件",
];

export function normalizeBrandTypeNames(typeNames: string[]): string[] {
    return typeNames
        .map((typeName) => typeName.trim())
        .filter((typeName, index, all) => typeName.length > 0 && all.findIndex((item) => item.toLowerCase() === typeName.toLowerCase()) === index)
        .sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

export function getBrandTypeNames(brand: Pick<RepairBrand, "productTypes" | "modelsByType" | "usedProductTypes">): string[] {
    return normalizeBrandTypeNames([
        ...(brand.productTypes ?? []),
        ...(brand.modelsByType ?? []).map((group) => group.typeName),
        ...(brand.usedProductTypes ?? []),
    ]);
}

export function getBrandCategoryNames(brand: Pick<RepairBrand, "linkedCategoryNames">): string[] {
    return normalizeBrandTypeNames(brand.linkedCategoryNames ?? []);
}

export function buildBrandTypeSuggestionPool(brands: RepairBrand[], categoryNames: string[]): string[] {
    return normalizeBrandTypeNames([
        ...COMMON_BRAND_TYPE_SUGGESTIONS,
        ...categoryNames,
        ...brands.flatMap((brand) => getBrandTypeNames(brand)),
    ]);
}

export function rankBrandTypeSuggestions(items: string[], keyword: string, excluded: string[]): string[] {
    const q = keyword.trim().toLowerCase();
    const excludedSet = new Set(excluded.map((item) => item.trim().toLowerCase()));
    return items
        .filter((item) => {
            const normalized = item.trim().toLowerCase();
            if (!normalized || excludedSet.has(normalized)) return false;
            if (!q) return true;
            return normalized.includes(q);
        })
        .sort((a, b) => {
            const aText = a.toLowerCase();
            const bText = b.toLowerCase();
            const aStarts = q ? aText.startsWith(q) : false;
            const bStarts = q ? bText.startsWith(q) : false;
            if (aStarts !== bStarts) return aStarts ? -1 : 1;
            const aIndex = q ? aText.indexOf(q) : 0;
            const bIndex = q ? bText.indexOf(q) : 0;
            if (aIndex !== bIndex) return aIndex - bIndex;
            if (a.length !== b.length) return a.length - b.length;
            return a.localeCompare(b, "zh-Hant");
        })
        .slice(0, 6);
}

export function getBrandModelsForType(brand: RepairBrand, typeName: string): string[] {
    const requestedTypeName = typeName.trim().toLowerCase();
    if (!requestedTypeName) return brand.models;

    const matchedGroup = (brand.modelsByType ?? []).find((group) => group.typeName.trim().toLowerCase() === requestedTypeName) ?? null;
    if (matchedGroup) return matchedGroup.models;
    if ((brand.modelsByType ?? []).length === 0) return brand.models;
    if (getBrandTypeNames(brand).length <= 1) return brand.models;
    return [];
}
