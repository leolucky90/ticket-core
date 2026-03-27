import "server-only";
import { listProducts } from "@/lib/services/commerce";
import { buildProductNameSuggestion, buildProductNormalizedName, normalizeAliasList, parseProductNamingMode } from "@/lib/services/productNaming";
import type { DimensionPickerBundle, ProductNamingMode, StockDeductionMode } from "@/lib/types/catalog";
import type { ProductDoc } from "@/lib/types/product";
import type { Product } from "@/lib/types/commerce";

type ProductNameSuggestionInput = {
    namingMode?: unknown;
    categoryName?: unknown;
    brandName?: unknown;
    modelName?: unknown;
    nameEntryName?: unknown;
    customLabel?: unknown;
};

type ProductDraftInput = Partial<ProductDoc> & {
    name?: string;
    categoryName?: string;
    brandName?: string;
    modelName?: string;
    nameEntryName?: string;
    customLabel?: string;
};

function toIso(value: unknown, fallback: string): string {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return new Date(value).toISOString();
    }
    return fallback;
}

function toStatus(value: unknown): "active" | "inactive" {
    return value === "inactive" ? "inactive" : "active";
}

function toStockMode(value: unknown): StockDeductionMode {
    return value === "redeem_only" ? "redeem_only" : "immediate";
}

function toNumber(value: unknown, fallback = 0): number {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return n;
}

function toText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function toProductDoc(legacy: Product): ProductDoc {
    const nowIso = new Date().toISOString();
    return {
        id: legacy.id,
        companyId: legacy.companyId ?? "",
        name: legacy.name,
        normalizedName: legacy.normalizedName || buildProductNormalizedName({ name: legacy.name, aliases: legacy.aliases }),
        aliases: normalizeAliasList(legacy.aliases),
        namingMode: parseProductNamingMode(legacy.namingMode),
        categoryId: legacy.categoryId || undefined,
        categoryName: legacy.categoryName || undefined,
        brandId: legacy.brandId || undefined,
        brandName: legacy.brandName || undefined,
        modelId: legacy.modelId || undefined,
        modelName: legacy.modelName || undefined,
        nameEntryId: legacy.nameEntryId || undefined,
        nameEntryName: legacy.nameEntryName || undefined,
        customLabel: legacy.customLabel || undefined,
        sku: legacy.sku || undefined,
        supplier: legacy.supplier || undefined,
        sellPrice: Math.max(0, toNumber(legacy.sellPrice ?? legacy.price, 0)),
        costPrice: Math.max(0, toNumber(legacy.costPrice ?? legacy.cost, 0)),
        stockQty: Math.max(0, Math.round(toNumber(legacy.stockQty ?? legacy.stock, 0))),
        lowStockThreshold: Number.isFinite(Number(legacy.lowStockThreshold)) ? Math.max(0, Math.round(Number(legacy.lowStockThreshold))) : undefined,
        stockDeductionMode: toStockMode(legacy.stockDeductionMode),
        status: toStatus(legacy.status),
        createdAt: toIso(legacy.createdAt, nowIso),
        updatedAt: toIso(legacy.updatedAt, nowIso),
    };
}

export function suggestProductNameFromDimensions(input: ProductNameSuggestionInput): string {
    return buildProductNameSuggestion(input);
}

export function buildProductDraft(input: ProductDraftInput): ProductDoc {
    const nowIso = new Date().toISOString();
    const namingMode: ProductNamingMode = parseProductNamingMode(input.namingMode);
    const suggestedName = buildProductNameSuggestion({
        namingMode,
        categoryName: input.categoryName,
        brandName: input.brandName,
        modelName: input.modelName,
        nameEntryName: input.nameEntryName,
        customLabel: input.customLabel,
    });
    const aliases = normalizeAliasList(input.aliases);
    const name = toText(input.name) || suggestedName || "未命名產品";

    return {
        id: toText(input.id) || "",
        companyId: toText(input.companyId),
        name,
        normalizedName: buildProductNormalizedName({
            name,
            aliases,
            categoryName: input.categoryName,
            brandName: input.brandName,
            modelName: input.modelName,
            nameEntryName: input.nameEntryName,
            customLabel: input.customLabel,
        }),
        aliases,
        namingMode,
        categoryId: toText(input.categoryId) || undefined,
        categoryName: toText(input.categoryName) || undefined,
        brandId: toText(input.brandId) || undefined,
        brandName: toText(input.brandName) || undefined,
        modelId: toText(input.modelId) || undefined,
        modelName: toText(input.modelName) || undefined,
        nameEntryId: toText(input.nameEntryId) || undefined,
        nameEntryName: toText(input.nameEntryName) || undefined,
        customLabel: toText(input.customLabel) || undefined,
        sku: toText(input.sku) || undefined,
        supplier: toText(input.supplier) || undefined,
        sellPrice: Math.max(0, toNumber(input.sellPrice, 0)),
        costPrice: Math.max(0, toNumber(input.costPrice, 0)),
        stockQty: Math.max(0, Math.round(toNumber(input.stockQty, 0))),
        lowStockThreshold:
            Number.isFinite(Number(input.lowStockThreshold)) && Number(input.lowStockThreshold) >= 0
                ? Math.round(Number(input.lowStockThreshold))
                : undefined,
        stockDeductionMode: toStockMode(input.stockDeductionMode),
        status: toStatus(input.status),
        createdAt: toIso(input.createdAt, nowIso),
        updatedAt: toIso(input.updatedAt, nowIso),
    };
}

export async function listMerchantProducts(): Promise<ProductDoc[]> {
    const products = await listProducts();
    return products.map((item) => toProductDoc(item));
}

export function buildDimensionBundleFromProducts(products: ProductDoc[]): DimensionPickerBundle {
    const dedupe = (pairs: Array<{ id?: string; name?: string; brandId?: string; brandName?: string; categoryId?: string; categoryName?: string }>) => {
        const seen = new Set<string>();
        const out: Array<{ id: string; name: string; brandId?: string; brandName?: string; categoryId?: string; categoryName?: string }> = [];
        for (const pair of pairs) {
            const name = toText(pair.name);
            if (!name) continue;
            const id = toText(pair.id) || name;
            const brandId = toText(pair.brandId) || undefined;
            const brandName = toText(pair.brandName) || undefined;
            const categoryId = toText(pair.categoryId) || undefined;
            const categoryName = toText(pair.categoryName) || undefined;
            const key = `${id}:${name}:${brandId || ""}:${categoryId || ""}`.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            out.push({ id, name, brandId, brandName, categoryId, categoryName });
        }
        return out.sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
    };

    return {
        categories: dedupe(products.map((item) => ({ id: item.categoryId, name: item.categoryName }))),
        brands: dedupe(products.map((item) => ({ id: item.brandId, name: item.brandName }))),
        models: dedupe(products.map((item) => ({
            id: item.modelId,
            name: item.modelName,
            brandId: item.brandId,
            brandName: item.brandName,
            categoryId: item.categoryId,
            categoryName: item.categoryName,
        }))),
    };
}
