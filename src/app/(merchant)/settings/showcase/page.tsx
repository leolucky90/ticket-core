import { cookies } from "next/headers";
import { MerchantPageShell } from "@/components/merchant/shell";
import { ShowcaseBuilder } from "@/features/showcase/components/ShowcaseBuilder";
import { getShowcasePreferences } from "@/features/showcase/services/showcasePreferences.server";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";

export default async function ShowcaseBuilderPage() {
    const c = await cookies();
    const langCookie = c.get("lang")?.value;
    const uiLang = getUiLanguage(langCookie);
    const shellSubtitle = getUiText(uiLang).merchantStandalonePages.showcaseBuilderShellSubtitle;
    const accountContext = await getCurrentSessionAccountContext();
    const tenantId = accountContext?.tenantId ?? null;
    const preferences = await getShowcasePreferences({ tenantId });
    const labels = getUiText(uiLang).showcaseBuilderPage;

    const intro = getUiText(uiLang).showcaseBuilderIntro;
    const showcaseLabels = {
        ...labels,
        introBadge: intro.badge,
        introTitle: intro.title,
        introBody: intro.body,
    };

    return (
        <MerchantPageShell
            title={labels.title}
            subtitle={shellSubtitle}
            width="builder"
        >
            <ShowcaseBuilder
                labels={showcaseLabels}
                initialContent={preferences.content}
                initialThemeColors={preferences.themeColors}
                initialStorefront={preferences.storefront}
                tenantId={tenantId}
                hasSavedPreferences={preferences.updatedAt > 0}
            />
        </MerchantPageShell>
    );
}
