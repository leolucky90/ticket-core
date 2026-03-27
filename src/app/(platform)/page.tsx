import { BusinessLandingPage } from "@/features/business/components/BusinessLandingPage";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";
import { getBusinessHomepageContentPreferences } from "@/features/business/services/businessHomepageContent.server";

export default async function HomePage() {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";
    const sessionUser = await getSessionUser();
    const homepagePreferences = await getBusinessHomepageContentPreferences();

    let dashboardHref = "/dashboard";
    if (sessionUser) {
        const accountContext = await getCurrentSessionAccountContext();
        if (accountContext?.accountType === "customer") {
            dashboardHref = accountContext.tenantId ? `/${encodeURIComponent(accountContext.tenantId)}/dashboard` : "/customer-dashboard";
        }
    }

    return (
        <BusinessLandingPage
            lang={lang}
            isAuthenticated={Boolean(sessionUser)}
            dashboardHref={dashboardHref}
            homepageContent={homepagePreferences.content}
        />
    );
}
