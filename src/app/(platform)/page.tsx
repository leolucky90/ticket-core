import { BusinessLandingPage } from "@/features/business/components/BusinessLandingPage";
import { cookies, headers } from "next/headers";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";
import { getBusinessHomepageContentPreferences } from "@/features/business/services/businessHomepageContent.server";
import { getPublicReleaseNotes } from "@/features/business/services/publicReleaseNotes.server";

function resolveRequestOrigin(host: string | null, forwardedProto: string | null): string {
    const normalizedHost = host?.trim();
    if (!normalizedHost) return "http://localhost:3000";

    const normalizedProto = forwardedProto?.split(",")[0]?.trim().toLowerCase();
    const protocol =
        normalizedProto === "http" || normalizedProto === "https"
            ? normalizedProto
            : normalizedHost.startsWith("localhost") || normalizedHost.startsWith("127.0.0.1")
              ? "http"
              : "https";

    return `${protocol}://${normalizedHost}`;
}

export default async function HomePage() {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";
    const sessionUser = await getSessionUser();
    const [homepagePreferences, releaseNotes] = await Promise.all([
        getBusinessHomepageContentPreferences(),
        getPublicReleaseNotes(),
    ]);
    const requestOrigin = resolveRequestOrigin(
        headerStore.get("x-forwarded-host") ?? headerStore.get("host"),
        headerStore.get("x-forwarded-proto"),
    );

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
            demoEntryValue={requestOrigin}
            releaseNotes={releaseNotes}
        />
    );
}
