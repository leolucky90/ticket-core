/**
 * Narrow shape for PO draft product search results.
 * Canonical product document: `@/lib/types/merchant-product` (`ProductDoc`).
 */

export type PoDraftProductSearchHit = {
    id: string;
    name: string;
    sku: string | null;
    categoryName: string | null;
    brandName: string | null;
    modelName: string | null;
    nameEntryName: string | null;
    sellPrice: number | null;
};
