export type TrendRange = "day" | "month";

export type ActivityStatus = "upcoming" | "active" | "ended" | "cancelled";

export type ActivityItem = {
    id: string;
    itemName: string;
    totalQty: number;
    unitPrice: number;
    unitCost: number;
    amount: number;
    cost: number;
};

export type Activity = {
    id: string;
    name: string;
    startAt: number;
    endAt: number;
    status: ActivityStatus;
    message: string;
    defaultStoreQty: number;
    items: ActivityItem[];
    totalAmount: number;
    totalCost: number;
    createdAt: number;
    updatedAt: number;
};

export type ActivityPurchaseStatus = "ongoing" | "ended";

export type ActivityPurchase = {
    id: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    activityName: string;
    activityContent: string;
    checkoutStatus: "stored" | "settled";
    itemName: string;
    totalQty: number;
    remainingQty: number;
    salesAmount: number;
    purchasedAt: number;
    status: ActivityPurchaseStatus;
};

export type CompanyCustomer = {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    createdAt: number;
    updatedAt: number;
};

export type Product = {
    id: string;
    name: string;
    price: number;
    cost: number;
    supplier: string;
    sku: string;
    stock: number;
    createdAt: number;
    updatedAt: number;
};

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

export type RepairBrand = {
    id: string;
    name: string;
    models: string[];
    createdAt: number;
    updatedAt: number;
};

export type RevenuePoint = {
    label: string;
    revenue: number;
    count: number;
};

export type CompanyDashboardStats = {
    todayRevenue: number;
    monthRevenue: number;
    todaySubscriptionCount: number;
    monthSubscriptionCount: number;
    pointsByDay: RevenuePoint[];
    pointsByMonth: RevenuePoint[];
};

export type BossAdminCompanyRecord = {
    id: string;
    name: string;
    phone: string;
    address: string;
    paymentInfo: string;
    subscriptionStartAt: number;
    subscriptionEndAt: number;
    subscriptionAmount: number;
    createdAt: number;
    updatedAt: number;
};
