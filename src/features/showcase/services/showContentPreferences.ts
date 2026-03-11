import type {
    ShowContentBlock,
    ShowContentBlockId,
    ShowContentBodyScale,
    ShowContentFontFamily,
    ShowContentLocale,
    ShowContentLocaleMap,
    ShowContentState,
    ShowContentTitleScale,
    ShowServiceCard,
    ShowServiceImagePosition,
    ShowServiceImageStyle,
    ShowServiceRows,
} from "@/features/showcase/types/showContent";
import { MOCK_HOME_SERVICE_IMAGE_URLS } from "@/mock/homeServiceImages";

const BLOCK_IDS: ShowContentBlockId[] = ["hero", "about", "services", "contact", "ad"];
const FONT_FAMILIES: ShowContentFontFamily[] = ["default", "serif", "mono"];
const TITLE_SCALES: ShowContentTitleScale[] = ["md", "lg", "xl"];
const BODY_SCALES: ShowContentBodyScale[] = ["sm", "md", "lg"];
const SERVICE_CARD_COUNT = 9;
const SERVICE_IMAGE_STYLES: ShowServiceImageStyle[] = ["square", "circle"];
const SERVICE_IMAGE_POSITIONS: ShowServiceImagePosition[] = ["top", "bottom", "left", "right"];
const SERVICE_ROWS: ShowServiceRows[] = [1, 2, 3];

function createDefaultServiceCards(titles: string[]): ShowServiceCard[] {
    const normalizedTitles = titles
        .map((title) => title.trim())
        .filter((title) => title.length > 0)
        .slice(0, SERVICE_CARD_COUNT);

    while (normalizedTitles.length < SERVICE_CARD_COUNT) {
        normalizedTitles.push("");
    }

    return normalizedTitles.map((title, index) => ({
        title,
        body: "",
        imageUrl: MOCK_HOME_SERVICE_IMAGE_URLS[index] ?? "",
        imageStyle: "square",
        imagePosition: "top",
        showImage: true,
        showTitle: true,
        showBody: true,
    }));
}

function createDefaultLocaleMap(locale: ShowContentLocale): ShowContentLocaleMap {
    if (locale === "zh") {
        const servicePoints = ["螢幕維修", "電池更換", "背蓋修復", "充電孔維修", "進水檢測", "資料轉移"];

        return {
            hero: {
                enabled: true,
                kicker: "行動裝置快速維修",
                title: "我們到你身邊修",
                body: "以高對比黃黑視覺呈現服務價值，讓訪客一眼看懂維修流程、預約入口與可處理項目。",
                points: ["電話：04 8339 7068", "Email：hello@example.com", "服務區域：Sydney CBD / Eastern Suburbs"],
                serviceCards: [],
                serviceRows: 1,
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
                serviceCards: [],
                serviceRows: 1,
                fontFamily: "default",
                titleScale: "md",
                bodyScale: "md",
            },
            services: {
                enabled: true,
                kicker: "可維修項目",
                title: "主要服務",
                body: "以下是最常見的維修項目，可依品牌與型號客製方案。",
                points: servicePoints,
                serviceCards: createDefaultServiceCards(servicePoints),
                serviceRows: 2,
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
                serviceCards: [],
                serviceRows: 1,
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
                serviceCards: [],
                serviceRows: 1,
                fontFamily: "default",
                titleScale: "md",
                bodyScale: "sm",
            },
        };
    }

    const servicePoints = ["Screen Repair", "Battery Replacement", "Back Glass", "Charging Port", "Water Damage", "Data Transfer"];

    return {
        hero: {
            enabled: true,
            kicker: "Fast Mobile Repair",
            title: "We Come To You",
            body: "A high-contrast visual homepage that clarifies service scope, booking entry, and value in one screen.",
            points: ["Phone: 04 8339 7068", "Email: hello@example.com", "Area: Sydney CBD / Eastern Suburbs"],
            serviceCards: [],
            serviceRows: 1,
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
            serviceCards: [],
            serviceRows: 1,
            fontFamily: "default",
            titleScale: "md",
            bodyScale: "md",
        },
        services: {
            enabled: true,
            kicker: "What We Fix",
            title: "Our Services",
            body: "Common service types listed below. Adjust and reorder to fit your business focus.",
            points: servicePoints,
            serviceCards: createDefaultServiceCards(servicePoints),
            serviceRows: 2,
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
            serviceCards: [],
            serviceRows: 1,
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
            serviceCards: [],
            serviceRows: 1,
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

function sanitizeOptionalText(value: unknown, fallback = ""): string {
    if (typeof value !== "string") return fallback;
    return value.trim();
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

function sanitizeServiceImageStyle(value: unknown, fallback: ShowServiceImageStyle): ShowServiceImageStyle {
    return typeof value === "string" && SERVICE_IMAGE_STYLES.includes(value as ShowServiceImageStyle)
        ? (value as ShowServiceImageStyle)
        : fallback;
}

function sanitizeServiceImagePosition(value: unknown, fallback: ShowServiceImagePosition): ShowServiceImagePosition {
    return typeof value === "string" && SERVICE_IMAGE_POSITIONS.includes(value as ShowServiceImagePosition)
        ? (value as ShowServiceImagePosition)
        : fallback;
}

function sanitizeServiceRows(value: unknown, fallback: ShowServiceRows): ShowServiceRows {
    if (typeof value === "number" && SERVICE_ROWS.includes(value as ShowServiceRows)) return value as ShowServiceRows;
    if (typeof value === "string") {
        const parsed = Number.parseInt(value, 10);
        if (SERVICE_ROWS.includes(parsed as ShowServiceRows)) return parsed as ShowServiceRows;
    }
    return fallback;
}

function normalizeServiceCards(
    value: unknown,
    fallback: ShowServiceCard[],
    legacyTitles?: string[],
): ShowServiceCard[] {
    const source = Array.isArray(value) ? value : [];
    const legacy = (legacyTitles ?? [])
        .map((title) => title.trim())
        .filter((title) => title.length > 0)
        .slice(0, SERVICE_CARD_COUNT);

    const next: ShowServiceCard[] = [];
    for (let index = 0; index < SERVICE_CARD_COUNT; index += 1) {
        const fallbackCard = fallback[index] ?? {
            title: legacy[index] ?? "",
            body: "",
            imageUrl: "",
            imageStyle: "square" as const,
            imagePosition: "top" as const,
            showImage: true,
            showTitle: true,
            showBody: true,
        };
        const candidate = source[index] as Partial<ShowServiceCard> | undefined;

        next.push({
            title: sanitizeText(candidate?.title, fallbackCard.title),
            body: sanitizeOptionalText(candidate?.body, fallbackCard.body),
            imageUrl: sanitizeOptionalText(candidate?.imageUrl, fallbackCard.imageUrl),
            imageStyle: sanitizeServiceImageStyle(candidate?.imageStyle, fallbackCard.imageStyle),
            imagePosition: sanitizeServiceImagePosition(candidate?.imagePosition, fallbackCard.imagePosition),
            showImage: typeof candidate?.showImage === "boolean" ? candidate.showImage : fallbackCard.showImage,
            showTitle: typeof candidate?.showTitle === "boolean" ? candidate.showTitle : fallbackCard.showTitle,
            showBody: typeof candidate?.showBody === "boolean" ? candidate.showBody : fallbackCard.showBody,
        });
    }

    return next;
}

function normalizeBlock(
    blockId: ShowContentBlockId,
    candidate: Partial<ShowContentBlock> | null | undefined,
    fallback: ShowContentBlock,
): ShowContentBlock {
    const source = candidate ?? {};
    const rawPoints = sanitizePoints(source.points);
    const serviceRows = blockId === "services" ? sanitizeServiceRows(source.serviceRows, fallback.serviceRows) : 1;
    const serviceCards =
        blockId === "services"
            ? normalizeServiceCards(source.serviceCards, fallback.serviceCards, rawPoints.length > 0 ? rawPoints : fallback.points)
            : [];
    const visibleCardCount = serviceRows * 3;
    const normalizedPoints =
        blockId === "services"
            ? serviceCards
                  .slice(0, visibleCardCount)
                  .map((card) => card.title.trim())
                  .filter((title) => title.length > 0)
                  .slice(0, 12)
            : rawPoints;

    return {
        enabled: typeof source.enabled === "boolean" ? source.enabled : fallback.enabled,
        kicker: sanitizeText(source.kicker, fallback.kicker),
        title: sanitizeText(source.title, fallback.title),
        body: sanitizeText(source.body, fallback.body),
        points: normalizedPoints,
        serviceCards,
        serviceRows,
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
        hero: normalizeBlock("hero", source.hero, fallback.hero),
        about: normalizeBlock("about", source.about, fallback.about),
        services: normalizeBlock("services", source.services, fallback.services),
        contact: normalizeBlock("contact", source.contact, fallback.contact),
        ad: normalizeBlock("ad", source.ad, fallback.ad),
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
