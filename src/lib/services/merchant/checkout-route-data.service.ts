import "server-only";
import { listActivities } from "@/lib/services/merchant/activity-read-model.service";
import { listCompanyCustomers } from "@/lib/services/merchant/customer-read-model.service";
import { listProducts } from "@/lib/services/merchant/inventory-read-model.service";
import { getBusinessProfile } from "@/lib/services/business-profile.service";
import { getRegionalReceiptSettings } from "@/lib/services/regional-receipt-settings.service";
import { listTickets } from "@/lib/services/ticket";
import { listUsedProducts } from "@/lib/services/used-products.service";

export async function getCheckoutRouteData() {
    const [customers, tickets, products, activities, usedProducts, businessProfile, regionalReceiptSettings] = await Promise.all([
        listCompanyCustomers(),
        listTickets(),
        listProducts(),
        listActivities(),
        listUsedProducts(),
        getBusinessProfile(),
        getRegionalReceiptSettings(),
    ]);

    return {
        customers,
        tickets,
        products,
        activeActivities: activities.filter((activity) => activity.status === "active"),
        usedProducts: usedProducts.filter((row) => row.isSellable && row.saleStatus !== "sold" && row.saleStatus !== "archived"),
        businessProfile,
        regionalReceiptSettings,
    };
}
