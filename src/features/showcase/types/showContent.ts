export type ShowContentLocale = "zh" | "en";

export type ShowContentBlockId = "hero" | "about" | "services" | "contact" | "ad";

export type ShowContentFontFamily = "default" | "serif" | "mono";
export type ShowContentTitleScale = "md" | "lg" | "xl";
export type ShowContentBodyScale = "sm" | "md" | "lg";
export type ShowServiceRows = 1 | 2 | 3;
export type ShowServiceImageStyle = "square" | "circle";
export type ShowServiceImagePosition = "top" | "bottom" | "left" | "right";

export type ShowServiceCard = {
    title: string;
    body: string;
    imageUrl: string;
    imageStyle: ShowServiceImageStyle;
    imagePosition: ShowServiceImagePosition;
    showImage: boolean;
    showTitle: boolean;
    showBody: boolean;
};

export type ShowContentBlock = {
    enabled: boolean;
    kicker: string;
    title: string;
    body: string;
    points: string[];
    serviceCards: ShowServiceCard[];
    serviceRows: ShowServiceRows;
    fontFamily: ShowContentFontFamily;
    titleScale: ShowContentTitleScale;
    bodyScale: ShowContentBodyScale;
};

export type ShowContentLocaleMap = Record<ShowContentBlockId, ShowContentBlock>;

export type ShowContentState = {
    order: ShowContentBlockId[];
    locale: Record<ShowContentLocale, ShowContentLocaleMap>;
};
