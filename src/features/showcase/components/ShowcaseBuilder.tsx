"use client";

import Image from "next/image";
import { type DragEvent, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ShowHomePage } from "@/features/showcase/components/ShowHomePage";
import { DEFAULT_SHOW_CONTENT_STATE, normalizeShowContentState } from "@/features/showcase/services/showContentPreferences";
import {
    DEFAULT_SHOW_THEME_COLORS,
    DEFAULT_STOREFRONT_SETTINGS,
    normalizeShowThemeColors,
    normalizeStorefrontSettings,
} from "@/features/showcase/services/showThemePreferences";
import type { BlockCtaVariant, BuilderTextAlign, ImageAssetSourceType } from "@/features/showcase/types/builder";
import type {
    ShowContactBlockContent,
    ShowContentBlock,
    ShowContentBlockId,
    ShowContentBodyScale,
    ShowContentFontFamily,
    ShowContentLocale,
    ShowContentState,
    ShowContentTitleScale,
    ShowHeroBlockContent,
    ShowServiceCard,
    ShowServiceImagePosition,
    ShowServiceImageStyle,
    ShowServiceRows,
    ShowServicesBlockContent,
} from "@/features/showcase/types/showContent";
import type { ShowThemeColorRole, ShowThemeColors, StorefrontSettings } from "@/features/showcase/types/showTheme";

type ShowcaseBuilderLabels = {
    title: string;
    hint: string;
    save: string;
    saving: string;
    saved: string;
    saveFailed: string;
    saveFailedWithReason: string;
    resetAll: string;
    resetBlock: string;
    resetTheme: string;
    localeZh: string;
    localeEn: string;
    audienceLabel: string;
    audienceGuest: string;
    audienceCompany: string;
    audienceCustomer: string;
    viewportLabel: string;
    viewportDesktop: string;
    viewportMobile: string;
    usingDefaultTemplate: string;
    orderHint: string;
    dragHint: string;
    enabled: string;
    hidden: string;
    moveUp: string;
    moveDown: string;
    sectionListTitle: string;
    previewTitle: string;
    inspectorTitle: string;
    libraryTitle: string;
    libraryHint: string;
    libraryInUse: string;
    libraryFixed: string;
    fieldAnchor: string;
    fieldKicker: string;
    fieldTitle: string;
    fieldBody: string;
    fieldHeroSummaryTitle: string;
    fieldContactCardTitle: string;
    fieldContactCardBody: string;
    fieldPoints: string;
    pointsHint: string;
    fieldFontFamily: string;
    fieldTitleScale: string;
    fieldBodyScale: string;
    fieldServiceCards: string;
    fieldServiceRows: string;
    fieldServiceCardTitle: string;
    fieldServiceCardBody: string;
    fieldServiceCardImage: string;
    fieldServiceCardImageUrl: string;
    fieldServiceCardImageSourceType: string;
    fieldServiceCardStoragePath: string;
    fieldServiceCardImageStyle: string;
    fieldServiceCardImagePosition: string;
    fieldServiceCardShowImage: string;
    fieldServiceCardShowTitle: string;
    fieldServiceCardShowBody: string;
    uploadImage: string;
    confirmUploadImage: string;
    selectedImage: string;
    imageUploadSuccess: string;
    uploadingImage: string;
    clearImage: string;
    imageUploadFailed: string;
    optionImageSquare: string;
    optionImageCircle: string;
    optionImageTop: string;
    optionImageBottom: string;
    optionImageLeft: string;
    optionImageRight: string;
    optionImageSourceExternal: string;
    optionImageSourceStorage: string;
    optionServiceRows1: string;
    optionServiceRows2: string;
    optionServiceRows3: string;
    optionFontDefault: string;
    optionFontSerif: string;
    optionFontMono: string;
    optionTitleMd: string;
    optionTitleLg: string;
    optionTitleXl: string;
    optionBodySm: string;
    optionBodyMd: string;
    optionBodyLg: string;
    styleSectionTitle: string;
    styleBackgroundColor: string;
    styleTextColor: string;
    styleAccentColor: string;
    styleBorderColor: string;
    styleMutedColor: string;
    styleSurfaceColor: string;
    styleCardBackgroundColor: string;
    styleSummaryBackgroundColor: string;
    styleBorderRadius: string;
    stylePadding: string;
    styleAlign: string;
    optionAlignLeft: string;
    optionAlignCenter: string;
    optionAlignRight: string;
    typographySectionTitle: string;
    typographyKickerColor: string;
    typographyTitleColor: string;
    typographyBodyColor: string;
    ctaSectionTitle: string;
    ctaLabel: string;
    ctaHref: string;
    ctaVariant: string;
    ctaOpenInNewTab: string;
    optionCtaSolid: string;
    optionCtaOutline: string;
    optionCtaGhost: string;
    themeOverrideSectionTitle: string;
    themeOverrideHint: string;
    themeOverridePlaceholder: string;
    themeSectionTitle: string;
    themeCustomColor: string;
    storefrontTitle: string;
    storefrontHint: string;
    storefrontShoppingEnabled: string;
    storefrontAutoRedirect: string;
    storefrontShowCart: string;
    schemaSectionTitle: string;
    schemaHint: string;
    rolePage: string;
    roleHeader: string;
    roleHero: string;
    roleAbout: string;
    roleServices: string;
    roleContact: string;
    roleAd: string;
    roleFooter: string;
    roleShopPage: string;
    roleShopHeader: string;
    roleShopHero: string;
    roleShopGrid: string;
    roleShopFooter: string;
    blockHero: string;
    blockAbout: string;
    blockServices: string;
    blockContact: string;
    blockAd: string;
};

type ShowcaseBuilderProps = {
    labels: ShowcaseBuilderLabels;
    initialContent: ShowContentState;
    initialThemeColors: ShowThemeColors;
    initialStorefront: StorefrontSettings;
    tenantId?: string | null;
    hasSavedPreferences?: boolean;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";
type PreviewAudience = "guest" | "company" | "customer";
type PreviewViewport = "desktop" | "mobile";

type UploadImageResponse = {
    url?: string;
    error?: string;
};

const BLOCK_IDS: ShowContentBlockId[] = ["hero", "about", "services", "contact", "ad"];
const SERVICE_CARD_COUNT = 9;
const THEME_ROLES: ShowThemeColorRole[] = [
    "page",
    "header",
    "hero",
    "about",
    "services",
    "contact",
    "ad",
    "footer",
    "shopPage",
    "shopHeader",
    "shopHero",
    "shopGrid",
    "shopFooter",
];

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

function isBlockId(value: string): value is ShowContentBlockId {
    return BLOCK_IDS.includes(value as ShowContentBlockId);
}

function toPoints(value: string): string[] {
    return value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

function serializeThemeTokenOverrides(value: Record<string, string> | undefined): string {
    return Object.entries(value ?? {})
        .map(([token, resolvedValue]) => `${token}=${resolvedValue}`)
        .join("\n");
}

function parseThemeTokenOverrides(value: string): Record<string, string> {
    const next: Record<string, string> = {};
    for (const rawLine of value.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        const separatorIndex = line.indexOf("=");
        if (separatorIndex === -1) continue;
        const token = line.slice(0, separatorIndex).trim();
        const resolvedValue = line.slice(separatorIndex + 1).trim();
        if (!token || !resolvedValue) continue;
        next[token] = resolvedValue;
    }
    return next;
}

function buildDefaultServiceCard(index: number): ShowServiceCard {
    return {
        id: `service-card-${index + 1}`,
        title: "",
        body: "",
        image: {
            sourceType: "external_url",
            url: "",
        },
        imageUrl: "",
        imageStyle: "square",
        imagePosition: "top",
        showImage: true,
        showTitle: true,
        showBody: true,
    };
}

function ensureServiceCards(cards: ShowServiceCard[] | undefined): ShowServiceCard[] {
    return Array.from({ length: SERVICE_CARD_COUNT }, (_, index) => cards?.[index] ?? buildDefaultServiceCard(index));
}

function hexToRgbTriplet(hex: string): `${number} ${number} ${number}` {
    const normalized = hex.replace("#", "");
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    return `${r} ${g} ${b}`;
}

function clampColor(value: number): number {
    if (!Number.isFinite(value)) return 0;
    if (value < 0) return 0;
    if (value > 255) return 255;
    return Math.round(value);
}

function rgbTripletToHexString(rgb: `${number} ${number} ${number}`): string {
    const [rRaw, gRaw, bRaw] = rgb.split(" ").map((part) => Number.parseInt(part, 10));
    const toHex = (value: number) => clampColor(value).toString(16).padStart(2, "0");
    return `#${toHex(rRaw)}${toHex(gRaw)}${toHex(bRaw)}`;
}

export function ShowcaseBuilder({
    labels,
    initialContent,
    initialThemeColors,
    initialStorefront,
    tenantId = null,
    hasSavedPreferences = true,
}: ShowcaseBuilderProps) {
    const [contentState, setContentState] = useState<ShowContentState>(() => normalizeShowContentState(initialContent));
    const [themeColors, setThemeColors] = useState<ShowThemeColors>(() => normalizeShowThemeColors(initialThemeColors));
    const [storefront, setStorefront] = useState<StorefrontSettings>(() => normalizeStorefrontSettings(initialStorefront));
    const [locale, setLocale] = useState<ShowContentLocale>("zh");
    const [activeBlockId, setActiveBlockId] = useState<ShowContentBlockId>("hero");
    const [dragging, setDragging] = useState<ShowContentBlockId | null>(null);
    const [dragOver, setDragOver] = useState<ShowContentBlockId | null>(null);
    const [previewAudience, setPreviewAudience] = useState<PreviewAudience>("guest");
    const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const [saveErrorDetail, setSaveErrorDetail] = useState("");
    const [uploadingCardIndex, setUploadingCardIndex] = useState<number | null>(null);
    const [uploadErrorByCard, setUploadErrorByCard] = useState<Record<number, string>>({});
    const [uploadSuccessByCard, setUploadSuccessByCard] = useState<Record<number, string>>({});
    const [selectedUploadFiles, setSelectedUploadFiles] = useState<Record<number, File | null>>({});
    const [selectedPreviewByCard, setSelectedPreviewByCard] = useState<Record<number, string>>({});
    const serviceImageInputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const currentBlock = contentState.locale[locale][activeBlockId];
    const currentSharedContent = currentBlock.content;
    const currentHeroContent = activeBlockId === "hero" ? (currentBlock.content as ShowHeroBlockContent) : null;
    const currentContactContent = activeBlockId === "contact" ? (currentBlock.content as ShowContactBlockContent) : null;
    const currentServicesContent = activeBlockId === "services" ? (currentBlock.content as ShowServicesBlockContent) : null;

    const blockNameMap: Record<ShowContentBlockId, string> = {
        hero: labels.blockHero,
        about: labels.blockAbout,
        services: labels.blockServices,
        contact: labels.blockContact,
        ad: labels.blockAd,
    };

    const roleLabels: Record<ShowThemeColorRole, string> = {
        page: labels.rolePage,
        header: labels.roleHeader,
        hero: labels.roleHero,
        about: labels.roleAbout,
        services: labels.roleServices,
        contact: labels.roleContact,
        ad: labels.roleAd,
        footer: labels.roleFooter,
        shopPage: labels.roleShopPage,
        shopHeader: labels.roleShopHeader,
        shopHero: labels.roleShopHero,
        shopGrid: labels.roleShopGrid,
        shopFooter: labels.roleShopFooter,
    };

    const fontOptions: Array<{ value: ShowContentFontFamily; label: string }> = [
        { value: "default", label: labels.optionFontDefault },
        { value: "serif", label: labels.optionFontSerif },
        { value: "mono", label: labels.optionFontMono },
    ];
    const titleScaleOptions: Array<{ value: ShowContentTitleScale; label: string }> = [
        { value: "md", label: labels.optionTitleMd },
        { value: "lg", label: labels.optionTitleLg },
        { value: "xl", label: labels.optionTitleXl },
    ];
    const bodyScaleOptions: Array<{ value: ShowContentBodyScale; label: string }> = [
        { value: "sm", label: labels.optionBodySm },
        { value: "md", label: labels.optionBodyMd },
        { value: "lg", label: labels.optionBodyLg },
    ];
    const imageStyleOptions: Array<{ value: ShowServiceImageStyle; label: string }> = [
        { value: "square", label: labels.optionImageSquare },
        { value: "circle", label: labels.optionImageCircle },
    ];
    const imagePositionOptions: Array<{ value: ShowServiceImagePosition; label: string }> = [
        { value: "top", label: labels.optionImageTop },
        { value: "bottom", label: labels.optionImageBottom },
        { value: "left", label: labels.optionImageLeft },
        { value: "right", label: labels.optionImageRight },
    ];
    const imageSourceTypeOptions: Array<{ value: ImageAssetSourceType; label: string }> = [
        { value: "external_url", label: labels.optionImageSourceExternal },
        { value: "storage_file", label: labels.optionImageSourceStorage },
    ];
    const serviceRowOptions: Array<{ value: ShowServiceRows; label: string }> = [
        { value: 1, label: labels.optionServiceRows1 },
        { value: 2, label: labels.optionServiceRows2 },
        { value: 3, label: labels.optionServiceRows3 },
    ];
    const alignOptions: Array<{ value: BuilderTextAlign; label: string }> = [
        { value: "left", label: labels.optionAlignLeft },
        { value: "center", label: labels.optionAlignCenter },
        { value: "right", label: labels.optionAlignRight },
    ];
    const ctaVariantOptions: Array<{ value: BlockCtaVariant; label: string }> = [
        { value: "solid", label: labels.optionCtaSolid },
        { value: "outline", label: labels.optionCtaOutline },
        { value: "ghost", label: labels.optionCtaGhost },
    ];

    const saveStatusText = useMemo(() => {
        if (saveStatus === "saving") return labels.saving;
        if (saveStatus === "saved") return labels.saved;
        if (saveStatus === "error") {
            return saveErrorDetail ? `${labels.saveFailedWithReason}: ${saveErrorDetail}` : labels.saveFailed;
        }
        return "";
    }, [labels.saveFailed, labels.saveFailedWithReason, labels.saved, labels.saving, saveErrorDetail, saveStatus]);

    const visibleServiceCards =
        activeBlockId === "services" && currentServicesContent
            ? ensureServiceCards(currentServicesContent.serviceCards).slice(0, currentServicesContent.serviceRows * 3)
            : [];

    function resetSaveState() {
        setSaveStatus("idle");
        setSaveErrorDetail("");
    }

    function updateCurrentBlock(patch: Partial<ShowContentBlock>) {
        resetSaveState();
        setContentState((prev) => ({
            ...prev,
            locale: {
                ...prev.locale,
                [locale]: {
                    ...prev.locale[locale],
                    [activeBlockId]: {
                        ...prev.locale[locale][activeBlockId],
                        ...patch,
                    },
                },
            },
        }));
    }

    function updateCurrentBlockContent(patch: Partial<typeof currentBlock.content>) {
        resetSaveState();
        setContentState((prev) => {
            const block = prev.locale[locale][activeBlockId];
            return {
                ...prev,
                locale: {
                    ...prev.locale,
                    [locale]: {
                        ...prev.locale[locale],
                        [activeBlockId]: {
                            ...block,
                            content: {
                                ...block.content,
                                ...patch,
                            },
                        },
                    },
                },
            };
        });
    }

    function updateCurrentBlockStyles(patch: Partial<typeof currentBlock.styles>) {
        updateCurrentBlock({
            styles: {
                ...currentBlock.styles,
                ...patch,
            },
        });
    }

    function updateCurrentBlockTypography(patch: Partial<typeof currentBlock.typography>) {
        updateCurrentBlock({
            typography: {
                ...currentBlock.typography,
                ...patch,
            },
        });
    }

    function updateCurrentBlockCta(index: number, patch: Partial<(typeof currentBlock.ctas)[number]>) {
        resetSaveState();
        setContentState((prev) => {
            const block = prev.locale[locale][activeBlockId];
            const nextCtas = (block.ctas ?? []).map((cta, ctaIndex) => (ctaIndex === index ? { ...cta, ...patch } : cta));
            return {
                ...prev,
                locale: {
                    ...prev.locale,
                    [locale]: {
                        ...prev.locale[locale],
                        [activeBlockId]: {
                            ...block,
                            ctas: nextCtas,
                        },
                    },
                },
            };
        });
    }

    function updateCurrentThemeTokenOverrides(value: string) {
        updateCurrentBlock({
            themeTokenOverrides: parseThemeTokenOverrides(value),
        });
    }

    function updateServiceRows(nextRows: ShowServiceRows) {
        if (activeBlockId !== "services" || !currentServicesContent) return;
        const cards = ensureServiceCards(currentServicesContent.serviceCards);
        updateCurrentBlockContent({
            ...currentServicesContent,
            serviceRows: nextRows,
            serviceCards: cards,
        } as Partial<typeof currentBlock.content>);
    }

    function updateServiceCard(index: number, patch: Partial<ShowServiceCard>) {
        if (activeBlockId !== "services" || !currentServicesContent) return;
        if (index < 0 || index >= SERVICE_CARD_COUNT) return;

        resetSaveState();
        setUploadErrorByCard((prev) => ({ ...prev, [index]: "" }));

        setContentState((prev) => {
            const block = prev.locale[locale].services;
            const cards = ensureServiceCards(block.content.serviceCards);
            const currentCard = cards[index];
            const nextCard: ShowServiceCard = {
                ...currentCard,
                ...patch,
                image:
                    patch.imageUrl !== undefined && patch.image === undefined
                        ? {
                              ...currentCard.image,
                              sourceType: "external_url",
                              url: patch.imageUrl,
                          }
                        : patch.image
                          ? {
                                ...currentCard.image,
                                ...patch.image,
                            }
                          : currentCard.image,
                imageUrl: patch.imageUrl ?? (patch.image ? patch.image.url : currentCard.imageUrl),
            };
            cards[index] = nextCard;

            return {
                ...prev,
                locale: {
                    ...prev.locale,
                    [locale]: {
                        ...prev.locale[locale],
                        services: {
                            ...block,
                            content: {
                                ...block.content,
                                serviceCards: cards,
                            },
                        },
                    },
                },
            };
        });
    }

    async function uploadServiceImage(index: number, file: File) {
        if (activeBlockId !== "services") return;
        if (!file.type.startsWith("image/")) {
            setUploadErrorByCard((prev) => ({ ...prev, [index]: labels.imageUploadFailed }));
            setUploadSuccessByCard((prev) => ({ ...prev, [index]: "" }));
            return;
        }

        setUploadingCardIndex(index);
        setUploadErrorByCard((prev) => ({ ...prev, [index]: "" }));

        try {
            const form = new FormData();
            form.append("file", file);

            const response = await fetch("/api/showcase/upload-image", {
                method: "POST",
                body: form,
            });

            const payload = (await response.json().catch(() => null)) as UploadImageResponse | null;
            if (!response.ok || !payload?.url) {
                throw new Error(payload?.error ?? "upload failed");
            }

            updateServiceCard(index, {
                imageUrl: payload.url,
                image: {
                    ...ensureServiceCards(currentServicesContent?.serviceCards)[index].image,
                    sourceType: "external_url",
                    url: payload.url,
                },
            });
            setUploadSuccessByCard((prev) => ({ ...prev, [index]: labels.imageUploadSuccess }));
        } catch (error) {
            const detail = error instanceof Error ? error.message : "";
            const demoOnlyMessage = /bucket/i.test(detail) || /storage/i.test(detail) ? "need upgrade project ,demo only" : "";
            setUploadErrorByCard((prev) => ({
                ...prev,
                [index]: demoOnlyMessage || (detail ? `${labels.imageUploadFailed}: ${detail}` : labels.imageUploadFailed),
            }));
            setUploadSuccessByCard((prev) => ({ ...prev, [index]: "" }));
        } finally {
            setUploadingCardIndex(null);
        }
    }

    async function confirmUploadServiceImage(index: number) {
        const file = selectedUploadFiles[index];
        if (!file) return;
        await uploadServiceImage(index, file);
        setSelectedUploadFiles((prev) => ({ ...prev, [index]: null }));
        setSelectedPreviewByCard((prev) => ({ ...prev, [index]: "" }));
    }

    function handleSelectServiceImageFile(index: number, file: File) {
        setSelectedUploadFiles((prev) => ({ ...prev, [index]: file }));
        setUploadSuccessByCard((prev) => ({ ...prev, [index]: "" }));
        setUploadErrorByCard((prev) => ({ ...prev, [index]: "" }));

        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === "string" ? reader.result : "";
            setSelectedPreviewByCard((prev) => ({ ...prev, [index]: result }));
        };
        reader.onerror = () => {
            setSelectedPreviewByCard((prev) => ({ ...prev, [index]: "" }));
        };
        reader.readAsDataURL(file);
    }

    function moveBlock(blockId: ShowContentBlockId, direction: -1 | 1) {
        resetSaveState();
        setContentState((prev) => {
            const currentIndex = prev.order.indexOf(blockId);
            const nextIndex = currentIndex + direction;
            if (currentIndex === -1 || nextIndex < 0 || nextIndex >= prev.order.length) return prev;
            const nextOrder = [...prev.order];
            [nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]];
            return { ...prev, order: nextOrder };
        });
    }

    function handleDragStart(id: ShowContentBlockId) {
        return (event: DragEvent<HTMLButtonElement>) => {
            setDragging(id);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", id);
        };
    }

    function handleDragOver(id: ShowContentBlockId) {
        return (event: DragEvent<HTMLButtonElement>) => {
            event.preventDefault();
            if (!dragging || dragging === id) return;
            setDragOver(id);
            event.dataTransfer.dropEffect = "move";
        };
    }

    function handleDrop(id: ShowContentBlockId) {
        return (event: DragEvent<HTMLButtonElement>) => {
            event.preventDefault();
            const sourceText = event.dataTransfer.getData("text/plain");
            const source = isBlockId(sourceText) ? sourceText : dragging;
            if (source && source !== id) {
                resetSaveState();
                setContentState((prev) => {
                    const firstIndex = prev.order.indexOf(source);
                    const secondIndex = prev.order.indexOf(id);
                    if (firstIndex === -1 || secondIndex === -1 || firstIndex === secondIndex) return prev;
                    const nextOrder = [...prev.order];
                    [nextOrder[firstIndex], nextOrder[secondIndex]] = [nextOrder[secondIndex], nextOrder[firstIndex]];
                    return { ...prev, order: nextOrder };
                });
            }
            setDragging(null);
            setDragOver(null);
        };
    }

    function handleDragEnd() {
        setDragging(null);
        setDragOver(null);
    }

    function resetCurrentBlock() {
        resetSaveState();
        setContentState((prev) => {
            const defaultBlock = clone(DEFAULT_SHOW_CONTENT_STATE.locale[locale][activeBlockId]);
            return {
                ...prev,
                locale: {
                    ...prev.locale,
                    [locale]: {
                        ...prev.locale[locale],
                        [activeBlockId]: {
                            ...defaultBlock,
                            order: prev.order.indexOf(activeBlockId),
                        },
                    },
                },
            };
        });
    }

    function resetTheme() {
        resetSaveState();
        setThemeColors(clone(DEFAULT_SHOW_THEME_COLORS));
        setStorefront(clone(DEFAULT_STOREFRONT_SETTINGS));
    }

    function resetAll() {
        resetSaveState();
        setContentState(clone(DEFAULT_SHOW_CONTENT_STATE));
        setThemeColors(clone(DEFAULT_SHOW_THEME_COLORS));
        setStorefront(clone(DEFAULT_STOREFRONT_SETTINGS));
        setUploadingCardIndex(null);
        setUploadErrorByCard({});
        setUploadSuccessByCard({});
        setSelectedUploadFiles({});
        setSelectedPreviewByCard({});
    }

    async function saveToFirebase() {
        setSaveStatus("saving");
        setSaveErrorDetail("");

        try {
            const response = await fetch("/api/showcase/preferences", {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    content: contentState,
                    themeColors,
                    storefront,
                }),
            });
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) throw new Error(payload?.error ?? "save failed");
            setSaveStatus("saved");
        } catch (error) {
            setSaveStatus("error");
            setSaveErrorDetail(error instanceof Error ? error.message : "");
        }
    }

    return (
        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_380px] 2xl:grid-cols-[300px_minmax(0,1fr)_420px]">
            <aside className="grid gap-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4 xl:sticky xl:top-4 xl:self-start">
                <div className="grid gap-1">
                    <div className="auth-title">{labels.sectionListTitle}</div>
                    <div className="text-xs text-[rgb(var(--muted))]">{labels.orderHint}</div>
                    <div className="text-xs text-[rgb(var(--muted))]">{labels.dragHint}</div>
                </div>

                <div className="inline-flex w-fit rounded-lg border border-[rgb(var(--border))] p-1">
                    <button
                        type="button"
                        className={`rounded px-2 py-1 text-xs ${locale === "zh" ? "bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "text-[rgb(var(--text))]"}`}
                        onClick={() => setLocale("zh")}
                    >
                        {labels.localeZh}
                    </button>
                    <button
                        type="button"
                        className={`rounded px-2 py-1 text-xs ${locale === "en" ? "bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "text-[rgb(var(--text))]"}`}
                        onClick={() => setLocale("en")}
                    >
                        {labels.localeEn}
                    </button>
                </div>

                <div className="grid gap-2">
                    {contentState.order.map((blockId, index) => {
                        const block = contentState.locale[locale][blockId];
                        const isActive = activeBlockId === blockId;
                        const isDropTarget = dragOver === blockId && dragging !== null && dragging !== blockId;
                        return (
                            <button
                                key={blockId}
                                type="button"
                                draggable
                                onClick={() => setActiveBlockId(blockId)}
                                onDragStart={handleDragStart(blockId)}
                                onDragOver={handleDragOver(blockId)}
                                onDrop={handleDrop(blockId)}
                                onDragEnd={handleDragEnd}
                                className={[
                                    "grid gap-2 rounded-xl border px-3 py-3 text-left transition",
                                    isActive ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel2))]" : "border-[rgb(var(--border))] bg-[rgb(var(--panel2))]",
                                    isDropTarget ? "ring-1 ring-[rgb(var(--accent))]" : "",
                                ].join(" ")}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{index + 1}</div>
                                        <div className="text-sm font-semibold">{blockNameMap[blockId]}</div>
                                    </div>
                                    <span className="rounded-md border border-[rgb(var(--border))] px-2 py-0.5 text-[11px] text-[rgb(var(--muted))]">
                                        {block.enabled ? labels.enabled : labels.hidden}
                                    </span>
                                </div>
                                <div className="line-clamp-2 text-xs text-[rgb(var(--muted))]">{block.content.title || block.content.kicker}</div>
                                <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                                    <button
                                        type="button"
                                        className="rounded border border-[rgb(var(--border))] px-2 py-1 hover:bg-[rgb(var(--panel))]"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            moveBlock(blockId, -1);
                                        }}
                                        disabled={index === 0}
                                    >
                                        {labels.moveUp}
                                    </button>
                                    <button
                                        type="button"
                                        className="rounded border border-[rgb(var(--border))] px-2 py-1 hover:bg-[rgb(var(--panel))]"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            moveBlock(blockId, 1);
                                        }}
                                        disabled={index === contentState.order.length - 1}
                                    >
                                        {labels.moveDown}
                                    </button>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="grid gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                    <div className="text-sm font-semibold">{labels.libraryTitle}</div>
                    <div className="text-xs text-[rgb(var(--muted))]">{labels.libraryHint}</div>
                    <div className="grid gap-2">
                        {BLOCK_IDS.map((blockId) => (
                            <div key={`library-${blockId}`} className="flex items-center justify-between rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2">
                                <span className="text-sm">{blockNameMap[blockId]}</span>
                                <span className="text-[11px] text-[rgb(var(--muted))]">
                                    {contentState.order.includes(blockId) ? labels.libraryInUse : labels.libraryFixed}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            <section className="grid gap-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="grid gap-1">
                        <div className="auth-title">{labels.previewTitle}</div>
                        <div className="text-xs text-[rgb(var(--muted))]">{labels.hint}</div>
                    </div>
                    {!hasSavedPreferences ? (
                        <span className="rounded-full border border-[rgb(var(--accent))] bg-[rgb(var(--panel2))] px-3 py-1 text-xs text-[rgb(var(--text))]">
                            {labels.usingDefaultTemplate}
                        </span>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3">
                    <div className="grid gap-1">
                        <div className="text-[11px] uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{labels.audienceLabel}</div>
                        <div className="inline-flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-1">
                            {([
                                ["guest", labels.audienceGuest],
                                ["company", labels.audienceCompany],
                                ["customer", labels.audienceCustomer],
                            ] as const).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={`rounded px-2 py-1 text-xs ${previewAudience === value ? "bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "text-[rgb(var(--text))]"}`}
                                    onClick={() => setPreviewAudience(value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-1">
                        <div className="text-[11px] uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{labels.viewportLabel}</div>
                        <div className="inline-flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-1">
                            {([
                                ["desktop", labels.viewportDesktop],
                                ["mobile", labels.viewportMobile],
                            ] as const).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={`rounded px-2 py-1 text-xs ${previewViewport === value ? "bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "text-[rgb(var(--text))]"}`}
                                    onClick={() => setPreviewViewport(value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="min-h-[680px] overflow-auto rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                    <div className={previewViewport === "mobile" ? "mx-auto w-full max-w-[390px] overflow-hidden rounded-[24px] border border-[rgb(var(--border))] bg-white shadow-sm" : "overflow-hidden rounded-[24px] border border-[rgb(var(--border))] bg-white shadow-sm"}>
                        <ShowHomePage
                            navAccountType={previewAudience}
                            lang={locale}
                            showThemeColors={themeColors}
                            storefrontSettings={storefront}
                            showContentState={contentState}
                            homeHref="/company-home"
                            authTenantId={tenantId}
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4 xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:self-start xl:overflow-auto">
                <div className="flex items-start justify-between gap-3">
                    <div className="grid gap-1">
                        <div className="auth-title">{labels.inspectorTitle}</div>
                        <div className="text-xs text-[rgb(var(--muted))]">{blockNameMap[activeBlockId]}</div>
                    </div>
                    <span className="rounded-md border border-[rgb(var(--border))] px-2 py-1 text-xs text-[rgb(var(--muted))]">
                        {currentBlock.enabled ? labels.enabled : labels.hidden}
                    </span>
                </div>

                <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3">
                    <Button type="button" onClick={saveToFirebase} disabled={saveStatus === "saving"}>
                        {labels.save}
                    </Button>
                    <Button type="button" variant="ghost" onClick={resetCurrentBlock}>
                        {labels.resetBlock}
                    </Button>
                    <Button type="button" variant="ghost" onClick={resetTheme}>
                        {labels.resetTheme}
                    </Button>
                    <Button type="button" variant="ghost" onClick={resetAll}>
                        {labels.resetAll}
                    </Button>
                    {saveStatusText ? (
                        <span className="text-xs text-[rgb(var(--muted))]" aria-live="polite">
                            {saveStatusText}
                        </span>
                    ) : null}
                </div>

                <details open className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                    <summary className="cursor-pointer list-none text-sm font-medium">Block</summary>
                    <div className="mt-3 grid gap-3">
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.enabled}</span>
                            <button
                                type="button"
                                className={`w-fit rounded-md border px-3 py-1 text-sm ${currentBlock.enabled ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "border-[rgb(var(--border))] bg-[rgb(var(--panel))] text-[rgb(var(--text))]"}`}
                                onClick={() => updateCurrentBlock({ enabled: !currentBlock.enabled })}
                            >
                                {currentBlock.enabled ? labels.enabled : labels.hidden}
                            </button>
                        </label>

                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldAnchor}</span>
                            <Input value={currentBlock.anchor} onChange={(event) => updateCurrentBlock({ anchor: event.target.value })} />
                        </label>

                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldKicker}</span>
                            <Input value={currentSharedContent.kicker} onChange={(event) => updateCurrentBlockContent({ kicker: event.target.value })} />
                        </label>

                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldTitle}</span>
                            <Input value={currentSharedContent.title} onChange={(event) => updateCurrentBlockContent({ title: event.target.value })} />
                        </label>

                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldBody}</span>
                            <Textarea rows={4} value={currentSharedContent.body} onChange={(event) => updateCurrentBlockContent({ body: event.target.value })} />
                        </label>

                        {currentHeroContent ? (
                            <label className="grid gap-1">
                                <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldHeroSummaryTitle}</span>
                                <Input
                                    value={currentHeroContent.summaryTitle}
                                    onChange={(event) => updateCurrentBlockContent({ summaryTitle: event.target.value } as Partial<typeof currentBlock.content>)}
                                />
                            </label>
                        ) : null}

                        {currentContactContent ? (
                            <div className="grid gap-3 md:grid-cols-2">
                                <label className="grid gap-1">
                                    <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldContactCardTitle}</span>
                                    <Input
                                        value={currentContactContent.cardTitle}
                                        onChange={(event) => updateCurrentBlockContent({ cardTitle: event.target.value } as Partial<typeof currentBlock.content>)}
                                    />
                                </label>
                                <label className="grid gap-1">
                                    <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldContactCardBody}</span>
                                    <Textarea
                                        rows={4}
                                        value={currentContactContent.cardBody}
                                        onChange={(event) => updateCurrentBlockContent({ cardBody: event.target.value } as Partial<typeof currentBlock.content>)}
                                    />
                                </label>
                            </div>
                        ) : null}

                        {currentServicesContent ? (
                            <div className="grid gap-3">
                                <label className="grid gap-1 md:max-w-xs">
                                    <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceRows}</span>
                                    <Select
                                        value={String(currentServicesContent.serviceRows)}
                                        onChange={(event) => {
                                            const parsed = Number.parseInt(event.target.value, 10);
                                            if (parsed === 1 || parsed === 2 || parsed === 3) updateServiceRows(parsed);
                                        }}
                                    >
                                        {serviceRowOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </Select>
                                </label>

                                <div className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceCards}</div>
                                <div className="grid gap-3">
                                    {visibleServiceCards.map((card, index) => {
                                        const imageShapeClass = card.imageStyle === "circle" ? "rounded-full" : "rounded-lg";
                                        const selectedFile = selectedUploadFiles[index] ?? null;
                                        const selectedPreview = selectedPreviewByCard[index] ?? "";
                                        const resolvedImageUrl = card.image.url || card.imageUrl;
                                        const previewSrc = selectedPreview || resolvedImageUrl;
                                        const uploadSuccessText = uploadSuccessByCard[index] ?? "";
                                        const uploadErrorText = uploadErrorByCard[index] ?? "";

                                        return (
                                            <article key={`service-card-${index}`} className="grid gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-3">
                                                <div className="text-xs font-semibold">#{index + 1}</div>

                                                <label className="grid gap-1">
                                                    <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceCardTitle}</span>
                                                    <Input value={card.title} onChange={(event) => updateServiceCard(index, { title: event.target.value })} />
                                                </label>

                                                <label className="grid gap-1">
                                                    <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceCardBody}</span>
                                                    <Textarea rows={3} value={card.body} onChange={(event) => updateServiceCard(index, { body: event.target.value })} />
                                                </label>

                                                <div className="grid gap-3 sm:grid-cols-3">
                                                    <label className="grid gap-1">
                                                        <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceCardImageSourceType}</span>
                                                        <Select
                                                            value={card.image.sourceType}
                                                            onChange={(event) =>
                                                                updateServiceCard(index, {
                                                                    image: {
                                                                        ...card.image,
                                                                        sourceType: event.target.value as ImageAssetSourceType,
                                                                    },
                                                                })
                                                            }
                                                        >
                                                            {imageSourceTypeOptions.map((opt) => (
                                                                <option key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </option>
                                                            ))}
                                                        </Select>
                                                    </label>

                                                    <label className="grid gap-1 sm:col-span-2">
                                                        <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceCardImageUrl}</span>
                                                        <Input
                                                            value={resolvedImageUrl}
                                                            onChange={(event) =>
                                                                updateServiceCard(index, {
                                                                    imageUrl: event.target.value,
                                                                    image: {
                                                                        ...card.image,
                                                                        url: event.target.value,
                                                                    },
                                                                })
                                                            }
                                                        />
                                                    </label>
                                                </div>

                                                <label className="grid gap-1">
                                                    <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceCardStoragePath}</span>
                                                    <Input
                                                        value={card.image.storagePath ?? ""}
                                                        onChange={(event) =>
                                                            updateServiceCard(index, {
                                                                image: {
                                                                    ...card.image,
                                                                    storagePath: event.target.value || undefined,
                                                                },
                                                            })
                                                        }
                                                    />
                                                </label>

                                                <div className="grid gap-2">
                                                    <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceCardImage}</span>
                                                    {previewSrc ? (
                                                        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-2">
                                                            <Image
                                                                src={previewSrc}
                                                                alt={card.title || `Service card ${index + 1}`}
                                                                width={96}
                                                                height={96}
                                                                unoptimized
                                                                className={`mx-auto h-24 w-24 object-cover ${imageShapeClass}`}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="grid h-24 place-items-center rounded-lg border border-dashed border-[rgb(var(--border))] text-center text-xs text-[rgb(var(--muted))]">
                                                            <div className="grid gap-1">
                                                                <span>No Image</span>
                                                                <span>need upgrade project ,demo only</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        ref={(element) => {
                                                            serviceImageInputRefs.current[index] = element;
                                                        }}
                                                        onChange={(event) => {
                                                            const file = event.target.files?.[0];
                                                            if (!file) return;
                                                            handleSelectServiceImageFile(index, file);
                                                            event.currentTarget.value = "";
                                                        }}
                                                        className="hidden"
                                                    />

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => serviceImageInputRefs.current[index]?.click()}
                                                            disabled={uploadingCardIndex === index}
                                                        >
                                                            {labels.uploadImage}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => void confirmUploadServiceImage(index)}
                                                            disabled={!selectedFile || uploadingCardIndex === index}
                                                        >
                                                            {labels.confirmUploadImage}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                updateServiceCard(index, {
                                                                    imageUrl: "",
                                                                    image: {
                                                                        ...card.image,
                                                                        sourceType: "external_url",
                                                                        url: "",
                                                                        storagePath: undefined,
                                                                    },
                                                                });
                                                                setSelectedUploadFiles((prev) => ({ ...prev, [index]: null }));
                                                                setSelectedPreviewByCard((prev) => ({ ...prev, [index]: "" }));
                                                                setUploadSuccessByCard((prev) => ({ ...prev, [index]: "" }));
                                                                setUploadErrorByCard((prev) => ({ ...prev, [index]: "" }));
                                                            }}
                                                            disabled={(!resolvedImageUrl && !selectedPreview) || uploadingCardIndex === index}
                                                        >
                                                            {labels.clearImage}
                                                        </Button>
                                                        {uploadingCardIndex === index ? (
                                                            <span className="text-xs text-[rgb(var(--muted))]">{labels.uploadingImage}</span>
                                                        ) : null}
                                                    </div>

                                                    {selectedFile ? (
                                                        <span className="text-xs text-[rgb(var(--muted))]">
                                                            {labels.selectedImage}: {selectedFile.name}
                                                        </span>
                                                    ) : null}
                                                    {uploadSuccessText ? <span className="text-xs text-[rgb(var(--accent))]">{uploadSuccessText}</span> : null}
                                                    {uploadErrorText ? <span className="text-xs text-[rgb(var(--muted))]">{uploadErrorText}</span> : null}
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <label className="grid gap-1">
                                                        <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceCardImageStyle}</span>
                                                        <Select
                                                            value={card.imageStyle}
                                                            onChange={(event) => updateServiceCard(index, { imageStyle: event.target.value as ShowServiceImageStyle })}
                                                        >
                                                            {imageStyleOptions.map((opt) => (
                                                                <option key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </option>
                                                            ))}
                                                        </Select>
                                                    </label>

                                                    <label className="grid gap-1">
                                                        <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceCardImagePosition}</span>
                                                        <Select
                                                            value={card.imagePosition}
                                                            onChange={(event) =>
                                                                updateServiceCard(index, { imagePosition: event.target.value as ShowServiceImagePosition })
                                                            }
                                                        >
                                                            {imagePositionOptions.map((opt) => (
                                                                <option key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </option>
                                                            ))}
                                                        </Select>
                                                    </label>
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-3">
                                                    {([
                                                        ["showImage", labels.fieldServiceCardShowImage],
                                                        ["showTitle", labels.fieldServiceCardShowTitle],
                                                        ["showBody", labels.fieldServiceCardShowBody],
                                                    ] as const).map(([key, label]) => {
                                                        const currentValue = card[key];
                                                        return (
                                                            <label key={`${key}-${index}`} className="grid gap-1">
                                                                <span className="text-xs text-[rgb(var(--muted))]">{label}</span>
                                                                <button
                                                                    type="button"
                                                                    className={`w-fit rounded-md border px-3 py-1 text-sm ${currentValue ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "border-[rgb(var(--border))] bg-[rgb(var(--panel2))] text-[rgb(var(--text))]"}`}
                                                                    onClick={() => updateServiceCard(index, { [key]: !currentValue } as Partial<ShowServiceCard>)}
                                                                >
                                                                    {currentValue ? labels.enabled : labels.hidden}
                                                                </button>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <label className="grid gap-1">
                                <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldPoints}</span>
                                <Textarea
                                    rows={6}
                                    value={currentSharedContent.points.join("\n")}
                                    onChange={(event) => updateCurrentBlockContent({ points: toPoints(event.target.value) })}
                                />
                                <span className="text-xs text-[rgb(var(--muted))]">{labels.pointsHint}</span>
                            </label>
                        )}

                        <div className="grid gap-3 md:grid-cols-3">
                            <label className="grid gap-1">
                                <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldFontFamily}</span>
                                <Select
                                    value={currentBlock.typography.fontFamily}
                                    onChange={(event) => updateCurrentBlockTypography({ fontFamily: event.target.value as ShowContentFontFamily })}
                                >
                                    {fontOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </Select>
                            </label>

                            <label className="grid gap-1">
                                <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldTitleScale}</span>
                                <Select
                                    value={currentBlock.typography.titleScale}
                                    onChange={(event) => updateCurrentBlockTypography({ titleScale: event.target.value as ShowContentTitleScale })}
                                >
                                    {titleScaleOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </Select>
                            </label>

                            <label className="grid gap-1">
                                <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldBodyScale}</span>
                                <Select
                                    value={currentBlock.typography.bodyScale}
                                    onChange={(event) => updateCurrentBlockTypography({ bodyScale: event.target.value as ShowContentBodyScale })}
                                >
                                    {bodyScaleOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </Select>
                            </label>
                        </div>
                    </div>
                </details>

                <details open className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                    <summary className="cursor-pointer list-none text-sm font-medium">{labels.typographySectionTitle}</summary>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.typographyKickerColor}</span>
                            <Input
                                value={currentBlock.typography.kickerColor ?? ""}
                                onChange={(event) => updateCurrentBlockTypography({ kickerColor: event.target.value || undefined })}
                            />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.typographyTitleColor}</span>
                            <Input
                                value={currentBlock.typography.titleColor ?? ""}
                                onChange={(event) => updateCurrentBlockTypography({ titleColor: event.target.value || undefined })}
                            />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.typographyBodyColor}</span>
                            <Input
                                value={currentBlock.typography.bodyColor ?? ""}
                                onChange={(event) => updateCurrentBlockTypography({ bodyColor: event.target.value || undefined })}
                            />
                        </label>
                    </div>
                </details>

                <details open className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                    <summary className="cursor-pointer list-none text-sm font-medium">{labels.styleSectionTitle}</summary>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.styleAlign}</span>
                            <Select
                                value={currentBlock.styles.align ?? "left"}
                                onChange={(event) => updateCurrentBlockStyles({ align: event.target.value as BuilderTextAlign })}
                            >
                                {alignOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </Select>
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.styleBorderRadius}</span>
                            <Input
                                value={currentBlock.styles.borderRadius ?? ""}
                                onChange={(event) => updateCurrentBlockStyles({ borderRadius: event.target.value || undefined })}
                            />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.stylePadding}</span>
                            <Input value={currentBlock.styles.padding ?? ""} onChange={(event) => updateCurrentBlockStyles({ padding: event.target.value || undefined })} />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.styleBackgroundColor}</span>
                            <Input
                                value={currentBlock.styles.backgroundColor ?? ""}
                                onChange={(event) => updateCurrentBlockStyles({ backgroundColor: event.target.value || undefined })}
                            />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.styleTextColor}</span>
                            <Input value={currentBlock.styles.textColor ?? ""} onChange={(event) => updateCurrentBlockStyles({ textColor: event.target.value || undefined })} />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.styleAccentColor}</span>
                            <Input
                                value={currentBlock.styles.accentColor ?? ""}
                                onChange={(event) => updateCurrentBlockStyles({ accentColor: event.target.value || undefined })}
                            />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.styleBorderColor}</span>
                            <Input
                                value={currentBlock.styles.borderColor ?? ""}
                                onChange={(event) => updateCurrentBlockStyles({ borderColor: event.target.value || undefined })}
                            />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.styleMutedColor}</span>
                            <Input
                                value={currentBlock.styles.mutedColor ?? ""}
                                onChange={(event) => updateCurrentBlockStyles({ mutedColor: event.target.value || undefined })}
                            />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.styleSurfaceColor}</span>
                            <Input
                                value={currentBlock.styles.surfaceColor ?? ""}
                                onChange={(event) => updateCurrentBlockStyles({ surfaceColor: event.target.value || undefined })}
                            />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.styleCardBackgroundColor}</span>
                            <Input
                                value={currentBlock.styles.cardBackgroundColor ?? ""}
                                onChange={(event) => updateCurrentBlockStyles({ cardBackgroundColor: event.target.value || undefined })}
                            />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.styleSummaryBackgroundColor}</span>
                            <Input
                                value={currentBlock.styles.summaryBackgroundColor ?? ""}
                                onChange={(event) => updateCurrentBlockStyles({ summaryBackgroundColor: event.target.value || undefined })}
                            />
                        </label>
                    </div>
                </details>

                <details open className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                    <summary className="cursor-pointer list-none text-sm font-medium">{labels.ctaSectionTitle}</summary>
                    <div className="mt-3 grid gap-3">
                        {(currentBlock.ctas ?? []).map((cta, index) => (
                            <div key={cta.id || `cta-${index}`} className="grid gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-3">
                                <label className="grid gap-1">
                                    <span className="text-xs text-[rgb(var(--muted))]">{labels.ctaLabel}</span>
                                    <Input value={cta.label} onChange={(event) => updateCurrentBlockCta(index, { label: event.target.value })} />
                                </label>
                                <label className="grid gap-1">
                                    <span className="text-xs text-[rgb(var(--muted))]">{labels.ctaHref}</span>
                                    <Input value={cta.href} onChange={(event) => updateCurrentBlockCta(index, { href: event.target.value })} />
                                </label>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <label className="grid gap-1">
                                        <span className="text-xs text-[rgb(var(--muted))]">{labels.ctaVariant}</span>
                                        <Select value={cta.variant} onChange={(event) => updateCurrentBlockCta(index, { variant: event.target.value as BlockCtaVariant })}>
                                            {ctaVariantOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </Select>
                                    </label>
                                    <label className="grid gap-1">
                                        <span className="text-xs text-[rgb(var(--muted))]">{labels.enabled}</span>
                                        <button
                                            type="button"
                                            className={`w-fit rounded-md border px-3 py-1 text-sm ${cta.enabled ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "border-[rgb(var(--border))] bg-[rgb(var(--panel2))] text-[rgb(var(--text))]"}`}
                                            onClick={() => updateCurrentBlockCta(index, { enabled: !cta.enabled })}
                                        >
                                            {cta.enabled ? labels.enabled : labels.hidden}
                                        </button>
                                    </label>
                                    <label className="grid gap-1">
                                        <span className="text-xs text-[rgb(var(--muted))]">{labels.ctaOpenInNewTab}</span>
                                        <button
                                            type="button"
                                            className={`w-fit rounded-md border px-3 py-1 text-sm ${cta.openInNewTab ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "border-[rgb(var(--border))] bg-[rgb(var(--panel2))] text-[rgb(var(--text))]"}`}
                                            onClick={() => updateCurrentBlockCta(index, { openInNewTab: !cta.openInNewTab })}
                                        >
                                            {cta.openInNewTab ? labels.enabled : labels.hidden}
                                        </button>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </details>

                <details open className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                    <summary className="cursor-pointer list-none text-sm font-medium">{labels.themeOverrideSectionTitle}</summary>
                    <div className="mt-3 grid gap-2">
                        <div className="text-xs text-[rgb(var(--muted))]">{labels.themeOverrideHint}</div>
                        <Textarea
                            rows={5}
                            placeholder={labels.themeOverridePlaceholder}
                            value={serializeThemeTokenOverrides(currentBlock.themeTokenOverrides)}
                            onChange={(event) => updateCurrentThemeTokenOverrides(event.target.value)}
                        />
                    </div>
                </details>

                <details open className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                    <summary className="cursor-pointer list-none text-sm font-medium">{labels.themeSectionTitle}</summary>
                    <div className="mt-3 grid gap-3">
                        {THEME_ROLES.map((role) => {
                            const rgbValue = themeColors[role];
                            const hexValue = rgbTripletToHexString(rgbValue);
                            const pickerLabel = `${roleLabels[role]} - ${labels.themeCustomColor}`;

                            return (
                                <div key={role} className="grid gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm">{roleLabels[role]}</div>
                                        <label className="flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-2 py-1 text-xs text-[rgb(var(--muted))]">
                                            <span className="sr-only">{pickerLabel}</span>
                                            <input
                                                type="color"
                                                value={hexValue}
                                                aria-label={pickerLabel}
                                                onChange={(event) => {
                                                    resetSaveState();
                                                    setThemeColors((prev) =>
                                                        normalizeShowThemeColors({
                                                            ...prev,
                                                            [role]: hexToRgbTriplet(event.target.value),
                                                        }),
                                                    );
                                                }}
                                                className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                                            />
                                            <span className="font-mono uppercase">{hexValue}</span>
                                        </label>
                                    </div>
                                    <div className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-2 py-1 text-[10px] text-[rgb(var(--muted))]">
                                        rgb({rgbValue})
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </details>

                <details open className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                    <summary className="cursor-pointer list-none text-sm font-medium">{labels.storefrontTitle}</summary>
                    <div className="mt-3 grid gap-2">
                        <div className="text-xs text-[rgb(var(--muted))]">{labels.storefrontHint}</div>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={storefront.shoppingEnabled}
                                onChange={(event) => {
                                    resetSaveState();
                                    setStorefront((prev) => ({ ...prev, shoppingEnabled: event.target.checked }));
                                }}
                            />
                            <span>{labels.storefrontShoppingEnabled}</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={storefront.autoRedirectToShopForCustomer}
                                onChange={(event) => {
                                    resetSaveState();
                                    setStorefront((prev) => ({ ...prev, autoRedirectToShopForCustomer: event.target.checked }));
                                }}
                            />
                            <span>{labels.storefrontAutoRedirect}</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={storefront.showCartOnNavForCustomer}
                                onChange={(event) => {
                                    resetSaveState();
                                    setStorefront((prev) => ({ ...prev, showCartOnNavForCustomer: event.target.checked }));
                                }}
                            />
                            <span>{labels.storefrontShowCart}</span>
                        </label>
                    </div>
                </details>

                <details className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                    <summary className="cursor-pointer list-none text-sm font-medium">{labels.schemaSectionTitle}</summary>
                    <div className="mt-3 grid gap-2">
                        <div className="text-xs text-[rgb(var(--muted))]">{labels.schemaHint}</div>
                        <Textarea rows={16} readOnly value={JSON.stringify(currentBlock, null, 2)} />
                    </div>
                </details>
            </section>
        </div>
    );
}
