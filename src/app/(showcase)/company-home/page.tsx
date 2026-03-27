import { ShowHomePage } from "@/features/showcase/components/ShowHomePage";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";
import { getShowcasePreferences } from "@/features/showcase/services/showcasePreferences.server";
import { DEFAULT_SHOW_THEME_COLORS, DEFAULT_STOREFRONT_SETTINGS } from "@/features/showcase/services/showThemePreferences";
import { DEFAULT_SHOW_CONTENT_STATE } from "@/features/showcase/services/showContentPreferences";

export default async function CompanyHomePage() {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";
    const sessionUser = await getSessionUser();

    if (!sessionUser) redirect("/login?next=/company-home");

    const accountContext = await getCurrentSessionAccountContext();
    const tenantId = accountContext?.tenantId ?? null;
    if (accountContext?.accountType !== "company") {
        if (tenantId) redirect(`/${encodeURIComponent(tenantId)}/dashboard`);
        redirect("/customer-dashboard");
    }

    const preferences = await getShowcasePreferences({ tenantId }).catch(() => ({
        themeColors: DEFAULT_SHOW_THEME_COLORS,
        storefront: DEFAULT_STOREFRONT_SETTINGS,
        content: DEFAULT_SHOW_CONTENT_STATE,
        updatedAt: 0,
        updatedBy: "",
    }));

    return (
        <ShowHomePage
            navAccountType="company"
            lang={lang}
            showThemeColors={preferences.themeColors}
            storefrontSettings={preferences.storefront}
            showContentState={preferences.content}
            homeHref="/company-home"
            authTenantId={tenantId}
        />
    );
}
