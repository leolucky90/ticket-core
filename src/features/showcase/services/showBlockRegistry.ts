import { COMPANY_HOME_DEFAULT_BLOCKS } from "@/features/showcase/default-template/companyHomeDefaultTemplate";
import type {
    ShowContentBlock,
    ShowContentBlockId,
    ShowContentBlockType,
    ShowContentBlockVariant,
    ShowContentLocale,
} from "@/features/showcase/types/showContent";

export type ShowBlockRegistryEntry = {
    templateType: ShowContentBlockType;
    defaultVariant: ShowContentBlockVariant;
    allowMultiple: boolean;
};

export const SHOW_BLOCK_REGISTRY: Record<ShowContentBlockType, ShowBlockRegistryEntry> = {
    hero: { templateType: "hero", defaultVariant: "split-screen", allowMultiple: true },
    about: { templateType: "about", defaultVariant: "default", allowMultiple: true },
    services: { templateType: "services", defaultVariant: "default", allowMultiple: true },
    contact: { templateType: "contact", defaultVariant: "default", allowMultiple: true },
    ad: { templateType: "ad", defaultVariant: "single-banner", allowMultiple: true },
    cta: { templateType: "cta", defaultVariant: "default", allowMultiple: true },
    promo: { templateType: "promo", defaultVariant: "default", allowMultiple: true },
};

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

function baseBlockFor(locale: ShowContentLocale, type: ShowContentBlockType): ShowContentBlock {
    if (type === "cta") {
        return {
            id: "cta",
            type: "cta",
            anchor: "cta",
            enabled: true,
            order: 0,
            content: {
                kicker: locale === "zh" ? "立即行動" : "Take Action",
                title: locale === "zh" ? "準備好把展示頁換成你的版本了嗎？" : "Ready to turn this showcase into your own version?",
                body: locale === "zh" ? "插入 CTA 區塊後，可以快速放上預約、聯絡或導購入口。" : "Insert a CTA block to quickly surface booking, contact, or conversion actions.",
                points: locale === "zh" ? ["立即預約", "加入 LINE", "查看商店"] : ["Book Now", "Join LINE", "Open Shop"],
            },
            kicker: "",
            title: "",
            body: "",
            points: [],
            serviceCards: [],
            serviceRows: 1,
            styles: { align: "center" },
            assets: {},
            ctas: [
                { id: "primary", label: locale === "zh" ? "立即預約" : "Book Now", href: "#contact", enabled: true, variant: "solid" },
                { id: "secondary", label: locale === "zh" ? "查看服務" : "View Services", href: "#services", enabled: true, variant: "outline" },
            ],
            typography: { fontFamily: "default", titleScale: "lg", bodyScale: "sm" },
            fontFamily: "default",
            titleScale: "lg",
            bodyScale: "sm",
            variant: "default",
            dataSource: {},
            themeTokenOverrides: {},
        };
    }

    if (type === "promo") {
        return {
            id: "promo",
            type: "promo",
            anchor: "promo",
            enabled: true,
            order: 0,
            content: {
                kicker: locale === "zh" ? "活動促銷" : "Campaign",
                title: locale === "zh" ? "本月主打活動" : "This Month's Featured Offer",
                body: locale === "zh" ? "用 promo banner 放限時活動、換季方案或店內主打服務。" : "Use a promo banner for limited offers, seasonal campaigns, or featured services.",
                points: locale === "zh" ? ["限時折扣", "預約優惠", "加購方案"] : ["Limited Discount", "Booking Offer", "Bundle Upgrade"],
            },
            kicker: "",
            title: "",
            body: "",
            points: [],
            serviceCards: [],
            serviceRows: 1,
            styles: { align: "left" },
            assets: {},
            ctas: [],
            typography: { fontFamily: "default", titleScale: "lg", bodyScale: "sm" },
            fontFamily: "default",
            titleScale: "lg",
            bodyScale: "sm",
            variant: "default",
            dataSource: {},
            themeTokenOverrides: {},
        };
    }

    const base = COMPANY_HOME_DEFAULT_BLOCKS[locale].find((block) => block.type === type);
    if (!base) {
        throw new Error(`Missing default showcase block for ${locale}:${type}`);
    }
    return clone(base);
}

export function createShowBlockId(type: ShowContentBlockType, existingIds: ShowContentBlockId[]): ShowContentBlockId {
    let index = existingIds.filter((id) => id === type || id.startsWith(`${type}-`)).length + 1;
    let nextId = `${type}-${index}`;
    while (existingIds.includes(nextId)) {
        index += 1;
        nextId = `${type}-${index}`;
    }
    return nextId;
}

export function createShowcaseBlock(
    locale: ShowContentLocale,
    type: ShowContentBlockType,
    id: ShowContentBlockId,
    order: number,
    variant?: ShowContentBlockVariant,
): ShowContentBlock {
    const entry = SHOW_BLOCK_REGISTRY[type];
    const base = baseBlockFor(locale, type);
    const resolvedVariant = variant ?? entry.defaultVariant;
    return {
        ...base,
        id,
        type,
        order,
        anchor: id,
        variant: resolvedVariant,
        content: clone(base.content),
        styles: clone(base.styles),
        assets: clone(base.assets ?? {}),
        ctas: clone(base.ctas ?? []),
        typography: clone(base.typography),
        dataSource: clone(base.dataSource ?? {}),
        themeTokenOverrides: clone(base.themeTokenOverrides ?? {}),
    };
}

export function getShowcaseDefaultBlocks(locale: ShowContentLocale): ShowContentBlock[] {
    return [
        createShowcaseBlock(locale, "hero", "hero", 0, "split-screen"),
        createShowcaseBlock(locale, "about", "about", 1),
        createShowcaseBlock(locale, "services", "services", 2),
        createShowcaseBlock(locale, "contact", "contact", 3),
        createShowcaseBlock(locale, "ad", "ad", 4, "single-banner"),
    ];
}
