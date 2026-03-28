import { cookies } from "next/headers";
import { Shield, SlidersHorizontal } from "lucide-react";
import { redirect } from "next/navigation";
import { MerchantPageShell, MerchantSectionCard } from "@/components/merchant/shell";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { CompanyProfileSettingsForm } from "@/components/account/company-profile-settings-form";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";
import { getCompanyProfile, updateCompanyProfile } from "@/lib/services/company-profile.service";

type AccountInfoPageProps = {
    searchParams: Promise<{ flash?: string; ts?: string }>;
};

export default async function AccountInfoPage({ searchParams }: AccountInfoPageProps) {
    const session = await getSessionUser();
    if (!session) {
        redirect("/login?next=/settings/account");
    }

    const sp = await searchParams;
    const cookieStore = await cookies();
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const ui = getUiText(lang);
    const accountContext = await getCurrentSessionAccountContext();
    const accountType = accountContext?.accountType ?? "customer";
    const accountTypeText = accountType === "company" ? ui.accountInfo.companyAccount : ui.accountInfo.customerAccount;
    const companyProfile = accountType === "company" ? await getCompanyProfile() : null;
    const title = ui.accountInfo.pageTitle;
    const subtitle = ui.accountInfo.pageSubtitle;

    async function saveCompanyProfileAction(formData: FormData): Promise<void> {
        "use server";

        const updated = await updateCompanyProfile({
            companyName: String(formData.get("companyName") ?? ""),
            displayName: String(formData.get("displayName") ?? ""),
            contactName: String(formData.get("contactName") ?? ""),
            phone: String(formData.get("phone") ?? ""),
            email: String(formData.get("email") ?? ""),
            address: String(formData.get("address") ?? ""),
            country: String(formData.get("country") ?? ""),
            region: String(formData.get("region") ?? ""),
            postcode: String(formData.get("postcode") ?? ""),
            taxId: String(formData.get("taxId") ?? ""),
            abn: String(formData.get("abn") ?? ""),
            businessRegistrationNumber: String(formData.get("businessRegistrationNumber") ?? ""),
            invoiceNote: String(formData.get("invoiceNote") ?? ""),
            receiptNote: String(formData.get("receiptNote") ?? ""),
        });

        if (!updated) {
            redirect(`/settings/account?flash=${encodeURIComponent(ui.accountInfo.saveFailed)}&ts=${Date.now()}`);
        }

        redirect(`/settings/account?flash=${encodeURIComponent(ui.accountInfo.saved)}&ts=${Date.now()}`);
    }

    return (
        <MerchantPageShell title={title} subtitle={subtitle} width="index">
            <div className="grid max-w-5xl gap-4">
                {sp.flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{sp.flash}</div> : null}

                <MerchantSectionCard title={ui.accountInfo.summaryTitle} description={ui.accountInfo.summaryDescription}>
                    <div className="grid gap-3">
                        <div className="text-sm">
                            <span className="text-[rgb(var(--muted))]">{ui.accountInfo.accountType}：</span>
                            <span>{accountTypeText}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-[rgb(var(--muted))]">{ui.accountInfo.email}：</span>
                            <span>{session.email}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-[rgb(var(--muted))]">{ui.accountInfo.uid}：</span>
                            <span className="break-all">{session.uid}</span>
                        </div>
                    </div>
                </MerchantSectionCard>

                {accountType === "company" ? <CompanyProfileSettingsForm profile={companyProfile} saveAction={saveCompanyProfileAction} /> : null}

                {accountType === "company" ? (
                    <MerchantSectionCard title={ui.accountInfo.relatedSettingsTitle} description={ui.accountInfo.relatedSettingsDescription}>
                        <div className="flex flex-wrap items-center gap-2">
                            <IconTextActionButton
                                href="/settings/account/attributes"
                                icon={SlidersHorizontal}
                                label={ui.accountInfo.attributeSettingsAction}
                                tooltip={ui.accountInfo.attributeSettingsTooltip}
                            />
                            <IconTextActionButton
                                href="/account/security"
                                icon={Shield}
                                label={ui.accountInfo.accountSecurityAction}
                                tooltip={ui.accountInfo.accountSecurityTooltip}
                            />
                        </div>
                    </MerchantSectionCard>
                ) : null}

                <ChangePasswordForm email={session.email} labels={ui.changePassword} />
            </div>
        </MerchantPageShell>
    );
}
