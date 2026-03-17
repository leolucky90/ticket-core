import { cookies } from "next/headers";
import { CompanyDashboardWorkspace } from "@/components/dashboard/CompanyDashboardWorkspace";
import {
    cancelActivity,
    createActivity,
    createCompanyCustomer,
    createProduct,
    createRepairBrand,
    createRepairModel,
    createStockIn,
    createStockOut,
    deleteActivity,
    deleteProduct,
    deleteRepairBrand,
    deleteRepairModel,
    getDashboardBundle,
    updateActivity,
    updateCompanyCustomer,
    updateProduct,
    updateRepairBrand,
    updateRepairModel,
} from "@/lib/services/commerce";
import { getTicketAttributePreferences } from "@/lib/services/ticketAttributes";
import { createTicket, updateTicket } from "@/lib/services/ticket";

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

export default async function DashboardPage({ searchParams }: { searchParams: Promise<DashboardSearchParams> }) {
    const c = await cookies();
    const langCookie = c.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";

    const sp = await searchParams;
    const tab = toTab(sp.tab);
    const inventoryView = toInventoryView(sp.inventoryView);
    const caseStatus = (sp.caseStatus ?? "all").trim() || "all";
    const caseOrder = toCaseOrder(sp.caseOrder);
    const actionTs = (sp.ts ?? "").trim();

    const bundle = await getDashboardBundle({
        customerKeyword: (sp.customerQ ?? "").trim(),
        caseKeyword: (sp.caseQ ?? "").trim(),
        caseStatus,
        caseOrder,
        activityKeyword: (sp.activityQ ?? "").trim(),
        productKeyword: (sp.productQ ?? "").trim(),
        brandKeyword: (sp.brandQ ?? "").trim(),
    });
    const parsedActionTs = Number.parseInt(actionTs, 10);
    const derivedSnapshotTs = [
        ...bundle.tickets.map((ticket) => ticket.updatedAt),
        ...bundle.customers.map((customer) => customer.updatedAt),
        ...bundle.activities.map((activity) => activity.updatedAt),
        ...bundle.products.map((product) => product.updatedAt),
        ...bundle.brands.map((brand) => brand.updatedAt),
        ...bundle.sales.map((sale) => sale.checkoutAt),
        ...bundle.purchases.map((purchase) => purchase.purchasedAt),
        ...bundle.stockLogs.map((log) => log.createdAt),
    ].reduce((max, value) => (value > max ? value : max), 0);
    const snapshotTs = Number.isFinite(parsedActionTs) && parsedActionTs > 0 ? parsedActionTs : derivedSnapshotTs;
    const ticketAttributePreferences = await getTicketAttributePreferences({ tenantId: bundle.companyId });

    return (
        <CompanyDashboardWorkspace
            lang={lang}
            tab={tab}
            inventoryView={inventoryView}
            flash={(sp.flash ?? "").trim()}
            actionTs={actionTs}
            snapshotTs={snapshotTs}
            stats={bundle.stats}
            sales={bundle.sales}
            tickets={bundle.tickets}
            customers={bundle.customers}
            activities={bundle.activities}
            purchases={bundle.purchases}
            products={bundle.products}
            brands={bundle.brands}
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
            createModelAction={createRepairModel}
            updateModelAction={updateRepairModel}
            deleteModelAction={deleteRepairModel}
        />
    );
}
