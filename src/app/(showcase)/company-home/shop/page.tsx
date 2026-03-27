import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TenantShopPage } from "@/features/showcase/components/TenantShopPage";
import { getShowcasePreferences } from "@/features/showcase/services/showcasePreferences.server";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";
import { listPublicProductsByTenant } from "@/lib/services/commerce";

export default async function CompanyHomeShopPage() {
    const sessionUser = await getSessionUser();
    if (!sessionUser) redirect("/login?next=/company-home/shop");

    const accountContext = await getCurrentSessionAccountContext();
    const fallbackTenantId = accountContext?.tenantId ?? null;
    if (accountContext?.accountType !== "company") {
        if (fallbackTenantId) redirect(`/${encodeURIComponent(fallbackTenantId)}/dashboard`);
        redirect("/customer-dashboard");
    }

    const tenantId = fallbackTenantId;
    if (!tenantId) redirect("/company-home");

    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";

    const [preferences, products] = await Promise.all([
        getShowcasePreferences({ tenantId }),
        listPublicProductsByTenant(tenantId),
    ]);

    return (
        <TenantShopPage
            tenantId={tenantId}
            lang={lang}
            products={products}
            showThemeColors={preferences.themeColors}
            storefrontSettings={preferences.storefront}
            navAccountType="company"
        />
    );
}
