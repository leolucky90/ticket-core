import type { DimensionOption } from "@/lib/types/catalog";
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

export function inferGenericCategoryFromProductType(typeName: string): string {
    const text = normalizeLookupText(typeName);
    if (!text) return "";
    if (text.includes("watch") || text.includes("iwatch") || text.includes("手錶")) return "手錶";
    if (text.includes("ipad") || text.startsWith("tab ")) return "平板";
    return "手機";
}

type CatalogLookupRef = {
    id?: string;
    name?: string;
};

function normalizeLookupText(value: string | undefined): string {
    return value?.trim().toLowerCase() ?? "";
}

function isRepairPartsCategoryName(value: string | undefined): boolean {
    const text = normalizeLookupText(value);
    return text === "維修配件" || text === "repair parts";
}

function matchesLookupRef(
    item: Pick<DimensionOption, "id" | "name" | "categoryId" | "categoryName" | "brandId" | "brandName">,
    ref: CatalogLookupRef,
    fields: {
        id: "id" | "categoryId" | "brandId";
        name: "name" | "categoryName" | "brandName";
    },
): boolean {
    const requestedId = ref.id?.trim() ?? "";
    const requestedName = normalizeLookupText(ref.name);
    if (!requestedId && !requestedName) return false;
    const itemId = (item[fields.id] ?? "").trim();
    const itemName = normalizeLookupText(item[fields.name]);
    if (requestedId && itemId) return itemId === requestedId;
    if (requestedName && itemName) return itemName === requestedName;
    return false;
}

export function filterBrandsForPrimaryCategory(
    brands: DimensionOption[],
    primaryCategory: CatalogLookupRef,
): DimensionOption[] {
    const categoryName = normalizeLookupText(primaryCategory.name);
    if (!categoryName) return [...brands];
    return brands.filter((brand) =>
        (brand.categoryNames ?? []).some((name) => normalizeLookupText(name) === categoryName),
    );
}

export function filterModelsForCatalogSelection(
    models: DimensionOption[],
    selection: {
        brand: CatalogLookupRef;
        primaryCategory?: CatalogLookupRef;
        secondaryCategory?: CatalogLookupRef;
        tertiaryCategory?: CatalogLookupRef;
        productType?: CatalogLookupRef;
    },
): DimensionOption[] {
    const brandId = selection.brand.id?.trim() ?? "";
    const brandName = normalizeLookupText(selection.brand.name);
    if (!brandId && !brandName) return [];

    const primaryCategoryName = selection.primaryCategory?.name?.trim() ?? "";
    const isRepairPartsFlow = isRepairPartsCategoryName(primaryCategoryName);
    const requestedProductType = normalizeLookupText(selection.productType?.name);
    const inferredCategoryFromProductType = requestedProductType
        ? normalizeLookupText(inferGenericCategoryFromProductType(selection.productType?.name ?? ""))
        : "";

    const deepestCategory =
        (selection.tertiaryCategory?.id || selection.tertiaryCategory?.name
            ? selection.tertiaryCategory
            : selection.secondaryCategory?.id || selection.secondaryCategory?.name
              ? selection.secondaryCategory
              : selection.primaryCategory) ?? {};
    const hasCategoryConstraint = !isRepairPartsFlow && Boolean(deepestCategory.id?.trim() || deepestCategory.name?.trim());

    return models.filter((model) => {
        const matchesBrand = matchesLookupRef(model, selection.brand, { id: "brandId", name: "brandName" });
        if (!matchesBrand) return false;
        const matchesCategory = isRepairPartsFlow
            ? !inferredCategoryFromProductType || normalizeLookupText(model.categoryName) === inferredCategoryFromProductType
            : !hasCategoryConstraint || matchesLookupRef(model, deepestCategory, { id: "categoryId", name: "categoryName" });
        if (!matchesCategory) return false;
        if (!requestedProductType) return true;
        return normalizeLookupText(model.productTypeName) === requestedProductType;
    });
}

export function listProductTypesForCatalogSelection(
    models: DimensionOption[],
    brands: DimensionOption[],
    selection: {
        brand: CatalogLookupRef;
        primaryCategory?: CatalogLookupRef;
    },
): string[] {
    const selectedModels = filterModelsForCatalogSelection(models, {
        brand: selection.brand,
        primaryCategory: selection.primaryCategory,
    });
    const fromModels = normalizeBrandTypeNames(selectedModels.map((model) => model.productTypeName ?? ""));
    if (fromModels.length > 0) return fromModels;

    const brandId = selection.brand.id?.trim() ?? "";
    const brandName = normalizeLookupText(selection.brand.name);
    const selectedBrand =
        brands.find((brand) => (brandId && brand.id === brandId) || (brandName && normalizeLookupText(brand.name) === brandName)) ?? null;
    const allTypes = normalizeBrandTypeNames(selectedBrand?.productTypes ?? []);
    const categoryName = selection.primaryCategory?.name?.trim() ?? "";
    if (!categoryName) return allTypes;
    if (isRepairPartsCategoryName(categoryName)) return allTypes;
    return allTypes.filter((typeName) => inferGenericCategoryFromProductType(typeName) === categoryName);
}
