import { ShowHomePage } from "@/features/showcase/components/ShowHomePage";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import { getShowcasePreferences } from "@/features/showcase/services/showcasePreferences.server";

export default async function HomePage() {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
        const preferences = await getShowcasePreferences({ tenantId: null });
        return (
            <ShowHomePage
                navAccountType="guest"
                lang={lang}
                showThemeColors={preferences.themeColors}
                showContentState={preferences.content}
            />
        );
    }

    const userDoc = await getUserDoc(sessionUser.uid);
    const navAccountType = toAccountType(userDoc?.role ?? null);
    const tenantId = getShowcaseTenantId(userDoc, sessionUser.uid);
    const preferences = await getShowcasePreferences({ tenantId });

    return (
        <ShowHomePage
            navAccountType={navAccountType}
            lang={lang}
            showThemeColors={preferences.themeColors}
            showContentState={preferences.content}
        />
    );
}
