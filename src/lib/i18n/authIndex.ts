import type { DictKey, Locale } from "./authDict";
import { dict } from "./authDict";

export function getLocaleFromHeader(value: string | null): Locale {
    const v = (value ?? "").toLowerCase();
    if (v.includes("zh")) return "zh-TW";
    return "en";
}

export function t(locale: Locale, key: DictKey): string {
    return dict[locale][key] ?? dict.en[key];
}