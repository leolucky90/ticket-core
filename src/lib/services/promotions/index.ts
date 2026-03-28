import "server-only";
import type { CheckoutPromotionSelection } from "@/lib/schema";
import { listActivities } from "@/lib/services/merchant/activity-read-model.service";
import {
    applyPromotionToCart,
    evaluateCheckoutPromotions,
    evaluatePromotionsForCart,
    normalizePromotionEffectType,
} from "@/lib/services/promotions/engine";
import type { PromotionCartLine } from "@/lib/services/promotions/engine";
import type { Activity } from "@/lib/types/promotion";

function toText(value: unknown, max = 160): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toNonNegativeInt(value: unknown, fallback = 0): number {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) return Math.max(0, Math.round(fallback));
    return Math.max(0, Math.round(parsed));
}

export function toCheckoutPromotionSelection(activity: Activity): CheckoutPromotionSelection {
    return {
        promotionId: activity.id,
        promotionName: activity.name,
        effectType: normalizePromotionEffectType(activity.effectType),
        scopeType: activity.scopeType,
        entitlementType: activity.entitlementType,
        categoryId: activity.categoryId,
        categoryName: activity.categoryName,
        productId: activity.productId,
        productName: activity.productName,
        discountAmount: toNonNegativeInt(activity.discountAmount, 0),
        bundlePriceDiscount: toNonNegativeInt(activity.bundlePriceDiscount, 0),
        giftProductId: activity.giftProductId,
        giftProductName: activity.giftProductName,
        giftQty: toNonNegativeInt(activity.giftQty, 1),
        entitlementQty: toNonNegativeInt(activity.entitlementQty, 1),
        entitlementExpiresAt: activity.entitlementExpiresAt,
        reservationQty: toNonNegativeInt(activity.reservationQty, 1),
        reservationExpiresAt: activity.reservationExpiresAt,
        note: activity.message || undefined,
        enabled: true,
    };
}

export async function getActivePromotions(): Promise<CheckoutPromotionSelection[]> {
    const activities = await listActivities();
    const nowMs = Date.now();

    return activities
        .filter((activity) => activity.status === "active")
        .filter((activity) => {
            const startAt = typeof activity.startAt === "number" ? activity.startAt : Date.parse(toText(activity.startAt));
            const endAt = typeof activity.endAt === "number" ? activity.endAt : Date.parse(toText(activity.endAt));
            if (Number.isFinite(startAt) && nowMs < startAt) return false;
            if (Number.isFinite(endAt) && nowMs > endAt) return false;
            return true;
        })
        .map((activity) => toCheckoutPromotionSelection(activity));
}

export { evaluatePromotionsForCart, evaluateCheckoutPromotions, applyPromotionToCart };
export type { PromotionCartLine };
