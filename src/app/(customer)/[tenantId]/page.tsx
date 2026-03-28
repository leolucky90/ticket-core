import { notFound } from "next/navigation";
import { TenantShowcasePage } from "@/features/showcase/components/TenantShowcasePage";
import { normalizeTenantId } from "@/lib/tenant-scope";

export default async function TenantEntryPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId: rawTenantId } = await params;
    const tenantId = normalizeTenantId(rawTenantId);
    if (!tenantId) notFound();

    return <TenantShowcasePage tenantId={tenantId} homeHref={`/${encodeURIComponent(tenantId)}`} />;
}
