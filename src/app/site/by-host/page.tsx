import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TenantShowcasePage } from "@/features/showcase/components/TenantShowcasePage";
import { resolveTenantIdByHost } from "@/lib/services/homepage-url.service";

export default async function SiteByHostPage() {
    const headerStore = await headers();
    const host = headerStore.get("host");
    const tenantId = await resolveTenantIdByHost(host);

    if (!tenantId) {
        redirect("/");
    }

    return <TenantShowcasePage tenantId={tenantId} homeHref="/" />;
}
