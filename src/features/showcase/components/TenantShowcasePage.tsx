import { ShowHomePage } from "@/features/showcase/components/ShowHomePage";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import { getShowcasePreferences } from "@/features/showcase/services/showcasePreferences.server";

export async function TenantShowcasePage({ tenantId, homeHref }: { tenantId: string; homeHref?: string }) {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";

    const preferences = await getShowcasePreferences({ tenantId });
    let navAccountType: "guest" | "company" | "customer" = "guest";

    const sessionUser = await getSessionUser();
    if (sessionUser) {
        const userDoc = await getUserDoc(sessionUser.uid);
        const sessionTenantId = getShowcaseTenantId(userDoc, sessionUser.uid);
        if (sessionTenantId === tenantId) {
            navAccountType = toAccountType(userDoc?.role ?? null);
        }
    }

    if (
        navAccountType === "customer" &&
        preferences.storefront.shoppingEnabled &&
        preferences.storefront.autoRedirectToShopForCustomer
    ) {
        redirect(`/${encodeURIComponent(tenantId)}/shop`);
    }

    return (
        <ShowHomePage
            navAccountType={navAccountType}
            lang={lang}
            showThemeColors={preferences.themeColors}
            storefrontSettings={preferences.storefront}
            showContentState={preferences.content}
            homeHref={homeHref ?? `/${encodeURIComponent(tenantId)}`}
            authTenantId={tenantId}
        />
    );
}
