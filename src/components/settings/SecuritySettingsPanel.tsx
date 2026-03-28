import { MerchantSectionCard } from "@/components/merchant/shell";
import { LinkGoogleClient } from "@/components/auth/LinkGoogleClient";
import { ThemeModeToggle, type ThemeModeToggleLabels } from "@/components/settings/ThemeModeToggle";

type SecuritySettingsPanelProps = {
    linkGoogleTitle: string;
    linkedLabel: string;
    linkNowLabel: string;
    themeLabels: ThemeModeToggleLabels;
};

export function SecuritySettingsPanel({
    linkGoogleTitle,
    linkedLabel,
    linkNowLabel,
    themeLabels,
}: SecuritySettingsPanelProps) {
    return (
        <div className="grid max-w-2xl gap-4">
            <MerchantSectionCard title={linkGoogleTitle}>
                <div className="auth-stack">
                    <LinkGoogleClient linkedLabel={linkedLabel} linkNowLabel={linkNowLabel} />
                </div>
            </MerchantSectionCard>
            <MerchantSectionCard>
                <ThemeModeToggle labels={themeLabels} />
            </MerchantSectionCard>
        </div>
    );
}
