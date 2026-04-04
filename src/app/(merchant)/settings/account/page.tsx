import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { AccountSummaryCard } from "@/components/account/AccountSummaryCard";
import { BusinessProfileForm } from "@/components/account/BusinessProfileForm";
import { RegionalReceiptSettingsCard } from "@/components/account/RegionalReceiptSettingsCard";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getAccountSettingsPageData } from "@/lib/services/merchant/account-settings-read-model.service";
import {
    updateBusinessProfileFromFormData,
    updateRegionalReceiptSettingsFromFormData,
} from "@/lib/services/merchant/account-settings-write.service";

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
    const pageData = await getAccountSettingsPageData();
    if (!pageData) {
        redirect("/login?next=/settings/account");
    }

    const accountType = pageData.accountSummary.accountType;
    const title = ui.accountInfo.pageTitle;
    const subtitle = ui.accountInfo.pageSubtitle;

    async function saveBusinessProfileAction(formData: FormData): Promise<void> {
        "use server";

        const updated = await updateBusinessProfileFromFormData(formData);

        if (!updated) {
            redirect(`/settings/account?flash=${encodeURIComponent(ui.accountInfo.businessSaveFailed)}&ts=${Date.now()}`);
        }

        redirect(`/settings/account?flash=${encodeURIComponent(ui.accountInfo.businessSaved)}&ts=${Date.now()}`);
    }

    async function saveRegionalReceiptSettingsAction(formData: FormData): Promise<void> {
        "use server";

        const updated = await updateRegionalReceiptSettingsFromFormData(formData);

        if (!updated) {
            redirect(`/settings/account?flash=${encodeURIComponent(ui.accountInfo.receiptSettingsSaveFailed)}&ts=${Date.now()}`);
        }

        redirect(`/settings/account?flash=${encodeURIComponent(ui.accountInfo.receiptSettingsSaved)}&ts=${Date.now()}`);
    }

    return (
        <MerchantPageShell title={title} subtitle={subtitle} width="index">
            <div className="grid max-w-5xl gap-4">
                {sp.flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{sp.flash}</div> : null}

                <AccountSummaryCard summary={pageData.accountSummary} lang={lang} />

                {accountType === "company" && pageData.businessProfile ? (
                    <BusinessProfileForm profile={pageData.businessProfile} saveAction={saveBusinessProfileAction} />
                ) : null}

                {accountType === "company" && pageData.regionalReceiptSettings ? (
                    <RegionalReceiptSettingsCard
                        businessProfile={pageData.businessProfile}
                        settings={pageData.regionalReceiptSettings}
                        saveAction={saveRegionalReceiptSettingsAction}
                    />
                ) : null}

                <ChangePasswordForm email={session.email} labels={ui.changePassword} />
            </div>
        </MerchantPageShell>
    );
}
