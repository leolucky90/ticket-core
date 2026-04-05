export type CatalogRecordStatus = "active" | "inactive";
export type ProductNamingMode = "structured" | "custom" | "hybrid";
export type StockDeductionMode = "immediate" | "redeem_only";
export type ItemNamingToken = "brand" | "productType" | "model" | "category" | "secondaryCategory" | "tertiaryCategory";

type CatalogAuditDoc = {
    id: string;
    companyId: string;
    createdAt: string;
    updatedAt: string;
};

export interface CategoryDoc extends CatalogAuditDoc {
    name: string;
    slug: string;
    parentCategoryId?: string;
    parentCategoryName?: string;
    categoryLevel: 1 | 2 | 3;
    fullPath: string;
    description?: string;
    sortOrder: number;
    status: CatalogRecordStatus;
}

export interface BrandDoc extends CatalogAuditDoc {
    name: string;
    slug: string;
    description?: string;
    linkedCategoryNames?: string[];
    productTypes?: string[];
    usedProductTypes?: string[];
    sortOrder: number;
    status: CatalogRecordStatus;
}

export interface ModelDoc extends CatalogAuditDoc {
    name: string;
    slug: string;
    brandId?: string;
    brandName?: string;
    categoryId?: string;
    categoryName?: string;
    productTypeName?: string;
    isUniversal: boolean;
    description?: string;
    sortOrder: number;
    status: CatalogRecordStatus;
}

export interface ProductNameEntryDoc extends CatalogAuditDoc {
    name: string;
    slug: string;
    aliases?: string[];
    categoryId?: string;
    categoryName?: string;
    description?: string;
    sortOrder: number;
    status: CatalogRecordStatus;
}

export interface SupplierDoc extends CatalogAuditDoc {
    name: string;
    slug: string;
    contactName?: string;
    phone?: string;
    email?: string;
    description?: string;
    sortOrder: number;
    status: CatalogRecordStatus;
}

export type DimensionOption = {
    id: string;
    name: string;
    slug?: string;
    parentCategoryId?: string;
    parentCategoryName?: string;
    categoryLevel?: 1 | 2 | 3;
    fullPath?: string;
    brandId?: string;
    brandName?: string;
    categoryId?: string;
    categoryName?: string;
    categoryNames?: string[];
    productTypeName?: string;
    productTypes?: string[];
    sortOrder?: number;
};

export type DimensionPickerBundle = {
    categories: DimensionOption[];
    brands: DimensionOption[];
    models: DimensionOption[];
};
