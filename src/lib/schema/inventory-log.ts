/**
 * 倉別庫存時間軸（與既有 inventoryMovements 並存：此集合專注 warehouse 維度與調貨型別）。
 * Collection：`companies/{companyId}/inventoryLogs`
 */

export const WAREHOUSE_INVENTORY_LOG_TYPES = [
    "inbound",
    "outbound",
    "reserve",
    "release",
    "transfer_in",
    "transfer_out",
    "adjustment",
] as const;

export type WarehouseInventoryLogType = (typeof WAREHOUSE_INVENTORY_LOG_TYPES)[number];

/** 規格對齊名稱 InventoryLog（倉別時間軸） */
export type InventoryLog = {
    companyId: string;
    productId: string;
    warehouseId: string;
    type: WarehouseInventoryLogType;
    qty: number;
    refId?: string;
    createdBy: string;
};

export type WarehouseInventoryLog = InventoryLog;

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toInt(value: unknown): number {
    const raw = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(raw)) return 0;
    return Math.round(raw);
}

function toLogType(value: unknown): WarehouseInventoryLogType {
    const v = toText(value, 40);
    if (
        v === "inbound" ||
        v === "outbound" ||
        v === "reserve" ||
        v === "release" ||
        v === "transfer_in" ||
        v === "transfer_out" ||
        v === "adjustment"
    ) {
        return v;
    }
    return "adjustment";
}

export function inventoryLogsCollectionPath(companyId: string): string {
    return `companies/${toText(companyId, 120)}/inventoryLogs`;
}

export function normalizeWarehouseInventoryLog(
    input: Partial<InventoryLog> & Pick<InventoryLog, "companyId" | "productId" | "warehouseId">,
): InventoryLog {
    return {
        companyId: toText(input.companyId, 120),
        productId: toText(input.productId, 120),
        warehouseId: toText(input.warehouseId, 120),
        type: toLogType(input.type),
        qty: Math.max(0, toInt(input.qty)),
        refId: input.refId ? toText(input.refId, 160) : undefined,
        createdBy: toText(input.createdBy, 120),
    };
}
