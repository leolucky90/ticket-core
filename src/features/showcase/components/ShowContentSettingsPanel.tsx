"use client";

import { type DragEvent, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_SHOW_CONTENT_STATE, normalizeShowContentState } from "@/features/showcase/services/showContentPreferences";
import type {
    ShowContentBlockId,
    ShowContentBodyScale,
    ShowContentFontFamily,
    ShowContentLocale,
    ShowContentState,
    ShowContentTitleScale,
    ShowServiceCard,
    ShowServiceImagePosition,
    ShowServiceImageStyle,
    ShowServiceRows,
} from "@/features/showcase/types/showContent";

export type ShowContentSettingsLabels = {
    title: string;
    hint: string;
    reset: string;
    save: string;
    saving: string;
    saved: string;
    saveFailed: string;
    localeZh: string;
    localeEn: string;
    orderHint: string;
    enabled: string;
    hidden: string;
    fieldKicker: string;
    fieldTitle: string;
    fieldBody: string;
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
    blockHero: string;
    blockAbout: string;
    blockServices: string;
    blockContact: string;
    blockAd: string;
};

type ShowContentSettingsPanelProps = {
    labels: ShowContentSettingsLabels;
    initialState: ShowContentState;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

const SERVICE_CARD_COUNT = 9;

function isBlockId(value: string): value is ShowContentBlockId {
    return value === "hero" || value === "about" || value === "services" || value === "contact" || value === "ad";
}

function toPoints(value: string): string[] {
    return value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

function cloneDefaultState(): ShowContentState {
    return JSON.parse(JSON.stringify(DEFAULT_SHOW_CONTENT_STATE)) as ShowContentState;
}

function buildDefaultServiceCard(): ShowServiceCard {
    return {
        title: "",
        body: "",
        imageUrl: "",
        imageStyle: "square",
        imagePosition: "top",
        showImage: true,
        showTitle: true,
        showBody: true,
    };
}

type UploadImageResponse = {
    url?: string;
    error?: string;
};

export function ShowContentSettingsPanel({ labels, initialState }: ShowContentSettingsPanelProps) {
    const [state, setState] = useState<ShowContentState>(() => normalizeShowContentState(initialState));
    const [locale, setLocale] = useState<ShowContentLocale>("zh");
    const [activeBlockId, setActiveBlockId] = useState<ShowContentBlockId>("hero");
    const [dragging, setDragging] = useState<ShowContentBlockId | null>(null);
    const [dragOver, setDragOver] = useState<ShowContentBlockId | null>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const [uploadingCardIndex, setUploadingCardIndex] = useState<number | null>(null);
    const [uploadErrorByCard, setUploadErrorByCard] = useState<Record<number, string>>({});
    const [uploadSuccessByCard, setUploadSuccessByCard] = useState<Record<number, string>>({});
    const [selectedUploadFiles, setSelectedUploadFiles] = useState<Record<number, File | null>>({});
    const [selectedPreviewByCard, setSelectedPreviewByCard] = useState<Record<number, string>>({});
    const serviceImageInputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const currentBlock = state.locale[locale][activeBlockId];

    const blockNameMap: Record<ShowContentBlockId, string> = {
        hero: labels.blockHero,
        about: labels.blockAbout,
        services: labels.blockServices,
        contact: labels.blockContact,
        ad: labels.blockAd,
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
    const serviceRowOptions: Array<{ value: ShowServiceRows; label: string }> = [
        { value: 1, label: labels.optionServiceRows1 },
        { value: 2, label: labels.optionServiceRows2 },
        { value: 3, label: labels.optionServiceRows3 },
    ];

    const saveStatusText = useMemo(() => {
        if (saveStatus === "saving") return labels.saving;
        if (saveStatus === "saved") return labels.saved;
        if (saveStatus === "error") return labels.saveFailed;
        return "";
    }, [labels.saveFailed, labels.saved, labels.saving, saveStatus]);

    function updateCurrentBlock(patch: Partial<typeof currentBlock>) {
        setSaveStatus("idle");
        setState((prev) => ({
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

    function updateServiceCard(index: number, patch: Partial<ShowServiceCard>) {
        if (activeBlockId !== "services") return;
        if (index < 0 || index >= SERVICE_CARD_COUNT) return;

        setSaveStatus("idle");
        setUploadErrorByCard((prev) => ({ ...prev, [index]: "" }));
        setState((prev) => {
            const block = prev.locale[locale].services;
            const cards: ShowServiceCard[] = Array.from({ length: SERVICE_CARD_COUNT }, (_, cardIndex) =>
                block.serviceCards[cardIndex] ?? buildDefaultServiceCard(),
            );

            cards[index] = {
                ...cards[index],
                ...patch,
            };

            return {
                ...prev,
                locale: {
                    ...prev.locale,
                    [locale]: {
                        ...prev.locale[locale],
                        services: {
                            ...block,
                            serviceCards: cards,
                            points: cards
                                .slice(0, block.serviceRows * 3)
                                .map((card) => card.title.trim())
                                .filter((title) => title.length > 0)
                                .slice(0, 12),
                        },
                    },
                },
            };
        });
    }

    function updateServiceRows(nextRows: ShowServiceRows) {
        if (activeBlockId !== "services") return;
        setSaveStatus("idle");
        setState((prev) => {
            const block = prev.locale[locale].services;
            const cards: ShowServiceCard[] = Array.from({ length: SERVICE_CARD_COUNT }, (_, cardIndex) =>
                block.serviceCards[cardIndex] ?? buildDefaultServiceCard(),
            );

            return {
                ...prev,
                locale: {
                    ...prev.locale,
                    [locale]: {
                        ...prev.locale[locale],
                        services: {
                            ...block,
                            serviceRows: nextRows,
                            serviceCards: cards,
                            points: cards
                                .slice(0, nextRows * 3)
                                .map((card) => card.title.trim())
                                .filter((title) => title.length > 0)
                                .slice(0, 12),
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

            updateServiceCard(index, { imageUrl: payload.url });
            setUploadSuccessByCard((prev) => ({ ...prev, [index]: labels.imageUploadSuccess }));
        } catch (error) {
            const detail = error instanceof Error ? error.message : "";
            const demoOnlyMessage =
                /bucket/i.test(detail) || /storage/i.test(detail)
                    ? "need upgrade project ,demo only"
                    : "";
            setUploadErrorByCard((prev) => ({
                ...prev,
                [index]:
                    demoOnlyMessage ||
                    (detail ? `${labels.imageUploadFailed}: ${detail}` : labels.imageUploadFailed),
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
                setSaveStatus("idle");
                setState((prev) => {
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

    async function saveToFirebase() {
        setSaveStatus("saving");
        try {
            const response = await fetch("/api/showcase/preferences", {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ content: state }),
            });
            if (!response.ok) throw new Error("save failed");
            setSaveStatus("saved");
        } catch {
            setSaveStatus("error");
        }
    }

    const visibleServiceCardCount = activeBlockId === "services" ? currentBlock.serviceRows * 3 : 0;
    const serviceCards: ShowServiceCard[] =
        activeBlockId === "services"
            ? Array.from({ length: visibleServiceCardCount }, (_, index) => currentBlock.serviceCards[index] ?? buildDefaultServiceCard())
            : [];

    return (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <aside className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4">
                <div className="auth-title">{labels.title}</div>
                <div className="mt-1 text-xs text-[rgb(var(--muted))]">{labels.hint}</div>
                <div className="mt-3 inline-flex rounded-lg border border-[rgb(var(--border))] p-1">
                    <button
                        type="button"
                        className={`rounded px-2 py-1 text-xs ${
                            locale === "zh" ? "bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "text-[rgb(var(--text))]"
                        }`}
                        onClick={() => setLocale("zh")}
                    >
                        {labels.localeZh}
                    </button>
                    <button
                        type="button"
                        className={`rounded px-2 py-1 text-xs ${
                            locale === "en" ? "bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "text-[rgb(var(--text))]"
                        }`}
                        onClick={() => setLocale("en")}
                    >
                        {labels.localeEn}
                    </button>
                </div>

                <div className="mt-4 text-xs text-[rgb(var(--muted))]">{labels.orderHint}</div>
                <div className="mt-2 grid gap-2">
                    {state.order.map((blockId) => {
                        const isActive = activeBlockId === blockId;
                        const isDropTarget = dragOver === blockId && dragging !== null && dragging !== blockId;
                        const blockEnabled = state.locale[locale][blockId].enabled;
                        return (
                            <button
                                key={blockId}
                                type="button"
                                draggable
                                onClick={() => {
                                    setActiveBlockId(blockId);
                                    setUploadingCardIndex(null);
                                }}
                                onDragStart={handleDragStart(blockId)}
                                onDragOver={handleDragOver(blockId)}
                                onDrop={handleDrop(blockId)}
                                onDragEnd={handleDragEnd}
                                className={[
                                    "flex items-center justify-between rounded-xl border px-3 py-2 text-left",
                                    isActive ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel2))]" : "border-[rgb(var(--border))] bg-[rgb(var(--panel2))]",
                                    isDropTarget ? "ring-1 ring-[rgb(var(--accent))]" : "",
                                ].join(" ")}
                            >
                                <span className="text-sm font-medium">{blockNameMap[blockId]}</span>
                                <span className="text-[11px] text-[rgb(var(--muted))]">{blockEnabled ? labels.enabled : labels.hidden}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="mt-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            setSaveStatus("idle");
                            setUploadingCardIndex(null);
                            setState(cloneDefaultState());
                        }}
                    >
                        {labels.reset}
                    </Button>
                </div>
            </aside>

            <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold">{blockNameMap[activeBlockId]}</div>
                    <span className="rounded-md border border-[rgb(var(--border))] px-2 py-1 text-xs text-[rgb(var(--muted))]">
                        {currentBlock.enabled ? labels.enabled : labels.hidden}
                    </span>
                </div>

                <div className="sticky top-2 z-10 mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2">
                    <Button type="button" onClick={saveToFirebase} disabled={saveStatus === "saving"}>
                        {labels.save}
                    </Button>
                    {saveStatusText ? (
                        <span className="text-xs text-[rgb(var(--muted))]" aria-live="polite">
                            {saveStatusText}
                        </span>
                    ) : null}
                </div>

                <div className="mt-4 grid gap-3">
                    <label className="grid gap-1">
                        <span className="text-xs text-[rgb(var(--muted))]">{labels.enabled}</span>
                        <button
                            type="button"
                            className={`w-fit rounded-md border px-3 py-1 text-sm ${
                                currentBlock.enabled
                                    ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))] text-[rgb(var(--bg))]"
                                    : "border-[rgb(var(--border))] bg-[rgb(var(--panel2))] text-[rgb(var(--text))]"
                            }`}
                            onClick={() => updateCurrentBlock({ enabled: !currentBlock.enabled })}
                        >
                            {currentBlock.enabled ? labels.enabled : labels.hidden}
                        </button>
                    </label>

                    <label className="grid gap-1">
                        <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldKicker}</span>
                        <Input value={currentBlock.kicker} onChange={(event) => updateCurrentBlock({ kicker: event.target.value })} />
                    </label>

                    <label className="grid gap-1">
                        <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldTitle}</span>
                        <Input value={currentBlock.title} onChange={(event) => updateCurrentBlock({ title: event.target.value })} />
                    </label>

                    <label className="grid gap-1">
                        <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldBody}</span>
                        <Textarea rows={4} value={currentBlock.body} onChange={(event) => updateCurrentBlock({ body: event.target.value })} />
                    </label>

                    {activeBlockId === "services" ? (
                        <div className="grid gap-3">
                            <label className="grid gap-1 md:max-w-xs">
                                <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceRows}</span>
                                <Select
                                    value={String(currentBlock.serviceRows)}
                                    onChange={(event) => {
                                        const parsed = Number.parseInt(event.target.value, 10);
                                        if (parsed === 1 || parsed === 2 || parsed === 3) {
                                            updateServiceRows(parsed);
                                        }
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
                            <div className="grid gap-3 md:grid-cols-2">
                                {serviceCards.map((card, index) => {
                                    const imageShapeClass = card.imageStyle === "circle" ? "rounded-full" : "rounded-lg";
                                    const selectedFile = selectedUploadFiles[index] ?? null;
                                    const selectedPreview = selectedPreviewByCard[index] ?? "";
                                    const previewSrc = selectedPreview || card.imageUrl;
                                    const uploadSuccessText = uploadSuccessByCard[index] ?? "";
                                    const uploadErrorText = uploadErrorByCard[index] ?? "";
                                    return (
                                        <article
                                            key={`service-card-${index}`}
                                            className="grid gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3"
                                        >
                                            <div className="text-xs font-semibold">#{index + 1}</div>

                                            <label className="grid gap-1">
                                                <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceCardTitle}</span>
                                                <Input value={card.title} onChange={(event) => updateServiceCard(index, { title: event.target.value })} />
                                            </label>

                                            <label className="grid gap-1">
                                                <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceCardBody}</span>
                                                <Textarea rows={3} value={card.body} onChange={(event) => updateServiceCard(index, { body: event.target.value })} />
                                            </label>

                                            <div className="grid gap-2">
                                                <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceCardImage}</span>
                                                {previewSrc ? (
                                                    <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-2">
                                                        <img
                                                            src={previewSrc}
                                                            alt={card.title || `Service card ${index + 1}`}
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
                                                <div className="flex items-center gap-2">
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
                                                            updateServiceCard(index, { imageUrl: "" });
                                                            setSelectedUploadFiles((prev) => ({ ...prev, [index]: null }));
                                                            setSelectedPreviewByCard((prev) => ({ ...prev, [index]: "" }));
                                                            setUploadSuccessByCard((prev) => ({ ...prev, [index]: "" }));
                                                            setUploadErrorByCard((prev) => ({ ...prev, [index]: "" }));
                                                        }}
                                                        disabled={(!card.imageUrl && !selectedPreview) || uploadingCardIndex === index}
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
                                                {uploadSuccessText ? (
                                                    <span className="text-xs text-green-600">{uploadSuccessText}</span>
                                                ) : null}
                                                {uploadErrorText ? (
                                                    <span className="text-xs text-red-500">{uploadErrorText}</span>
                                                ) : null}
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <label className="grid gap-1">
                                                    <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceCardImageStyle}</span>
                                                    <Select
                                                        value={card.imageStyle}
                                                        onChange={(event) =>
                                                            updateServiceCard(index, {
                                                                imageStyle: event.target.value as ShowServiceImageStyle,
                                                            })
                                                        }
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
                                                            updateServiceCard(index, {
                                                                imagePosition: event.target.value as ShowServiceImagePosition,
                                                            })
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
                                                <label className="grid gap-1">
                                                    <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceCardShowImage}</span>
                                                    <button
                                                        type="button"
                                                        className={`w-fit rounded-md border px-3 py-1 text-sm ${
                                                            card.showImage
                                                                ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))] text-[rgb(var(--bg))]"
                                                                : "border-[rgb(var(--border))] bg-[rgb(var(--panel))] text-[rgb(var(--text))]"
                                                        }`}
                                                        onClick={() => updateServiceCard(index, { showImage: !card.showImage })}
                                                    >
                                                        {card.showImage ? labels.enabled : labels.hidden}
                                                    </button>
                                                </label>
                                                <label className="grid gap-1">
                                                    <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceCardShowTitle}</span>
                                                    <button
                                                        type="button"
                                                        className={`w-fit rounded-md border px-3 py-1 text-sm ${
                                                            card.showTitle
                                                                ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))] text-[rgb(var(--bg))]"
                                                                : "border-[rgb(var(--border))] bg-[rgb(var(--panel))] text-[rgb(var(--text))]"
                                                        }`}
                                                        onClick={() => updateServiceCard(index, { showTitle: !card.showTitle })}
                                                    >
                                                        {card.showTitle ? labels.enabled : labels.hidden}
                                                    </button>
                                                </label>
                                                <label className="grid gap-1">
                                                    <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldServiceCardShowBody}</span>
                                                    <button
                                                        type="button"
                                                        className={`w-fit rounded-md border px-3 py-1 text-sm ${
                                                            card.showBody
                                                                ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))] text-[rgb(var(--bg))]"
                                                                : "border-[rgb(var(--border))] bg-[rgb(var(--panel))] text-[rgb(var(--text))]"
                                                        }`}
                                                        onClick={() => updateServiceCard(index, { showBody: !card.showBody })}
                                                    >
                                                        {card.showBody ? labels.enabled : labels.hidden}
                                                    </button>
                                                </label>
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
                                value={currentBlock.points.join("\n")}
                                onChange={(event) => updateCurrentBlock({ points: toPoints(event.target.value) })}
                            />
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.pointsHint}</span>
                        </label>
                    )}

                    <div className="grid gap-3 md:grid-cols-3">
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldFontFamily}</span>
                            <Select
                                value={currentBlock.fontFamily}
                                onChange={(event) => updateCurrentBlock({ fontFamily: event.target.value as ShowContentFontFamily })}
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
                                value={currentBlock.titleScale}
                                onChange={(event) => updateCurrentBlock({ titleScale: event.target.value as ShowContentTitleScale })}
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
                                value={currentBlock.bodyScale}
                                onChange={(event) => updateCurrentBlock({ bodyScale: event.target.value as ShowContentBodyScale })}
                            >
                                {bodyScaleOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </Select>
                        </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" onClick={saveToFirebase} disabled={saveStatus === "saving"}>
                            {labels.save}
                        </Button>
                        {saveStatusText ? (
                            <span className="text-xs text-[rgb(var(--muted))]" aria-live="polite">
                                {saveStatusText}
                            </span>
                        ) : null}
                    </div>
                </div>
            </section>
        </div>
    );
}
