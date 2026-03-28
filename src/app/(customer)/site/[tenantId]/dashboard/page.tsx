import { redirect } from "next/navigation";
import { normalizeTenantId } from "@/lib/tenant-scope";

export default async function LegacyTenantDashboardPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId: rawTenantId } = await params;
    const tenantId = normalizeTenantId(rawTenantId);
    if (!tenantId) {
        redirect("/");
    }

    redirect(`/${encodeURIComponent(tenantId)}/dashboard`);
}
