import type { BlockCtaConfig, BlockCtaVariant, BuilderTextAlign, ImageAsset, ImageAssetSourceType } from "@/features/showcase/types/builder";
import { createShowcaseBlock, getShowcaseDefaultBlocks } from "@/features/showcase/services/showBlockRegistry";
import type {
    PersistedShowContentBlock,
    PersistedShowContentState,
    ShowContentBlock,
    ShowContentBlockId,
    ShowContentBlockType,
    ShowContentBlockVariant,
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

const BLOCK_TYPES: ShowContentBlockType[] = ["hero", "about", "services", "contact", "ad", "cta", "promo"];
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
const BLOCK_VARIANTS: ShowContentBlockVariant[] = ["default", "left-copy", "center-copy", "split-screen", "single-banner", "slider", "card-rail"];

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function inferBlockType(value: unknown): ShowContentBlockType | null {
    if (typeof value !== "string") return null;
    if (BLOCK_TYPES.includes(value as ShowContentBlockType)) return value as ShowContentBlockType;
    return BLOCK_TYPES.find((type) => value === type || value.startsWith(`${type}-`)) ?? null;
}

function createDefaultLocaleMap(locale: ShowContentLocale): ShowContentLocaleMap {
    const next: ShowContentLocaleMap = {};
    for (const block of getShowcaseDefaultBlocks(locale)) {
        next[block.id] = block;
    }
    return next;
}

export const DEFAULT_SHOW_CONTENT_STATE: ShowContentState = {
    order: getShowcaseDefaultBlocks("zh").map((block) => block.id),
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

function sanitizeVariant(value: unknown, fallback: ShowContentBlockVariant): ShowContentBlockVariant {
    return typeof value === "string" && BLOCK_VARIANTS.includes(value as ShowContentBlockVariant)
        ? (value as ShowContentBlockVariant)
        : fallback;
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
    const resolvedUrl = sanitizeOptionalText(source.url, fallback.url);
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
            image: { sourceType: "external_url" as const, url: "" },
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

function normalizeTypography(value: unknown, fallback: ShowContentBlock["typography"], legacySource?: Record<string, unknown>): ShowContentBlock["typography"] {
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

function normalizeBlock(id: string, candidate: unknown, fallback: ShowContentBlock): ShowContentBlock {
    const source = isRecord(candidate) ? candidate : {};
    const contentSource = isRecord(source.content) ? source.content : source;
    const sharedContent = normalizeSharedContent(contentSource, fallback.content);
    const rawPoints = sharedContent.points.length > 0 ? sharedContent.points : fallback.content.points;
    const normalizedStyles = normalizeStyles(source.styles, fallback.styles);
    const normalizedTypography = normalizeTypography(source.typography, fallback.typography, source);
    const resolvedType = inferBlockType(source.type) ?? fallback.type;

    if (resolvedType === "hero") {
        return {
            ...fallback,
            id,
            type: "hero",
            enabled: sanitizeBoolean(source.enabled, fallback.enabled),
            order: sanitizeOrderValue(source.order, fallback.order),
            anchor: sanitizeText(source.anchor, fallback.anchor),
            variant: sanitizeVariant(source.variant, fallback.variant),
            content: {
                ...sharedContent,
                points: rawPoints,
                summaryTitle: sanitizeText(contentSource.summaryTitle, (fallback.content as ShowContentBlock<"hero">["content"]).summaryTitle),
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

    if (resolvedType === "services") {
        const serviceRows = sanitizeServiceRows(contentSource.serviceRows ?? source.serviceRows, (fallback.content as ShowContentBlock<"services">["content"]).serviceRows);
        const serviceCards = normalizeServiceCards(
            contentSource.serviceCards ?? source.serviceCards,
            (fallback.content as ShowContentBlock<"services">["content"]).serviceCards,
            rawPoints.length > 0 ? rawPoints : fallback.content.points,
        );
        const visibleCardCount = serviceRows * 3;
        const derivedPoints = serviceCards
            .slice(0, visibleCardCount)
            .map((card) => card.title.trim())
            .filter((title) => title.length > 0)
            .slice(0, 12);

        return {
            ...fallback,
            id,
            type: "services",
            enabled: sanitizeBoolean(source.enabled, fallback.enabled),
            order: sanitizeOrderValue(source.order, fallback.order),
            anchor: sanitizeText(source.anchor, fallback.anchor),
            variant: sanitizeVariant(source.variant, fallback.variant),
            content: {
                ...sharedContent,
                points: derivedPoints,
                serviceRows,
                serviceCards,
            },
            styles: normalizedStyles,
            assets: clone(fallback.assets),
            ctas: normalizeCtas(source.ctas, fallback.ctas),
            typography: normalizedTypography,
            kicker: sharedContent.kicker,
            title: sharedContent.title,
            body: sharedContent.body,
            points: derivedPoints,
            serviceCards,
            serviceRows,
            fontFamily: normalizedTypography.fontFamily,
            titleScale: normalizedTypography.titleScale,
            bodyScale: normalizedTypography.bodyScale,
            dataSource: isRecord(source.dataSource) ? source.dataSource : clone(fallback.dataSource ?? {}),
            themeTokenOverrides: sanitizeThemeTokenOverrides(source.themeTokenOverrides, fallback.themeTokenOverrides ?? {}),
        };
    }

    if (resolvedType === "contact") {
        return {
            ...fallback,
            id,
            type: "contact",
            enabled: sanitizeBoolean(source.enabled, fallback.enabled),
            order: sanitizeOrderValue(source.order, fallback.order),
            anchor: sanitizeText(source.anchor, fallback.anchor),
            variant: sanitizeVariant(source.variant, fallback.variant),
            content: {
                ...sharedContent,
                points: rawPoints,
                cardTitle: sanitizeText(contentSource.cardTitle, (fallback.content as ShowContentBlock<"contact">["content"]).cardTitle),
                cardBody: sanitizeText(contentSource.cardBody, (fallback.content as ShowContentBlock<"contact">["content"]).cardBody),
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

    return {
        ...fallback,
        id,
        type: resolvedType,
        enabled: sanitizeBoolean(source.enabled, fallback.enabled),
        order: sanitizeOrderValue(source.order, fallback.order),
        anchor: sanitizeText(source.anchor, fallback.anchor),
        variant: sanitizeVariant(source.variant, fallback.variant),
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

function normalizeLocaleMap(candidate: unknown, locale: ShowContentLocale): ShowContentLocaleMap {
    const source = isRecord(candidate) ? candidate : {};
    const defaults = createDefaultLocaleMap(locale);
    const next: ShowContentLocaleMap = {};

    for (const [id, value] of Object.entries(source)) {
        if (!isRecord(value)) continue;
        const resolvedType = inferBlockType(value.type ?? id);
        if (!resolvedType) continue;
        const fallback = defaults[id] ?? createShowcaseBlock(locale, resolvedType, id, Number.MAX_SAFE_INTEGER);
        next[id] = normalizeBlock(id, value, fallback);
    }

    for (const [id, fallback] of Object.entries(defaults)) {
        if (!next[id]) {
            next[id] = clone(fallback);
        }
    }

    return next;
}

function deriveOrderFromLocaleMap(candidate: unknown): ShowContentBlockId[] {
    if (!isRecord(candidate)) return [...DEFAULT_SHOW_CONTENT_STATE.order];
    return Object.entries(candidate)
        .filter(([, value]) => isRecord(value))
        .map(([id, value]) => {
            const block = value as Record<string, unknown>;
            return {
            id,
            order: typeof block.order === "number" ? block.order : Number.MAX_SAFE_INTEGER,
        };
        })
        .sort((left, right) => left.order - right.order)
        .map((item) => item.id);
}

function normalizeOrder(candidate: unknown, availableIds: ShowContentBlockId[], localeCandidates: unknown[]): ShowContentBlockId[] {
    const derived = localeCandidates.flatMap((localeCandidate) => deriveOrderFromLocaleMap(localeCandidate));
    const source = Array.isArray(candidate) ? candidate : derived;
    const next: ShowContentBlockId[] = [];

    for (const value of source) {
        if (typeof value !== "string") continue;
        if (!availableIds.includes(value)) continue;
        if (next.includes(value)) continue;
        next.push(value);
    }

    for (const id of availableIds) {
        if (!next.includes(id)) next.push(id);
    }

    return next;
}

function ensureLocaleOrder(localeMap: ShowContentLocaleMap, order: ShowContentBlockId[], locale: ShowContentLocale, peer?: ShowContentLocaleMap): ShowContentLocaleMap {
    const next: ShowContentLocaleMap = {};
    for (const [index, id] of order.entries()) {
        const current = localeMap[id];
        const peerType = peer?.[id]?.type;
        const resolved = current ?? createShowcaseBlock(locale, peerType ?? inferBlockType(id) ?? "promo", id, index);
        next[id] = { ...resolved, order: index };
    }
    return next;
}

export function normalizeShowContentState(candidate: unknown): ShowContentState {
    const source = (candidate ?? {}) as Partial<ShowContentState>;
    const zhBase = normalizeLocaleMap(source.locale?.zh, "zh");
    const enBase = normalizeLocaleMap(source.locale?.en, "en");
    const availableIds = Array.from(new Set([...Object.keys(zhBase), ...Object.keys(enBase), ...DEFAULT_SHOW_CONTENT_STATE.order]));
    const order = normalizeOrder(source.order, availableIds, [source.locale?.zh, source.locale?.en]);
    const zh = ensureLocaleOrder(zhBase, order, "zh", enBase);
    const en = ensureLocaleOrder(enBase, order, "en", zhBase);

    return {
        order,
        locale: { zh, en },
    };
}

function compactBlock<TType extends ShowContentBlockType>(block: ShowContentBlock<TType>): PersistedShowContentBlock<TType> {
    return {
        id: block.id,
        type: block.type,
        enabled: block.enabled,
        order: block.order,
        anchor: block.anchor,
        variant: block.variant,
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
    const compactLocaleMap = (localeMap: ShowContentLocaleMap) =>
        Object.fromEntries(Object.entries(localeMap).map(([id, block]) => [id, compactBlock(block)]));

    return {
        order: [...normalized.order],
        locale: {
            zh: compactLocaleMap(normalized.locale.zh),
            en: compactLocaleMap(normalized.locale.en),
        },
    };
}
