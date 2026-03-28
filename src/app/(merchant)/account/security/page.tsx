import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { AccountSecurityPanel } from "@/components/account/AccountSecurityPanel";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getCurrentStaffProfile } from "@/lib/services/staff.service";

export default async function AccountSecurityPage() {
    const cookieStore = await cookies();
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const ui = getUiText(lang);
    const session = await getSessionUser();
    if (!session) {
        redirect("/login?next=/account/security");
    }
    const staff = await getCurrentStaffProfile();

    return (
        <MerchantPageShell title={ui.accountSecurity.pageTitle} subtitle={ui.accountSecurity.pageSubtitle} width="default">
            {staff?.mustChangePassword ? (
                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">
                    {ui.accountSecurity.mustResetPassword}
                </div>
            ) : null}
            <AccountSecurityPanel email={session.email} staff={staff} lang={lang} />
        </MerchantPageShell>
    );
}
