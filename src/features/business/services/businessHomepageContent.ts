export type BusinessHomepageLocale = "zh" | "en";
export type BusinessHomepageThemePreset = "forest" | "ocean" | "sunset" | "slate";

export type BusinessHomepageEditableContent = {
    kicker: string;
    title: string;
    desc: string;
    ctaPrimary: string;
    ctaSecondary: string;
    finalTitle: string;
    finalDesc: string;
    finalCta: string;
};

export type BusinessHomepageContentState = {
    theme: {
        preset: BusinessHomepageThemePreset;
    };
    locale: Record<BusinessHomepageLocale, BusinessHomepageEditableContent>;
};

const THEME_PRESETS: BusinessHomepageThemePreset[] = ["forest", "ocean", "sunset", "slate"];

export const DEFAULT_BUSINESS_HOMEPAGE_CONTENT_STATE: BusinessHomepageContentState = {
    theme: {
        preset: "forest",
    },
    locale: {
        zh: {
            kicker: "Builder-crafted commerce operating system",
            title: "Ticket Core Commerce / SaaS + AI：我親手打造的商家營運系統",
            desc: "整合維修案件、商品與二手品、收據銷售與展示頁 builder，讓商家流程在同一條資料鏈路中運作。",
            ctaPrimary: "查看系統入口",
            ctaSecondary: "看架構重點",
            finalTitle: "如果你正在找可落地的商家系統方案，我可以直接帶你看實機流程",
            finalDesc: "這個首頁同時是產品介紹、作品集與提案入口。下一步可先看 demo，或直接建立帳號展開導入討論。",
            finalCta: "先看 Demo",
        },
        en: {
            kicker: "Builder-crafted commerce operating system",
            title: "Ticket Core Commerce / SaaS + AI: the operating system I built end to end",
            desc: "Connect repair cases, product and used-item flow, receipts, and showcase builder in one operational system.",
            ctaPrimary: "Open system entry",
            ctaSecondary: "View architecture",
            finalTitle: "If you need an operable commerce system, I can walk you through the live flow",
            finalDesc: "This page is a product showcase, portfolio landing, and proposal gateway in one place.",
            finalCta: "View Demo",
        },
    },
};

function sanitizeText(value: unknown, fallback: string): string {
    if (typeof value !== "string") return fallback;
    const next = value.trim();
    return next.length > 0 ? next : fallback;
}

function normalizeLocaleContent(candidate: unknown, fallback: BusinessHomepageEditableContent): BusinessHomepageEditableContent {
    const source = (candidate ?? {}) as Partial<BusinessHomepageEditableContent>;
    return {
        kicker: sanitizeText(source.kicker, fallback.kicker),
        title: sanitizeText(source.title, fallback.title),
        desc: sanitizeText(source.desc, fallback.desc),
        ctaPrimary: sanitizeText(source.ctaPrimary, fallback.ctaPrimary),
        ctaSecondary: sanitizeText(source.ctaSecondary, fallback.ctaSecondary),
        finalTitle: sanitizeText(source.finalTitle, fallback.finalTitle),
        finalDesc: sanitizeText(source.finalDesc, fallback.finalDesc),
        finalCta: sanitizeText(source.finalCta, fallback.finalCta),
    };
}

export function normalizeBusinessHomepageContentState(candidate: unknown): BusinessHomepageContentState {
    const source = (candidate ?? {}) as Partial<BusinessHomepageContentState>;
    const rawPreset = source.theme?.preset;
    const preset =
        typeof rawPreset === "string" && THEME_PRESETS.includes(rawPreset as BusinessHomepageThemePreset)
            ? (rawPreset as BusinessHomepageThemePreset)
            : DEFAULT_BUSINESS_HOMEPAGE_CONTENT_STATE.theme.preset;
    return {
        theme: {
            preset,
        },
        locale: {
            zh: normalizeLocaleContent(source.locale?.zh, DEFAULT_BUSINESS_HOMEPAGE_CONTENT_STATE.locale.zh),
            en: normalizeLocaleContent(source.locale?.en, DEFAULT_BUSINESS_HOMEPAGE_CONTENT_STATE.locale.en),
        },
    };
}
