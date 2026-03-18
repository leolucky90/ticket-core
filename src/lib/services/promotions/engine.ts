import type {
    CheckoutPromotionSelection,
    PromotionEffectType,
    PromotionEntitlementDraft,
    PromotionEvaluationResult,
    PromotionGiftItem,
    PromotionPickupReservationDraft,
    PromotionPricingAdjustment,
    PromotionRecommendation,
} from "@/lib/schema";

export type PromotionCartLine = {
    productId: string;
    productName: string;
    categoryId?: string | null;
    categoryName?: string | null;
    qty: number;
    unitPrice: number;
    subtotal: number;
};

function toText(value: unknown, max = 160): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toNonNegativeInt(value: unknown, fallback = 0): number {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) return Math.max(0, Math.round(fallback));
    return Math.max(0, Math.round(parsed));
}

function toTimestamp(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.round(value);
    if (typeof value === "string" && value.trim()) {
        const parsed = Date.parse(value);
        if (Number.isFinite(parsed)) return Math.round(parsed);
    }
    return undefined;
}

export function normalizePromotionEffectType(value: unknown): PromotionEffectType {
    if (value === "bundle_price") return "bundle_price";
    if (value === "gift_item") return "gift_item";
    if (value === "create_entitlement") return "create_entitlement";
    if (value === "create_pickup_reservation") return "create_pickup_reservation";
    return "discount";
}

function getMatchedCartLines(selection: CheckoutPromotionSelection, cartLines: PromotionCartLine[]): PromotionCartLine[] {
    const targetProductId = toText(selection.productId, 120);
    if (targetProductId) {
        return cartLines.filter((line) => line.productId === targetProductId);
    }

    if (selection.scopeType === "category") {
        const targetCategoryId = toText(selection.categoryId, 120);
        const targetCategoryName = toText(selection.categoryName).toLowerCase();
        return cartLines.filter((line) => {
            if (targetCategoryId && (line.categoryId ?? "") === targetCategoryId) return true;
            if (targetCategoryName && (line.categoryName ?? "").toLowerCase() === targetCategoryName) return true;
            return false;
        });
    }

    return cartLines;
}

function buildPromotionRecommendation(
    selection: CheckoutPromotionSelection,
    cartLines: PromotionCartLine[],
): PromotionRecommendation {
    const effectType = normalizePromotionEffectType(selection.effectType);
    const matchedLines = getMatchedCartLines(selection, cartLines);
    const matchedSubtotal = matchedLines.reduce((sum, line) => sum + Math.max(0, line.subtotal), 0);

    let recommended = matchedLines.length > 0;
    let estimatedDiscount = 0;
    let reason = matchedLines.length > 0 ? `符合 ${matchedLines.length} 筆商品` : "購物車目前不符合條件";

    if (effectType === "discount") {
        estimatedDiscount = Math.min(matchedSubtotal, toNonNegativeInt(selection.discountAmount, 0));
        recommended = recommended && estimatedDiscount > 0;
        reason = recommended ? `可折抵 ${estimatedDiscount}` : "折扣金額為 0 或無符合商品";
    }

    if (effectType === "bundle_price") {
        estimatedDiscount = Math.min(matchedSubtotal, toNonNegativeInt(selection.bundlePriceDiscount, 0));
        recommended = recommended && estimatedDiscount > 0;
        reason = recommended ? `可組合折抵 ${estimatedDiscount}` : "組合折抵為 0 或無符合商品";
    }

    if (effectType === "gift_item") {
        const giftQty = Math.max(1, toNonNegativeInt(selection.giftQty, 1));
        recommended = recommended && Boolean(toText(selection.giftProductId, 120));
        reason = recommended ? `可贈送 ${giftQty} 件` : "缺少贈品 productId 或無符合商品";
    }

    if (effectType === "create_entitlement") {
        const entitlementQty = Math.max(1, toNonNegativeInt(selection.entitlementQty, 1));
        const scopeOk = selection.scopeType === "product" ? Boolean(toText(selection.productId, 120)) : true;
        recommended = recommended && scopeOk;
        reason = recommended ? `可建立 ${entitlementQty} 次客戶權益` : "缺少權益範圍設定或無符合商品";
    }

    if (effectType === "create_pickup_reservation") {
        const reservationQty = Math.max(1, toNonNegativeInt(selection.reservationQty, 1));
        recommended = recommended && Boolean(toText(selection.productId, 120));
        reason = recommended ? `可建立 ${reservationQty} 件待取貨` : "缺少留貨 productId 或無符合商品";
    }

    return {
        promotionId: toText(selection.promotionId, 120),
        promotionName: toText(selection.promotionName) || "Untitled Promotion",
        effectType,
        recommended,
        reason,
        estimatedDiscount,
    };
}

export function evaluatePromotionsForCart(input: {
    selectedPromotions: CheckoutPromotionSelection[];
    cartLines: PromotionCartLine[];
    sourceId: string;
}): PromotionEvaluationResult {
    const pricingAdjustments: PromotionPricingAdjustment[] = [];
    const giftItems: PromotionGiftItem[] = [];
    const entitlementsToCreate: PromotionEntitlementDraft[] = [];
    const pickupReservationsToCreate: PromotionPickupReservationDraft[] = [];

    const recommendations = input.selectedPromotions.map((selection) =>
        buildPromotionRecommendation(selection, input.cartLines),
    );

    for (const selection of input.selectedPromotions) {
        if (selection.enabled === false) continue;

        const recommendation = recommendations.find((item) => item.promotionId === toText(selection.promotionId, 120));
        if (!recommendation?.recommended) continue;

        const effectType = normalizePromotionEffectType(selection.effectType);
        const promotionId = toText(selection.promotionId, 120);
        const promotionName = toText(selection.promotionName) || "Untitled Promotion";

        if (effectType === "discount" || effectType === "bundle_price") {
            const amount = effectType === "discount" ? toNonNegativeInt(selection.discountAmount, 0) : toNonNegativeInt(selection.bundlePriceDiscount, 0);
            if (amount > 0) {
                pricingAdjustments.push({
                    promotionId,
                    promotionName,
                    effectType,
                    amount,
                    reason: recommendation.reason,
                });
            }
            continue;
        }

        if (effectType === "gift_item") {
            const giftProductId = toText(selection.giftProductId, 120);
            if (!giftProductId) continue;
            giftItems.push({
                promotionId,
                promotionName,
                productId: giftProductId,
                productName: toText(selection.giftProductName) || "Gift Item",
                qty: Math.max(1, toNonNegativeInt(selection.giftQty, 1)),
                reason: recommendation.reason,
            });
            continue;
        }

        if (effectType === "create_entitlement") {
            const scopeType = selection.scopeType === "product" ? "product" : "category";
            entitlementsToCreate.push({
                promotionId,
                promotionName,
                sourceType: "promotion",
                sourceId: input.sourceId,
                entitlementType:
                    selection.entitlementType === "gift" || selection.entitlementType === "discount" || selection.entitlementType === "service"
                        ? selection.entitlementType
                        : "replacement",
                scopeType,
                categoryId: scopeType === "category" ? toText(selection.categoryId, 120) || undefined : undefined,
                categoryName: scopeType === "category" ? toText(selection.categoryName) || undefined : undefined,
                productId: scopeType === "product" ? toText(selection.productId, 120) || undefined : undefined,
                productName: scopeType === "product" ? toText(selection.productName) || undefined : undefined,
                totalQty: Math.max(1, toNonNegativeInt(selection.entitlementQty, 1)),
                expiresAt: toTimestamp(selection.entitlementExpiresAt),
                note: toText(selection.note, 800) || recommendation.reason,
            });
            continue;
        }

        if (effectType === "create_pickup_reservation") {
            const productId = toText(selection.productId, 120);
            if (!productId) continue;

            const matchedLines = getMatchedCartLines(selection, input.cartLines);
            const matchedLine = matchedLines.find((line) => line.productId === productId) ?? matchedLines[0] ?? null;
            const fallbackName = matchedLine?.productName ?? (toText(selection.productName) || "Reserved Item");
            const fallbackUnitPrice = matchedLine?.unitPrice ?? 0;

            pickupReservationsToCreate.push({
                promotionId,
                promotionName,
                sourceChannel: "pos",
                productId,
                productName: toText(selection.productName) || fallbackName,
                qty: Math.max(1, toNonNegativeInt(selection.reservationQty, 1)),
                unitPrice: Math.max(0, toNonNegativeInt(fallbackUnitPrice, 0)),
                expiresAt: toTimestamp(selection.reservationExpiresAt),
                note: toText(selection.note, 800) || recommendation.reason,
            });
        }
    }

    const subtotal = input.cartLines.reduce((sum, row) => sum + Math.max(0, row.subtotal), 0);
    let budget = subtotal;
    const clippedAdjustments = pricingAdjustments.map((item) => {
        const clipped = Math.min(item.amount, Math.max(0, budget));
        budget = Math.max(0, budget - clipped);
        return {
            ...item,
            amount: clipped,
        };
    });

    return {
        pricingAdjustments: clippedAdjustments.filter((item) => item.amount > 0),
        giftItems,
        entitlementsToCreate,
        pickupReservationsToCreate,
        recommendations,
    };
}

export function applyPromotionToCart(input: {
    cartLines: PromotionCartLine[];
    evaluation: PromotionEvaluationResult;
}): {
    originalTotal: number;
    discountTotal: number;
    finalTotal: number;
} {
    const originalTotal = input.cartLines.reduce((sum, row) => sum + Math.max(0, row.subtotal), 0);
    const discountTotal = input.evaluation.pricingAdjustments.reduce((sum, row) => sum + Math.max(0, row.amount), 0);
    const finalTotal = Math.max(0, originalTotal - discountTotal);

    return {
        originalTotal,
        discountTotal,
        finalTotal,
    };
}

export function evaluateCheckoutPromotions(input: {
    selectedPromotions: CheckoutPromotionSelection[];
    cartLines: PromotionCartLine[];
    sourceId: string;
}): PromotionEvaluationResult {
    return evaluatePromotionsForCart(input);
}
