import type { StaffMember } from "@/lib/schema";
import { MerchantSectionCard } from "@/components/merchant/shell";
import { StaffGoogleBindingClient } from "@/components/account/StaffGoogleBindingClient";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { StatusBadge } from "@/components/ui/status-badge";
import type { UiLanguage } from "@/lib/i18n/ui-text";
import { getUiText } from "@/lib/i18n/ui-text";

type AccountSecurityPanelProps = {
    email: string;
    staff: StaffMember | null;
    lang: UiLanguage;
};

export function AccountSecurityPanel({ email, staff, lang }: AccountSecurityPanelProps) {
    const ui = getUiText(lang);
    const linked = Boolean(staff?.googleLinked);
    return (
        <div className="grid max-w-3xl gap-4">
            <MerchantSectionCard
                title={ui.accountSecurity.statusTitle}
                actions={<StatusBadge label={staff?.status ?? "unknown"} tone={staff?.status === "active" ? "success" : "warning"} />}
            >
                <div className="grid gap-1 text-sm text-[rgb(var(--muted))]">
                    <div>{ui.accountSecurity.primaryEmail}：{email}</div>
                    <div>{ui.accountSecurity.lastSignIn}：{staff?.lastLoginAt ?? "-"}</div>
                    <div>{ui.accountSecurity.googleBinding}：{linked ? ui.accountSecurity.linked : ui.accountSecurity.notLinked}</div>
                    <div>{ui.accountSecurity.requirePasswordChange}：{staff?.mustChangePassword ? ui.accountSecurity.yes : ui.accountSecurity.no}</div>
                </div>
            </MerchantSectionCard>

            <MerchantSectionCard title={ui.accountSecurity.googleBindingTitle}>
                {staff ? (
                    <StaffGoogleBindingClient
                        staffId={staff.id}
                        primaryEmail={staff.email}
                        linked={Boolean(staff.googleLinked)}
                        googleEmail={staff.googleEmail}
                        labels={{
                            statusPrefix: ui.googleBinding.statusPrefix,
                            linked: ui.accountSecurity.linked,
                            notLinked: ui.accountSecurity.notLinked,
                            bindAction: ui.googleBinding.bindAction,
                            bindLoading: ui.googleBinding.bindLoading,
                            unbindAction: ui.googleBinding.unbindAction,
                            unbindLoading: ui.googleBinding.unbindLoading,
                            linkSuccess: ui.googleBinding.linkSuccess,
                            unlinkSuccess: ui.googleBinding.unlinkSuccess,
                            requireEmailPassword: ui.googleBinding.requireEmailPassword,
                            emailMustMatch: ui.googleBinding.emailMustMatch,
                            emailMismatch: ui.googleBinding.emailMismatch,
                        }}
                    />
                ) : (
                    <div className="text-sm text-[rgb(var(--muted))]">{ui.accountSecurity.noStaffProfile}</div>
                )}
            </MerchantSectionCard>

            <ChangePasswordForm email={email} labels={ui.changePassword} />

            <MerchantSectionCard title={ui.accountSecurity.twoFactorTitle}>
                <div className="text-sm text-[rgb(var(--muted))]">{ui.accountSecurity.twoFactorHint}</div>
            </MerchantSectionCard>
        </div>
    );
}
