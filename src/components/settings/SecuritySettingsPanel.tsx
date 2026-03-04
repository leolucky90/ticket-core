import { Card } from "@/components/ui/card";
import { LinkGoogleClient } from "@/components/auth/LinkGoogleClient";
import { ThemeModeToggle } from "@/components/settings/ThemeModeToggle";

type SecuritySettingsPanelProps = {
    title: string;
    linkGoogleTitle: string;
    linkedLabel: string;
    linkNowLabel: string;
};

export function SecuritySettingsPanel({
    title,
    linkGoogleTitle,
    linkedLabel,
    linkNowLabel,
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
                <ThemeModeToggle />
            </Card>
        </div>
    );
}
