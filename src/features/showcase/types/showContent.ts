export type ShowContentLocale = "zh" | "en";

export type ShowContentBlockId = "hero" | "about" | "services" | "contact" | "ad";

export type ShowContentFontFamily = "default" | "serif" | "mono";
export type ShowContentTitleScale = "md" | "lg" | "xl";
export type ShowContentBodyScale = "sm" | "md" | "lg";

export type ShowContentBlock = {
    enabled: boolean;
    kicker: string;
    title: string;
    body: string;
    points: string[];
    fontFamily: ShowContentFontFamily;
    titleScale: ShowContentTitleScale;
    bodyScale: ShowContentBodyScale;
};

export type ShowContentLocaleMap = Record<ShowContentBlockId, ShowContentBlock>;

export type ShowContentState = {
    order: ShowContentBlockId[];
    locale: Record<ShowContentLocale, ShowContentLocaleMap>;
};
