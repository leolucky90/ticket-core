/**
 * 倉別庫存（與既有 companies/{companyId}/inventory/{productId} 公司彙總並存；
 * 多倉 key：warehouseId + productId，doc id 慣例 `${warehouseId}_${productId}`）。
 */

import { recomputeAvailableQty } from "@/lib/schema/inventory";

export type WarehouseInventoryRow = {
    companyId: string;
    warehouseId: string;
    productId: string;
    onHandQty: number;
    reservedQty: number;
    availableQty: number;
};

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toNonNegativeInt(value: unknown, fallback = 0): number {
    const raw = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(raw)) return Math.max(0, Math.round(fallback));
    return Math.max(0, Math.round(raw));
}

export function warehouseInventoryDocId(warehouseId: string, productId: string): string {
    return `${toText(warehouseId, 120)}_${toText(productId, 120)}`;
}

export function warehouseInventoryCollectionPath(companyId: string): string {
    return `companies/${toText(companyId, 120)}/warehouseInventory`;
}

export function normalizeWarehouseInventoryRow(
    input: Partial<WarehouseInventoryRow> & Pick<WarehouseInventoryRow, "companyId" | "warehouseId" | "productId">,
): WarehouseInventoryRow {
    const onHandQty = toNonNegativeInt(input.onHandQty);
    const reservedQty = toNonNegativeInt(input.reservedQty);
    return {
        companyId: toText(input.companyId, 120),
        warehouseId: toText(input.warehouseId, 120),
        productId: toText(input.productId, 120),
        onHandQty,
        reservedQty,
        availableQty: recomputeAvailableQty(onHandQty, reservedQty),
    };
}
