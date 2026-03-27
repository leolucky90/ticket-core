import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CompanyDashboardWorkspace } from "@/components/dashboard/CompanyDashboardWorkspace";
import { MerchantPageShell } from "@/components/merchant/shell";
import {
    cancelActivity,
    createActivity,
    createCompanyCustomer,
    createProductCategory,
    createProduct,
    createProductSupplier,
    createRepairBrand,
    createRepairModel,
    createStockIn,
    createStockOut,
    deleteActivity,
    deleteProduct,
    deleteProductCategory,
    deleteProductSupplier,
    deleteRepairBrand,
    deleteRepairBrandType,
    deleteRepairModel,
    getDashboardBundle,
    queryActivitiesPage,
    queryCompanyCustomersPage,
    updateActivity,
    updateCompanyCustomer,
    updateProduct,
    updateProductCategory,
    updateProductSupplier,
    updateRepairBrand,
    renameRepairBrandType,
    updateRepairModel,
} from "@/lib/services/commerce";
import { getCatalogDimensionBundle, listCatalogSuppliers } from "@/lib/services/merchant/catalog-service";
import { decodeCursorStack, encodeCursorStack, parseListPageSize } from "@/lib/pagination/query-controls";
import { getTicketAttributePreferences } from "@/lib/services/ticketAttributes";
import { createTicket, queryTicketsPage, updateTicket } from "@/lib/services/ticket";
import { listRepairTechnicians } from "@/lib/services/repair-technician.service";
import {
    listUsedProductTypeSettings,
    updateUsedProductTypeSetting,
} from "@/lib/services/used-product-type-settings.service";
import type { DimensionPickerBundle } from "@/lib/types/catalog";

type DashboardSearchParams = {
    tab?: string;
    flash?: string;
    ts?: string;
    caseQ?: string;
    caseStatus?: string;
    caseOrder?: string;
    activityQ?: string;
    productQ?: string;
    brandQ?: string;
    customerQ?: string;
    customerCaseFilter?: string;
    customerOrder?: string;
    customerPageSize?: string;
    customerCursor?: string;
    customerCursorStack?: string;
    casePageSize?: string;
    caseCursor?: string;
    caseCursorStack?: string;
    activityStatusFilter?: string;
    activityOrder?: string;
    activityPageSize?: string;
    activityCursor?: string;
    activityCursorStack?: string;
    inventoryView?: string;
};

function toTab(input: string | undefined): "dashboard" | "customers" | "cases" | "activities" | "inventory" | "marketing" {
    if (input === "customers") return "customers";
    if (input === "cases") return "cases";
    if (input === "activities") return "activities";
    if (input === "inventory") return "inventory";
    if (input === "marketing") return "marketing";
    return "dashboard";
}

function toCaseOrder(value: string | undefined): "latest" | "earliest" {
    return value === "earliest" ? "earliest" : "latest";
}

function toInventoryView(value: string | undefined): "stock" | "settings" | "stock-in" | "stock-out" | "product-management" {
    if (value === "settings") return "settings";
    if (value === "stock-in") return "stock-in";
    if (value === "stock-out") return "stock-out";
    if (value === "product-management") return "product-management";
    return "stock";
}

function toCustomerCaseFilter(value: string | undefined): "all" | "active_case" | "closed_case" | "no_case" {
    if (value === "active_case" || value === "closed_case" || value === "no_case") return value;
    return "all";
}

function toCustomerOrder(value: string | undefined): "updated_latest" | "updated_earliest" | "created_latest" | "created_earliest" | "name_asc" | "name_desc" {
    if (
        value === "updated_earliest" ||
        value === "created_latest" ||
        value === "created_earliest" ||
        value === "name_asc" ||
        value === "name_desc"
    ) {
        return value;
    }
    return "updated_latest";
}

function toActivityStatusFilter(value: string | undefined): "all" | "upcoming" | "active" | "ended" | "cancelled" {
    if (value === "upcoming" || value === "active" || value === "ended" || value === "cancelled") return value;
    return "all";
}

function toActivityOrder(value: string | undefined): "updated_latest" | "updated_earliest" | "start_latest" | "start_earliest" {
    if (value === "updated_earliest" || value === "start_latest" || value === "start_earliest") return value;
    return "updated_latest";
}

function emptyDimensionBundle(): DimensionPickerBundle {
    return {
        categories: [],
        brands: [],
        models: [],
    };
}

function toSpecTemplateKey(name: string): string {
    const normalized = name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_\-\u4e00-\u9fff]/g, "")
        .slice(0, 120);
    if (normalized) return normalized;
    return "spec_name";
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<DashboardSearchParams> }) {
    const c = await cookies();
    const langCookie = c.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";

    const sp = await searchParams;
    const tab = toTab(sp.tab);
    const inventoryView = toInventoryView(sp.inventoryView);
    const caseStatus = (sp.caseStatus ?? "all").trim() || "all";
    const caseOrder = toCaseOrder(sp.caseOrder);
    const customerCaseFilter = toCustomerCaseFilter(sp.customerCaseFilter);
    const customerOrder = toCustomerOrder(sp.customerOrder);
    const activityStatusFilter = toActivityStatusFilter(sp.activityStatusFilter);
    const activityOrder = toActivityOrder(sp.activityOrder);
    const customerPageSize = parseListPageSize((sp.customerPageSize ?? "").trim(), "10");
    const casePageSize = parseListPageSize((sp.casePageSize ?? "").trim(), "10");
    const activityPageSize = parseListPageSize((sp.activityPageSize ?? "").trim(), "10");
    const customerCursor = (sp.customerCursor ?? "").trim();
    const caseCursor = (sp.caseCursor ?? "").trim();
    const activityCursor = (sp.activityCursor ?? "").trim();
    const customerCursorStack = decodeCursorStack((sp.customerCursorStack ?? "").trim());
    const caseCursorStack = decodeCursorStack((sp.caseCursorStack ?? "").trim());
    const activityCursorStack = decodeCursorStack((sp.activityCursorStack ?? "").trim());
    const actionTs = (sp.ts ?? "").trim();
    const needsCaseSupport = tab === "cases";
    const needsInventorySupport = tab === "inventory" || tab === "marketing";
    const needsMarketingSupport = tab === "marketing";
    const needsCustomerSupport = tab === "customers";
    const needsActivitySupport = tab === "activities";

    const bundle = await getDashboardBundle({
        customerKeyword: (sp.customerQ ?? "").trim(),
        caseKeyword: (sp.caseQ ?? "").trim(),
        caseStatus,
        caseOrder,
        activityKeyword: (sp.activityQ ?? "").trim(),
        productKeyword: (sp.productQ ?? "").trim(),
        brandKeyword: (sp.brandQ ?? "").trim(),
        scope: tab === "dashboard" ? "full" : tab === "marketing" ? "marketing" : tab === "inventory" ? "inventory" : "basic",
    });
    const customerPage = needsCustomerSupport
        ? await queryCompanyCustomersPage({
              keyword: (sp.customerQ ?? "").trim(),
              caseState: customerCaseFilter,
              order: customerOrder,
              pageSize: customerPageSize,
              cursor: customerCursor || undefined,
          })
        : { items: [], pageSize: customerPageSize, nextCursor: "", hasNextPage: false };
    const casePage = needsCaseSupport
        ? await queryTicketsPage({
              keyword: (sp.caseQ ?? "").trim(),
              status: caseStatus,
              order: caseOrder,
              pageSize: casePageSize,
              cursor: caseCursor || undefined,
          })
        : { items: [], pageSize: casePageSize, nextCursor: "", hasNextPage: false };
    const activityPage = needsActivitySupport
        ? await queryActivitiesPage({
              keyword: (sp.activityQ ?? "").trim(),
              status: activityStatusFilter,
              order: activityOrder,
              pageSize: activityPageSize,
              cursor: activityCursor || undefined,
          })
        : { items: [], pageSize: activityPageSize, nextCursor: "", hasNextPage: false };
    const repairTechnicians = needsCaseSupport ? await listRepairTechnicians() : [];
    const usedProductTypeSettings = needsMarketingSupport ? await listUsedProductTypeSettings() : [];
    const companyId = typeof bundle.companyId === "string" ? bundle.companyId.trim() : "";
    let dimensionBundle = emptyDimensionBundle();
    let supplierRecords: Awaited<ReturnType<typeof listCatalogSuppliers>> = [];
    if (companyId && needsInventorySupport) {
        [dimensionBundle, supplierRecords] = await Promise.all([
            getCatalogDimensionBundle(companyId),
            listCatalogSuppliers("", companyId),
        ]);
    }
    const parsedActionTs = Number.parseInt(actionTs, 10);
    const derivedSnapshotTs = [
        ...(needsCaseSupport ? casePage.items : bundle.tickets).map((ticket) => ticket.updatedAt),
        ...(needsCustomerSupport ? customerPage.items.map((row) => row.customer) : bundle.customers).map((customer) => customer.updatedAt),
        ...(needsActivitySupport ? activityPage.items : bundle.activities).map((activity) => activity.updatedAt),
        ...bundle.products.map((product) => product.updatedAt),
        ...bundle.brands.map((brand) => brand.updatedAt),
        ...bundle.sales.map((sale) => sale.checkoutAt),
        ...bundle.purchases.map((purchase) => purchase.purchasedAt),
        ...bundle.stockLogs.map((log) => log.createdAt),
    ].reduce((max, value) => (value > max ? value : max), 0);
    const snapshotTs = Number.isFinite(parsedActionTs) && parsedActionTs > 0 ? parsedActionTs : derivedSnapshotTs;
    const ticketAttributePreferences = needsCaseSupport
        ? await getTicketAttributePreferences({ tenantId: bundle.companyId })
        : { caseStatuses: [], quoteStatuses: [] };
    const tabLabels: Record<ReturnType<typeof toTab>, { title: string; subtitle: string }> = {
        dashboard: { title: "儀表板", subtitle: "營運概覽、關鍵指標與近期動態。" },
        customers: { title: "客戶", subtitle: "固定結構的客戶名單與關聯資訊，不使用自由排序卡片。" },
        cases: { title: "案件", subtitle: "案件查詢、過濾、排序與明細編輯。" },
        activities: { title: "活動促銷", subtitle: "活動清單與編輯面板，維持營運型列表流程。" },
        inventory: { title: "庫存管理", subtitle: "庫存摘要與操作列表，優先支援搜尋、過濾與異動紀錄。" },
        marketing: { title: "商店營銷設定", subtitle: "品牌型號與營運資料設定。" },
    };
    const currentTabLabel = tabLabels[tab];

    async function updateUsedProductTypeSettingAction(formData: FormData): Promise<void> {
        "use server";

        const id = String(formData.get("id") ?? "").trim();
        const actionMode = String(formData.get("actionMode") ?? "updateMeta").trim();
        const settings = await listUsedProductTypeSettings();
        const current = settings.find((row) => row.id === id);
        if (!current) {
            return redirect(`/dashboard?tab=marketing&flash=${encodeURIComponent("找不到二手類型")}&ts=${Date.now()}`);
        }

        if (actionMode === "addSpec") {
            const specName = String(formData.get("specName") ?? "").trim();
            const specPlaceholder = String(formData.get("specPlaceholder") ?? "").trim();
            const specRequired = formData.get("specRequired") === "on";
            if (!specName) {
                return redirect(`/dashboard?tab=marketing&flash=${encodeURIComponent("規格名稱不可空白")}&ts=${Date.now()}`);
            }
            const specKey = toSpecTemplateKey(specName);
            const exists = current.specificationTemplates.some((row) => {
                const rowName = (row.label || row.key).trim().toLowerCase();
                return row.key.toLowerCase() === specKey.toLowerCase() || rowName === specName.toLowerCase();
            });
            const nextTemplates = exists
                ? current.specificationTemplates
                : [
                      ...current.specificationTemplates,
                      {
                          key: specKey,
                          label: specName,
                          placeholder: specPlaceholder || undefined,
                          isRequired: specRequired,
                      },
                  ];
            await updateUsedProductTypeSetting({
                id,
                specificationTemplates: nextTemplates,
            });
            return redirect(`/dashboard?tab=marketing&flash=${encodeURIComponent("規格欄位已新增")}&ts=${Date.now()}`);
        }

        if (actionMode === "removeSpec") {
            const specKey = String(formData.get("specKey") ?? "").trim();
            const nextTemplates = current.specificationTemplates.filter((row) => row.key !== specKey);
            await updateUsedProductTypeSetting({
                id,
                specificationTemplates: nextTemplates,
            });
            return redirect(`/dashboard?tab=marketing&flash=${encodeURIComponent("規格欄位已刪除")}&ts=${Date.now()}`);
        }
        return redirect(`/dashboard?tab=marketing&flash=${encodeURIComponent("二手規格模板已更新")}&ts=${Date.now()}`);
    }

    return (
        <MerchantPageShell title={currentTabLabel.title} subtitle={currentTabLabel.subtitle} width={tab === "dashboard" ? "overview" : "index"}>
            <CompanyDashboardWorkspace
                lang={lang}
                tab={tab}
                inventoryView={inventoryView}
                flash={(sp.flash ?? "").trim()}
                actionTs={actionTs}
                snapshotTs={snapshotTs}
                stats={bundle.stats}
                sales={bundle.sales}
                tickets={needsCaseSupport ? casePage.items : bundle.tickets}
                customers={needsCustomerSupport ? customerPage.items.map((row) => row.customer) : bundle.customers}
                activities={needsActivitySupport ? activityPage.items : bundle.activities}
                purchases={bundle.purchases}
                products={bundle.products}
                brands={bundle.brands}
                dimensionBundle={dimensionBundle}
                supplierItems={supplierRecords.map((item) => ({ id: item.id, name: item.name, status: item.status }))}
                stockLogs={bundle.stockLogs}
                caseKeyword={(sp.caseQ ?? "").trim()}
                caseStatus={caseStatus}
                caseOrder={caseOrder}
                caseStatusOptions={ticketAttributePreferences.caseStatuses}
                quoteStatusOptions={ticketAttributePreferences.quoteStatuses}
                customerKeyword={(sp.customerQ ?? "").trim()}
                activityKeyword={(sp.activityQ ?? "").trim()}
                productKeyword={(sp.productQ ?? "").trim()}
                brandKeyword={(sp.brandQ ?? "").trim()}
                createCaseAction={createTicket}
                updateCaseAction={updateTicket}
                repairTechnicians={repairTechnicians.map((row) => ({
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    phone: row.phone,
                }))}
                createCustomerAction={createCompanyCustomer}
                updateCustomerAction={updateCompanyCustomer}
                createActivityAction={createActivity}
                updateActivityAction={updateActivity}
                cancelActivityAction={cancelActivity}
                deleteActivityAction={deleteActivity}
                createProductAction={createProduct}
                updateProductAction={updateProduct}
                deleteProductAction={deleteProduct}
                createStockInAction={createStockIn}
                createStockOutAction={createStockOut}
                createBrandAction={createRepairBrand}
                updateBrandAction={updateRepairBrand}
                deleteBrandAction={deleteRepairBrand}
                renameBrandTypeAction={renameRepairBrandType}
                deleteBrandTypeAction={deleteRepairBrandType}
                createModelAction={createRepairModel}
                updateModelAction={updateRepairModel}
                deleteModelAction={deleteRepairModel}
                createCategoryAction={createProductCategory}
                createSupplierAction={createProductSupplier}
                updateCategoryAction={updateProductCategory}
                deleteCategoryAction={deleteProductCategory}
                updateSupplierAction={updateProductSupplier}
                deleteSupplierAction={deleteProductSupplier}
                customerRows={customerPage.items}
                customerCaseFilter={customerCaseFilter}
                customerOrder={customerOrder}
                customerPageSize={String(customerPage.pageSize)}
                customerCurrentCursor={customerCursor}
                customerPreviousCursor={customerCursorStack.at(-1) ?? ""}
                customerPreviousCursorStack={encodeCursorStack(customerCursorStack.slice(0, -1))}
                customerNextCursor={customerPage.nextCursor}
                customerNextCursorStack={encodeCursorStack(customerCursor ? [...customerCursorStack, customerCursor] : customerCursorStack)}
                customerHasNextPage={customerPage.hasNextPage}
                casePageSize={String(casePage.pageSize)}
                caseCurrentCursor={caseCursor}
                casePreviousCursor={caseCursorStack.at(-1) ?? ""}
                casePreviousCursorStack={encodeCursorStack(caseCursorStack.slice(0, -1))}
                caseNextCursor={casePage.nextCursor}
                caseNextCursorStack={encodeCursorStack(caseCursor ? [...caseCursorStack, caseCursor] : caseCursorStack)}
                caseHasNextPage={casePage.hasNextPage}
                activityStatusFilter={activityStatusFilter}
                activityOrder={activityOrder}
                activityPageSize={String(activityPage.pageSize)}
                activityCurrentCursor={activityCursor}
                activityPreviousCursor={activityCursorStack.at(-1) ?? ""}
                activityPreviousCursorStack={encodeCursorStack(activityCursorStack.slice(0, -1))}
                activityNextCursor={activityPage.nextCursor}
                activityNextCursorStack={encodeCursorStack(activityCursor ? [...activityCursorStack, activityCursor] : activityCursorStack)}
                activityHasNextPage={activityPage.hasNextPage}
                usedProductTypeSettings={usedProductTypeSettings}
                updateUsedProductTypeSettingAction={updateUsedProductTypeSettingAction}
            />
        </MerchantPageShell>
    );
}
