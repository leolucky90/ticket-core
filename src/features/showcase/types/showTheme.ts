import type { RgbTriplet } from "@/lib/types/theme";

export type ShowThemeColorRole =
    | "page"
    | "header"
    | "hero"
    | "about"
    | "services"
    | "contact"
    | "ad"
    | "footer";

export type ShowThemeColors = {
    page: RgbTriplet;
    header: RgbTriplet;
    hero: RgbTriplet;
    about: RgbTriplet;
    services: RgbTriplet;
    contact: RgbTriplet;
    ad: RgbTriplet;
    footer: RgbTriplet;
};

export type ShowThemeState = {
    colors: ShowThemeColors;
};
