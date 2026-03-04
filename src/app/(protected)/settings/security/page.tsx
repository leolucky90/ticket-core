import { headers } from "next/headers";
import { cookies } from "next/headers";
import { getLocaleFromHeader, t } from "@/lib/i18n/authIndex";
import { SecuritySettingsPanel } from "@/components/settings/SecuritySettingsPanel";

export default async function SecurityPage() {
    const h = await headers();
    const c = await cookies();
    const langCookie = c.get("lang")?.value;
    const locale = langCookie === "en" ? "en" : getLocaleFromHeader(h.get("accept-language"));

    return (
        <SecuritySettingsPanel
            title={t(locale, "security")}
            linkGoogleTitle={t(locale, "linkGoogle")}
            linkedLabel={t(locale, "linked")}
            linkNowLabel={t(locale, "linkNow")}
        />
    );
}
