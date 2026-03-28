export type InventoryStockLog = {
    id: string;
    productId: string;
    productName: string;
    action: "stock_in" | "stock_out";
    qty: number;
    beforeStock: number;
    afterStock: number;
    operatorName: string;
    operatorEmail: string;
    createdAt: number;
    updatedAt: number;
};
