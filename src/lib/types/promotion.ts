import type { EntitlementScopeType, EntitlementType, PromotionEffectType } from "@/lib/schema";

// Legacy merchant promotion read-model used by current dashboard/checkout flows.
// Canonical marketing entities should converge on campaign/entitlement schemas over time.
export type ActivityStatus = "upcoming" | "active" | "ended" | "cancelled";

export type ActivityItem = {
    id: string;
    itemName: string;
    totalQty: number;
    unitPrice: number;
    unitCost: number;
    amount: number;
    cost: number;
};

export type Activity = {
    id: string;
    name: string;
    startAt: number;
    endAt: number;
    status: ActivityStatus;
    message: string;
    effectType: PromotionEffectType;
    discountAmount: number;
    bundlePriceDiscount: number;
    giftProductId?: string;
    giftProductName?: string;
    giftQty: number;
    entitlementType?: EntitlementType;
    scopeType?: EntitlementScopeType;
    categoryId?: string;
    categoryName?: string;
    productId?: string;
    productName?: string;
    entitlementQty: number;
    entitlementExpiresAt?: number;
    reservationQty: number;
    reservationExpiresAt?: number;
    defaultStoreQty: number;
    items: ActivityItem[];
    totalAmount: number;
    totalCost: number;
    createdAt: number;
    updatedAt: number;
};

export type ActivityPurchaseStatus = "ongoing" | "ended";

export type ActivityPurchase = {
    id: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    activityName: string;
    activityContent: string;
    checkoutStatus: "stored" | "settled";
    itemName: string;
    totalQty: number;
    remainingQty: number;
    salesAmount: number;
    purchasedAt: number;
    status: ActivityPurchaseStatus;
};
