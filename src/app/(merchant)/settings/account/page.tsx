import { Shield, SlidersHorizontal } from "lucide-react";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { Section } from "@/components/ui/section";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { CompanyProfileSettingsForm } from "@/components/account/company-profile-settings-form";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
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
    const accountContext = await getCurrentSessionAccountContext();
    const accountType = accountContext?.accountType ?? "customer";
    const accountTypeText = accountType === "company" ? "公司帳號" : "客戶帳號";
    const companyProfile = accountType === "company" ? await getCompanyProfile() : null;

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
            redirect(`/settings/account?flash=${encodeURIComponent("公司資料更新失敗")}&ts=${Date.now()}`);
        }

        redirect(`/settings/account?flash=${encodeURIComponent("公司資料已更新")}&ts=${Date.now()}`);
    }

    return (
        <Section title="帳戶資訊">
            <div className="grid max-w-5xl gap-4">
                {sp.flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{sp.flash}</div> : null}

                <Card>
                    <div className="grid gap-3">
                        <div className="text-sm">
                            <span className="text-[rgb(var(--muted))]">帳號類型：</span>
                            <span>{accountTypeText}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-[rgb(var(--muted))]">Email：</span>
                            <span>{session.email}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-[rgb(var(--muted))]">UID：</span>
                            <span className="break-all">{session.uid}</span>
                        </div>
                    </div>
                </Card>

                {accountType === "company" ? <CompanyProfileSettingsForm profile={companyProfile} saveAction={saveCompanyProfileAction} /> : null}

                {accountType === "company" ? (
                    <Card>
                        <div className="flex flex-wrap items-center gap-2">
                            <IconTextActionButton
                                href="/settings/account/attributes"
                                icon={SlidersHorizontal}
                                label="屬性設置"
                                tooltip="前往屬性設置"
                            />
                            <IconTextActionButton href="/account/security" icon={Shield} label="帳號安全" tooltip="前往帳號安全中心" />
                        </div>
                    </Card>
                ) : null}

                <Card>
                    <ChangePasswordForm email={session.email} />
                </Card>
            </div>
        </Section>
    );
}
