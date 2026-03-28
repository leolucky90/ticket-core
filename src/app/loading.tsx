"use client";

import { useUiLanguage } from "@/components/layout/ui-language-provider";
import { ProcessingState } from "@/components/ui/processing-state";
import { getUiText } from "@/lib/i18n/ui-text";

export default function AppLoading() {
    const lang = useUiLanguage();
    const ui = getUiText(lang);

    return (
        <div className="flex min-h-[50vh] items-center justify-center px-6 py-16">
            <ProcessingState
                title={ui.processing.pageLoadingTitle}
                description={ui.processing.appLoadingDescription}
                className="max-w-sm"
            />
        </div>
    );
}
