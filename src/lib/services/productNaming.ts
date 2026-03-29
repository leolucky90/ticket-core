import type { ItemNamingToken, ProductNamingMode } from "@/lib/types/catalog";

type ProductSearchKeywordSource = {
    name: string;
    normalizedName: string;
    aliases?: string[];
    sku?: string | undefined;
    categoryName?: string | undefined;
    secondaryCategoryName?: string | undefined;
    brandName?: string | undefined;
    modelName?: string | undefined;
    nameEntryName?: string | undefined;
    customLabel?: string | undefined;
    supplier?: string | undefined;
};

const SPLIT_ALIAS_RE = /[\n,;|、]+/;
const MAX_ALIAS_COUNT = 24;
export const DEFAULT_ITEM_NAMING_ORDER: ItemNamingToken[] = ["brand", "model", "secondaryCategory"];
const ITEM_NAMING_TOKEN_SET: ReadonlySet<ItemNamingToken> = new Set(["brand", "model", "category", "secondaryCategory"]);

function toText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function dedupeText(values: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const value of values) {
        const text = value.trim();
        if (!text) continue;
        const key = text.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(text);
    }
    return out;
}

export function parseProductNamingMode(value: unknown): ProductNamingMode {
    if (value === "structured") return "structured";
    if (value === "hybrid") return "hybrid";
    return "custom";
}

export function normalizeItemNamingOrder(value: unknown): ItemNamingToken[] {
    const source = Array.isArray(value)
        ? value
        : typeof value === "string"
          ? value.split(/[\s,|>]+/)
          : [];
    const out: ItemNamingToken[] = [];
    const seen = new Set<ItemNamingToken>();
    for (const item of source) {
        const token = toText(item) as ItemNamingToken;
        if (!ITEM_NAMING_TOKEN_SET.has(token)) continue;
        if (seen.has(token)) continue;
        seen.add(token);
        out.push(token);
    }
    return out.length > 0 ? out : [...DEFAULT_ITEM_NAMING_ORDER];
}

export function normalizeSearchText(value: unknown): string {
    return toText(value)
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

export function normalizeAliasList(value: unknown): string[] {
    const source = Array.isArray(value)
        ? value.flatMap((item) => (typeof item === "string" ? item.split(SPLIT_ALIAS_RE) : []))
        : typeof value === "string"
          ? value.split(SPLIT_ALIAS_RE)
          : [];
    return dedupeText(source).slice(0, MAX_ALIAS_COUNT);
}

function joinNameParts(values: Array<string | null | undefined>): string {
    return dedupeText(
        values.map((value) => toText(value)).filter((value) => value.length > 0),
    ).join(" ");
}

/** Appends optional supplementary label after structured auto-name (自動命名 + 副品名). */
export function appendStructuredProductNameSuffix(base: unknown, suffix: unknown): string {
    const b = toText(base);
    const s = toText(suffix);
    if (!s) return b;
    return b ? `${b} ${s}` : s;
}

export type ProductNameSuggestionInput = {
    namingMode?: unknown;
    categoryName?: unknown;
    secondaryCategoryName?: unknown;
    brandName?: unknown;
    modelName?: unknown;
    nameEntryName?: unknown;
    customLabel?: unknown;
    namingOrder?: unknown;
};

export function buildConfiguredProductName(input: {
    categoryName?: unknown;
    secondaryCategoryName?: unknown;
    brandName?: unknown;
    modelName?: unknown;
    namingOrder?: unknown;
}): string {
    const partsByToken: Record<ItemNamingToken, string> = {
        brand: toText(input.brandName),
        model: toText(input.modelName),
        category: toText(input.categoryName),
        secondaryCategory: toText(input.secondaryCategoryName),
    };
    const order = normalizeItemNamingOrder(input.namingOrder);
    const orderedParts = order.map((token) => partsByToken[token]);
    return joinNameParts(orderedParts);
}

export function buildProductNameSuggestion(input: ProductNameSuggestionInput): string {
    const namingMode = parseProductNamingMode(input.namingMode);
    const categoryName = toText(input.categoryName);
    const secondaryCategoryName = toText(input.secondaryCategoryName);
    const brandName = toText(input.brandName);
    const modelName = toText(input.modelName);
    const nameEntryName = toText(input.nameEntryName);
    const customLabel = toText(input.customLabel);

    const structuredName =
        buildConfiguredProductName({
            categoryName,
            secondaryCategoryName,
            brandName,
            modelName,
            namingOrder: input.namingOrder,
        }) || joinNameParts([categoryName, brandName, modelName, secondaryCategoryName]);
    const customName = customLabel || nameEntryName;

    // `hybrid` keeps structured dimensions plus a reusable/custom label for mixed naming needs.
    if (namingMode === "hybrid") {
        return joinNameParts([brandName, modelName, customName || secondaryCategoryName || categoryName]);
    }
    if (namingMode === "structured") {
        return structuredName || joinNameParts([brandName, modelName, secondaryCategoryName, nameEntryName, customLabel]);
    }
    return customName || structuredName || joinNameParts([categoryName, brandName, modelName, secondaryCategoryName]);
}

export function buildProductSearchKeywords(product: ProductSearchKeywordSource): string[] {
    return dedupeText(
        [
            product.name,
            product.normalizedName,
            product.sku,
            product.categoryName,
            product.secondaryCategoryName,
            product.brandName,
            product.modelName,
            product.nameEntryName,
            product.customLabel,
            product.supplier,
            ...(product.aliases ?? []),
        ].filter((value): value is string => typeof value === "string" && value.length > 0),
    );
}

export function buildProductNormalizedName(input: {
    name?: unknown;
    aliases?: unknown;
    categoryName?: unknown;
    secondaryCategoryName?: unknown;
    brandName?: unknown;
    modelName?: unknown;
    nameEntryName?: unknown;
    customLabel?: unknown;
}): string {
    const aliases = normalizeAliasList(input.aliases);
    const merged = dedupeText([
        toText(input.name),
        toText(input.categoryName),
        toText(input.secondaryCategoryName),
        toText(input.brandName),
        toText(input.modelName),
        toText(input.nameEntryName),
        toText(input.customLabel),
        ...aliases,
    ]).join(" ");
    return normalizeSearchText(merged);
}
