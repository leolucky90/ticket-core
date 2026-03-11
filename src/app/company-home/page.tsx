import { ShowHomePage } from "@/features/showcase/components/ShowHomePage";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import { getShowcasePreferences } from "@/features/showcase/services/showcasePreferences.server";

export default async function CompanyHomePage() {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";
    const sessionUser = await getSessionUser();

    if (!sessionUser) redirect("/login?next=/company-home");

    const userDoc = await getUserDoc(sessionUser.uid);
    const navAccountType = toAccountType(userDoc?.role ?? null);
    if (navAccountType !== "company") redirect("/ticket/history");

    const tenantId = getShowcaseTenantId(userDoc, sessionUser.uid);
    const preferences = await getShowcasePreferences({ tenantId });

    return (
        <ShowHomePage
            navAccountType="company"
            lang={lang}
            showThemeColors={preferences.themeColors}
            showContentState={preferences.content}
            homeHref="/company-home"
        />
    );
}
