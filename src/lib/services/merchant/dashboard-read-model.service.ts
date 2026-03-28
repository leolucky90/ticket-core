import "server-only";
import { getDashboardBundle } from "@/lib/services/commerce";
import { getCatalogDimensionBundle, listCatalogSuppliers } from "@/lib/services/merchant/catalog-service";
import { queryCompanyCustomersPage } from "@/lib/services/merchant/customer-read-model.service";
import { queryActivitiesPage } from "@/lib/services/merchant/activity-read-model.service";
import { listRepairTechnicians } from "@/lib/services/repair-technician.service";
import { queryTicketsPage } from "@/lib/services/ticket";
import { getTicketAttributePreferences } from "@/lib/services/ticketAttributes";
import { listUsedProductTypeSettings } from "@/lib/services/used-product-type-settings.service";
import type { DimensionPickerBundle } from "@/lib/types/catalog";

type DashboardTab = "dashboard" | "customers" | "cases" | "activities" | "inventory" | "marketing";

type DashboardRouteQuery = {
    tab: DashboardTab;
    customerKeyword: string;
    caseKeyword: string;
    caseStatus: string;
    caseOrder: "latest" | "earliest";
    activityKeyword: string;
    activityStatusFilter: "all" | "upcoming" | "active" | "ended" | "cancelled";
    activityOrder: "updated_latest" | "updated_earliest" | "start_latest" | "start_earliest";
    productKeyword: string;
    brandKeyword: string;
    customerCaseFilter: "all" | "active_case" | "closed_case" | "no_case";
    customerOrder: "updated_latest" | "updated_earliest" | "created_latest" | "created_earliest" | "name_asc" | "name_desc";
    customerPageSize: number;
    customerCursor?: string;
    casePageSize: number;
    caseCursor?: string;
    activityPageSize: number;
    activityCursor?: string;
};

function emptyDimensionBundle(): DimensionPickerBundle {
    return { categories: [], brands: [], models: [] };
}

export async function getMerchantDashboardRouteData(params: DashboardRouteQuery) {
    const needsCaseSupport = params.tab === "cases";
    const needsInventorySupport = params.tab === "inventory" || params.tab === "marketing";
    const needsMarketingSupport = params.tab === "marketing";
    const needsCustomerSupport = params.tab === "customers";
    const needsActivitySupport = params.tab === "activities";

    const bundle = await getDashboardBundle({
        customerKeyword: params.customerKeyword,
        caseKeyword: params.caseKeyword,
        caseStatus: params.caseStatus,
        caseOrder: params.caseOrder,
        activityKeyword: params.activityKeyword,
        productKeyword: params.productKeyword,
        brandKeyword: params.brandKeyword,
        scope: params.tab === "dashboard" ? "full" : params.tab === "marketing" ? "marketing" : params.tab === "inventory" ? "inventory" : "basic",
    });

    const companyId = typeof bundle.companyId === "string" ? bundle.companyId.trim() : "";

    const [
        customerPage,
        casePage,
        activityPage,
        repairTechnicians,
        usedProductTypeSettings,
        lookupData,
        ticketAttributePreferences,
    ] = await Promise.all([
        needsCustomerSupport
            ? queryCompanyCustomersPage({
                  keyword: params.customerKeyword,
                  caseState: params.customerCaseFilter,
                  order: params.customerOrder,
                  pageSize: params.customerPageSize,
                  cursor: params.customerCursor || undefined,
              })
            : Promise.resolve({ items: [], pageSize: params.customerPageSize, nextCursor: "", hasNextPage: false }),
        needsCaseSupport
            ? queryTicketsPage({
                  keyword: params.caseKeyword,
                  status: params.caseStatus,
                  order: params.caseOrder,
                  pageSize: params.casePageSize,
                  cursor: params.caseCursor || undefined,
              })
            : Promise.resolve({ items: [], pageSize: params.casePageSize, nextCursor: "", hasNextPage: false }),
        needsActivitySupport
            ? queryActivitiesPage({
                  keyword: params.activityKeyword,
                  status: params.activityStatusFilter,
                  order: params.activityOrder,
                  pageSize: params.activityPageSize,
                  cursor: params.activityCursor || undefined,
              })
            : Promise.resolve({ items: [], pageSize: params.activityPageSize, nextCursor: "", hasNextPage: false }),
        needsCaseSupport ? listRepairTechnicians() : Promise.resolve([]),
        needsMarketingSupport ? listUsedProductTypeSettings() : Promise.resolve([]),
        companyId && needsInventorySupport
            ? Promise.all([getCatalogDimensionBundle(companyId), listCatalogSuppliers("", companyId)])
            : Promise.resolve([emptyDimensionBundle(), []] as const),
        needsCaseSupport
            ? getTicketAttributePreferences({ tenantId: bundle.companyId })
            : Promise.resolve({ caseStatuses: [], quoteStatuses: [] }),
    ]);

    const [dimensionBundle, supplierRecords] = lookupData;

    return {
        bundle,
        customerPage,
        casePage,
        activityPage,
        repairTechnicians,
        usedProductTypeSettings,
        dimensionBundle,
        supplierRecords,
        ticketAttributePreferences,
    };
}

// Compatibility-backed aggregate remains available for older callers.
export { getDashboardBundle };
