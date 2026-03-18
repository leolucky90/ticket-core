import "server-only";
import type { CheckoutPromotionSelection, CustomerEntitlement, PickupReservation, PromotionEvaluationResult } from "@/lib/schema";
import { createEntitlementsFromCheckoutPromotions } from "@/lib/services/entitlements";
import { adjustInventory } from "@/lib/services/inventory";
import { createPickupReservationsFromPromotionDrafts } from "@/lib/services/pickupReservations";
import { applyPromotionToCart, evaluatePromotionsForCart, getActivePromotions } from "@/lib/services/promotions";
import type { PromotionCartLine } from "@/lib/services/promotions";

export type CheckoutCartLineInput = {
    productId: string;
    productName: string;
    categoryId?: string | null;
    categoryName?: string | null;
    qty: number;
    unitPrice: number;
    subtotal?: number;
};

export type CheckoutCartLine = {
    productId: string;
    productName: string;
    categoryId: string | null;
    categoryName: string | null;
    qty: number;
    unitPrice: number;
    subtotal: number;
};

export type CheckoutPreview = {
    sourceId: string;
    selectedPromotions: CheckoutPromotionSelection[];
    evaluation: PromotionEvaluationResult;
    originalTotal: number;
    discountTotal: number;
    finalTotal: number;
};

export type CheckoutOrderDraft = {
    checkoutOrderId: string;
    createdAt: string;
    sourceId: string;
    lineItems: CheckoutCartLine[];
    preview: CheckoutPreview;
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

function normalizeCartLines(input: CheckoutCartLineInput[]): CheckoutCartLine[] {
    return input
        .map((line) => {
            const productId = toText(line.productId, 120);
            if (!productId) return null;
            const qty = Math.max(1, toNonNegativeInt(line.qty, 1));
            const unitPrice = Math.max(0, toNonNegativeInt(line.unitPrice, 0));
            const subtotal = Math.max(0, toNonNegativeInt(line.subtotal, qty * unitPrice));
            return {
                productId,
                productName: toText(line.productName, 240) || "Untitled Product",
                categoryId: toText(line.categoryId, 120) || null,
                categoryName: toText(line.categoryName, 240) || null,
                qty,
                unitPrice,
                subtotal,
            };
        })
        .filter((line): line is CheckoutCartLine => line !== null)
        .slice(0, 200);
}

function toPromotionCartLines(lines: CheckoutCartLine[]): PromotionCartLine[] {
    return lines.map((line) => ({
        productId: line.productId,
        productName: line.productName,
        categoryId: line.categoryId ?? null,
        categoryName: line.categoryName ?? null,
        qty: line.qty,
        unitPrice: line.unitPrice,
        subtotal: Math.max(0, toNonNegativeInt(line.subtotal, line.qty * line.unitPrice)),
    }));
}

export async function buildCheckoutPreview(input: {
    cartLines: CheckoutCartLineInput[];
    selectedPromotions?: CheckoutPromotionSelection[];
    sourceId?: string;
}): Promise<CheckoutPreview> {
    const sourceId = toText(input.sourceId, 120) || `checkout_${Date.now()}`;
    const cartLines = normalizeCartLines(input.cartLines);
    const selectedPromotions = Array.isArray(input.selectedPromotions) && input.selectedPromotions.length > 0
        ? input.selectedPromotions
        : await getActivePromotions();

    const evaluation = evaluatePromotionsForCart({
        selectedPromotions,
        cartLines: toPromotionCartLines(cartLines),
        sourceId,
    });
    const totals = applyPromotionToCart({
        cartLines: toPromotionCartLines(cartLines),
        evaluation,
    });

    return {
        sourceId,
        selectedPromotions,
        evaluation,
        originalTotal: totals.originalTotal,
        discountTotal: totals.discountTotal,
        finalTotal: totals.finalTotal,
    };
}

export async function createCheckoutOrder(input: {
    cartLines: CheckoutCartLineInput[];
    selectedPromotions?: CheckoutPromotionSelection[];
    sourceId?: string;
}): Promise<CheckoutOrderDraft> {
    const lineItems = normalizeCartLines(input.cartLines);
    const preview = await buildCheckoutPreview({
        cartLines: lineItems,
        selectedPromotions: input.selectedPromotions,
        sourceId: input.sourceId,
    });

    return {
        checkoutOrderId: `checkout_order_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        createdAt: new Date().toISOString(),
        sourceId: preview.sourceId,
        lineItems,
        preview,
    };
}

export async function finalizeCheckout(input: {
    companyId: string;
    receiptId: string;
    customerId?: string | null;
    lineItems: CheckoutCartLineInput[];
    evaluation: PromotionEvaluationResult;
    operatorUserId?: string | null;
    operatorName?: string | null;
}): Promise<{
    inventoryMovementCount: number;
    createdEntitlements: CustomerEntitlement[];
    createdPickupReservations: PickupReservation[];
}> {
    const companyId = toText(input.companyId, 120);
    const receiptId = toText(input.receiptId, 120);
    if (!companyId || !receiptId) {
        return {
            inventoryMovementCount: 0,
            createdEntitlements: [],
            createdPickupReservations: [],
        };
    }

    const lineItems = normalizeCartLines(input.lineItems);
    let inventoryMovementCount = 0;
    for (const line of lineItems) {
        const adjusted = await adjustInventory({
            companyId,
            productId: line.productId,
            eventType: "sale_out",
            qty: line.qty,
            onHandDelta: -line.qty,
            reservedDelta: 0,
            referenceType: "receipt",
            referenceId: receiptId,
            note: `checkout sale ${receiptId}`,
            operatorUserId: toText(input.operatorUserId, 120) || undefined,
            operatorName: toText(input.operatorName, 120) || undefined,
            enforceAvailable: true,
        });
        if (adjusted?.movement) inventoryMovementCount += 1;
    }

    const customerId = toText(input.customerId, 120);
    const createdEntitlements = customerId
        ? await createEntitlementsFromCheckoutPromotions({
              customerId,
              sourceId: receiptId,
              drafts: input.evaluation.entitlementsToCreate,
              companyId,
          })
        : [];

    const createdPickupReservations = customerId
        ? await createPickupReservationsFromPromotionDrafts({
              customerId,
              sourceId: receiptId,
              drafts: input.evaluation.pickupReservationsToCreate,
              companyId,
          })
        : [];

    return {
        inventoryMovementCount,
        createdEntitlements,
        createdPickupReservations,
    };
}
