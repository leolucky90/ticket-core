import type { ProductNamingMode, StockDeductionMode } from "@/lib/types/catalog";

export interface ProductDoc {
    id: string;
    companyId: string;

    name: string;
    normalizedName: string;
    aliases?: string[];

    namingMode: ProductNamingMode;

    categoryId?: string;
    categoryName?: string;

    brandId?: string;
    brandName?: string;

    modelId?: string;
    modelName?: string;

    nameEntryId?: string;
    nameEntryName?: string;

    customLabel?: string;

    sku?: string;
    supplier?: string;

    sellPrice: number;
    costPrice: number;

    stockQty: number;
    lowStockThreshold?: number;

    stockDeductionMode: StockDeductionMode;
    status: "active" | "inactive";

    createdAt: string;
    updatedAt: string;
}
