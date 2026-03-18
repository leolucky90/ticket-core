import { headers } from "next/headers";
import { cookies } from "next/headers";
import { getLocaleFromHeader, t } from "@/lib/i18n/authIndex";
import { SecuritySettingsPanel } from "@/components/settings/SecuritySettingsPanel";

export default async function DashboardSettingsPage() {
    const h = await headers();
    const c = await cookies();
    const langCookie = c.get("lang")?.value;
    const locale = langCookie === "en" ? "en" : getLocaleFromHeader(h.get("accept-language"));

    return (
        <SecuritySettingsPanel
            title={t(locale, "dashboardSettings")}
            linkGoogleTitle={t(locale, "linkGoogle")}
            linkedLabel={t(locale, "linked")}
            linkNowLabel={t(locale, "linkNow")}
            themeLabels={{
                sectionTitle: t(locale, "themeStyle"),
                modeLight: t(locale, "themeModeLight"),
                modeDark: t(locale, "themeModeDark"),
                modeCustom: t(locale, "themeModeCustom"),
                scopeHint: t(locale, "themeScopeHint"),
                groupBaseTitle: t(locale, "themeGroupBase"),
                groupBaseHint: t(locale, "themeGroupBaseHint"),
                groupAccentTitle: t(locale, "themeGroupAccent"),
                groupAccentHint: t(locale, "themeGroupAccentHint"),
                roleBg: t(locale, "themeRoleBg"),
                rolePanel: t(locale, "themeRolePanel"),
                rolePanel2: t(locale, "themeRolePanel2"),
                roleNav: t(locale, "themeRoleNav"),
                roleText: t(locale, "themeRoleText"),
                roleAccent: t(locale, "themeRoleAccent"),
                roleBorder: t(locale, "themeRoleBorder"),
                resetPalette: t(locale, "themeResetPalette"),
                customColor: t(locale, "themeCustomColor"),
            }}
        />
    );
}
