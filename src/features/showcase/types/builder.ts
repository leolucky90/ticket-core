export type BuilderTextAlign = "left" | "center" | "right";

export type ImageAssetSourceType = "external_url" | "storage_file";

export type ImageAsset = {
    sourceType: ImageAssetSourceType;
    url: string;
    alt?: string;
    storagePath?: string;
};

export type BlockStyleConfig = {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    borderColor?: string;
    borderRadius?: string;
    padding?: string;
    align?: BuilderTextAlign;
    mutedColor?: string;
    surfaceColor?: string;
    cardBackgroundColor?: string;
};

export type BlockCtaVariant = "solid" | "outline" | "ghost";

export type BlockCtaConfig = {
    id: string;
    label: string;
    href: string;
    enabled: boolean;
    variant: BlockCtaVariant;
    openInNewTab?: boolean;
};

export type BlockTypographyConfig = {
    fontFamily?: string;
    titleScale?: string;
    bodyScale?: string;
    kickerColor?: string;
    titleColor?: string;
    bodyColor?: string;
};

export type ThemeTokenOverrideMap = Record<string, string>;

export type StorefrontBlock<
    TType extends string = string,
    TContent extends Record<string, unknown> = Record<string, unknown>,
    TStyles extends BlockStyleConfig = BlockStyleConfig,
> = {
    id: string;
    type: TType;
    enabled: boolean;
    order: number;
    anchor?: string;
    content: TContent;
    styles: TStyles;
    assets?: Record<string, ImageAsset | ImageAsset[] | undefined>;
    ctas?: BlockCtaConfig[];
    typography?: BlockTypographyConfig;
    dataSource?: Record<string, unknown>;
    themeTokenOverrides?: ThemeTokenOverrideMap;
};
