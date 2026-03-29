/**
 * 倉庫（Warehouse）：掛在分店之下；庫存筆數以 warehouseId + productId 為 key。
 * Canonical DB field：companyId。
 */

export type Warehouse = {
    id: string;
    companyId: string;
    storeId: string;
    name: string;
};

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

export function warehousesCollectionPath(companyId: string): string {
    return `companies/${toText(companyId, 120)}/warehouses`;
}

export function normalizeWarehouse(input: Partial<Warehouse> & Pick<Warehouse, "id" | "companyId" | "storeId">): Warehouse {
    return {
        id: toText(input.id, 120),
        companyId: toText(input.companyId, 120),
        storeId: toText(input.storeId, 120),
        name: toText(input.name) || "Warehouse",
    };
}
