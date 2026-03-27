import { MOCK_HOME_SERVICE_IMAGE_URLS } from "@/mock/homeServiceImages";
import type { ImageAsset } from "@/features/showcase/types/builder";
import type { ShowContentBlock, ShowContentLocale, ShowServiceRows } from "@/features/showcase/types/showContent";

export type CompanyHomeTemplateCopy = {
    logoText: string;
    logoSubtext: string;
    navAbout: string;
    navServices: string;
    navContact: string;
    navLocation: string;
    navShop: string;
    navLogin: string;
    navSignUp: string;
    navDashboard: string;
    navMyAccount: string;
    navSignOut: string;
    navCart: string;
    ctaCompany: string;
    ctaCustomer: string;
    ctaGuest: string;
    ctaServices: string;
    footerTagline: string;
    footerInfo: string[];
    footerSocialLabel: string;
    footerSocialLinks: string[];
    copyright: string;
};

export type CompanyHomeTemplateStyleTokens = {
    text: string;
    muted: string;
    border: string;
    accent: string;
    accentSoft: string;
    accentContrast: string;
    surface: string;
};

type CompanyHomeServiceSeed = {
    title: string;
    body: string;
    imageUrl?: string;
};

type CompanyHomeLocaleSeed = {
    hero: {
        kicker: string;
        title: string;
        body: string;
        points: string[];
        summaryTitle: string;
    };
    about: {
        kicker: string;
        title: string;
        body: string;
        points: string[];
    };
    services: {
        kicker: string;
        title: string;
        body: string;
        points: string[];
        serviceRows: ShowServiceRows;
        cards: CompanyHomeServiceSeed[];
    };
    contact: {
        kicker: string;
        title: string;
        body: string;
        points: string[];
        cardTitle: string;
        cardBody: string;
        primaryCta: string;
        secondaryCta: string;
    };
    ad: {
        enabled: boolean;
        kicker: string;
        title: string;
        body: string;
        points: string[];
    };
};

export const COMPANY_HOME_TEMPLATE_COPY: Record<ShowContentLocale, CompanyHomeTemplateCopy> = {
    zh: {
        logoText: "YOUR STORE",
        logoSubtext: "Default Company Home",
        navAbout: "關於我們",
        navServices: "服務項目",
        navContact: "聯絡方式",
        navLocation: "門市位置",
        navShop: "線上購物",
        navLogin: "登入",
        navSignUp: "註冊",
        navDashboard: "前往儀表板",
        navMyAccount: "我的帳戶",
        navSignOut: "登出",
        navCart: "購物車",
        ctaCompany: "管理公司內容",
        ctaCustomer: "查看我的服務",
        ctaGuest: "立即聯絡",
        ctaServices: "瀏覽服務",
        footerTagline: "提供維修、門市與小型商家常見服務的通用展示模板。",
        footerInfo: ["服務時間：週一至週六 10:00 - 20:00", "聯絡電話：02-0000-0000", "Email：hello@your-store.com"],
        footerSocialLabel: "社群與聯繫",
        footerSocialLinks: ["Facebook", "Instagram", "LINE Official"],
        copyright: "版權所有",
    },
    en: {
        logoText: "YOUR STORE",
        logoSubtext: "Default Company Home",
        navAbout: "About",
        navServices: "Services",
        navContact: "Contact",
        navLocation: "Location",
        navShop: "Shop",
        navLogin: "Log In",
        navSignUp: "Sign Up",
        navDashboard: "Open Dashboard",
        navMyAccount: "My Account",
        navSignOut: "Sign out",
        navCart: "Cart",
        ctaCompany: "Manage Content",
        ctaCustomer: "View My Services",
        ctaGuest: "Contact Us",
        ctaServices: "Browse Services",
        footerTagline: "A neutral default homepage template for repair shops, stores, and local service teams.",
        footerInfo: ["Business Hours: Mon - Sat 10:00 - 20:00", "Phone: +886-2-0000-0000", "Email: hello@your-store.com"],
        footerSocialLabel: "Social & Contact",
        footerSocialLinks: ["Facebook", "Instagram", "WhatsApp"],
        copyright: "Copyright",
    },
};

export const COMPANY_HOME_TEMPLATE_STYLE_TOKENS: CompanyHomeTemplateStyleTokens = {
    text: "31 49 46",
    muted: "87 106 102",
    border: "208 221 217",
    accent: "30 112 99",
    accentSoft: "228 241 238",
    accentContrast: "245 251 249",
    surface: "255 255 255",
};

const COMPANY_HOME_DEFAULT_SEEDS: Record<ShowContentLocale, CompanyHomeLocaleSeed> = {
    zh: {
        hero: {
            kicker: "可靠維修與門市服務",
            title: "先上線、再客製的商用首頁",
            body: "這是系統提供的預設首頁模板，適用於維修、門市、二手商品與小型服務商家，讓你在尚未自訂前也能直接對外展示。",
            points: ["快速回覆與預約引導", "服務內容可持續擴充", "文案與區塊皆可在後台調整"],
            summaryTitle: "服務摘要",
        },
        about: {
            kicker: "關於團隊",
            title: "專注基本功，提供穩定服務體驗",
            body: "我們重視透明流程、合理報價與清楚溝通，讓顧客在諮詢、交件到後續服務中，都能獲得一致且可信的體驗。",
            points: ["流程透明，報價清楚", "重視設備與資料安全", "可依門市與服務內容彈性調整"],
        },
        services: {
            kicker: "服務項目",
            title: "常見服務類型",
            body: "以下為通用展示內容，可依商家需求修改標題、說明、圖片與排序。",
            points: ["手機維修", "平板與筆電檢測", "配件與耗材", "二手商品收售", "資料轉移與備份", "到店快速服務"],
            serviceRows: 2,
            cards: [
                {
                    title: "手機維修",
                    body: "提供螢幕、電池與常見故障檢測，協助快速恢復日常使用。",
                },
                {
                    title: "平板與筆電檢測",
                    body: "針對效能、充電與硬體狀態做基礎檢測，提供可執行建議。",
                },
                {
                    title: "配件與耗材",
                    body: "提供常用充電、保護與周邊產品，方便一次完成選購。",
                },
                {
                    title: "二手商品收售",
                    body: "建立檢測與分級流程，提升交易透明度與信任感。",
                },
                {
                    title: "資料轉移與備份",
                    body: "協助顧客在換機或維修前，完成必要資料整理與移轉。",
                },
                {
                    title: "到店快速服務",
                    body: "透過預約與現場分流機制，減少等待並提升服務效率。",
                },
            ],
        },
        contact: {
            kicker: "聯絡與預約",
            title: "歡迎來電或線上洽詢",
            body: "可將此區塊設定為電話、表單、社群私訊或線上預約入口。",
            points: ["電話：02-0000-0000", "門市：台北市○○區○○路 100 號", "營業：週一至週六 10:00 - 20:00"],
            cardTitle: "準備好開始了嗎？",
            cardBody: "可把此區塊改成電話、LINE、地圖或預約連結，作為預設導流入口。",
            primaryCta: "立即預約",
            secondaryCta: "查看門市位置",
        },
        ad: {
            enabled: false,
            kicker: "活動資訊",
            title: "促銷與公告區塊",
            body: "可在需要時啟用，用於展示限時活動、合作方案或節慶公告。",
            points: [],
        },
    },
    en: {
        hero: {
            kicker: "Reliable Repair & Store Services",
            title: "A Commercial Homepage Ready Before Custom Setup",
            body: "This is the system default homepage template for repair shops, retail stores, second-hand goods, and local service businesses.",
            points: ["Fast response and booking guidance", "Service blocks ready for customization", "Content and section order editable in dashboard"],
            summaryTitle: "Service Snapshot",
        },
        about: {
            kicker: "About",
            title: "Built on clarity, consistency, and trust",
            body: "We focus on clear communication, transparent workflow, and practical service execution so visitors can quickly understand what your business offers.",
            points: ["Clear process and pricing", "Device and data safety awareness", "Flexible setup for different business types"],
        },
        services: {
            kicker: "Services",
            title: "Common Service Categories",
            body: "These are starter cards. Update titles, descriptions, images, and order based on your business scope.",
            points: ["Phone Repair", "Tablet & Laptop Check", "Accessories", "Second-hand Trade", "Data Transfer", "In-store Service"],
            serviceRows: 2,
            cards: [
                {
                    title: "Phone Repair",
                    body: "Handle common issues like screen, battery, and charging diagnostics with clear workflow.",
                },
                {
                    title: "Tablet & Laptop Check",
                    body: "Provide baseline checks for charging, performance, and hardware condition.",
                },
                {
                    title: "Accessories",
                    body: "Offer practical add-ons and essentials to support day-to-day device usage.",
                },
                {
                    title: "Second-hand Trade",
                    body: "Use condition grading and transparent records to improve transaction confidence.",
                },
                {
                    title: "Data Transfer & Backup",
                    body: "Support customers with migration and backup steps before repair or replacement.",
                },
                {
                    title: "In-store Quick Service",
                    body: "Use appointments and flow control to reduce wait time and improve service quality.",
                },
            ],
        },
        contact: {
            kicker: "Contact",
            title: "Talk to us and plan your visit",
            body: "Use this block as your default entry for phone calls, messaging, forms, or booking links.",
            points: ["Phone: +886-2-0000-0000", "Address: No.100, Example Rd., Taipei", "Hours: Mon - Sat 10:00 - 20:00"],
            cardTitle: "Ready to get started?",
            cardBody: "Replace this block with your phone number, messaging channel, map, or booking link.",
            primaryCta: "Book Now",
            secondaryCta: "View Store Location",
        },
        ad: {
            enabled: false,
            kicker: "Announcement",
            title: "Promotion and Notice Slot",
            body: "Enable this section when needed for campaigns, holiday notices, or partner information.",
            points: [],
        },
    },
};

function createImageAsset(url: string, alt: string): ImageAsset {
    return {
        sourceType: "external_url",
        url,
        alt,
    };
}

function createServiceCards(locale: ShowContentLocale, seeds: CompanyHomeServiceSeed[]) {
    return Array.from({ length: 9 }, (_, index) => {
        const seed = seeds[index];
        return {
            id: `service-card-${index + 1}`,
            title: seed?.title ?? "",
            body: seed?.body ?? "",
            image: createImageAsset(seed?.imageUrl ?? MOCK_HOME_SERVICE_IMAGE_URLS[index] ?? "", `${locale}-service-${index + 1}`),
            imageUrl: seed?.imageUrl ?? MOCK_HOME_SERVICE_IMAGE_URLS[index] ?? "",
            imageStyle: "square" as const,
            imagePosition: "top" as const,
            showImage: true,
            showTitle: true,
            showBody: true,
        };
    });
}

function createDefaultBlocksForLocale(locale: ShowContentLocale): ShowContentBlock[] {
    const seed = COMPANY_HOME_DEFAULT_SEEDS[locale];
    const serviceCards = createServiceCards(locale, seed.services.cards);
    return [
        {
            id: "hero",
            type: "hero",
            anchor: "hero",
            enabled: true,
            order: 0,
            content: {
                kicker: seed.hero.kicker,
                title: seed.hero.title,
                body: seed.hero.body,
                points: seed.hero.points,
                summaryTitle: seed.hero.summaryTitle,
            },
            kicker: seed.hero.kicker,
            title: seed.hero.title,
            body: seed.hero.body,
            points: seed.hero.points,
            serviceCards: [],
            serviceRows: 1,
            styles: {
                align: "left",
            },
            assets: {},
            ctas: [
                {
                    id: "primary",
                    label: "",
                    href: "",
                    enabled: true,
                    variant: "solid",
                },
                {
                    id: "secondary",
                    label: COMPANY_HOME_TEMPLATE_COPY[locale].ctaServices,
                    href: "#services",
                    enabled: true,
                    variant: "outline",
                },
            ],
            typography: {
                fontFamily: "default",
                titleScale: "xl",
                bodyScale: "md",
            },
            fontFamily: "default",
            titleScale: "xl",
            bodyScale: "md",
            dataSource: {},
            themeTokenOverrides: {},
        },
        {
            id: "about",
            type: "about",
            anchor: "about",
            enabled: true,
            order: 1,
            content: {
                kicker: seed.about.kicker,
                title: seed.about.title,
                body: seed.about.body,
                points: seed.about.points,
            },
            kicker: seed.about.kicker,
            title: seed.about.title,
            body: seed.about.body,
            points: seed.about.points,
            serviceCards: [],
            serviceRows: 1,
            styles: {
                align: "left",
            },
            assets: {},
            ctas: [],
            typography: {
                fontFamily: "default",
                titleScale: "lg",
                bodyScale: "md",
            },
            fontFamily: "default",
            titleScale: "lg",
            bodyScale: "md",
            dataSource: {},
            themeTokenOverrides: {},
        },
        {
            id: "services",
            type: "services",
            anchor: "services",
            enabled: true,
            order: 2,
            content: {
                kicker: seed.services.kicker,
                title: seed.services.title,
                body: seed.services.body,
                points: seed.services.points,
                serviceRows: seed.services.serviceRows,
                serviceCards,
            },
            kicker: seed.services.kicker,
            title: seed.services.title,
            body: seed.services.body,
            points: seed.services.points,
            serviceCards,
            serviceRows: seed.services.serviceRows,
            styles: {
                align: "left",
            },
            assets: {},
            ctas: [],
            typography: {
                fontFamily: "default",
                titleScale: "lg",
                bodyScale: "sm",
            },
            fontFamily: "default",
            titleScale: "lg",
            bodyScale: "sm",
            dataSource: {},
            themeTokenOverrides: {},
        },
        {
            id: "contact",
            type: "contact",
            anchor: "contact",
            enabled: true,
            order: 3,
            content: {
                kicker: seed.contact.kicker,
                title: seed.contact.title,
                body: seed.contact.body,
                points: seed.contact.points,
                cardTitle: seed.contact.cardTitle,
                cardBody: seed.contact.cardBody,
            },
            kicker: seed.contact.kicker,
            title: seed.contact.title,
            body: seed.contact.body,
            points: seed.contact.points,
            serviceCards: [],
            serviceRows: 1,
            styles: {
                align: "left",
            },
            assets: {},
            ctas: [
                {
                    id: "primary",
                    label: seed.contact.primaryCta,
                    href: "#",
                    enabled: true,
                    variant: "solid",
                },
                {
                    id: "secondary",
                    label: seed.contact.secondaryCta,
                    href: "#",
                    enabled: true,
                    variant: "outline",
                },
            ],
            typography: {
                fontFamily: "default",
                titleScale: "lg",
                bodyScale: "sm",
            },
            fontFamily: "default",
            titleScale: "lg",
            bodyScale: "sm",
            dataSource: {},
            themeTokenOverrides: {},
        },
        {
            id: "ad",
            type: "ad",
            anchor: "ad",
            enabled: seed.ad.enabled,
            order: 4,
            content: {
                kicker: seed.ad.kicker,
                title: seed.ad.title,
                body: seed.ad.body,
                points: seed.ad.points,
            },
            kicker: seed.ad.kicker,
            title: seed.ad.title,
            body: seed.ad.body,
            points: seed.ad.points,
            serviceCards: [],
            serviceRows: 1,
            styles: {
                align: "center",
            },
            assets: {},
            ctas: [],
            typography: {
                fontFamily: "default",
                titleScale: "md",
                bodyScale: "sm",
            },
            fontFamily: "default",
            titleScale: "md",
            bodyScale: "sm",
            dataSource: {},
            themeTokenOverrides: {},
        },
    ];
}

export const COMPANY_HOME_DEFAULT_BLOCKS: Record<ShowContentLocale, ShowContentBlock[]> = {
    zh: createDefaultBlocksForLocale("zh"),
    en: createDefaultBlocksForLocale("en"),
};
