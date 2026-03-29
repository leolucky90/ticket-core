import type { Product } from "@/lib/types/merchant-product";
import type { Sale } from "@/lib/types/sale";

function getDayStart(ts: number): number {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

function getMonthStart(ts: number): number {
    const d = new Date(ts);
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

function toMoney(n: number): number {
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100) / 100;
}

function productUnitCost(p: Product): number {
    const c = p.cost ?? p.costPrice ?? 0;
    return typeof c === "number" && Number.isFinite(c) ? Math.max(0, c) : 0;
}

function buildProductMap(products: Product[]): Map<string, Product> {
    const m = new Map<string, Product>();
    for (const p of products) {
        m.set(p.id, p);
    }
    return m;
}

/**
 * 依銷售明細與品項成本估計單筆銷貨成本（無 lineItems 或找不到 productId 時為 0）。
 */
export function estimateCogsForSale(sale: Sale, productsById: Map<string, Product>): number {
    if (!sale.lineItems?.length) return 0;
    let sum = 0;
    for (const line of sale.lineItems) {
        const p = productsById.get(line.productId);
        if (!p) continue;
        sum += productUnitCost(p) * Math.max(0, line.qty);
    }
    return toMoney(sum);
}

export type FinancialPeriodSummary = {
    /** 來自 Sale.amount 彙總（與 stats 一致） */
    todayRevenue: number;
    monthRevenue: number;
    /** 依 lineItems × 品項成本估計；無明細時為 0 */
    todayCogsEstimate: number;
    monthCogsEstimate: number;
    todayGrossProfit: number;
    monthGrossProfit: number;
};

/**
 * 老闆儀表板用：本日／本月 收入、估計進貨成本、毛利（收入 − 估計 COGS）。
 */
export function buildFinancialPeriodSummaryFromSales(sales: Sale[], products: Product[], nowMs = Date.now()): FinancialPeriodSummary {
    const byId = buildProductMap(products);
    const dayStart = getDayStart(nowMs);
    const monthStart = getMonthStart(nowMs);

    let todayRevenue = 0;
    let monthRevenue = 0;
    let todayCogs = 0;
    let monthCogs = 0;

    for (const sale of sales) {
        const amt = toMoney(sale.amount);
        const cogs = estimateCogsForSale(sale, byId);
        if (sale.checkoutAt >= monthStart) {
            monthRevenue += amt;
            monthCogs += cogs;
        }
        if (sale.checkoutAt >= dayStart) {
            todayRevenue += amt;
            todayCogs += cogs;
        }
    }

    todayRevenue = toMoney(todayRevenue);
    monthRevenue = toMoney(monthRevenue);
    todayCogs = toMoney(todayCogs);
    monthCogs = toMoney(monthCogs);

    return {
        todayRevenue,
        monthRevenue,
        todayCogsEstimate: todayCogs,
        monthCogsEstimate: monthCogs,
        todayGrossProfit: toMoney(todayRevenue - todayCogs),
        monthGrossProfit: toMoney(monthRevenue - monthCogs),
    };
}
