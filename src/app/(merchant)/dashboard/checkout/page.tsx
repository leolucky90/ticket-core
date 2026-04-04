import { cookies } from "next/headers";
import { CheckoutWorkspace } from "@/components/dashboard/CheckoutWorkspace";
import { MerchantPageShell } from "@/components/merchant/shell";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getCheckoutRouteData } from "@/lib/services/merchant/checkout-route-data.service";
import { createCheckoutSale } from "@/lib/services/sales";

type CheckoutPageProps = {
    searchParams: Promise<{ flash?: string; ts?: string; customerId?: string; usedProductId?: string }>;
};

export default async function DashboardCheckoutPage({ searchParams }: CheckoutPageProps) {
    const sp = await searchParams;
    const lang = getUiLanguage((await cookies()).get("lang")?.value);
    const p = getUiText(lang).merchantStandalonePages.checkout;
    const { customers, tickets, products, activeActivities, usedProducts, businessProfile, regionalReceiptSettings } =
        await getCheckoutRouteData();

    return (
        <MerchantPageShell title={p.title} subtitle={p.subtitle} width="default">
            <CheckoutWorkspace
                customers={customers}
                tickets={tickets}
                products={products}
                usedProducts={usedProducts}
                businessProfile={businessProfile}
                regionalReceiptSettings={regionalReceiptSettings}
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
