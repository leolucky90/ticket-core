import { Card } from "@/components/ui/card";
import { getUiText, type UiLanguage } from "@/lib/i18n/ui-text";

export function DashboardPanel({ lang = "zh" }: { lang?: UiLanguage }) {
    const ui = getUiText(lang).dashboardPanel;
    return (
        <Card>
            <div className="space-y-2">
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="text-sm text-[rgb(var(--muted))]">{ui.subtitle}</p>
            </div>
        </Card>
    );
}
