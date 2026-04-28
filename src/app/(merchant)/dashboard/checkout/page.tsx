import { cookies } from "next/headers";
import { CheckoutWorkspace } from "@/components/dashboard/CheckoutWorkspace";
import { MerchantPageShell } from "@/components/merchant/shell";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { resolveCompanySettingsScope } from "@/lib/services/company-settings-scope.service";
import { getCheckoutRouteBaseData } from "@/lib/services/merchant/checkout-route-data.service";
import { getSaleByIdWithinCompany } from "@/lib/services/sales";
import { createCheckoutSale } from "@/lib/services/sales";
import { getReceiptDocumentById } from "@/lib/services/receipt-document.service";
import type { Sale } from "@/lib/types/sale";

type CheckoutPageProps = {
    searchParams: Promise<{ flash?: string; ts?: string; customerId?: string; caseId?: string; usedProductId?: string; rebuildSaleId?: string; rebuildDocumentId?: string }>;
};

export default async function DashboardCheckoutPage({ searchParams }: CheckoutPageProps) {
    const sp = await searchParams;
    const lang = getUiLanguage((await cookies()).get("lang")?.value);
    const p = getUiText(lang).merchantStandalonePages.checkout;
    const { customers, tickets, products } = await getCheckoutRouteBaseData();
    const rebuildSaleId = (sp.rebuildSaleId ?? "").trim();
    const rebuildDocumentId = (sp.rebuildDocumentId ?? "").trim();
    const scope = rebuildSaleId ? await resolveCompanySettingsScope() : null;
    const saleSnapshot = rebuildSaleId && scope ? await getSaleByIdWithinCompany(scope.companyId, rebuildSaleId) : null;
    const rebuildDocument = rebuildDocumentId && scope ? await getReceiptDocumentById(rebuildDocumentId, scope.companyId) : null;
    const rebuildIssuedTs = rebuildDocument ? Date.parse(rebuildDocument.issuedAt || rebuildDocument.createdAt) : 0;
    const rebuildCreatedTs = rebuildDocument ? Date.parse(rebuildDocument.createdAt) : 0;
    const rebuildUpdatedTs = rebuildDocument ? Date.parse(rebuildDocument.updatedAt) : 0;
    const initialSaleSnapshot: Sale | null = saleSnapshot
        ? saleSnapshot
        : rebuildDocument
          ? {
                id: rebuildDocument.checkoutId || rebuildDocument.orderId || rebuildDocument.id,
                item: rebuildDocument.items[0]?.name || rebuildDocument.documentNo || rebuildDocument.id,
                amount: Math.max(0, rebuildDocument.totalAmount),
                checkoutAt: Number.isFinite(rebuildIssuedTs) && rebuildIssuedTs > 0 ? rebuildIssuedTs : 0,
                paymentMethod: "cash",
                paymentStatus: "paid",
                source: "checkout",
                customerName: rebuildDocument.buyerName,
                lineItems: rebuildDocument.items.map((item) => ({
                    productId: item.productId || "",
                    productName: item.name,
                    qty: Math.max(1, item.qty || 1),
                    unitPrice: Math.max(0, item.unitPrice || item.totalAmount || 0),
                    subtotal: Math.max(0, item.totalAmount || item.amount || 0),
                })),
                createdAt: Number.isFinite(rebuildCreatedTs) && rebuildCreatedTs > 0 ? rebuildCreatedTs : 0,
                updatedAt: Number.isFinite(rebuildUpdatedTs) && rebuildUpdatedTs > 0 ? rebuildUpdatedTs : 0,
            }
          : null;

    return (
        <MerchantPageShell title={p.title} subtitle={p.subtitle} width="default">
            <CheckoutWorkspace
                customers={customers}
                tickets={tickets}
                products={products}
                usedProducts={[]}
                businessProfile={null}
                regionalReceiptSettings={null}
                activeActivities={[]}
                deferredActivitiesUrl="/dashboard/checkout/deferred-activities"
                deferredUsedProductsUrl="/dashboard/checkout/deferred-used-products"
                deferredReceiptSettingsUrl="/dashboard/checkout/deferred-receipt-settings"
                createCheckoutAction={createCheckoutSale}
                flash={(sp.flash ?? "").trim()}
                actionTs={(sp.ts ?? "").trim()}
                initialCustomerId={(sp.customerId ?? "").trim()}
                initialCaseId={(sp.caseId ?? "").trim()}
                initialUsedProductId={(sp.usedProductId ?? "").trim()}
                initialSaleSnapshot={initialSaleSnapshot}
            />
        </MerchantPageShell>
    );
}
