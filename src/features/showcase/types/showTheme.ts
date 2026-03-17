import type { RgbTriplet } from "@/lib/types/theme";

export type ShowThemeColorRole =
    | "page"
    | "header"
    | "hero"
    | "about"
    | "services"
    | "contact"
    | "ad"
    | "footer"
    | "shopPage"
    | "shopHeader"
    | "shopHero"
    | "shopGrid"
    | "shopFooter";

export type ShowThemeColors = {
    page: RgbTriplet;
    header: RgbTriplet;
    hero: RgbTriplet;
    about: RgbTriplet;
    services: RgbTriplet;
    contact: RgbTriplet;
    ad: RgbTriplet;
    footer: RgbTriplet;
    shopPage: RgbTriplet;
    shopHeader: RgbTriplet;
    shopHero: RgbTriplet;
    shopGrid: RgbTriplet;
    shopFooter: RgbTriplet;
};

export type StorefrontSettings = {
    shoppingEnabled: boolean;
    autoRedirectToShopForCustomer: boolean;
    showCartOnNavForCustomer: boolean;
};

export type ShowThemeState = {
    colors: ShowThemeColors;
};
