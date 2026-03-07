import { Card } from "@/components/ui/card";
import { LinkGoogleClient } from "@/components/auth/LinkGoogleClient";
import { ThemeModeToggle, type ThemeModeToggleLabels } from "@/components/settings/ThemeModeToggle";

type SecuritySettingsPanelProps = {
    title: string;
    linkGoogleTitle: string;
    linkedLabel: string;
    linkNowLabel: string;
    themeLabels: ThemeModeToggleLabels;
};

export function SecuritySettingsPanel({
    title,
    linkGoogleTitle,
    linkedLabel,
    linkNowLabel,
    themeLabels,
}: SecuritySettingsPanelProps) {
    return (
        <div className="grid max-w-2xl gap-4">
            <Card>
                <div className="auth-stack">
                    <div className="auth-title">{title}</div>
                    <div className="ui-muted">{linkGoogleTitle}</div>
                    <LinkGoogleClient linkedLabel={linkedLabel} linkNowLabel={linkNowLabel} />
                </div>
            </Card>
            <Card>
                <ThemeModeToggle labels={themeLabels} />
            </Card>
        </div>
    );
}
