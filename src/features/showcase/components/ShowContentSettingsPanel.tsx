"use client";

import { type DragEvent, useMemo, useState } from "react";
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

export function ShowContentSettingsPanel({ labels, initialState }: ShowContentSettingsPanelProps) {
    const [state, setState] = useState<ShowContentState>(() => normalizeShowContentState(initialState));
    const [locale, setLocale] = useState<ShowContentLocale>("zh");
    const [activeBlockId, setActiveBlockId] = useState<ShowContentBlockId>("hero");
    const [dragging, setDragging] = useState<ShowContentBlockId | null>(null);
    const [dragOver, setDragOver] = useState<ShowContentBlockId | null>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
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
                                onClick={() => setActiveBlockId(blockId)}
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

                    <label className="grid gap-1">
                        <span className="text-xs text-[rgb(var(--muted))]">{labels.fieldPoints}</span>
                        <Textarea
                            rows={6}
                            value={currentBlock.points.join("\n")}
                            onChange={(event) => updateCurrentBlock({ points: toPoints(event.target.value) })}
                        />
                        <span className="text-xs text-[rgb(var(--muted))]">{labels.pointsHint}</span>
                    </label>

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
