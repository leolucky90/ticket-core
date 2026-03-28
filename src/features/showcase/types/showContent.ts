import type {
    BlockCtaConfig,
    BlockStyleConfig,
    BlockTypographyConfig,
    ImageAsset,
    StorefrontBlock,
} from "@/features/showcase/types/builder";

export type ShowContentLocale = "zh" | "en";

export type ShowContentTemplateType = "hero" | "about" | "services" | "contact" | "ad" | "cta" | "promo";
export type ShowContentBlockType = ShowContentTemplateType;
export type ShowContentBlockId = string;

export type ShowContentHeroVariant = "left-copy" | "center-copy" | "split-screen";
export type ShowContentAdVariant = "single-banner" | "slider" | "card-rail";
export type ShowContentBlockVariant = "default" | ShowContentHeroVariant | ShowContentAdVariant;

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
    cta: ShowSharedBlockContent;
    promo: ShowSharedBlockContent;
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
    variant: ShowContentBlockVariant;
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
    variant?: ShowContentBlockVariant;
};

export type ShowContentLocaleMap = Record<ShowContentBlockId, ShowContentBlock>;

export type PersistedShowContentLocaleMap = Record<ShowContentBlockId, PersistedShowContentBlock>;

export type ShowContentState = {
    order: ShowContentBlockId[];
    locale: Record<ShowContentLocale, ShowContentLocaleMap>;
};

export type PersistedShowContentState = {
    order: ShowContentBlockId[];
    locale: Record<ShowContentLocale, PersistedShowContentLocaleMap>;
};
