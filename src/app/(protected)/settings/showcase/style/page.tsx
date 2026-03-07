import { headers } from "next/headers";
import { cookies } from "next/headers";
import { ShowStyleSettingsPanel } from "@/features/showcase/components/ShowStyleSettingsPanel";
import { getLocaleFromHeader, t } from "@/lib/i18n/authIndex";
import { getShowcasePreferences } from "@/features/showcase/services/showcasePreferences.server";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcaseTenantId, getUserDoc } from "@/lib/services/user.service";

export default async function ShowcaseStylePage() {
    const h = await headers();
    const c = await cookies();
    const langCookie = c.get("lang")?.value;
    const locale = langCookie === "en" ? "en" : getLocaleFromHeader(h.get("accept-language"));
    const session = await getSessionUser();
    const userDoc = session ? await getUserDoc(session.uid) : null;
    const tenantId = getShowcaseTenantId(userDoc, session?.uid);
    const preferences = await getShowcasePreferences({ tenantId });

    return (
        <ShowStyleSettingsPanel
            initialColors={preferences.themeColors}
            labels={{
                title: t(locale, "showcaseStyleTitle"),
                hint: t(locale, "showcaseStyleHint"),
                reset: t(locale, "showcaseResetPalette"),
                save: locale === "en" ? "Save to Firebase" : "儲存到 Firebase",
                saving: locale === "en" ? "Saving..." : "儲存中...",
                saved: locale === "en" ? "Saved" : "已儲存",
                saveFailed: locale === "en" ? "Save failed" : "儲存失敗",
                customColor: t(locale, "themeCustomColor"),
                rolePage: t(locale, "showcaseRolePage"),
                roleHeader: t(locale, "showcaseRoleHeader"),
                roleHero: t(locale, "showcaseRoleHero"),
                roleAbout: t(locale, "showcaseRoleAbout"),
                roleServices: t(locale, "showcaseRoleServices"),
                roleContact: t(locale, "showcaseRoleContact"),
                roleAd: t(locale, "showcaseRoleAd"),
                roleFooter: t(locale, "showcaseRoleFooter"),
            }}
        />
    );
}
