export type TrendRange = "day" | "month";

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
