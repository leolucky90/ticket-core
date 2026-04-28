import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getUserCompanyId, getUserDoc, toAccountType } from "@/lib/services/user.service";

export default async function TicketAttributesSettingsPage() {
    await cookies();
    const session = await getSessionUser();
    if (!session) {
        redirect("/login?next=/dashboard/marketing/attributes");
    }

    const user = await getUserDoc(session.uid);
    if (toAccountType(user?.role ?? null) !== "company") {
        redirect("/settings/account");
    }

    const companyId = getUserCompanyId(user, session.uid);
    if (!companyId) redirect("/settings/account");
    redirect("/dashboard/marketing/attributes");
}
