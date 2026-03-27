import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { listTicketsByCustomerEmail } from "@/lib/services/ticket";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";
import { CustomerDashboardPanel } from "@/components/dashboard/CustomerDashboardPanel";

export default async function CustomerDashboardPage() {
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
    return <CustomerDashboardPanel tickets={tickets} />;
}
