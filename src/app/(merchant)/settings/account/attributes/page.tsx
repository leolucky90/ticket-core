import { redirect } from "next/navigation";
import { Section } from "@/components/ui/section";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getUserCompanyId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import { getTicketAttributePreferences } from "@/lib/services/ticketAttributes";
import { TicketAttributesSettingsPanel } from "@/components/settings/TicketAttributesSettingsPanel";

export default async function TicketAttributesSettingsPage() {
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
        <Section title="屬性設置">
            <TicketAttributesSettingsPanel initialPreferences={preferences} />
        </Section>
    );
}
