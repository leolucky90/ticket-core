import type { EntitlementScopeType, EntitlementSourceType, EntitlementType } from "@/lib/schema/customerEntitlement";
import type { PickupReservationSourceChannel } from "@/lib/schema/pickupReservation";

export const PROMOTION_EFFECT_TYPES = [
    "discount",
    "bundle_price",
    "gift_item",
    "create_entitlement",
    "create_pickup_reservation",
] as const;

export const PROMOTION_TYPES = [
    "buy_x_get_y",
    "fixed_price_bundle",
    "percentage_discount",
    "amount_discount",
    "reserve_only",
    "entitlement_only",
] as const;

export type PromotionEffectType = (typeof PROMOTION_EFFECT_TYPES)[number];
export type PromotionType = (typeof PROMOTION_TYPES)[number];

export type PromotionPricingAdjustment = {
    promotionId: string;
    promotionName: string;
    effectType: "discount" | "bundle_price";
    amount: number;
    reason?: string;
};

export type PromotionGiftItem = {
    promotionId: string;
    promotionName: string;
    productId: string;
    productName: string;
    qty: number;
    reason?: string;
};

export type PromotionEntitlementDraft = {
    promotionId: string;
    promotionName: string;
    sourceType: EntitlementSourceType;
    sourceId: string;
    entitlementType: EntitlementType;
    scopeType: EntitlementScopeType;
    categoryId?: string;
    categoryName?: string;
    productId?: string;
    productName?: string;
    totalQty: number;
    expiresAt?: number;
    note?: string;
};

export type PromotionPickupReservationDraft = {
    promotionId: string;
    promotionName: string;
    sourceChannel: PickupReservationSourceChannel;
    productId: string;
    productName: string;
    qty: number;
    unitPrice: number;
    expiresAt?: number;
    note?: string;
};

export type CheckoutPromotionSelection = {
    promotionId: string;
    promotionName: string;
    promotionType?: PromotionType;
    effectType: PromotionEffectType;
    scopeType?: EntitlementScopeType;
    entitlementType?: EntitlementType;
    categoryId?: string;
    categoryName?: string;
    productId?: string;
    productName?: string;
    discountAmount?: number;
    bundlePriceDiscount?: number;
    giftProductId?: string;
    giftProductName?: string;
    giftQty?: number;
    entitlementQty?: number;
    entitlementExpiresAt?: number;
    reservationQty?: number;
    reservationExpiresAt?: number;
    note?: string;
    enabled?: boolean;
};

export type PromotionRecommendation = {
    promotionId: string;
    promotionName: string;
    effectType: PromotionEffectType;
    recommended: boolean;
    reason: string;
    estimatedDiscount: number;
};

export type PromotionEvaluationResult = {
    pricingAdjustments: PromotionPricingAdjustment[];
    giftItems: PromotionGiftItem[];
    entitlementsToCreate: PromotionEntitlementDraft[];
    pickupReservationsToCreate: PromotionPickupReservationDraft[];
    recommendations: PromotionRecommendation[];
};
