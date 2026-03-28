"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { ThemeColorPalette } from "@/components/settings/ThemeColorPalette";
import { ProcessingIndicator } from "@/components/ui/processing-indicator";
import {
    applyThemeState,
    DEFAULT_THEME_CUSTOM_COLORS,
    getThemeStateFromClient,
    rgbTripletToHex,
    setThemeColor,
    setThemeMode,
    subscribeThemeState,
} from "@/lib/services/themePreferences";
import type { ThemeColorRole, ThemeMode } from "@/lib/types/theme";

export type ThemeModeToggleLabels = {
    sectionTitle: string;
    modeLight: string;
    modeDark: string;
    modeCustom: string;
    scopeHint: string;
    groupBaseTitle: string;
    groupBaseHint: string;
    groupAccentTitle: string;
    groupAccentHint: string;
    roleBg: string;
    rolePanel: string;
    rolePanel2: string;
    roleNav: string;
    roleText: string;
    roleAccent: string;
    roleBorder: string;
    resetPalette: string;
    customColor: string;
};

type ThemeModeToggleProps = {
    labels: ThemeModeToggleLabels;
};

const SERVER_THEME_STATE = {
    mode: "dark" as const,
    customColors: DEFAULT_THEME_CUSTOM_COLORS,
};

async function saveThemeToFirebase() {
    const theme = getThemeStateFromClient();
    const response = await fetch("/api/dashboard/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme }),
    });
    if (!response.ok) {
        throw new Error("save failed");
    }
}

export function ThemeModeToggle({ labels }: ThemeModeToggleProps) {
    const themeState = useSyncExternalStore(
        subscribeThemeState,
        getThemeStateFromClient,
        () => SERVER_THEME_STATE,
    );
    const saveTimerRef = useRef<number | null>(null);
    const saveStatusResetTimerRef = useRef<number | null>(null);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

    function setSettledStatus(status: "saved" | "error") {
        setSaveStatus(status);
        if (typeof window === "undefined") return;
        if (saveStatusResetTimerRef.current !== null) {
            window.clearTimeout(saveStatusResetTimerRef.current);
        }
        saveStatusResetTimerRef.current = window.setTimeout(() => {
            saveStatusResetTimerRef.current = null;
            setSaveStatus("idle");
        }, 1800);
    }

    function scheduleThemeSave() {
        if (typeof window === "undefined") return;
        if (saveTimerRef.current !== null) {
            window.clearTimeout(saveTimerRef.current);
        }
        if (saveStatusResetTimerRef.current !== null) {
            window.clearTimeout(saveStatusResetTimerRef.current);
            saveStatusResetTimerRef.current = null;
        }
        setSaveStatus("saving");
        saveTimerRef.current = window.setTimeout(() => {
            saveTimerRef.current = null;
            void saveThemeToFirebase()
                .then(() => {
                    setSettledStatus("saved");
                })
                .catch(() => {
                    setSettledStatus("error");
                });
        }, 220);
    }

    useEffect(
        () => () => {
            if (saveTimerRef.current !== null) {
                window.clearTimeout(saveTimerRef.current);
            }
            if (saveStatusResetTimerRef.current !== null) {
                window.clearTimeout(saveStatusResetTimerRef.current);
            }
        },
        [],
    );

    const modeOptions: Array<{ mode: ThemeMode; label: string }> = [
        { mode: "light", label: labels.modeLight },
        { mode: "dark", label: labels.modeDark },
        { mode: "custom", label: labels.modeCustom },
    ];

    const roleLabels: Record<ThemeColorRole, string> = {
        bg: labels.roleBg,
        panel: labels.rolePanel,
        panel2: labels.rolePanel2,
        nav: labels.roleNav,
        text: labels.roleText,
        accent: labels.roleAccent,
        border: labels.roleBorder,
    };

    const colorGroups: Array<{
        id: "base" | "accent";
        title: string;
        hint: string;
        roles: ThemeColorRole[];
    }> = [
        {
            id: "base",
            title: labels.groupBaseTitle,
            hint: labels.groupBaseHint,
            roles: ["bg", "panel", "panel2", "nav", "text"],
        },
        {
            id: "accent",
            title: labels.groupAccentTitle,
            hint: labels.groupAccentHint,
            roles: ["accent", "border"],
        },
    ];

    function handleModeChange(nextMode: ThemeMode) {
        setThemeMode(nextMode);
        scheduleThemeSave();
    }

    function handleColorChange(role: ThemeColorRole, nextColor: string) {
        setThemeColor(role, nextColor);
        scheduleThemeSave();
    }

    function handleResetCustomTheme() {
        applyThemeState({
            mode: "custom",
            customColors: DEFAULT_THEME_CUSTOM_COLORS,
        });
        scheduleThemeSave();
    }

    return (
        <div className="grid gap-4">
            <div className="grid gap-1">
                <div className="text-sm text-[rgb(var(--muted))]">{labels.sectionTitle}</div>
                {saveStatus === "saving" ? <ProcessingIndicator label="外觀設定同步中..." size="sm" /> : null}
                {saveStatus === "saved" ? <div className="text-xs text-[rgb(var(--muted))]">外觀設定已同步到後台。</div> : null}
                {saveStatus === "error" ? <div className="text-xs text-[rgb(var(--muted))]">外觀設定同步失敗，已保留本機預覽。</div> : null}
            </div>
            <div className="flex flex-wrap gap-2">
                {modeOptions.map(({ mode, label }) => (
                    <Button
                        key={mode}
                        type="button"
                        variant={themeState.mode === mode ? "solid" : "ghost"}
                        onClick={() => handleModeChange(mode)}
                    >
                        {label}
                    </Button>
                ))}
            </div>
            <div className="grid gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                <div className="text-xs text-[rgb(var(--muted))]">{labels.scopeHint}</div>
                {colorGroups.map((group) => (
                    <div
                        key={group.id}
                        className="grid gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-3"
                    >
                        <div className="text-xs font-semibold">{group.title}</div>
                        <div className="text-[11px] text-[rgb(var(--muted))]">{group.hint}</div>
                        <div className="grid gap-2">
                            {group.roles.map((role) => (
                                <ThemeColorPalette
                                    key={role}
                                    label={roleLabels[role]}
                                    customColorLabel={labels.customColor}
                                    customHexValue={rgbTripletToHex(themeState.customColors[role], "#000000")}
                                    onCustomColorChange={(color) => handleColorChange(role, color)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                <div className="pt-1">
                    <Button type="button" variant="ghost" onClick={handleResetCustomTheme}>
                        {labels.resetPalette}
                    </Button>
                </div>
            </div>
        </div>
    );
}
