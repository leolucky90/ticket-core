import { COMPANY_HOME_DEFAULT_BLOCKS } from "@/features/showcase/default-template/companyHomeDefaultTemplate";
import type { BlockCtaConfig, BlockCtaVariant, BuilderTextAlign, ImageAsset, ImageAssetSourceType } from "@/features/showcase/types/builder";
import type {
    PersistedShowContentBlock,
    PersistedShowContentState,
    ShowContentBlock,
    ShowContentBlockId,
    ShowContentBodyScale,
    ShowContentFontFamily,
    ShowContentLocale,
    ShowContentLocaleMap,
    ShowContentState,
    ShowContentTitleScale,
    ShowServiceCard,
    ShowServiceImagePosition,
    ShowServiceImageStyle,
    ShowServiceRows,
} from "@/features/showcase/types/showContent";

const BLOCK_IDS: ShowContentBlockId[] = ["hero", "about", "services", "contact", "ad"];
const FONT_FAMILIES: ShowContentFontFamily[] = ["default", "serif", "mono"];
const TITLE_SCALES: ShowContentTitleScale[] = ["md", "lg", "xl"];
const BODY_SCALES: ShowContentBodyScale[] = ["sm", "md", "lg"];
const SERVICE_CARD_COUNT = 9;
const SERVICE_IMAGE_STYLES: ShowServiceImageStyle[] = ["square", "circle"];
const SERVICE_IMAGE_POSITIONS: ShowServiceImagePosition[] = ["top", "bottom", "left", "right"];
const SERVICE_ROWS: ShowServiceRows[] = [1, 2, 3];
const CTA_VARIANTS: BlockCtaVariant[] = ["solid", "outline", "ghost"];
const TEXT_ALIGNMENTS: BuilderTextAlign[] = ["left", "center", "right"];
const IMAGE_SOURCE_TYPES: ImageAssetSourceType[] = ["external_url", "storage_file"];

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createDefaultLocaleMap(locale: ShowContentLocale): ShowContentLocaleMap {
    const blocks = clone(COMPANY_HOME_DEFAULT_BLOCKS[locale]);
    const next = {} as ShowContentLocaleMap;

    for (const blockId of BLOCK_IDS) {
        const block = blocks.find((item) => item.type === blockId);
        if (!block) throw new Error(`Missing default block for ${locale}:${blockId}`);
        if (blockId === "hero") next.hero = block as ShowContentLocaleMap["hero"];
        if (blockId === "about") next.about = block as ShowContentLocaleMap["about"];
        if (blockId === "services") next.services = block as ShowContentLocaleMap["services"];
        if (blockId === "contact") next.contact = block as ShowContentLocaleMap["contact"];
        if (blockId === "ad") next.ad = block as ShowContentLocaleMap["ad"];
    }

    return next;
}

export const DEFAULT_SHOW_CONTENT_STATE: ShowContentState = {
    order: [...BLOCK_IDS],
    locale: {
        zh: createDefaultLocaleMap("zh"),
        en: createDefaultLocaleMap("en"),
    },
};

function sanitizeText(value: unknown, fallback: string): string {
    if (typeof value !== "string") return fallback;
    const next = value.trim();
    return next.length > 0 ? next : fallback;
}

function sanitizeOptionalText(value: unknown, fallback = ""): string {
    if (typeof value !== "string") return fallback;
    return value.trim();
}

function sanitizeBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === "boolean" ? value : fallback;
}

function sanitizePoints(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((line): line is string => typeof line === "string")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .slice(0, 12);
}

function sanitizeFontFamily(value: unknown, fallback: ShowContentFontFamily): ShowContentFontFamily {
    return typeof value === "string" && FONT_FAMILIES.includes(value as ShowContentFontFamily)
        ? (value as ShowContentFontFamily)
        : fallback;
}

function sanitizeTitleScale(value: unknown, fallback: ShowContentTitleScale): ShowContentTitleScale {
    return typeof value === "string" && TITLE_SCALES.includes(value as ShowContentTitleScale)
        ? (value as ShowContentTitleScale)
        : fallback;
}

function sanitizeBodyScale(value: unknown, fallback: ShowContentBodyScale): ShowContentBodyScale {
    return typeof value === "string" && BODY_SCALES.includes(value as ShowContentBodyScale)
        ? (value as ShowContentBodyScale)
        : fallback;
}

function sanitizeAlign(value: unknown, fallback: BuilderTextAlign | undefined): BuilderTextAlign | undefined {
    return typeof value === "string" && TEXT_ALIGNMENTS.includes(value as BuilderTextAlign)
        ? (value as BuilderTextAlign)
        : fallback;
}

function sanitizeServiceImageStyle(value: unknown, fallback: ShowServiceImageStyle): ShowServiceImageStyle {
    return typeof value === "string" && SERVICE_IMAGE_STYLES.includes(value as ShowServiceImageStyle)
        ? (value as ShowServiceImageStyle)
        : fallback;
}

function sanitizeServiceImagePosition(value: unknown, fallback: ShowServiceImagePosition): ShowServiceImagePosition {
    return typeof value === "string" && SERVICE_IMAGE_POSITIONS.includes(value as ShowServiceImagePosition)
        ? (value as ShowServiceImagePosition)
        : fallback;
}

function sanitizeServiceRows(value: unknown, fallback: ShowServiceRows): ShowServiceRows {
    if (typeof value === "number" && SERVICE_ROWS.includes(value as ShowServiceRows)) return value as ShowServiceRows;
    if (typeof value === "string") {
        const parsed = Number.parseInt(value, 10);
        if (SERVICE_ROWS.includes(parsed as ShowServiceRows)) return parsed as ShowServiceRows;
    }
    return fallback;
}

function sanitizeCtaVariant(value: unknown, fallback: BlockCtaVariant): BlockCtaVariant {
    return typeof value === "string" && CTA_VARIANTS.includes(value as BlockCtaVariant)
        ? (value as BlockCtaVariant)
        : fallback;
}

function sanitizeImageSourceType(value: unknown, fallback: ImageAssetSourceType): ImageAssetSourceType {
    return typeof value === "string" && IMAGE_SOURCE_TYPES.includes(value as ImageAssetSourceType)
        ? (value as ImageAssetSourceType)
        : fallback;
}

function sanitizeOrderValue(value: unknown, fallback: number): number {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function sanitizeThemeTokenOverrides(value: unknown, fallback: Record<string, string>): Record<string, string> {
    if (!isRecord(value)) return { ...fallback };

    const next: Record<string, string> = {};
    for (const [token, candidate] of Object.entries(value)) {
        if (typeof candidate !== "string") continue;
        const resolvedToken = token.trim();
        const resolvedValue = candidate.trim();
        if (!resolvedToken || !resolvedValue) continue;
        next[resolvedToken] = resolvedValue;
    }

    return Object.keys(next).length > 0 ? next : { ...fallback };
}

function sanitizeImageAsset(value: unknown, fallback: ImageAsset): ImageAsset {
    const source = isRecord(value) ? value : {};
    const legacyUrl = source.url;
    const resolvedUrl = sanitizeOptionalText(legacyUrl, fallback.url);

    return {
        sourceType: sanitizeImageSourceType(source.sourceType, fallback.sourceType),
        url: resolvedUrl,
        alt: sanitizeOptionalText(source.alt, fallback.alt ?? "") || undefined,
        storagePath: sanitizeOptionalText(source.storagePath, fallback.storagePath ?? "") || undefined,
    };
}

function normalizeServiceCards(value: unknown, fallback: ShowServiceCard[], legacyTitles?: string[]): ShowServiceCard[] {
    const source = Array.isArray(value) ? value : [];
    const legacy = (legacyTitles ?? [])
        .map((title) => title.trim())
        .filter((title) => title.length > 0)
        .slice(0, SERVICE_CARD_COUNT);

    const next: ShowServiceCard[] = [];
    for (let index = 0; index < SERVICE_CARD_COUNT; index += 1) {
        const fallbackCard = fallback[index] ?? {
            id: `service-card-${index + 1}`,
            title: legacy[index] ?? "",
            body: "",
            image: {
                sourceType: "external_url" as const,
                url: "",
            },
            imageUrl: "",
            imageStyle: "square" as const,
            imagePosition: "top" as const,
            showImage: true,
            showTitle: true,
            showBody: true,
        };
        const candidate = isRecord(source[index]) ? source[index] : {};
        const imageCandidate = isRecord(candidate.image) ? candidate.image : null;
        const imageSource = {
            sourceType: imageCandidate?.sourceType ?? "external_url",
            url: candidate.imageUrl ?? imageCandidate?.url,
            alt: imageCandidate?.alt ?? candidate.imageAlt,
            storagePath: imageCandidate?.storagePath ?? candidate.storagePath,
        };

        next.push({
            id: sanitizeText(candidate.id, fallbackCard.id),
            title: sanitizeOptionalText(candidate.title, fallbackCard.title),
            body: sanitizeOptionalText(candidate.body, fallbackCard.body),
            image: sanitizeImageAsset(imageSource, fallbackCard.image),
            imageUrl: sanitizeOptionalText(candidate.imageUrl, fallbackCard.imageUrl || fallbackCard.image.url),
            imageStyle: sanitizeServiceImageStyle(candidate.imageStyle, fallbackCard.imageStyle),
            imagePosition: sanitizeServiceImagePosition(candidate.imagePosition, fallbackCard.imagePosition),
            showImage: sanitizeBoolean(candidate.showImage, fallbackCard.showImage),
            showTitle: sanitizeBoolean(candidate.showTitle, fallbackCard.showTitle),
            showBody: sanitizeBoolean(candidate.showBody, fallbackCard.showBody),
            cta: fallbackCard.cta,
        });
    }

    return next;
}

function normalizeCtas(value: unknown, fallback: BlockCtaConfig[]): BlockCtaConfig[] {
    if (!Array.isArray(value)) return clone(fallback);

    const next: BlockCtaConfig[] = [];
    for (const [index, item] of value.entries()) {
        if (!isRecord(item)) continue;
        const fallbackItem = fallback[index] ?? {
            id: `cta-${index + 1}`,
            label: "",
            href: "",
            enabled: true,
            variant: "solid" as const,
        };
        next.push({
            id: sanitizeText(item.id, fallbackItem.id),
            label: sanitizeOptionalText(item.label, fallbackItem.label),
            href: sanitizeOptionalText(item.href, fallbackItem.href),
            enabled: sanitizeBoolean(item.enabled, fallbackItem.enabled),
            variant: sanitizeCtaVariant(item.variant, fallbackItem.variant),
            openInNewTab: sanitizeBoolean(item.openInNewTab, fallbackItem.openInNewTab ?? false),
        });
    }

    return next.length > 0 ? next : clone(fallback);
}

function normalizeStyles(value: unknown, fallback: ShowContentBlock["styles"]): ShowContentBlock["styles"] {
    const source = isRecord(value) ? value : {};
    return {
        backgroundColor: sanitizeOptionalText(source.backgroundColor, fallback.backgroundColor ?? "") || undefined,
        textColor: sanitizeOptionalText(source.textColor, fallback.textColor ?? "") || undefined,
        accentColor: sanitizeOptionalText(source.accentColor, fallback.accentColor ?? "") || undefined,
        borderColor: sanitizeOptionalText(source.borderColor, fallback.borderColor ?? "") || undefined,
        borderRadius: sanitizeOptionalText(source.borderRadius, fallback.borderRadius ?? "") || undefined,
        padding: sanitizeOptionalText(source.padding, fallback.padding ?? "") || undefined,
        align: sanitizeAlign(source.align, fallback.align),
        mutedColor: sanitizeOptionalText(source.mutedColor, fallback.mutedColor ?? "") || undefined,
        surfaceColor: sanitizeOptionalText(source.surfaceColor, fallback.surfaceColor ?? "") || undefined,
        cardBackgroundColor: sanitizeOptionalText(source.cardBackgroundColor, fallback.cardBackgroundColor ?? "") || undefined,
        summaryBackgroundColor: sanitizeOptionalText(source.summaryBackgroundColor, fallback.summaryBackgroundColor ?? "") || undefined,
    };
}

function normalizeTypography(
    value: unknown,
    fallback: ShowContentBlock["typography"],
    legacySource?: Record<string, unknown>,
): ShowContentBlock["typography"] {
    const source = isRecord(value) ? value : {};
    return {
        fontFamily: sanitizeFontFamily(source.fontFamily ?? legacySource?.fontFamily, fallback.fontFamily),
        titleScale: sanitizeTitleScale(source.titleScale ?? legacySource?.titleScale, fallback.titleScale),
        bodyScale: sanitizeBodyScale(source.bodyScale ?? legacySource?.bodyScale, fallback.bodyScale),
        kickerColor: sanitizeOptionalText(source.kickerColor, fallback.kickerColor ?? "") || undefined,
        titleColor: sanitizeOptionalText(source.titleColor, fallback.titleColor ?? "") || undefined,
        bodyColor: sanitizeOptionalText(source.bodyColor, fallback.bodyColor ?? "") || undefined,
    };
}

function normalizeSharedContent(value: unknown, fallback: ShowContentBlock["content"]) {
    const source = isRecord(value) ? value : {};
    return {
        kicker: sanitizeText(source.kicker, fallback.kicker),
        title: sanitizeText(source.title, fallback.title),
        body: sanitizeText(source.body, fallback.body),
        points: sanitizePoints(source.points),
    };
}

function normalizeBlock(
    blockId: ShowContentBlockId,
    candidate: unknown,
    fallback: ShowContentBlock,
): ShowContentBlock {
    const source = isRecord(candidate) ? candidate : {};
    const contentSource = isRecord(source.content) ? source.content : source;
    const sharedContent = normalizeSharedContent(contentSource, fallback.content);
    const rawPoints = sharedContent.points.length > 0 ? sharedContent.points : fallback.content.points;
    const normalizedStyles = normalizeStyles(source.styles, fallback.styles);
    const normalizedTypography = normalizeTypography(source.typography, fallback.typography, source);

    if (blockId === "hero") {
        const heroFallback = fallback as ShowContentLocaleMap["hero"];
        return {
            ...heroFallback,
            enabled: sanitizeBoolean(source.enabled, heroFallback.enabled),
            order: sanitizeOrderValue(source.order, heroFallback.order),
            anchor: sanitizeText(source.anchor, heroFallback.anchor),
            content: {
                ...sharedContent,
                points: rawPoints,
                summaryTitle: sanitizeText(contentSource.summaryTitle, heroFallback.content.summaryTitle),
            },
            styles: normalizedStyles,
            assets: clone(heroFallback.assets),
            ctas: normalizeCtas(source.ctas, heroFallback.ctas),
            typography: normalizedTypography,
            kicker: sharedContent.kicker,
            title: sharedContent.title,
            body: sharedContent.body,
            points: rawPoints,
            serviceCards: [],
            serviceRows: 1,
            fontFamily: normalizedTypography.fontFamily,
            titleScale: normalizedTypography.titleScale,
            bodyScale: normalizedTypography.bodyScale,
            dataSource: isRecord(source.dataSource) ? source.dataSource : clone(heroFallback.dataSource ?? {}),
            themeTokenOverrides: sanitizeThemeTokenOverrides(source.themeTokenOverrides, heroFallback.themeTokenOverrides ?? {}),
        };
    }

    if (blockId === "services") {
        const servicesFallback = fallback as ShowContentLocaleMap["services"];
        const serviceRows = sanitizeServiceRows(contentSource.serviceRows ?? source.serviceRows, servicesFallback.content.serviceRows);
        const serviceCards = normalizeServiceCards(
            contentSource.serviceCards ?? source.serviceCards,
            servicesFallback.content.serviceCards,
            rawPoints.length > 0 ? rawPoints : servicesFallback.content.points,
        );
        const visibleCardCount = serviceRows * 3;

        return {
            ...servicesFallback,
            enabled: sanitizeBoolean(source.enabled, servicesFallback.enabled),
            order: sanitizeOrderValue(source.order, servicesFallback.order),
            anchor: sanitizeText(source.anchor, servicesFallback.anchor),
            content: {
                ...sharedContent,
                points: serviceCards
                    .slice(0, visibleCardCount)
                    .map((card) => card.title.trim())
                    .filter((title) => title.length > 0)
                    .slice(0, 12),
                serviceRows,
                serviceCards,
            },
            styles: normalizedStyles,
            assets: clone(servicesFallback.assets),
            ctas: normalizeCtas(source.ctas, servicesFallback.ctas),
            typography: normalizedTypography,
            kicker: sharedContent.kicker,
            title: sharedContent.title,
            body: sharedContent.body,
            points: serviceCards
                .slice(0, visibleCardCount)
                .map((card) => card.title.trim())
                .filter((title) => title.length > 0)
                .slice(0, 12),
            serviceCards,
            serviceRows,
            fontFamily: normalizedTypography.fontFamily,
            titleScale: normalizedTypography.titleScale,
            bodyScale: normalizedTypography.bodyScale,
            dataSource: isRecord(source.dataSource) ? source.dataSource : clone(servicesFallback.dataSource ?? {}),
            themeTokenOverrides: sanitizeThemeTokenOverrides(source.themeTokenOverrides, servicesFallback.themeTokenOverrides ?? {}),
        };
    }

    if (blockId === "contact") {
        const contactFallback = fallback as ShowContentLocaleMap["contact"];
        return {
            ...contactFallback,
            enabled: sanitizeBoolean(source.enabled, contactFallback.enabled),
            order: sanitizeOrderValue(source.order, contactFallback.order),
            anchor: sanitizeText(source.anchor, contactFallback.anchor),
            content: {
                ...sharedContent,
                points: rawPoints,
                cardTitle: sanitizeText(contentSource.cardTitle, contactFallback.content.cardTitle),
                cardBody: sanitizeText(contentSource.cardBody, contactFallback.content.cardBody),
            },
            styles: normalizedStyles,
            assets: clone(contactFallback.assets),
            ctas: normalizeCtas(source.ctas, contactFallback.ctas),
            typography: normalizedTypography,
            kicker: sharedContent.kicker,
            title: sharedContent.title,
            body: sharedContent.body,
            points: rawPoints,
            serviceCards: [],
            serviceRows: 1,
            fontFamily: normalizedTypography.fontFamily,
            titleScale: normalizedTypography.titleScale,
            bodyScale: normalizedTypography.bodyScale,
            dataSource: isRecord(source.dataSource) ? source.dataSource : clone(contactFallback.dataSource ?? {}),
            themeTokenOverrides: sanitizeThemeTokenOverrides(source.themeTokenOverrides, contactFallback.themeTokenOverrides ?? {}),
        };
    }

    return {
        ...fallback,
        enabled: sanitizeBoolean(source.enabled, fallback.enabled),
        order: sanitizeOrderValue(source.order, fallback.order),
        anchor: sanitizeText(source.anchor, fallback.anchor),
        content: {
            ...sharedContent,
            points: rawPoints,
        },
        styles: normalizedStyles,
        assets: clone(fallback.assets),
        ctas: normalizeCtas(source.ctas, fallback.ctas),
        typography: normalizedTypography,
        kicker: sharedContent.kicker,
        title: sharedContent.title,
        body: sharedContent.body,
        points: rawPoints,
        serviceCards: [],
        serviceRows: 1,
        fontFamily: normalizedTypography.fontFamily,
        titleScale: normalizedTypography.titleScale,
        bodyScale: normalizedTypography.bodyScale,
        dataSource: isRecord(source.dataSource) ? source.dataSource : clone(fallback.dataSource ?? {}),
        themeTokenOverrides: sanitizeThemeTokenOverrides(source.themeTokenOverrides, fallback.themeTokenOverrides ?? {}),
    };
}

function normalizeLocaleMap(
    candidate: Partial<Record<ShowContentBlockId, unknown>> | null | undefined,
    fallback: ShowContentLocaleMap,
): ShowContentLocaleMap {
    const source = isRecord(candidate) ? candidate : {};
    return {
        hero: normalizeBlock("hero", source.hero, fallback.hero) as ShowContentLocaleMap["hero"],
        about: normalizeBlock("about", source.about, fallback.about) as ShowContentLocaleMap["about"],
        services: normalizeBlock("services", source.services, fallback.services) as ShowContentLocaleMap["services"],
        contact: normalizeBlock("contact", source.contact, fallback.contact) as ShowContentLocaleMap["contact"],
        ad: normalizeBlock("ad", source.ad, fallback.ad) as ShowContentLocaleMap["ad"],
    };
}

function deriveOrderFromLocaleMap(candidate: unknown): ShowContentBlockId[] {
    if (!isRecord(candidate)) return [...BLOCK_IDS];

    const ordered = BLOCK_IDS.map((blockId) => {
        const block = isRecord(candidate[blockId]) ? candidate[blockId] : null;
        const order = block && typeof block.order === "number" ? block.order : Number.MAX_SAFE_INTEGER;
        return { blockId, order };
    }).sort((left, right) => left.order - right.order);

    return ordered.map((item) => item.blockId);
}

function normalizeOrder(candidate: unknown, localeCandidate?: unknown): ShowContentBlockId[] {
    const source = Array.isArray(candidate) ? candidate : deriveOrderFromLocaleMap(localeCandidate);
    const next: ShowContentBlockId[] = [];

    for (const value of source) {
        if (typeof value !== "string") continue;
        if (!BLOCK_IDS.includes(value as ShowContentBlockId)) continue;
        if (next.includes(value as ShowContentBlockId)) continue;
        next.push(value as ShowContentBlockId);
    }

    for (const blockId of BLOCK_IDS) {
        if (!next.includes(blockId)) next.push(blockId);
    }

    return next;
}

function syncOrderToLocaleMap(localeMap: ShowContentLocaleMap, order: ShowContentBlockId[]): ShowContentLocaleMap {
    return {
        hero: { ...localeMap.hero, order: order.indexOf("hero") },
        about: { ...localeMap.about, order: order.indexOf("about") },
        services: { ...localeMap.services, order: order.indexOf("services") },
        contact: { ...localeMap.contact, order: order.indexOf("contact") },
        ad: { ...localeMap.ad, order: order.indexOf("ad") },
    };
}

export function normalizeShowContentState(candidate: unknown): ShowContentState {
    const source = (candidate ?? {}) as Partial<ShowContentState>;
    const order = normalizeOrder(source.order, source.locale?.zh ?? source.locale?.en);
    const zh = syncOrderToLocaleMap(normalizeLocaleMap(source.locale?.zh, DEFAULT_SHOW_CONTENT_STATE.locale.zh), order);
    const en = syncOrderToLocaleMap(normalizeLocaleMap(source.locale?.en, DEFAULT_SHOW_CONTENT_STATE.locale.en), order);

    return {
        order,
        locale: {
            zh,
            en,
        },
    };
}

function compactBlock<TType extends ShowContentBlockId>(block: ShowContentBlock<TType>): PersistedShowContentBlock<TType> {
    return {
        id: block.id,
        type: block.type,
        enabled: block.enabled,
        order: block.order,
        anchor: block.anchor,
        content: clone(block.content),
        styles: clone(block.styles),
        assets: clone(block.assets ?? {}),
        ctas: clone(block.ctas ?? []),
        typography: clone(block.typography),
        dataSource: clone(block.dataSource ?? {}),
        themeTokenOverrides: clone(block.themeTokenOverrides ?? {}),
    };
}

export function serializeShowContentState(candidate: unknown): PersistedShowContentState {
    const normalized = normalizeShowContentState(candidate);
    return {
        order: [...normalized.order],
        locale: {
            zh: {
                hero: compactBlock(normalized.locale.zh.hero),
                about: compactBlock(normalized.locale.zh.about),
                services: compactBlock(normalized.locale.zh.services),
                contact: compactBlock(normalized.locale.zh.contact),
                ad: compactBlock(normalized.locale.zh.ad),
            },
            en: {
                hero: compactBlock(normalized.locale.en.hero),
                about: compactBlock(normalized.locale.en.about),
                services: compactBlock(normalized.locale.en.services),
                contact: compactBlock(normalized.locale.en.contact),
                ad: compactBlock(normalized.locale.en.ad),
            },
        },
    };
}
