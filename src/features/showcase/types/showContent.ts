import type {
    BlockCtaConfig,
    BlockStyleConfig,
    BlockTypographyConfig,
    ImageAsset,
    StorefrontBlock,
} from "@/features/showcase/types/builder";

export type ShowContentLocale = "zh" | "en";

export type ShowContentBlockType = "hero" | "about" | "services" | "contact" | "ad";
export type ShowContentBlockId = ShowContentBlockType;

export type ShowContentFontFamily = "default" | "serif" | "mono";
export type ShowContentTitleScale = "md" | "lg" | "xl";
export type ShowContentBodyScale = "sm" | "md" | "lg";
export type ShowServiceRows = 1 | 2 | 3;
export type ShowServiceImageStyle = "square" | "circle";
export type ShowServiceImagePosition = "top" | "bottom" | "left" | "right";

export type ShowServiceCard = {
    id: string;
    title: string;
    body: string;
    image: ImageAsset;
    imageUrl: string;
    imageStyle: ShowServiceImageStyle;
    imagePosition: ShowServiceImagePosition;
    showImage: boolean;
    showTitle: boolean;
    showBody: boolean;
    cta?: BlockCtaConfig;
};

export type ShowSharedBlockContent = {
    kicker: string;
    title: string;
    body: string;
    points: string[];
};

export type ShowHeroBlockContent = ShowSharedBlockContent & {
    summaryTitle: string;
};

export type ShowServicesBlockContent = ShowSharedBlockContent & {
    serviceCards: ShowServiceCard[];
    serviceRows: ShowServiceRows;
};

export type ShowContactBlockContent = ShowSharedBlockContent & {
    cardTitle: string;
    cardBody: string;
};

export type ShowAdBlockContent = ShowSharedBlockContent;

export type ShowContentBlockContentMap = {
    hero: ShowHeroBlockContent;
    about: ShowSharedBlockContent;
    services: ShowServicesBlockContent;
    contact: ShowContactBlockContent;
    ad: ShowAdBlockContent;
};

export type ShowContentBlockStyles = BlockStyleConfig & {
    summaryBackgroundColor?: string;
};

export type ShowContentTypography = BlockTypographyConfig & {
    fontFamily: ShowContentFontFamily;
    titleScale: ShowContentTitleScale;
    bodyScale: ShowContentBodyScale;
};

export type ShowContentBlock<TType extends ShowContentBlockType = ShowContentBlockType> = StorefrontBlock<
    TType,
    ShowContentBlockContentMap[TType],
    ShowContentBlockStyles
> & {
    anchor: string;
    assets: Record<string, ImageAsset | ImageAsset[] | undefined>;
    ctas: BlockCtaConfig[];
    typography: ShowContentTypography;
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

export type PersistedShowContentBlock<TType extends ShowContentBlockType = ShowContentBlockType> = StorefrontBlock<
    TType,
    ShowContentBlockContentMap[TType],
    ShowContentBlockStyles
> & {
    anchor: string;
    assets: Record<string, ImageAsset | ImageAsset[] | undefined>;
    ctas: BlockCtaConfig[];
    typography: ShowContentTypography;
};

export type ShowContentLocaleMap = {
    [K in ShowContentBlockType]: ShowContentBlock<K>;
};

export type PersistedShowContentLocaleMap = {
    [K in ShowContentBlockType]: PersistedShowContentBlock<K>;
};

export type ShowContentState = {
    order: ShowContentBlockId[];
    locale: Record<ShowContentLocale, ShowContentLocaleMap>;
};

export type PersistedShowContentState = {
    order: ShowContentBlockId[];
    locale: Record<ShowContentLocale, PersistedShowContentLocaleMap>;
};
