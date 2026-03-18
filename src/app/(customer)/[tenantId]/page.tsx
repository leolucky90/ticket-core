import { notFound } from "next/navigation";
import { TenantShowcasePage } from "@/features/showcase/components/TenantShowcasePage";

function normalizeTenantId(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/[/?#]/.test(trimmed)) return null;
    return trimmed;
}

export default async function TenantEntryPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId: rawTenantId } = await params;
    const tenantId = normalizeTenantId(rawTenantId);
    if (!tenantId) notFound();

    return <TenantShowcasePage tenantId={tenantId} homeHref={`/${encodeURIComponent(tenantId)}`} />;
}
