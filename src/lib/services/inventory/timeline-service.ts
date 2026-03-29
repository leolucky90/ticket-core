import "server-only";

import { createDoc } from "@/lib/services/db/firestore";
import { inventoryLogsCollectionPath, normalizeWarehouseInventoryLog, type InventoryLog } from "@/lib/schema/inventory-log";

/**
 * 寫入倉別庫存時間軸（inventoryLogs）。所有倉別庫存異動應呼叫此函式記錄。
 */
export async function logInventory(event: InventoryLog): Promise<string> {
    const row = normalizeWarehouseInventoryLog(event);
    return createDoc(inventoryLogsCollectionPath(row.companyId), {
        companyId: row.companyId,
        productId: row.productId,
        warehouseId: row.warehouseId,
        type: row.type,
        qty: row.qty,
        refId: row.refId ?? null,
        createdBy: row.createdBy,
    });
}
