import { MerchantSectionCard } from "@/components/merchant/shell";
import { ThemeModeToggle, type ThemeModeToggleLabels } from "@/components/settings/ThemeModeToggle";

type SecuritySettingsPanelProps = {
    themeLabels: ThemeModeToggleLabels;
};

export function SecuritySettingsPanel({ themeLabels }: SecuritySettingsPanelProps) {
    return (
        <div className="grid max-w-2xl gap-4">
            <MerchantSectionCard>
                <ThemeModeToggle labels={themeLabels} />
            </MerchantSectionCard>
        </div>
    );
}
