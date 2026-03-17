import { redirect } from "next/navigation";

function normalizeTenantId(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/[/?#]/.test(trimmed)) return null;
    return trimmed;
}

export default async function LegacyTenantDashboardPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId: rawTenantId } = await params;
    const tenantId = normalizeTenantId(rawTenantId);
    if (!tenantId) {
        redirect("/");
    }

    redirect(`/${encodeURIComponent(tenantId)}/dashboard`);
}
