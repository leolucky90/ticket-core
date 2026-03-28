"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { UiLanguage } from "@/lib/i18n/ui-text";

const UiLanguageContext = createContext<UiLanguage>("zh");

export function UiLanguageProvider({ lang, children }: { lang: UiLanguage; children: ReactNode }) {
    return <UiLanguageContext.Provider value={lang}>{children}</UiLanguageContext.Provider>;
}

export function useUiLanguage() {
    return useContext(UiLanguageContext);
}
