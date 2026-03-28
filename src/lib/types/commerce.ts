// Compatibility barrel for legacy merchant dashboard imports.
// Prefer focused modules under `@/lib/types/*` for new work and refactors.
export type { CompanyCustomer, CompanyCustomerListRow, CustomerCaseState } from "@/lib/types/customer";
export type { InventoryStockLog } from "@/lib/types/inventory";
export type { Product, ProductDoc } from "@/lib/types/merchant-product";
export type { Activity, ActivityItem, ActivityPurchase, ActivityPurchaseStatus, ActivityStatus } from "@/lib/types/promotion";
export type { RepairBrand, RepairBrandModelGroup } from "@/lib/types/repair-brand";
export type { BossAdminCompanyRecord, CompanyDashboardStats, RevenuePoint, TrendRange } from "@/lib/types/reporting";
