"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BusinessLandingPage } from "@/features/business/components/BusinessLandingPage";
import {
    DEFAULT_BUSINESS_HOMEPAGE_CONTENT_STATE,
    normalizeBusinessHomepageContentState,
    type BusinessHomepageContentState,
    type BusinessHomepageLocale,
    type BusinessHomepageThemePreset,
} from "@/features/business/services/businessHomepageContent";

type BossAdminHomepageBuilderProps = {
    initialState: BusinessHomepageContentState;
    hasSavedPreferences?: boolean;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";
type BuilderSectionId = "hero" | "closing" | "theme";
type PreviewViewport = "desktop" | "mobile";

const sectionLabels: Record<BuilderSectionId, string> = {
    hero: "Hero",
    closing: "Closing CTA",
    theme: "Theme",
};

const themeOptions: Array<{ value: BusinessHomepageThemePreset; label: string; hint: string }> = [
    { value: "forest", label: "Forest", hint: "綠色、沉穩、營運系統感" },
    { value: "ocean", label: "Ocean", hint: "藍色、理性、SaaS 感" },
    { value: "sunset", label: "Sunset", hint: "橘色、提案、展示感" },
    { value: "slate", label: "Slate", hint: "灰藍、專業、平台感" },
];

function cloneDefaultState(): BusinessHomepageContentState {
    return JSON.parse(JSON.stringify(DEFAULT_BUSINESS_HOMEPAGE_CONTENT_STATE)) as BusinessHomepageContentState;
}

export function BossAdminHomepageBuilder({
    initialState,
    hasSavedPreferences = true,
}: BossAdminHomepageBuilderProps) {
    const [state, setState] = useState<BusinessHomepageContentState>(() => normalizeBusinessHomepageContentState(initialState));
    const [locale, setLocale] = useState<BusinessHomepageLocale>("zh");
    const [activeSection, setActiveSection] = useState<BuilderSectionId>("hero");
    const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const current = state.locale[locale];

    const saveStatusText = useMemo(() => {
        if (saveStatus === "saving") return "儲存中...";
        if (saveStatus === "saved") return "已儲存";
        if (saveStatus === "error") return "儲存失敗";
        return "";
    }, [saveStatus]);

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
        <section className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_360px] 2xl:grid-cols-[280px_minmax(0,1fr)_400px]">
            <aside className="grid gap-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4 xl:sticky xl:top-4 xl:self-start">
                <div className="grid gap-1">
                    <div className="text-base font-semibold">官方首頁 Builder</div>
                    <div className="text-xs text-[rgb(var(--muted))]">把 `http://localhost:3000/` 的內容編輯切成 section list / live canvas / inspector。</div>
                    <div className="text-xs text-[rgb(var(--muted))]">目前首頁維持固定區段順序，先對齊單頁 builder 體驗，再往 block schema 演進。</div>
                </div>

                <div className="inline-flex w-fit rounded-lg border border-[rgb(var(--border))] p-1">
                    <button
                        type="button"
                        className={`rounded px-2 py-1 text-xs ${locale === "zh" ? "bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "text-[rgb(var(--text))]"}`}
                        onClick={() => setLocale("zh")}
                    >
                        中文
                    </button>
                    <button
                        type="button"
                        className={`rounded px-2 py-1 text-xs ${locale === "en" ? "bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "text-[rgb(var(--text))]"}`}
                        onClick={() => setLocale("en")}
                    >
                        English
                    </button>
                </div>

                <div className="grid gap-2">
                    {(["hero", "closing", "theme"] as const).map((sectionId, index) => (
                        <button
                            key={sectionId}
                            type="button"
                            onClick={() => setActiveSection(sectionId)}
                            className={`grid gap-2 rounded-xl border px-3 py-3 text-left ${activeSection === sectionId ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel2))]" : "border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"}`}
                        >
                            <div className="text-xs uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{index + 1}</div>
                            <div className="text-sm font-semibold">{sectionLabels[sectionId]}</div>
                            <div className="line-clamp-2 text-xs text-[rgb(var(--muted))]">
                                {sectionId === "hero"
                                    ? current.title
                                    : sectionId === "closing"
                                      ? current.finalTitle
                                      : themeOptions.find((option) => option.value === state.theme.preset)?.hint}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="grid gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                    <div className="text-sm font-semibold">Inserter</div>
                    <div className="text-xs text-[rgb(var(--muted))]">首頁目前是固定段落模板。這裡先保留與 showcase builder 一致的 UI 架構。</div>
                    <div className="grid gap-2">
                        {(["hero", "closing", "theme"] as const).map((sectionId) => (
                            <div key={`insert-${sectionId}`} className="flex items-center justify-between rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2">
                                <span className="text-sm">{sectionLabels[sectionId]}</span>
                                <span className="text-[11px] text-[rgb(var(--muted))]">Template section</span>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            <section className="grid gap-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="grid gap-1">
                        <div className="text-base font-semibold">官方首頁 Preview Canvas</div>
                        <div className="text-xs text-[rgb(var(--muted))]">這裡直接預覽 `http://localhost:3000/` 使用的 `BusinessLandingPage`。</div>
                    </div>
                    {!hasSavedPreferences ? (
                        <span className="rounded-full border border-[rgb(var(--accent))] bg-[rgb(var(--panel2))] px-3 py-1 text-xs">
                            目前使用 default homepage content
                        </span>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3">
                    <div className="grid gap-1">
                        <div className="text-[11px] uppercase tracking-[0.08em] text-[rgb(var(--muted))]">Viewport</div>
                        <div className="inline-flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-1">
                            {([
                                ["desktop", "桌機"],
                                ["mobile", "手機"],
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
                        <BusinessLandingPage
                            lang={locale}
                            isAuthenticated={false}
                            dashboardHref="/dashboard"
                            homepageContent={state}
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4 xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:self-start xl:overflow-auto">
                <div className="grid gap-1">
                    <div className="text-base font-semibold">Inspector</div>
                    <div className="text-xs text-[rgb(var(--muted))]">{sectionLabels[activeSection]}</div>
                </div>

                <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3">
                    <Button type="button" onClick={save} disabled={saveStatus === "saving"}>
                        儲存首頁內容
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
                        重設預設值
                    </Button>
                    {saveStatusText ? <span className="text-xs text-[rgb(var(--muted))]">{saveStatusText}</span> : null}
                </div>

                {activeSection === "hero" ? (
                    <div className="grid gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                        <div className="text-sm font-medium">Hero Content</div>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">Kicker / 前綴文字</span>
                            <Input value={current.kicker} onChange={(event) => updateField("kicker", event.target.value)} />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">主標題</span>
                            <Input value={current.title} onChange={(event) => updateField("title", event.target.value)} />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">說明文字</span>
                            <Textarea rows={5} value={current.desc} onChange={(event) => updateField("desc", event.target.value)} />
                        </label>
                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="grid gap-1">
                                <span className="text-xs text-[rgb(var(--muted))]">主要按鈕文字</span>
                                <Input value={current.ctaPrimary} onChange={(event) => updateField("ctaPrimary", event.target.value)} />
                            </label>
                            <label className="grid gap-1">
                                <span className="text-xs text-[rgb(var(--muted))]">次要按鈕文字</span>
                                <Input value={current.ctaSecondary} onChange={(event) => updateField("ctaSecondary", event.target.value)} />
                            </label>
                        </div>
                    </div>
                ) : null}

                {activeSection === "closing" ? (
                    <div className="grid gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                        <div className="text-sm font-medium">Closing CTA</div>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">頁尾 CTA 標題</span>
                            <Input value={current.finalTitle} onChange={(event) => updateField("finalTitle", event.target.value)} />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">頁尾 CTA 說明</span>
                            <Textarea rows={4} value={current.finalDesc} onChange={(event) => updateField("finalDesc", event.target.value)} />
                        </label>
                        <label className="grid gap-1 md:max-w-xs">
                            <span className="text-xs text-[rgb(var(--muted))]">頁尾 CTA 按鈕文字</span>
                            <Input value={current.finalCta} onChange={(event) => updateField("finalCta", event.target.value)} />
                        </label>
                    </div>
                ) : null}

                {activeSection === "theme" ? (
                    <div className="grid gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                        <div className="text-sm font-medium">Theme Preset</div>
                        <label className="grid gap-1 md:max-w-xs">
                            <span className="text-xs text-[rgb(var(--muted))]">整體配色風格</span>
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
                                        {option.label}
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
                                    <div className="text-sm font-semibold">{option.label}</div>
                                    <div className="text-xs text-[rgb(var(--muted))]">{option.hint}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : null}

                <details className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                    <summary className="cursor-pointer list-none text-sm font-medium">JSON Snapshot</summary>
                    <div className="mt-3 grid gap-2">
                        <div className="text-xs text-[rgb(var(--muted))]">唯讀檢視目前首頁可編輯內容，方便後續往 block schema 遷移。</div>
                        <Textarea rows={16} readOnly value={JSON.stringify(state, null, 2)} />
                    </div>
                </details>
            </section>
        </section>
    );
}
