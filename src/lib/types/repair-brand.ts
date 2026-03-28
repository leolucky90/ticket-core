export type RepairBrandModelGroup = {
    typeName: string;
    models: string[];
};

export type RepairBrand = {
    id: string;
    name: string;
    linkedCategoryNames: string[];
    productTypes: string[];
    modelsByType: RepairBrandModelGroup[];
    models: string[];
    usedProductTypes: string[];
    createdAt: number;
    updatedAt: number;
};
