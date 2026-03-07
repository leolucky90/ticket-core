import type {
    ShowContentBlock,
    ShowContentBlockId,
    ShowContentBodyScale,
    ShowContentFontFamily,
    ShowContentLocale,
    ShowContentLocaleMap,
    ShowContentState,
    ShowContentTitleScale,
} from "@/features/showcase/types/showContent";

const BLOCK_IDS: ShowContentBlockId[] = ["hero", "about", "services", "contact", "ad"];
const FONT_FAMILIES: ShowContentFontFamily[] = ["default", "serif", "mono"];
const TITLE_SCALES: ShowContentTitleScale[] = ["md", "lg", "xl"];
const BODY_SCALES: ShowContentBodyScale[] = ["sm", "md", "lg"];

function createDefaultLocaleMap(locale: ShowContentLocale): ShowContentLocaleMap {
    if (locale === "zh") {
        return {
            hero: {
                enabled: true,
                kicker: "行動裝置快速維修",
                title: "我們到你身邊修",
                body: "以高對比黃黑視覺呈現服務價值，讓訪客一眼看懂維修流程、預約入口與可處理項目。",
                points: ["電話：04 8339 7068", "Email：hello@example.com", "服務區域：Sydney CBD / Eastern Suburbs"],
                fontFamily: "default",
                titleScale: "lg",
                bodyScale: "md",
            },
            about: {
                enabled: true,
                kicker: "我們是誰",
                title: "關於團隊",
                body: "我們提供到府與現場快速維修，重視透明報價、資料安全和可追蹤進度。",
                points: ["透明報價", "資料安全", "進度可追蹤"],
                fontFamily: "default",
                titleScale: "md",
                bodyScale: "md",
            },
            services: {
                enabled: true,
                kicker: "可維修項目",
                title: "主要服務",
                body: "以下是最常見的維修項目，可依品牌與型號客製方案。",
                points: ["螢幕維修", "電池更換", "背蓋修復", "充電孔維修", "進水檢測", "資料轉移"],
                fontFamily: "default",
                titleScale: "md",
                bodyScale: "sm",
            },
            contact: {
                enabled: true,
                kicker: "聯絡我們",
                title: "營業與預約",
                body: "立即聯絡我們，取得當日報價與可預約時段。",
                points: ["週一至週五：08:00 - 18:00", "週六：08:00 - 15:00", "週日：公休"],
                fontFamily: "default",
                titleScale: "md",
                bodyScale: "sm",
            },
            ad: {
                enabled: true,
                kicker: "活動版位",
                title: "促銷 / 合作曝光區",
                body: "可放置限時優惠、品牌合作或新服務方案，提升首頁轉換率。",
                points: [],
                fontFamily: "default",
                titleScale: "md",
                bodyScale: "sm",
            },
        };
    }

    return {
        hero: {
            enabled: true,
            kicker: "Fast Mobile Repair",
            title: "We Come To You",
            body: "A high-contrast visual homepage that clarifies service scope, booking entry, and value in one screen.",
            points: ["Phone: 04 8339 7068", "Email: hello@example.com", "Area: Sydney CBD / Eastern Suburbs"],
            fontFamily: "default",
            titleScale: "lg",
            bodyScale: "md",
        },
        about: {
            enabled: true,
            kicker: "Who We Are",
            title: "About The Team",
            body: "We provide fast onsite and mobile repair with transparent pricing, data safety, and trackable progress.",
            points: ["Transparent pricing", "Data safety", "Trackable progress"],
            fontFamily: "default",
            titleScale: "md",
            bodyScale: "md",
        },
        services: {
            enabled: true,
            kicker: "What We Fix",
            title: "Our Services",
            body: "Common service types listed below. Adjust and reorder to fit your business focus.",
            points: ["Screen Repair", "Battery Replacement", "Back Glass", "Charging Port", "Water Damage", "Data Transfer"],
            fontFamily: "default",
            titleScale: "md",
            bodyScale: "sm",
        },
        contact: {
            enabled: true,
            kicker: "Contact",
            title: "Hours & Booking",
            body: "Call now for same-day quote and available booking slots.",
            points: ["Mon - Fri: 8:00 AM - 6:00 PM", "Sat: 8:00 AM - 3:00 PM", "Sun: Closed"],
            fontFamily: "default",
            titleScale: "md",
            bodyScale: "sm",
        },
        ad: {
            enabled: true,
            kicker: "Promotion Slot",
            title: "Campaign / Partner Banner",
            body: "Use this area for promotions, partnerships, or newly launched service packages.",
            points: [],
            fontFamily: "default",
            titleScale: "md",
            bodyScale: "sm",
        },
    };
}

export const DEFAULT_SHOW_CONTENT_STATE: ShowContentState = {
    order: [...BLOCK_IDS],
    locale: {
        zh: createDefaultLocaleMap("zh"),
        en: createDefaultLocaleMap("en"),
    },
};

function sanitizeText(value: unknown, fallback: string): string {
    if (typeof value !== "string") return fallback;
    const next = value.trim();
    return next.length > 0 ? next : fallback;
}

function sanitizePoints(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((line): line is string => typeof line === "string")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .slice(0, 12);
}

function sanitizeFontFamily(value: unknown, fallback: ShowContentFontFamily): ShowContentFontFamily {
    return typeof value === "string" && FONT_FAMILIES.includes(value as ShowContentFontFamily)
        ? (value as ShowContentFontFamily)
        : fallback;
}

function sanitizeTitleScale(value: unknown, fallback: ShowContentTitleScale): ShowContentTitleScale {
    return typeof value === "string" && TITLE_SCALES.includes(value as ShowContentTitleScale)
        ? (value as ShowContentTitleScale)
        : fallback;
}

function sanitizeBodyScale(value: unknown, fallback: ShowContentBodyScale): ShowContentBodyScale {
    return typeof value === "string" && BODY_SCALES.includes(value as ShowContentBodyScale)
        ? (value as ShowContentBodyScale)
        : fallback;
}

function normalizeBlock(candidate: Partial<ShowContentBlock> | null | undefined, fallback: ShowContentBlock): ShowContentBlock {
    const source = candidate ?? {};
    return {
        enabled: typeof source.enabled === "boolean" ? source.enabled : fallback.enabled,
        kicker: sanitizeText(source.kicker, fallback.kicker),
        title: sanitizeText(source.title, fallback.title),
        body: sanitizeText(source.body, fallback.body),
        points: sanitizePoints(source.points),
        fontFamily: sanitizeFontFamily(source.fontFamily, fallback.fontFamily),
        titleScale: sanitizeTitleScale(source.titleScale, fallback.titleScale),
        bodyScale: sanitizeBodyScale(source.bodyScale, fallback.bodyScale),
    };
}

function normalizeLocaleMap(
    candidate: Partial<Record<ShowContentBlockId, Partial<ShowContentBlock>>> | null | undefined,
    fallback: ShowContentLocaleMap,
): ShowContentLocaleMap {
    const source = candidate ?? {};
    return {
        hero: normalizeBlock(source.hero, fallback.hero),
        about: normalizeBlock(source.about, fallback.about),
        services: normalizeBlock(source.services, fallback.services),
        contact: normalizeBlock(source.contact, fallback.contact),
        ad: normalizeBlock(source.ad, fallback.ad),
    };
}

function normalizeOrder(candidate: unknown): ShowContentBlockId[] {
    if (!Array.isArray(candidate)) return [...BLOCK_IDS];
    const next: ShowContentBlockId[] = [];
    for (const value of candidate) {
        if (typeof value !== "string") continue;
        if (!BLOCK_IDS.includes(value as ShowContentBlockId)) continue;
        if (next.includes(value as ShowContentBlockId)) continue;
        next.push(value as ShowContentBlockId);
    }
    for (const id of BLOCK_IDS) {
        if (!next.includes(id)) next.push(id);
    }
    return next;
}

export function normalizeShowContentState(candidate: unknown): ShowContentState {
    const source = (candidate ?? {}) as Partial<ShowContentState>;
    return {
        order: normalizeOrder(source.order),
        locale: {
            zh: normalizeLocaleMap(source.locale?.zh, DEFAULT_SHOW_CONTENT_STATE.locale.zh),
            en: normalizeLocaleMap(source.locale?.en, DEFAULT_SHOW_CONTENT_STATE.locale.en),
        },
    };
}
