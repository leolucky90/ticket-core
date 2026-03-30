import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CompanyDashboardWorkspace } from "@/components/dashboard/CompanyDashboardWorkspace";
import { MerchantPageShell } from "@/components/merchant/shell";
import {
    cancelActivity,
    createActivity,
    deleteActivity,
    updateActivity,
} from "@/lib/services/merchant/activity-write.service";
import { getItemNamingSettings, updateItemNamingSettings } from "@/lib/services/item-naming-settings.service";
import { decodeCursorStack, encodeCursorStack, parseListPageSize } from "@/lib/pagination/query-controls";
import { createProductCategory, createProductSupplier, deleteProductCategory, deleteProductSupplier, updateProductCategory, updateProductSupplier } from "@/lib/services/merchant/catalog-write.service";
import { createCompanyCustomer, updateCompanyCustomer } from "@/lib/services/merchant/customer-write.service";
import { getMerchantDashboardRouteData } from "@/lib/services/merchant/dashboard-read-model.service";
import { createStockIn, createStockOut } from "@/lib/services/merchant/inventory-write.service";
import { createRepairBrand, createRepairModel, deleteRepairBrand, deleteRepairBrandType, deleteRepairModel, renameRepairBrandType, updateRepairBrand, updateRepairModel } from "@/lib/services/merchant/marketing-write.service";
import { createProduct, deleteProduct, updateProduct } from "@/lib/services/merchant/product-write.service";
import { createTicket, createWarrantyCaseFromExistingCase, updateTicket } from "@/lib/services/ticket";
import {
    listUsedProductTypeSettings,
    updateUsedProductTypeSetting,
} from "@/lib/services/used-product-type-settings.service";
import type { ItemNamingToken } from "@/lib/types/catalog";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";

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

function toSpecInputType(value: FormDataEntryValue | null): "text" | "select" {
    return value === "select" ? "select" : "text";
}

function parseSpecTemplateOptions(value: FormDataEntryValue | null): string[] {
    if (typeof value !== "string" || !value.trim()) return [];

    try {
        const parsed = JSON.parse(value) as unknown[];
        if (!Array.isArray(parsed)) return [];
        const seen = new Set<string>();
        const options: string[] = [];

        for (const row of parsed) {
            if (typeof row !== "string") continue;
            const option = row.trim().slice(0, 120);
            if (!option) continue;
            const normalized = option.toLowerCase();
            if (seen.has(normalized)) continue;
            seen.add(normalized);
            options.push(option);
            if (options.length >= 40) break;
        }

        return options;
    } catch {
        return [];
    }
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<DashboardSearchParams> }) {
    const c = await cookies();
    const lang = getUiLanguage(c.get("lang")?.value);
    const ui = getUiText(lang);

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
    const needsCustomerSupport = tab === "customers";
    const needsActivitySupport = tab === "activities";
    const {
        bundle,
        customerPage,
        casePage,
        activityPage,
        repairTechnicians,
        usedProductTypeSettings,
        dimensionBundle,
        supplierRecords,
        ticketAttributePreferences,
    } = await getMerchantDashboardRouteData({
        tab,
        customerKeyword: (sp.customerQ ?? "").trim(),
        caseKeyword: (sp.caseQ ?? "").trim(),
        caseStatus,
        caseOrder,
        activityKeyword: (sp.activityQ ?? "").trim(),
        activityStatusFilter,
        activityOrder,
        productKeyword: (sp.productQ ?? "").trim(),
        brandKeyword: (sp.brandQ ?? "").trim(),
        customerCaseFilter,
        customerOrder,
        customerPageSize,
        customerCursor: customerCursor || undefined,
        casePageSize,
        caseCursor: caseCursor || undefined,
        activityPageSize,
        activityCursor: activityCursor || undefined,
    });
    const itemNamingSettings = await getItemNamingSettings();
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
    const tabLabels = ui.dashboardWorkspaceTabs;
    const currentTabLabel = tabLabels[tab];

    async function updateUsedProductTypeSettingAction(formData: FormData): Promise<void> {
        "use server";

        const id = String(formData.get("id") ?? "").trim();
        const actionMode = String(formData.get("actionMode") ?? "updateMeta").trim();
        const settings = await listUsedProductTypeSettings();
        const current = settings.find((row) => row.id === id);
        if (!current) {
            return redirect(`/dashboard?tab=marketing&flash=used_product_type_not_found&ts=${Date.now()}`);
        }

        if (actionMode === "addSpec") {
            const specName = String(formData.get("specName") ?? "").trim();
            const specPlaceholder = String(formData.get("specPlaceholder") ?? "").trim();
            const specRequired = formData.get("specRequired") === "on";
            const specInputType = toSpecInputType(formData.get("specInputType"));
            const specOptions = parseSpecTemplateOptions(formData.get("specOptionsJson"));
            if (!specName) {
                return redirect(`/dashboard?tab=marketing&flash=used_product_spec_name_required&ts=${Date.now()}`);
            }
            if (specInputType === "select" && specOptions.length === 0) {
                return redirect(`/dashboard?tab=marketing&flash=used_product_spec_options_required&ts=${Date.now()}`);
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
                          inputType: specInputType,
                          options: specInputType === "select" ? specOptions : undefined,
                          isRequired: specRequired,
                      },
                  ];
            await updateUsedProductTypeSetting({
                id,
                specificationTemplates: nextTemplates,
            });
            return redirect(`/dashboard?tab=marketing&flash=used_product_spec_added&ts=${Date.now()}`);
        }

        if (actionMode === "updateSpec") {
            const specKey = String(formData.get("specKey") ?? "").trim();
            const specName = String(formData.get("specName") ?? "").trim();
            const specPlaceholder = String(formData.get("specPlaceholder") ?? "").trim();
            const specRequired = formData.get("specRequired") === "on";
            const specInputType = toSpecInputType(formData.get("specInputType"));
            const specOptions = parseSpecTemplateOptions(formData.get("specOptionsJson"));

            if (!specKey) {
                return redirect(`/dashboard?tab=marketing&flash=used_product_spec_not_found&ts=${Date.now()}`);
            }
            if (!specName) {
                return redirect(`/dashboard?tab=marketing&flash=used_product_spec_name_required&ts=${Date.now()}`);
            }
            if (specInputType === "select" && specOptions.length === 0) {
                return redirect(`/dashboard?tab=marketing&flash=used_product_spec_options_required&ts=${Date.now()}`);
            }

            const nextTemplates = current.specificationTemplates.map((row) =>
                row.key !== specKey
                    ? row
                    : {
                          ...row,
                          label: specName,
                          placeholder: specPlaceholder || undefined,
                          inputType: specInputType,
                          options: specInputType === "select" ? specOptions : undefined,
                          isRequired: specRequired,
                      },
            );

            await updateUsedProductTypeSetting({
                id,
                specificationTemplates: nextTemplates,
            });
            return redirect(`/dashboard?tab=marketing&flash=used_product_spec_updated&ts=${Date.now()}`);
        }

        if (actionMode === "removeSpec") {
            const specKey = String(formData.get("specKey") ?? "").trim();
            const nextTemplates = current.specificationTemplates.filter((row) => row.key !== specKey);
            await updateUsedProductTypeSetting({
                id,
                specificationTemplates: nextTemplates,
            });
            return redirect(`/dashboard?tab=marketing&flash=used_product_spec_deleted&ts=${Date.now()}`);
        }
        return redirect(`/dashboard?tab=marketing&flash=used_product_templates_updated&ts=${Date.now()}`);
    }

    async function updateItemNamingSettingsAction(formData: FormData): Promise<void> {
        "use server";

        try {
            const order = String(formData.get("order") ?? "")
                .split(",")
                .map((item) => item.trim())
                .filter((item) => item.length > 0);
            await updateItemNamingSettings({ patch: { order: order as ItemNamingToken[] } });
            redirect(`/dashboard?tab=marketing&flash=${encodeURIComponent("item_naming_saved")}&ts=${Date.now()}`);
        } catch {
            redirect(`/dashboard?tab=marketing&flash=${encodeURIComponent("error")}&ts=${Date.now()}`);
        }
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
                itemNamingSettings={itemNamingSettings}
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
                createCaseAction={createTicket}
                createWarrantyCaseAction={async (formData: FormData) => {
                    "use server";

                    const sourceCaseId = String(formData.get("sourceCaseId") ?? "").trim();
                    const created = await createWarrantyCaseFromExistingCase({ sourceCaseId });
                    if (!created) {
                        redirect(`/dashboard?tab=cases&flash=warranty_case_create_failed&ts=${Date.now()}`);
                    }
                    redirect(`/dashboard?tab=cases&caseQ=${encodeURIComponent(created.id)}&flash=warranty_case_created&ts=${Date.now()}`);
                }}
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
                updateItemNamingSettingsAction={updateItemNamingSettingsAction}
            />
        </MerchantPageShell>
    );
}
