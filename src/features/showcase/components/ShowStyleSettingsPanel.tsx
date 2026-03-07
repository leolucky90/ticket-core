"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DEFAULT_SHOW_THEME_COLORS, normalizeShowThemeColors } from "@/features/showcase/services/showThemePreferences";
import type { ShowThemeColorRole, ShowThemeColors } from "@/features/showcase/types/showTheme";
import { rgbTripletToHex } from "@/lib/services/themePreferences";

export type ShowStyleLabels = {
    title: string;
    hint: string;
    reset: string;
    save: string;
    saving: string;
    saved: string;
    saveFailed: string;
    customColor: string;
    rolePage: string;
    roleHeader: string;
    roleHero: string;
    roleAbout: string;
    roleServices: string;
    roleContact: string;
    roleAd: string;
    roleFooter: string;
};

type ShowStyleSettingsPanelProps = {
    labels: ShowStyleLabels;
    initialColors: ShowThemeColors;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function hexToRgbTriplet(hex: string): `${number} ${number} ${number}` {
    const normalized = hex.replace("#", "");
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    return `${r} ${g} ${b}`;
}

export function ShowStyleSettingsPanel({ labels, initialColors }: ShowStyleSettingsPanelProps) {
    const [colors, setColors] = useState<ShowThemeColors>(() => normalizeShowThemeColors(initialColors));
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

    const roleLabels: Record<ShowThemeColorRole, string> = {
        page: labels.rolePage,
        header: labels.roleHeader,
        hero: labels.roleHero,
        about: labels.roleAbout,
        services: labels.roleServices,
        contact: labels.roleContact,
        ad: labels.roleAd,
        footer: labels.roleFooter,
    };
    const roles: ShowThemeColorRole[] = ["page", "header", "hero", "about", "services", "contact", "ad", "footer"];

    const saveStatusText = useMemo(() => {
        if (saveStatus === "saving") return labels.saving;
        if (saveStatus === "saved") return labels.saved;
        if (saveStatus === "error") return labels.saveFailed;
        return "";
    }, [labels.saveFailed, labels.saved, labels.saving, saveStatus]);

    function updateColor(role: ShowThemeColorRole, hex: string) {
        setSaveStatus("idle");
        setColors((prev) =>
            normalizeShowThemeColors({
                ...prev,
                [role]: hexToRgbTriplet(hex),
            }),
        );
    }

    async function saveToFirebase() {
        setSaveStatus("saving");
        try {
            const response = await fetch("/api/showcase/preferences", {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ themeColors: colors }),
            });
            if (!response.ok) throw new Error("save failed");
            setSaveStatus("saved");
        } catch {
            setSaveStatus("error");
        }
    }

    return (
        <div className="grid max-w-3xl gap-4">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4">
                <div className="grid gap-4">
                    <div className="grid gap-1">
                        <div className="auth-title">{labels.title}</div>
                        <div className="text-xs text-[rgb(var(--muted))]">{labels.hint}</div>
                    </div>

                    <div className="grid gap-3">
                        {roles.map((role) => {
                            const rgbValue = colors[role];
                            const hexValue = rgbTripletToHex(rgbValue, "#000000");
                            const pickerLabel = `${roleLabels[role]} - ${labels.customColor}`;

                            return (
                                <div
                                    key={role}
                                    className="grid gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="text-sm">{roleLabels[role]}</div>
                                        <label className="flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-xs text-[rgb(var(--muted))]">
                                            <span className="sr-only">{pickerLabel}</span>
                                            <input
                                                type="color"
                                                value={hexValue}
                                                aria-label={pickerLabel}
                                                onChange={(event) => updateColor(role, event.target.value)}
                                                className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                                            />
                                            <span className="font-mono uppercase">{hexValue}</span>
                                        </label>
                                    </div>
                                    <div
                                        className="h-3 rounded-full border border-[rgb(var(--border))]"
                                        style={{ backgroundColor: `rgb(${rgbValue})` }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="ghost" onClick={() => setColors(DEFAULT_SHOW_THEME_COLORS)}>
                            {labels.reset}
                        </Button>
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
            </div>
        </div>
    );
}
