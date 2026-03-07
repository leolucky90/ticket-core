"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { ThemeColorPalette } from "@/components/settings/ThemeColorPalette";
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

export function ThemeModeToggle({ labels }: ThemeModeToggleProps) {
    const themeState = useSyncExternalStore(
        subscribeThemeState,
        getThemeStateFromClient,
        () => SERVER_THEME_STATE,
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
    }

    function handleColorChange(role: ThemeColorRole, nextColor: string) {
        setThemeColor(role, nextColor);
    }

    function handleResetCustomTheme() {
        applyThemeState({
            mode: "custom",
            customColors: DEFAULT_THEME_CUSTOM_COLORS,
        });
    }

    return (
        <div className="grid gap-4">
            <div className="text-sm text-[rgb(var(--muted))]">{labels.sectionTitle}</div>
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
