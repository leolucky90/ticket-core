import "server-only";
import { listConsignments } from "@/lib/services/merchant/campaign-consignment-service";
import { listMerchantProducts } from "@/lib/services/merchant/product-service";
import type { ProductDoc } from "@/lib/types/product";
import type { ConsignmentDoc } from "@/lib/types/consignment";

export type InventoryRiskLevel = "high" | "medium" | "low";

export type InventoryRiskReminder = {
    id: string;
    level: InventoryRiskLevel;
    kind: "stock_zero" | "low_stock" | "redemption_risk";
    title: string;
    description: string;
    productId?: string;
    productName?: string;
};

function buildRedemptionDemandByCategory(consignments: ConsignmentDoc[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const consignment of consignments) {
        if (consignment.remainingQty <= 0) continue;
        const key = (consignment.categoryName || "").trim().toLowerCase();
        if (!key) continue;
        map.set(key, (map.get(key) ?? 0) + consignment.remainingQty);
    }
    return map;
}

function buildProductRiskItems(products: ProductDoc[]): InventoryRiskReminder[] {
    const out: InventoryRiskReminder[] = [];
    for (const product of products) {
        const threshold = Math.max(1, product.lowStockThreshold ?? 5);
        if (product.stockQty <= 0) {
            out.push({
                id: `stock_zero:${product.id}`,
                level: "high",
                kind: "stock_zero",
                title: `庫存為 0：${product.name}`,
                description: "此商品已無可用庫存，建議優先補貨或暫停銷售。",
                productId: product.id,
                productName: product.name,
            });
            continue;
        }
        if (product.stockQty <= threshold) {
            out.push({
                id: `low_stock:${product.id}`,
                level: "medium",
                kind: "low_stock",
                title: `低庫存：${product.name}`,
                description: `目前庫存 ${product.stockQty}，低於警戒值 ${threshold}。`,
                productId: product.id,
                productName: product.name,
            });
        }
    }
    return out;
}

function buildRedemptionRiskItems(products: ProductDoc[], consignments: ConsignmentDoc[]): InventoryRiskReminder[] {
    const out: InventoryRiskReminder[] = [];
    const demandByCategory = buildRedemptionDemandByCategory(consignments);
    if (demandByCategory.size === 0) return out;

    const stockByCategory = new Map<string, number>();
    for (const product of products) {
        const key = (product.categoryName || "").trim().toLowerCase();
        if (!key) continue;
        stockByCategory.set(key, (stockByCategory.get(key) ?? 0) + Math.max(0, product.stockQty));
    }

    for (const [categoryKey, demand] of demandByCategory.entries()) {
        const stock = stockByCategory.get(categoryKey) ?? 0;
        if (stock >= demand) continue;
        out.push({
            id: `redemption_risk:${categoryKey}`,
            level: "high",
            kind: "redemption_risk",
            title: `寄店兌換風險：${categoryKey}`,
            description: `寄店待兌換量 ${demand}，現有可用庫存僅 ${stock}，可能造成後續兌換缺貨。`,
        });
    }

    return out;
}

export function evaluateInventoryRisks(products: ProductDoc[], consignments: ConsignmentDoc[]): InventoryRiskReminder[] {
    return [...buildProductRiskItems(products), ...buildRedemptionRiskItems(products, consignments)];
}

export async function getInventoryRiskReminders(): Promise<InventoryRiskReminder[]> {
    const [products, consignments] = await Promise.all([listMerchantProducts(), listConsignments()]);
    return evaluateInventoryRisks(products, consignments);
}
