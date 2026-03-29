import "server-only";
import type { PoDraftProductSearchHit } from "@/lib/schema/poDraftProduct";
import { buildProductSearchKeywords, normalizeSearchText } from "@/lib/services/productNaming";
import { listProducts } from "@/lib/services/merchant/inventory-read-model.service";
import type { Product } from "@/lib/types/merchant-product";

export type PoDraftProductDimensionFilter = {
    categoryId?: string;
    brandId?: string;
    modelId?: string;
};

function toHit(product: Product): PoDraftProductSearchHit {
    const sell =
        typeof product.sellPrice === "number" && Number.isFinite(product.sellPrice)
            ? product.sellPrice
            : typeof product.price === "number" && Number.isFinite(product.price)
              ? product.price
              : null;
    return {
        id: product.id,
        name: product.name,
        sku: product.sku?.trim() ? product.sku.trim() : null,
        categoryName: product.categoryName?.trim() ? product.categoryName : null,
        brandName: product.brandName?.trim() ? product.brandName : null,
        modelName: product.modelName?.trim() ? product.modelName : null,
        nameEntryName: product.nameEntryName?.trim() ? product.nameEntryName : null,
        sellPrice: sell,
    };
}

function matchesDimensions(product: Product, filter: PoDraftProductDimensionFilter): boolean {
    if (filter.categoryId && (product.categoryId ?? "").trim() !== filter.categoryId.trim()) return false;
    if (filter.brandId && (product.brandId ?? "").trim() !== filter.brandId.trim()) return false;
    if (filter.modelId && (product.modelId ?? "").trim() !== filter.modelId.trim()) return false;
    return true;
}

function matchesNameEntryHint(product: Product, hint: string): boolean {
    const q = normalizeSearchText(hint);
    if (!q) return true;
    const ne = normalizeSearchText(product.nameEntryName ?? "");
    const name = normalizeSearchText(product.name);
    return ne.includes(q) || name.includes(q);
}

function scoreQueryAgainstKeywords(query: string, keywords: string[]): number {
    const q = normalizeSearchText(query);
    if (!q) return 0;
    let best = 0;
    for (const kw of keywords) {
        const t = normalizeSearchText(kw);
        if (!t) continue;
        if (t === q) {
            best = Math.max(best, 120);
        } else if (t.startsWith(q)) {
            best = Math.max(best, 100);
        } else if (t.includes(q)) {
            best = Math.max(best, 80);
        }
    }
    return best;
}

/**
 * Merchant-scoped product search for PO draft lines (uses session catalog list + in-memory score).
 */
export async function searchProductsForPoDraft(params: {
    query: string;
    limit: number;
    dimensions?: PoDraftProductDimensionFilter;
    nameEntryHint?: string;
}): Promise<PoDraftProductSearchHit[]> {
    const q = normalizeSearchText(params.query);
    const limit = Math.max(1, Math.min(40, Math.round(params.limit || 12)));
    const dim = params.dimensions ?? {};
    const nameHint = params.nameEntryHint?.trim() ?? "";

    const products = await listProducts();
    const filtered = products.filter((p) => matchesDimensions(p, dim)).filter((p) => matchesNameEntryHint(p, nameHint));

    if (!q) {
        return filtered.slice(0, limit).map(toHit);
    }

    const scored = filtered
        .map((product) => {
            const keywords = buildProductSearchKeywords(product);
            const score = scoreQueryAgainstKeywords(q, keywords);
            return { product, score };
        })
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, "zh-Hant"));

    return scored.slice(0, limit).map((row) => toHit(row.product));
}
