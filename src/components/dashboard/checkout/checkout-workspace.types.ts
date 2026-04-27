import type { Activity } from "@/lib/types/promotion";

export type CheckoutCustomerMode = "walkin" | "customer";

export type CheckoutLineDraft = {
    id: string;
    productId: string;
    qty: number;
    activityPromotionId?: string;
    activityPromotionName?: string;
    isUsedProduct: boolean;
    usedProductId?: string;
};

export type CheckoutPromotionSelectionDraft = {
    promotionId: string;
    promotionName: string;
    note: string;
    effectType: Activity["effectType"];
    discountMode: "amount" | "percentage";
    scopeType: "category" | "product";
    entitlementType: "replacement" | "gift" | "discount" | "service";
    categoryId: string;
    categoryName: string;
    productId: string;
    productName: string;
    discountAmount: number;
    discountPercentage: number;
    bundlePriceDiscount: number;
    giftProductId: string;
    giftProductName: string;
    giftQty: number;
    entitlementQty: number;
    entitlementExpiresAt?: number;
    reservationQty: number;
    reservationExpiresAt?: number;
};
