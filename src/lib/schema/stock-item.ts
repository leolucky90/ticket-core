/**
 * 逐件序號／IMEI（一件一筆 stockItem）。
 */

export const STOCK_ITEM_STATUSES = ["in_stock", "sold", "reserved", "repair"] as const;

export type StockItemStatus = (typeof STOCK_ITEM_STATUSES)[number];

export type StockItem = {
    id: string;
    companyId: string;
    productId: string;
    warehouseId: string;
    imei?: string;
    serialNumber?: string;
    status: StockItemStatus;
};

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toOptionalText(value: unknown, max = 120): string | undefined {
    const t = toText(value, max);
    return t || undefined;
}

function toStatus(value: unknown): StockItemStatus {
    if (value === "sold" || value === "reserved" || value === "repair") return value;
    return "in_stock";
}

export function stockItemsCollectionPath(companyId: string): string {
    return `companies/${toText(companyId, 120)}/stockItems`;
}

export function normalizeStockItem(input: Partial<StockItem> & Pick<StockItem, "id" | "companyId" | "productId" | "warehouseId">): StockItem {
    return {
        id: toText(input.id, 120),
        companyId: toText(input.companyId, 120),
        productId: toText(input.productId, 120),
        warehouseId: toText(input.warehouseId, 120),
        imei: toOptionalText(input.imei, 64),
        serialNumber: toOptionalText(input.serialNumber, 120),
        status: toStatus(input.status),
    };
}
