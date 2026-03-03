// src/lib/i18n/locales.ts

export const LOCALES = ["en", "zh-Hant"] as const; // 支援的語系列表（用 const 讓 TS 產生字面量型別）
export type Locale = (typeof LOCALES)[number]; // Locale 型別 = "en" | "zh-Hant"

export const DEFAULT_LOCALE: Locale = "zh-Hant"; // 預設語系（你可改成 "en"）