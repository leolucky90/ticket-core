import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { TenantShopPage } from "@/features/showcase/components/TenantShopPage";
import { getShowcasePreferences } from "@/features/showcase/services/showcasePreferences.server";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { listPublicProductsByTenant } from "@/lib/services/merchant/inventory-read-model.service";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";
import { normalizeTenantId } from "@/lib/tenant-scope";

export default async function TenantShopRoutePage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId: rawTenantId } = await params;
    const tenantId = normalizeTenantId(rawTenantId);
    if (!tenantId) notFound();

    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";

    const [preferences, products] = await Promise.all([
        getShowcasePreferences({ tenantId }),
        listPublicProductsByTenant(tenantId),
    ]);

    let navAccountType: "guest" | "company" | "customer" = "guest";
    const sessionUser = await getSessionUser();
    if (sessionUser) {
        const accountContext = await getCurrentSessionAccountContext();
        if (accountContext?.tenantId === tenantId) {
            navAccountType = accountContext.accountType;
        }
    }

    return (
        <TenantShopPage
            tenantId={tenantId}
            lang={lang}
            products={products}
            showThemeColors={preferences.themeColors}
            storefrontSettings={preferences.storefront}
            navAccountType={navAccountType}
        />
    );
}
