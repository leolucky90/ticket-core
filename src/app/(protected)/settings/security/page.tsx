import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { headers } from "next/headers";
import { getLocaleFromHeader, t } from "@/lib/i18n";
import { LinkGoogleClient } from "@/components/auth/LinkGoogleClient";

export default async function SecurityPage() {
    const h = await headers();
    const locale = getLocaleFromHeader(h.get("accept-language"));

    return (
        <PageShell>
            <Card>
                <div className="auth-stack">
                    <div className="auth-title">{t(locale, "security")}</div>
                    <div className="ui-muted">{t(locale, "linkGoogle")}</div>
                    <LinkGoogleClient
                        linkedLabel={t(locale, "linked")}
                        linkNowLabel={t(locale, "linkNow")}
                    />
                    <a className="ui-link" href="/dashboard">
                        ← {t(locale, "dashboard")}
                    </a>
                </div>
            </Card>
        </PageShell>
    );
}