import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthClientBlock } from "@/components/auth/AuthClientBlock";
import { AuthPageShell } from "@/components/auth/ui/AuthPageShell";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";

export default async function CompanyRegisterPage() {
    const lang = getUiLanguage((await cookies()).get("lang")?.value);
    const ui = getUiText(lang).authPages;
    const session = await getSessionUser();
    if (session) {
        const accountContext = await getCurrentSessionAccountContext();
        if (accountContext?.accountType === "company") {
            redirect("/dashboard");
        }
        const tenantId = accountContext?.tenantId ?? null;
        if (tenantId) {
            redirect(`/${encodeURIComponent(tenantId)}/dashboard`);
        }
        redirect("/customer-dashboard");
    }

    return (
        <div className="min-h-dvh bg-[#191815] text-[#f5f1df]">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 md:px-6">
                <Link
                    href="/login"
                    className="rounded-full border border-[#ffcb2d] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#ffcb2d] hover:bg-[#ffcb2d] hover:text-[#191815]"
                >
                    {ui.backLogin}
                </Link>
            </div>
            <AuthPageShell>
                <AuthShell title={ui.companyRegisterShellTitle}>
                    <AuthClientBlock
                        labels={ui.companyRegisterLabels}
                        googleLabel={ui.googleSignIn}
                        modeOverride="signUp"
                        signUpAccountType="company"
                    />
                    <div className="pt-2 text-center text-xs text-[rgb(var(--muted))]">
                        <Link className="text-[rgb(var(--accent))] hover:underline" href="/login">
                            {ui.returnLoginPage}
                        </Link>
                        <span className="px-1">·</span>
                        <Link className="text-[rgb(var(--accent))] hover:underline" href="/forgot-password">
                            {ui.forgotPasswordLink}
                        </Link>
                    </div>
                </AuthShell>
            </AuthPageShell>
        </div>
    );
}
