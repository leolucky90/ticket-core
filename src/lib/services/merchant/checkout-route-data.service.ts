import "server-only";
import { listActivities } from "@/lib/services/merchant/activity-read-model.service";
import { listCompanyCustomers } from "@/lib/services/merchant/customer-read-model.service";
import { listProducts } from "@/lib/services/merchant/inventory-read-model.service";
import { getBusinessProfile } from "@/lib/services/business-profile.service";
import { getRegionalReceiptSettings } from "@/lib/services/regional-receipt-settings.service";
import { listTickets } from "@/lib/services/ticket";
import { listUsedProducts } from "@/lib/services/used-products.service";

export async function getCheckoutRouteBaseData() {
    const [customers, tickets, products] = await Promise.all([listCompanyCustomers(), listTickets(), listProducts()]);
    return {
        customers,
        tickets,
        products,
    };
}

export async function getCheckoutRouteDeferredData() {
    const [activities, usedProducts, businessProfile, regionalReceiptSettings] = await Promise.all([
        listActivities(),
        listUsedProducts(),
        getBusinessProfile(),
        getRegionalReceiptSettings(),
    ]);
    return {
        activeActivities: activities.filter((activity) => activity.status === "active"),
        usedProducts: usedProducts.filter((row) => row.isSellable && row.saleStatus !== "sold" && row.saleStatus !== "archived"),
        businessProfile,
        regionalReceiptSettings,
    };
}

export async function getCheckoutDeferredActivitiesData() {
    const activities = await listActivities();
    return {
        activeActivities: activities.filter((activity) => activity.status === "active"),
    };
}

export async function getCheckoutDeferredUsedProductsData() {
    const usedProducts = await listUsedProducts();
    return {
        usedProducts: usedProducts.filter((row) => row.isSellable && row.saleStatus !== "sold" && row.saleStatus !== "archived"),
    };
}

export async function getCheckoutDeferredReceiptSettingsData() {
    const [businessProfile, regionalReceiptSettings] = await Promise.all([getBusinessProfile(), getRegionalReceiptSettings()]);
    return {
        businessProfile,
        regionalReceiptSettings,
    };
}

export async function getCheckoutRouteData() {
    const [base, deferred] = await Promise.all([getCheckoutRouteBaseData(), getCheckoutRouteDeferredData()]);
    return {
        ...base,
        ...deferred,
    };
}
