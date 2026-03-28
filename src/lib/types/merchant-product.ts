import type { ProductNamingMode, StockDeductionMode } from "@/lib/types/catalog";

// Merchant/product workspace read-model. Keep this separate from the canonical
// catalog schema in `@/lib/types/product` until services are fully converged.
export type ProductDoc = {
    id: string;
    companyId?: string;
    name: string;
    namingMode: ProductNamingMode;
    categoryId: string;
    categoryName: string;
    brandId: string;
    brandName: string;
    modelId: string;
    modelName: string;
    nameEntryId: string;
    nameEntryName: string;
    customLabel: string;
    aliases: string[];
    normalizedName: string;
    price: number;
    cost: number;
    supplier: string;
    sku: string;
    stock: number;
    onHandQty?: number;
    reservedQty?: number;
    availableQty?: number;
    sellPrice?: number;
    costPrice?: number;
    stockQty?: number;
    lowStockThreshold?: number;
    stockDeductionMode?: StockDeductionMode;
    status?: "active" | "inactive";
    createdAt: number;
    updatedAt: number;
};

export type Product = ProductDoc;
