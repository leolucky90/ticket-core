import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { cookies } from "next/headers";
import { listTicketsByCustomerEmail } from "@/lib/services/ticket";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";
import { CustomerDashboardPanel } from "@/components/dashboard/CustomerDashboardPanel";
import { MerchantPageShell } from "@/components/merchant/shell";
import { getCustomerDashboardPageCopy } from "@/components/merchant/shell/merchant-shell-presets";

export default async function CustomerDashboardPage() {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";
    const copy = getCustomerDashboardPageCopy(lang);
    const session = await getSessionUser();
    if (!session) {
        redirect("/login?next=/customer-dashboard");
    }

    const accountContext = await getCurrentSessionAccountContext();
    if (accountContext?.accountType === "company") {
        redirect("/dashboard");
    }

    const tenantId = accountContext?.tenantId ?? null;
    if (tenantId) {
        redirect(`/${encodeURIComponent(tenantId)}/dashboard`);
    }

    const tickets = await listTicketsByCustomerEmail(session.email, tenantId);
    return (
        <MerchantPageShell title={copy.dashboardTitle} subtitle={copy.dashboardSubtitle} width="overview">
            <CustomerDashboardPanel tickets={tickets} />
        </MerchantPageShell>
    );
}
