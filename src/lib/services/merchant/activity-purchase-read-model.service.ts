import "server-only";
import { cache } from "react";
import { listSales } from "@/lib/services/sales";
import type { ActivityPurchase } from "@/lib/types/promotion";

function toText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown, fallback = 0): number {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return parsed;
}

function parsePromotionEffectType(value: unknown) {
    if (value === "bundle_price") return "bundle_price";
    if (value === "gift_item") return "gift_item";
    if (value === "create_entitlement") return "create_entitlement";
    if (value === "create_pickup_reservation") return "create_pickup_reservation";
    return "discount";
}

const loadActivityPurchases = cache(async (): Promise<ActivityPurchase[]> => {
    const checkoutSales = await listSales();

    return checkoutSales
        .filter((sale) => sale.source === "checkout")
        .slice(0, 400)
        .flatMap((sale, index) => {
            const boundActivities = sale.activityRefs && sale.activityRefs.length > 0
                ? sale.activityRefs
                : [{ activityId: "", activityName: "一般銷售", activityContent: "", checkoutStatus: "settled", storeQty: 0, effectType: "discount" as const }];

            const activityRows = boundActivities.flatMap((activity, activityIndex) =>
                (sale.lineItems ?? []).map((item, itemIndex) => {
                    const effectType = parsePromotionEffectType(
                        activity.effectType ?? (activity.checkoutStatus === "stored" ? "create_entitlement" : "discount"),
                    );
                    const checkoutStatus: "stored" | "settled" = effectType === "create_entitlement" ? "stored" : "settled";
                    const remainingQty = effectType === "create_entitlement" ? Math.max(1, toNumber(activity.storeQty, 0)) : 0;
                    const status: "ongoing" | "ended" = remainingQty > 0 ? "ongoing" : "ended";
                    return {
                        id: `purchase_${sale.id}_${index}_${activityIndex}_${itemIndex}`,
                        activityName: activity.activityName || "一般銷售",
                        activityContent: toText(activity.activityContent),
                        checkoutStatus,
                        itemName: item.productName || sale.item,
                        totalQty: Math.max(1, item.qty),
                        remainingQty,
                        salesAmount: Math.max(0, item.subtotal || sale.amount),
                        purchasedAt: sale.checkoutAt,
                        customerName: sale.customerName || "",
                        customerPhone: sale.customerPhone || "",
                        customerEmail: sale.customerEmail || "",
                        status,
                    } satisfies ActivityPurchase;
                }),
            );

            if (activityRows.length > 0) return activityRows;

            const fallbackEffectType = parsePromotionEffectType(
                sale.activityRefs?.[0]?.effectType ?? (sale.activityRefs?.[0]?.checkoutStatus === "stored" ? "create_entitlement" : "discount"),
            );
            const fallbackCheckoutStatus: "stored" | "settled" = fallbackEffectType === "create_entitlement" ? "stored" : "settled";
            const fallbackRemainingQty = fallbackEffectType === "create_entitlement" ? Math.max(1, toNumber(sale.activityRefs?.[0]?.storeQty, 0)) : 0;

            return [{
                id: `purchase_${sale.id}_${index}_fallback`,
                activityName: sale.activityRefs?.[0]?.activityName || "一般銷售",
                activityContent: toText(sale.activityRefs?.[0]?.activityContent),
                checkoutStatus: fallbackCheckoutStatus,
                itemName: sale.item,
                totalQty: 1,
                remainingQty: fallbackRemainingQty,
                salesAmount: Math.max(0, sale.amount),
                purchasedAt: sale.checkoutAt,
                customerName: sale.customerName || "",
                customerPhone: sale.customerPhone || "",
                customerEmail: sale.customerEmail || "",
                status: fallbackRemainingQty > 0 ? "ongoing" : "ended",
            } satisfies ActivityPurchase];
        })
        .sort((a, b) => b.purchasedAt - a.purchasedAt);
});

export async function listActivityPurchases(): Promise<ActivityPurchase[]> {
    return loadActivityPurchases();
}
