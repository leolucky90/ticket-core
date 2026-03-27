import { CheckoutWorkspace } from "@/components/dashboard/CheckoutWorkspace";
import { MerchantPageShell } from "@/components/merchant/shell";
import { createCheckoutSale } from "@/lib/services/sales";
import { listActivities, listCompanyCustomers, listProducts } from "@/lib/services/commerce";
import { listTickets } from "@/lib/services/ticket";
import { listUsedProducts } from "@/lib/services/used-products.service";
import { getCompanyProfile } from "@/lib/services/company-profile.service";

type CheckoutPageProps = {
    searchParams: Promise<{ flash?: string; ts?: string; customerId?: string; usedProductId?: string }>;
};

export default async function DashboardCheckoutPage({ searchParams }: CheckoutPageProps) {
    const sp = await searchParams;
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
        <MerchantPageShell title="結帳" subtitle="交易工作流頁面，聚焦收款與訂單建立。" width="default">
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
