export type ConsignmentStatus =
    | "active"
    | "partially_redeemed"
    | "completed"
    | "expired"
    | "cancelled";

export interface ConsignmentDoc {
    id: string;
    companyId: string;

    customerId: string;
    customerName: string;
    customerPhone?: string;

    campaignId?: string;
    campaignName?: string;
    entitlementId?: string;

    title: string;
    description?: string;

    categoryId?: string;
    categoryName?: string;

    brandScope?: "any" | "specific";
    brandIds?: string[];
    brandNames?: string[];

    modelScope?: "any" | "specific";
    modelIds?: string[];
    modelNames?: string[];

    nameEntryIds?: string[];
    nameEntryNames?: string[];

    depositedQty: number;
    redeemedQty: number;
    remainingQty: number;

    deductInventoryOnRedeem: true;

    activatedAt: string;
    expiresAt?: string;

    status: ConsignmentStatus;

    createdAt: string;
    updatedAt: string;
}

export interface ConsignmentRedemptionDoc {
    id: string;
    companyId: string;

    consignmentId: string;
    entitlementId?: string;
    campaignId?: string;

    customerId: string;
    customerName: string;

    redeemedQty: number;

    actualProductId?: string;
    actualProductName?: string;
    actualProductSku?: string;

    categoryId?: string;
    categoryName?: string;
    brandId?: string;
    brandName?: string;
    modelId?: string;
    modelName?: string;

    inventoryMovementId?: string;

    redeemedAt: string;
    redeemedBy?: string;

    notes?: string;

    createdAt: string;
    updatedAt: string;
}
