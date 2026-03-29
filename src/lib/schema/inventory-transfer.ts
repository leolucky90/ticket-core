/**
 * 跨倉調貨單（狀態流：pending → completed / cancelled）。
 */

export const INVENTORY_TRANSFER_STATUSES = ["pending", "completed", "cancelled"] as const;

export type InventoryTransferStatus = (typeof INVENTORY_TRANSFER_STATUSES)[number];

export type InventoryTransferLine = {
    productId: string;
    qty: number;
};

export type InventoryTransfer = {
    id: string;
    companyId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    items: InventoryTransferLine[];
    status: InventoryTransferStatus;
    createdBy: string;
};

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toNonNegativeInt(value: unknown): number {
    const raw = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(raw)) return 0;
    return Math.max(0, Math.round(raw));
}

function toStatus(value: unknown): InventoryTransferStatus {
    if (value === "pending" || value === "cancelled") return value;
    return "completed";
}

export function transfersCollectionPath(companyId: string): string {
    return `companies/${toText(companyId, 120)}/transfers`;
}

export function normalizeInventoryTransfer(
    input: Partial<InventoryTransfer> & Pick<InventoryTransfer, "id" | "companyId" | "fromWarehouseId" | "toWarehouseId">,
): InventoryTransfer {
    const itemsRaw = Array.isArray(input.items) ? input.items : [];
    const items: InventoryTransferLine[] = itemsRaw
        .map((row) => {
            const r = typeof row === "object" && row !== null ? (row as Record<string, unknown>) : {};
            return {
                productId: toText(r.productId, 120),
                qty: toNonNegativeInt(r.qty),
            };
        })
        .filter((line) => line.productId && line.qty > 0);

    return {
        id: toText(input.id, 120),
        companyId: toText(input.companyId, 120),
        fromWarehouseId: toText(input.fromWarehouseId, 120),
        toWarehouseId: toText(input.toWarehouseId, 120),
        items,
        status: toStatus(input.status),
        createdBy: toText(input.createdBy, 120),
    };
}
