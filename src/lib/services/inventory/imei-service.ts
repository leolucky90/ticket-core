import "server-only";

import { createDoc } from "@/lib/services/db/firestore";
import { normalizeStockItem, stockItemsCollectionPath, type StockItem } from "@/lib/schema/stock-item";

export type CreateStockItemParams = {
    companyId: string;
    productId: string;
    warehouseId: string;
    imei?: string;
    serialNumber?: string;
    status?: StockItem["status"];
};

/**
 * 建立逐件序號／IMEI 庫存（一件一筆）。
 */
export async function createStockItem(params: CreateStockItemParams): Promise<string> {
    const ref = await createDoc(stockItemsCollectionPath(params.companyId), {
        companyId: params.companyId,
        productId: params.productId,
        warehouseId: params.warehouseId,
        imei: params.imei ?? null,
        serialNumber: params.serialNumber ?? null,
        status: params.status ?? "in_stock",
    });
    return ref;
}

/** 以已知 doc id 讀取後正規化（若需 UI 顯示） */
export function normalizeStockItemDoc(id: string, data: Record<string, unknown>): StockItem {
    return normalizeStockItem({
        id,
        companyId: typeof data.companyId === "string" ? data.companyId : String(data.companyId ?? ""),
        productId: typeof data.productId === "string" ? data.productId : String(data.productId ?? ""),
        warehouseId: typeof data.warehouseId === "string" ? data.warehouseId : String(data.warehouseId ?? ""),
        imei: typeof data.imei === "string" ? data.imei : undefined,
        serialNumber: typeof data.serialNumber === "string" ? data.serialNumber : undefined,
        status:
            data.status === "sold" || data.status === "reserved" || data.status === "repair" || data.status === "in_stock"
                ? data.status
                : undefined,
    });
}
