import { cookies } from "next/headers";
import { CheckoutWorkspace } from "@/components/dashboard/CheckoutWorkspace";
import { MerchantPageShell } from "@/components/merchant/shell";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { listActivities } from "@/lib/services/merchant/activity-read-model.service";
import { listCompanyCustomers } from "@/lib/services/merchant/customer-read-model.service";
import { listProducts } from "@/lib/services/merchant/inventory-read-model.service";
import { createCheckoutSale } from "@/lib/services/sales";
import { listTickets } from "@/lib/services/ticket";
import { listUsedProducts } from "@/lib/services/used-products.service";
import { getCompanyProfile } from "@/lib/services/company-profile.service";

type CheckoutPageProps = {
    searchParams: Promise<{ flash?: string; ts?: string; customerId?: string; usedProductId?: string }>;
};

export default async function DashboardCheckoutPage({ searchParams }: CheckoutPageProps) {
    const sp = await searchParams;
    const lang = getUiLanguage((await cookies()).get("lang")?.value);
    const p = getUiText(lang).merchantStandalonePages.checkout;
    const [customers, tickets, products, activities, usedProducts, companyProfile] = await Promise.all([
        listCompanyCustomers(),
        listTickets(),
        listProducts(),
        listActivities(),
        listUsedProducts(),
        getCompanyProfile(),
    ]);
    const activeActivities = activities.filter((activity) => activity.status === "active");
    const sellableUsedProducts = usedProducts.filter((row) => row.isSellable && row.saleStatus !== "sold" && row.saleStatus !== "archived");

    return (
        <MerchantPageShell title={p.title} subtitle={p.subtitle} width="default">
            <CheckoutWorkspace
                customers={customers}
                tickets={tickets}
                products={products}
                usedProducts={sellableUsedProducts}
                companyProfile={companyProfile}
                activeActivities={activeActivities}
                createCheckoutAction={createCheckoutSale}
                flash={(sp.flash ?? "").trim()}
                actionTs={(sp.ts ?? "").trim()}
                initialCustomerId={(sp.customerId ?? "").trim()}
                initialUsedProductId={(sp.usedProductId ?? "").trim()}
            />
        </MerchantPageShell>
    );
}
