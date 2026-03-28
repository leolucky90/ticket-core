import type { ProductNamingMode } from "@/lib/types/catalog";

type ProductSearchKeywordSource = {
    name: string;
    normalizedName: string;
    aliases?: string[];
    sku?: string | undefined;
    categoryName?: string | undefined;
    brandName?: string | undefined;
    modelName?: string | undefined;
    nameEntryName?: string | undefined;
    customLabel?: string | undefined;
    supplier?: string | undefined;
};

const SPLIT_ALIAS_RE = /[\n,;|、]+/;
const MAX_ALIAS_COUNT = 24;

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

export type ProductNameSuggestionInput = {
    namingMode?: unknown;
    categoryName?: unknown;
    brandName?: unknown;
    modelName?: unknown;
    nameEntryName?: unknown;
    customLabel?: unknown;
};

export function buildProductNameSuggestion(input: ProductNameSuggestionInput): string {
    const namingMode = parseProductNamingMode(input.namingMode);
    const categoryName = toText(input.categoryName);
    const brandName = toText(input.brandName);
    const modelName = toText(input.modelName);
    const nameEntryName = toText(input.nameEntryName);
    const customLabel = toText(input.customLabel);

    const structuredName = joinNameParts([categoryName, brandName, modelName]);
    const customName = customLabel || nameEntryName;

    // `hybrid` keeps structured dimensions plus a reusable/custom label for mixed naming needs.
    if (namingMode === "hybrid") {
        return joinNameParts([brandName, modelName, customName || categoryName]);
    }
    if (namingMode === "structured") {
        return structuredName || joinNameParts([brandName, modelName, nameEntryName, customLabel]);
    }
    return customName || joinNameParts([categoryName, brandName, modelName]);
}

export function buildProductSearchKeywords(product: ProductSearchKeywordSource): string[] {
    return dedupeText(
        [
            product.name,
            product.normalizedName,
            product.sku,
            product.categoryName,
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
    brandName?: unknown;
    modelName?: unknown;
    nameEntryName?: unknown;
    customLabel?: unknown;
}): string {
    const aliases = normalizeAliasList(input.aliases);
    const merged = dedupeText([
        toText(input.name),
        toText(input.categoryName),
        toText(input.brandName),
        toText(input.modelName),
        toText(input.nameEntryName),
        toText(input.customLabel),
        ...aliases,
    ]).join(" ");
    return normalizeSearchText(merged);
}
