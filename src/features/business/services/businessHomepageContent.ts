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
            kicker: "Proposal-ready portfolio for a SaaS + AI operating platform",
            title: "Ticket Core 是我正在打造的多租戶 SaaS + AI 核心平台，整合 ERP、Repair System、POS 與 Commerce",
            desc: "這個首頁定位為未來提案與履歷展示的作品頁。系統以手機維修店的實務流程為起點，把多租戶營運、維修案件、商品與二手流通、櫃台交易、品牌展示與後續 AI 能力收斂成同一個產品方向。",
            ctaPrimary: "查看平台定位",
            ctaSecondary: "認識我的背景",
            finalTitle: "如果你在找一個帶有現場理解、產品思維與 AI 發展方向的作品，我可以直接用這個平台跟你說明",
            finalDesc: "這個首頁同時是產品介紹、作品集頁與提案入口。接下來我會繼續把系統打磨成熟，並把 AI / RAG 真正接進來。",
            finalCta: "查看目前系統入口",
        },
        en: {
            kicker: "Proposal-ready portfolio for a SaaS + AI operating platform",
            title: "Ticket Core is the multi-tenant SaaS + AI platform I am building across ERP, repair workflow, POS, and commerce",
            desc: "This homepage is designed as a proposal deck, portfolio landing, and future product front door in one. The first operating context is a phone repair store, but the architecture is shaped to expand into broader retail and service workflows.",
            ctaPrimary: "View platform thesis",
            ctaSecondary: "Read my background",
            finalTitle: "If you want to review a project shaped by real operations, product thinking, and AI direction, I can walk you through this platform directly",
            finalDesc: "This page works as a product story, portfolio page, and proposal entry. The next phase is to keep maturing the system and bring AI / RAG into the product itself.",
            finalCta: "Open current system",
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
