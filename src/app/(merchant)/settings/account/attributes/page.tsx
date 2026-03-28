import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getUserCompanyId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import { getTicketAttributePreferences } from "@/lib/services/ticketAttributes";
import { TicketAttributesSettingsPanel } from "@/components/settings/TicketAttributesSettingsPanel";

export default async function TicketAttributesSettingsPage() {
    const cookieStore = await cookies();
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const ui = getUiText(lang);
    const session = await getSessionUser();
    if (!session) {
        redirect("/login?next=/settings/account/attributes");
    }

    const user = await getUserDoc(session.uid);
    if (toAccountType(user?.role ?? null) !== "company") {
        redirect("/settings/account");
    }

    const companyId = getUserCompanyId(user, session.uid);
    const preferences = await getTicketAttributePreferences({ tenantId: companyId });

    return (
        <MerchantPageShell title={ui.ticketAttributes.pageTitle} subtitle={ui.ticketAttributes.pageSubtitle} width="default">
            <TicketAttributesSettingsPanel initialPreferences={preferences} lang={lang} />
        </MerchantPageShell>
    );
}
