import type { RgbTriplet } from "@/lib/types/theme";
import type { ShowThemeColors, StorefrontSettings } from "@/features/showcase/types/showTheme";

const RGB_TRIPLET_PATTERN = /^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/;
const HEX_COLOR_PATTERN = /^#?([0-9a-fA-F]{6})$/;

export const DEFAULT_SHOW_THEME_COLORS: ShowThemeColors = {
    page: "248 250 248",
    header: "248 250 248",
    hero: "236 243 241",
    about: "255 255 255",
    services: "242 247 245",
    contact: "248 250 248",
    ad: "236 243 241",
    footer: "242 247 245",
    shopPage: "250 248 239",
    shopHeader: "25 24 21",
    shopHero: "255 203 45",
    shopGrid: "255 255 255",
    shopFooter: "25 24 21",
};

export const DEFAULT_STOREFRONT_SETTINGS: StorefrontSettings = {
    shoppingEnabled: true,
    autoRedirectToShopForCustomer: false,
    showCartOnNavForCustomer: false,
};

function clampColorValue(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(255, Math.round(value)));
}

function parseRgbTriplet(value: string): [number, number, number] | null {
    const trimmed = value.trim();
    const matched = trimmed.match(RGB_TRIPLET_PATTERN);
    if (!matched) return null;
    const r = clampColorValue(Number(matched[1]));
    const g = clampColorValue(Number(matched[2]));
    const b = clampColorValue(Number(matched[3]));
    return [r, g, b];
}

function parseHexColor(value: string): [number, number, number] | null {
    const matched = value.trim().match(HEX_COLOR_PATTERN);
    if (!matched) return null;
    const hex = matched[1];
    const r = clampColorValue(Number.parseInt(hex.slice(0, 2), 16));
    const g = clampColorValue(Number.parseInt(hex.slice(2, 4), 16));
    const b = clampColorValue(Number.parseInt(hex.slice(4, 6), 16));
    return [r, g, b];
}

function toRgbTriplet(parts: [number, number, number]): RgbTriplet {
    return `${parts[0]} ${parts[1]} ${parts[2]}`;
}

function normalizeRgbTriplet(value: string, fallback: RgbTriplet): RgbTriplet {
    const parsed = parseRgbTriplet(value) ?? parseHexColor(value);
    if (!parsed) return fallback;
    return toRgbTriplet(parsed);
}

export function normalizeShowThemeColors(input: Partial<ShowThemeColors> | null | undefined): ShowThemeColors {
    const candidate = input ?? {};
    return {
        page: normalizeRgbTriplet(candidate.page ?? "", DEFAULT_SHOW_THEME_COLORS.page),
        header: normalizeRgbTriplet(candidate.header ?? "", DEFAULT_SHOW_THEME_COLORS.header),
        hero: normalizeRgbTriplet(candidate.hero ?? "", DEFAULT_SHOW_THEME_COLORS.hero),
        about: normalizeRgbTriplet(candidate.about ?? "", DEFAULT_SHOW_THEME_COLORS.about),
        services: normalizeRgbTriplet(candidate.services ?? "", DEFAULT_SHOW_THEME_COLORS.services),
        contact: normalizeRgbTriplet(candidate.contact ?? "", DEFAULT_SHOW_THEME_COLORS.contact),
        ad: normalizeRgbTriplet(candidate.ad ?? "", DEFAULT_SHOW_THEME_COLORS.ad),
        footer: normalizeRgbTriplet(candidate.footer ?? "", DEFAULT_SHOW_THEME_COLORS.footer),
        shopPage: normalizeRgbTriplet(candidate.shopPage ?? "", DEFAULT_SHOW_THEME_COLORS.shopPage),
        shopHeader: normalizeRgbTriplet(candidate.shopHeader ?? "", DEFAULT_SHOW_THEME_COLORS.shopHeader),
        shopHero: normalizeRgbTriplet(candidate.shopHero ?? "", DEFAULT_SHOW_THEME_COLORS.shopHero),
        shopGrid: normalizeRgbTriplet(candidate.shopGrid ?? "", DEFAULT_SHOW_THEME_COLORS.shopGrid),
        shopFooter: normalizeRgbTriplet(candidate.shopFooter ?? "", DEFAULT_SHOW_THEME_COLORS.shopFooter),
    };
}

export function normalizeStorefrontSettings(input: Partial<StorefrontSettings> | null | undefined): StorefrontSettings {
    const candidate = input ?? {};
    return {
        shoppingEnabled:
            typeof candidate.shoppingEnabled === "boolean"
                ? candidate.shoppingEnabled
                : DEFAULT_STOREFRONT_SETTINGS.shoppingEnabled,
        autoRedirectToShopForCustomer:
            typeof candidate.autoRedirectToShopForCustomer === "boolean"
                ? candidate.autoRedirectToShopForCustomer
                : DEFAULT_STOREFRONT_SETTINGS.autoRedirectToShopForCustomer,
        showCartOnNavForCustomer:
            typeof candidate.showCartOnNavForCustomer === "boolean"
                ? candidate.showCartOnNavForCustomer
                : DEFAULT_STOREFRONT_SETTINGS.showCartOnNavForCustomer,
    };
}
