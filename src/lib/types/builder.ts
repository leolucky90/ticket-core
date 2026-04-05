/**
 * Structured homepage builder types for official site vs tenant storefront.
 * CMS / Firebase config can deserialize into these shapes without touching commerce compatibility barrels.
 */

export type BuilderSiteType = "official" | "tenant";

export type BuilderThemeVariant = "official" | "neutral";

export type BuilderMediaStorageProvider = "external-url" | "firebase-storage" | "cloudinary" | "s3";

export type BuilderMediaAsset = {
    id: string;
    url: string;
    storageProvider?: BuilderMediaStorageProvider;
    mimeTypeHint?: "image" | "video";
    alt?: string;
};

export type BuilderActionLink = {
    label: string;
    href: string;
    openInNewTab?: boolean;
    variant?: "primary" | "secondary" | "ghost";
};

export type BuilderCarouselSlide = {
    id: string;
    title: string;
    description: string;
    buttonText: string;
    buttonHref: string;
    desktopImageUrl: string;
    mobileImageUrl: string;
    overlayEnabled: boolean;
    /** 0–1 normalized; rendering maps to theme-safe opacity. */
    overlayStrength: number;
    isActive: boolean;
    openInNewTab: boolean;
    /** ISO datetime; optional scheduling — full enforcement is backend-owned. */
    startAt?: string | null;
    endAt?: string | null;
};

export type BuilderCarouselConfig = {
    enabled: boolean;
    autoplay: boolean;
    intervalMs: number;
    showArrows: boolean;
    showDots: boolean;
    pauseOnHover: boolean;
    /** Default `panel`; official homepage can use `inline` to keep copy inside the image composition. */
    contentPresentation?: HeroContentPresentation;
    slides: BuilderCarouselSlide[];
};

export type HeroBackgroundType = "image" | "video" | "animated" | "none";

export type HeroContentAlign = "left" | "center" | "right";

export type HeroTextAlign = "left" | "center" | "right";

export type HeroHeightVariant = "compact" | "standard" | "tall" | "screen";

export type HeroAnimatedVariant = "gradient" | "blobs" | "layers";

/** Controls hero copy panel width; keeps background visible on marketing pages. */
export type HeroContentPanelSize = "sm" | "md" | "lg";

/** Controls whether hero copy floats on media directly or sits inside a glass panel. */
export type HeroContentPresentation = "panel" | "inline";

export type HeroBackgroundMediaConfig = {
    enabled: boolean;
    backgroundType: HeroBackgroundType;
    height: HeroHeightVariant;
    contentAlign: HeroContentAlign;
    textAlign: HeroTextAlign;
    /** Default `md`; use `sm` for proposal / portfolio heroes with large media. */
    contentPanelSize?: HeroContentPanelSize;
    /** Default `panel`; official portfolio hero can use `inline` to avoid boxed copy over imagery. */
    contentPresentation?: HeroContentPresentation;
    /** 0–1; mapped to overlay opacity classes. */
    overlayStrength: number;
    imageUrl?: string;
    videoUrl?: string;
    posterUrl?: string;
    animatedVariant?: HeroAnimatedVariant;
    eyebrow: string;
    title: string;
    description: string;
    primaryAction?: BuilderActionLink | null;
    secondaryAction?: BuilderActionLink | null;
};

/** Single homepage scope (official marketing `/` or tenant public `/{tenantId}`). */
export type BuilderHomepageConfig = {
    siteType: BuilderSiteType;
    themeVariant: BuilderThemeVariant;
    /** Reserved for future drag-order; section ids such as `hero`, `carousel`. */
    sectionOrder: string[];
    sectionsEnabled: Record<string, boolean>;
    hero: HeroBackgroundMediaConfig;
    carousel: BuilderCarouselConfig;
};

/** Root document holding both scopes (e.g. Firestore `app_config/builder` shape). */
export type BuilderSiteConfig = {
    officialSite: BuilderHomepageConfig;
    tenantSite: BuilderHomepageConfig;
};
