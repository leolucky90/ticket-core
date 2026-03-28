"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProcessingIndicator } from "@/components/ui/processing-indicator";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BusinessLandingPage } from "@/features/business/components/BusinessLandingPage";
import type { UiLanguage } from "@/lib/i18n/ui-text";
import { getUiText } from "@/lib/i18n/ui-text";
import {
    DEFAULT_BUSINESS_HOMEPAGE_CONTENT_STATE,
    normalizeBusinessHomepageContentState,
    type BusinessHomepageContentState,
    type BusinessHomepageLocale,
    type BusinessHomepageThemePreset,
} from "@/features/business/services/businessHomepageContent";

type BossAdminHomepageBuilderProps = {
    lang: UiLanguage;
    initialState: BusinessHomepageContentState;
    hasSavedPreferences?: boolean;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";
type BuilderSectionId = "hero" | "closing" | "theme";
type PreviewViewport = "desktop" | "mobile";
type PreviewScale = 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1 | 1.1 | 1.2;

const PREVIEW_SCALE_STEPS: PreviewScale[] = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2];
const DEFAULT_PREVIEW_SCALE: PreviewScale = 0.7;

const themeOptions: Array<{ value: BusinessHomepageThemePreset; label: Record<UiLanguage, string>; hint: Record<UiLanguage, string> }> = [
    { value: "forest", label: { zh: "森林", en: "Forest" }, hint: { zh: "綠色、沉穩、營運系統感", en: "Green, steady, operational system mood" } },
    { value: "ocean", label: { zh: "海洋", en: "Ocean" }, hint: { zh: "藍色、理性、SaaS 感", en: "Blue, analytical, SaaS-oriented" } },
    { value: "sunset", label: { zh: "夕照", en: "Sunset" }, hint: { zh: "橘色、提案、展示感", en: "Orange, proposal-driven, presentation mood" } },
    { value: "slate", label: { zh: "石板", en: "Slate" }, hint: { zh: "灰藍、專業、平台感", en: "Slate blue, professional, platform feel" } },
];

function cloneDefaultState(): BusinessHomepageContentState {
    return JSON.parse(JSON.stringify(DEFAULT_BUSINESS_HOMEPAGE_CONTENT_STATE)) as BusinessHomepageContentState;
}

export function BossAdminHomepageBuilder({
    lang,
    initialState,
    hasSavedPreferences = true,
}: BossAdminHomepageBuilderProps) {
    const ui = getUiText(lang).bossAdmin;
    const [state, setState] = useState<BusinessHomepageContentState>(() => normalizeBusinessHomepageContentState(initialState));
    const [locale, setLocale] = useState<BusinessHomepageLocale>("zh");
    const [activeSection, setActiveSection] = useState<BuilderSectionId>("hero");
    const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
    const [previewScale, setPreviewScale] = useState<PreviewScale>(DEFAULT_PREVIEW_SCALE);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const current = state.locale[locale];
    const desktopPreviewWidth = Math.round(1180 * previewScale);

    const sectionLabels: Record<BuilderSectionId, string> = {
        hero: ui.sectionHero,
        closing: ui.sectionClosing,
        theme: ui.sectionTheme,
    };

    const saveStatusText = useMemo(() => {
        if (saveStatus === "saving") return ui.saving;
        if (saveStatus === "saved") return ui.saved;
        if (saveStatus === "error") return ui.saveFailed;
        return "";
    }, [saveStatus, ui.saveFailed, ui.saved, ui.saving]);

    function updateField(
        key: keyof BusinessHomepageContentState["locale"]["zh"],
        value: string,
    ) {
        setSaveStatus("idle");
        setState((prev) => ({
            ...prev,
            locale: {
                ...prev.locale,
                [locale]: {
                    ...prev.locale[locale],
                    [key]: value,
                },
            },
        }));
    }

    function updatePreviewScale(direction: -1 | 1) {
        const currentIndex = PREVIEW_SCALE_STEPS.indexOf(previewScale);
        if (currentIndex === -1) return;
        const nextIndex = Math.min(PREVIEW_SCALE_STEPS.length - 1, Math.max(0, currentIndex + direction));
        setPreviewScale(PREVIEW_SCALE_STEPS[nextIndex]);
    }

    async function save() {
        setSaveStatus("saving");
        try {
            const response = await fetch("/api/bossadmin/homepage-content", {
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
        <div className="relative overflow-hidden rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-4 md:p-5">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="biz-grid absolute inset-0 opacity-40" />
                <div className="absolute -left-10 top-10 h-44 w-44 rounded-full bg-[rgb(var(--accent))]/10 blur-3xl" />
                <div className="absolute right-0 top-16 h-56 w-56 rounded-full bg-white/4 blur-3xl" />
            </div>

            <div className="relative grid gap-4">
                <section className="biz-fade-up grid gap-4 rounded-[1.8rem] border border-[rgb(var(--border))] bg-[rgb(var(--panel))]/90 p-5 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="grid gap-3">
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-[rgb(var(--muted))] uppercase">
                            <span className="biz-pulse h-2 w-2 rounded-full bg-[rgb(var(--accent))]" />
                            {ui.homepageStudioTag}
                        </div>
                        <div className="text-2xl font-semibold text-[rgb(var(--text))]">{ui.builderTitle}</div>
                        <div className="max-w-3xl text-sm leading-relaxed text-[rgb(var(--muted))]">{ui.builderDescription}</div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            [ui.sectionHero, ui.sectionHeroHint],
                            [ui.sectionClosing, ui.sectionClosingHint],
                            [ui.sectionTheme, ui.sectionThemeHint],
                        ].map(([title, note], index) => (
                            <div
                                key={title}
                                className={`rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4 ${index === 1 ? "biz-float" : index === 2 ? "biz-float biz-delay-1" : ""}`}
                            >
                                <div className="text-xs font-semibold tracking-[0.1em] text-[rgb(var(--muted))] uppercase">{title}</div>
                                <div className="mt-2 text-sm text-[rgb(var(--text))]">{note}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_380px] 2xl:grid-cols-[300px_minmax(0,1fr)_420px]">
            <aside className="grid gap-4 rounded-[1.8rem] border border-[rgb(var(--border))] bg-[rgb(var(--panel))]/90 p-4 backdrop-blur-xl xl:sticky xl:top-4 xl:self-start">
                <div className="grid gap-1">
                    <div className="text-base font-semibold">{ui.builderName}</div>
                    <div className="text-xs text-[rgb(var(--muted))]">{ui.builderHint}</div>
                    <div className="text-xs text-[rgb(var(--muted))]">{ui.builderSubHint}</div>
                </div>

                <div className="inline-flex w-fit rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-1">
                    <button
                        type="button"
                        className={`rounded-full px-3 py-1 text-xs ${locale === "zh" ? "bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "text-[rgb(var(--text))]"}`}
                        onClick={() => setLocale("zh")}
                    >
                        {ui.zhLabel}
                    </button>
                    <button
                        type="button"
                        className={`rounded-full px-3 py-1 text-xs ${locale === "en" ? "bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "text-[rgb(var(--text))]"}`}
                        onClick={() => setLocale("en")}
                    >
                        {ui.enLabel}
                    </button>
                </div>

                <div className="grid gap-2">
                    {(["hero", "closing", "theme"] as const).map((sectionId, index) => (
                        <button
                            key={sectionId}
                            type="button"
                            onClick={() => setActiveSection(sectionId)}
                            className={`grid gap-2 rounded-[1.2rem] border px-3 py-3 text-left transition ${activeSection === sectionId ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel2))]" : "border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"}`}
                        >
                            <div className="text-xs uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{index + 1}</div>
                            <div className="text-sm font-semibold">{sectionLabels[sectionId]}</div>
                            <div className="line-clamp-2 text-xs text-[rgb(var(--muted))]">
                                {sectionId === "hero"
                                    ? current.title
                                    : sectionId === "closing"
                                      ? current.finalTitle
                                      : themeOptions.find((option) => option.value === state.theme.preset)?.hint[lang]}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="grid gap-2 rounded-[1.4rem] border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                    <div className="text-sm font-semibold">{ui.inserterTitle}</div>
                    <div className="text-xs text-[rgb(var(--muted))]">{ui.inserterHint}</div>
                    <div className="grid gap-2">
                        {(["hero", "closing", "theme"] as const).map((sectionId) => (
                            <div key={`insert-${sectionId}`} className="flex items-center justify-between rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2">
                                <span className="text-sm">{sectionLabels[sectionId]}</span>
                                <span className="text-[11px] text-[rgb(var(--muted))]">{ui.templateSection}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            <section className="grid gap-4 rounded-[1.8rem] border border-[rgb(var(--border))] bg-[rgb(var(--panel))]/90 p-4 backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="grid gap-1">
                        <div className="text-base font-semibold">{ui.previewTitle}</div>
                        <div className="text-xs text-[rgb(var(--muted))]">{ui.previewHint}</div>
                    </div>
                    {!hasSavedPreferences ? (
                        <span className="rounded-full border border-[rgb(var(--accent))] bg-[rgb(var(--panel2))] px-3 py-1 text-xs">
                            {ui.usingDefaultContent}
                        </span>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-4 rounded-[1.4rem] border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3">
                    <div className="grid gap-1">
                        <div className="text-[11px] uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{ui.viewport}</div>
                        <div className="inline-flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-1">
                            {([
                                ["desktop", ui.desktop],
                                ["mobile", ui.mobile],
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

                    {previewViewport === "desktop" ? (
                        <div className="grid gap-1">
                            <div className="text-[11px] uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{ui.previewScale}</div>
                            <div className="inline-flex items-center gap-1 rounded-[1.1rem] border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-1.5 shadow-sm">
                                <div className="min-w-[4.4rem] rounded-[0.9rem] px-3 py-1.5 text-center text-sm font-medium text-[rgb(var(--text))]">
                                    {Math.round(previewScale * 100)}%
                                </div>
                                <button
                                    type="button"
                                    className="grid h-9 w-9 place-items-center rounded-[0.85rem] text-lg text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel2))] disabled:cursor-not-allowed disabled:opacity-40"
                                    onClick={() => updatePreviewScale(-1)}
                                    disabled={previewScale === PREVIEW_SCALE_STEPS[0]}
                                    aria-label={ui.zoomOut}
                                >
                                    -
                                </button>
                                <button
                                    type="button"
                                    className="grid h-9 w-9 place-items-center rounded-[0.85rem] text-xl text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel2))] disabled:cursor-not-allowed disabled:opacity-40"
                                    onClick={() => updatePreviewScale(1)}
                                    disabled={previewScale === PREVIEW_SCALE_STEPS[PREVIEW_SCALE_STEPS.length - 1]}
                                    aria-label={ui.zoomIn}
                                >
                                    +
                                </button>
                                <button
                                    type="button"
                                    className="rounded-full border border-[rgb(var(--accent))] px-4 py-1.5 text-sm font-medium text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel2))]"
                                    onClick={() => setPreviewScale(DEFAULT_PREVIEW_SCALE)}
                                >
                                    {ui.reset}
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="min-h-[760px] overflow-auto rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3 shadow-[0_30px_80px_-58px_rgb(var(--accent))]">
                    <div
                        className={previewViewport === "mobile"
                            ? "mx-auto w-full max-w-[390px] overflow-hidden rounded-[24px] border border-[rgb(var(--border))] bg-white shadow-sm"
                            : "overflow-hidden rounded-[24px] border border-[rgb(var(--border))] bg-white shadow-sm"}
                        style={previewViewport === "desktop" ? { width: `${desktopPreviewWidth}px` } : undefined}
                    >
                        <BusinessLandingPage
                            lang={locale}
                            isAuthenticated={false}
                            dashboardHref="/dashboard"
                            homepageContent={state}
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 rounded-[1.8rem] border border-[rgb(var(--border))] bg-[rgb(var(--panel))]/90 p-4 backdrop-blur-xl xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:self-start xl:overflow-auto">
                <div className="grid gap-1">
                    <div className="text-base font-semibold">{ui.inspectorTitle}</div>
                    <div className="text-xs text-[rgb(var(--muted))]">{sectionLabels[activeSection]}</div>
                </div>

                <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-[1.4rem] border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3">
                    <Button
                        type="button"
                        onClick={save}
                        disabled={saveStatus === "saving"}
                        loading={saveStatus === "saving"}
                        loadingLabel={ui.saving}
                    >
                        {ui.save}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            setSaveStatus("idle");
                            setState(cloneDefaultState());
                        }}
                        disabled={saveStatus === "saving"}
                    >
                        {ui.resetDefault}
                    </Button>
                    {saveStatus === "saving" ? <ProcessingIndicator label={ui.syncing} size="sm" /> : null}
                    {saveStatus !== "saving" && saveStatusText ? <span className="text-xs text-[rgb(var(--muted))]">{saveStatusText}</span> : null}
                </div>

                {activeSection === "hero" ? (
                    <div className="grid gap-3 rounded-[1.4rem] border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                        <div className="text-sm font-medium">{ui.heroContent}</div>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{ui.kickerField}</span>
                            <Input value={current.kicker} onChange={(event) => updateField("kicker", event.target.value)} />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{ui.titleField}</span>
                            <Input value={current.title} onChange={(event) => updateField("title", event.target.value)} />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{ui.descriptionField}</span>
                            <Textarea rows={5} value={current.desc} onChange={(event) => updateField("desc", event.target.value)} />
                        </label>
                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="grid gap-1">
                                <span className="text-xs text-[rgb(var(--muted))]">{ui.primaryCtaField}</span>
                                <Input value={current.ctaPrimary} onChange={(event) => updateField("ctaPrimary", event.target.value)} />
                            </label>
                            <label className="grid gap-1">
                                <span className="text-xs text-[rgb(var(--muted))]">{ui.secondaryCtaField}</span>
                                <Input value={current.ctaSecondary} onChange={(event) => updateField("ctaSecondary", event.target.value)} />
                            </label>
                        </div>
                    </div>
                ) : null}

                {activeSection === "closing" ? (
                    <div className="grid gap-3 rounded-[1.4rem] border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                        <div className="text-sm font-medium">{ui.closingTitle}</div>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{ui.closingCtaTitle}</span>
                            <Input value={current.finalTitle} onChange={(event) => updateField("finalTitle", event.target.value)} />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{ui.closingCtaDescription}</span>
                            <Textarea rows={4} value={current.finalDesc} onChange={(event) => updateField("finalDesc", event.target.value)} />
                        </label>
                        <label className="grid gap-1 md:max-w-xs">
                            <span className="text-xs text-[rgb(var(--muted))]">{ui.closingCtaButton}</span>
                            <Input value={current.finalCta} onChange={(event) => updateField("finalCta", event.target.value)} />
                        </label>
                    </div>
                ) : null}

                {activeSection === "theme" ? (
                    <div className="grid gap-3 rounded-[1.4rem] border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                        <div className="text-sm font-medium">{ui.themePresetTitle}</div>
                        <label className="grid gap-1 md:max-w-xs">
                            <span className="text-xs text-[rgb(var(--muted))]">{ui.themePresetField}</span>
                            <Select
                                value={state.theme.preset}
                                onChange={(event) => {
                                    const value = event.target.value as BusinessHomepageThemePreset;
                                    if (!themeOptions.some((option) => option.value === value)) return;
                                    setSaveStatus("idle");
                                    setState((prev) => ({
                                        ...prev,
                                        theme: { preset: value },
                                    }));
                                }}
                            >
                                {themeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label[lang]}
                                    </option>
                                ))}
                            </Select>
                        </label>
                        <div className="grid gap-2">
                            {themeOptions.map((option) => (
                                <button
                                    key={`theme-card-${option.value}`}
                                    type="button"
                                    onClick={() => {
                                        setSaveStatus("idle");
                                        setState((prev) => ({
                                            ...prev,
                                            theme: { preset: option.value },
                                        }));
                                    }}
                                    className={`grid gap-1 rounded-xl border px-3 py-3 text-left ${state.theme.preset === option.value ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel))]" : "border-[rgb(var(--border))] bg-[rgb(var(--panel))]"}`}
                                >
                                    <div className="text-sm font-semibold">{option.label[lang]}</div>
                                    <div className="text-xs text-[rgb(var(--muted))]">{option.hint[lang]}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : null}

                <details className="rounded-[1.4rem] border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                    <summary className="cursor-pointer list-none text-sm font-medium">{ui.jsonSnapshot}</summary>
                    <div className="mt-3 grid gap-2">
                        <div className="text-xs text-[rgb(var(--muted))]">{ui.jsonHint}</div>
                        <Textarea rows={16} readOnly value={JSON.stringify(state, null, 2)} />
                    </div>
                </details>
            </section>
                </section>
            </div>
        </div>
    );
}
