import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcasePreferences } from "@/features/showcase/services/showcasePreferences.server";
import { listTicketsByCustomerEmail } from "@/lib/services/ticket";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";
import { CustomerDashboardPanel } from "@/components/dashboard/CustomerDashboardPanel";
import { ProtectedShell } from "@/components/layout/ProtectedShell";

function normalizeTenantId(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/[/?#]/.test(trimmed)) return null;
    return trimmed;
}

export default async function TenantCustomerDashboardPage({ params }: { params: Promise<{ tenantId: string }> }) {
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
        <ProtectedShell>
            <CustomerDashboardPanel tickets={tickets} />
        </ProtectedShell>
    );
}
