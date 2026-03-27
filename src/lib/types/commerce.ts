import type { ProductNamingMode, StockDeductionMode } from "@/lib/types/catalog";
import type { EntitlementScopeType, EntitlementType, PromotionEffectType } from "@/lib/schema";

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
    effectType: PromotionEffectType;
    discountAmount: number;
    bundlePriceDiscount: number;
    giftProductId?: string;
    giftProductName?: string;
    giftQty: number;
    entitlementType?: EntitlementType;
    scopeType?: EntitlementScopeType;
    categoryId?: string;
    categoryName?: string;
    productId?: string;
    productName?: string;
    entitlementQty: number;
    entitlementExpiresAt?: number;
    reservationQty: number;
    reservationExpiresAt?: number;
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

export type CustomerCaseState = "active_case" | "closed_case" | "no_case";

export type CompanyCustomerListRow = {
    customer: CompanyCustomer;
    openCaseCount: number;
    closedCaseCount: number;
    caseState: CustomerCaseState;
    activitySpend: number;
};

export type ProductDoc = {
    id: string;
    companyId?: string;
    name: string;
    namingMode: ProductNamingMode;
    categoryId: string;
    categoryName: string;
    brandId: string;
    brandName: string;
    modelId: string;
    modelName: string;
    nameEntryId: string;
    nameEntryName: string;
    customLabel: string;
    aliases: string[];
    normalizedName: string;
    price: number;
    cost: number;
    supplier: string;
    sku: string;
    stock: number;
    onHandQty?: number;
    reservedQty?: number;
    availableQty?: number;
    sellPrice?: number;
    costPrice?: number;
    stockQty?: number;
    lowStockThreshold?: number;
    stockDeductionMode?: StockDeductionMode;
    status?: "active" | "inactive";
    createdAt: number;
    updatedAt: number;
};

export type Product = ProductDoc;

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
    linkedCategoryNames: string[];
    productTypes: string[];
    modelsByType: RepairBrandModelGroup[];
    models: string[];
    usedProductTypes: string[];
    createdAt: number;
    updatedAt: number;
};

export type RepairBrandModelGroup = {
    typeName: string;
    models: string[];
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
