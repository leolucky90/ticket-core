import type { UiLanguage } from "@/lib/i18n/ui-text";
import { uiLocale } from "@/lib/i18n/ui-text";

/**
 * Formats ISO-8601 timestamps for UI (locale-aware, easier to read than raw `...Z`).
 */
export function formatIsoForDisplay(raw: string | undefined, lang: UiLanguage): string {
    if (!raw?.trim()) return "-";
    const ms = Date.parse(raw);
    if (!Number.isFinite(ms)) return raw.trim();
    const date = new Date(ms);
    return date.toLocaleString(uiLocale(lang), {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
}
