import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { cookies } from "next/headers";
import { getShowcasePreferences } from "@/features/showcase/services/showcasePreferences.server";
import { listTicketsByCustomerEmail } from "@/lib/services/ticket";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";
import { CustomerDashboardPanel } from "@/components/dashboard/CustomerDashboardPanel";
import { MerchantPageShell } from "@/components/merchant/shell";
import { getCustomerDashboardPageCopy } from "@/components/merchant/shell/merchant-shell-presets";
import { normalizeTenantId } from "@/lib/tenant-scope";

export default async function TenantCustomerDashboardPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";
    const copy = getCustomerDashboardPageCopy(lang);
    const { tenantId: rawTenantId } = await params;
    const tenantId = normalizeTenantId(rawTenantId);
    if (!tenantId) notFound();

    const session = await getSessionUser();
    if (!session) {
        redirect(`/login?next=/${encodeURIComponent(tenantId)}/dashboard&tenant=${encodeURIComponent(tenantId)}`);
    }

    const accountContext = await getCurrentSessionAccountContext();
    const sessionTenantId = accountContext?.tenantId ?? null;

    if (accountContext?.accountType === "company") {
        if (sessionTenantId === tenantId) {
            redirect("/dashboard");
        }
        redirect("/customer-dashboard");
    }

    if (!sessionTenantId || sessionTenantId !== tenantId) {
        redirect("/customer-dashboard");
    }

    const preferences = await getShowcasePreferences({ tenantId });
    if (preferences.storefront.shoppingEnabled && preferences.storefront.autoRedirectToShopForCustomer) {
        redirect(`/${encodeURIComponent(tenantId)}/shop`);
    }

    const tickets = await listTicketsByCustomerEmail(session.email, tenantId);
    return (
        <MerchantPageShell title={copy.dashboardTitle} subtitle={copy.dashboardSubtitle} width="overview">
            <CustomerDashboardPanel tickets={tickets} />
        </MerchantPageShell>
    );
}
