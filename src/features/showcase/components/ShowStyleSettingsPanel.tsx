"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DEFAULT_SHOW_THEME_COLORS,
    DEFAULT_STOREFRONT_SETTINGS,
    normalizeShowThemeColors,
    normalizeStorefrontSettings,
} from "@/features/showcase/services/showThemePreferences";
import type { ShowThemeColorRole, ShowThemeColors, StorefrontSettings } from "@/features/showcase/types/showTheme";

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
    roleShopPage: string;
    roleShopHeader: string;
    roleShopHero: string;
    roleShopGrid: string;
    roleShopFooter: string;
    storefrontTitle: string;
    storefrontHint: string;
    storefrontShoppingEnabled: string;
    storefrontAutoRedirect: string;
    storefrontShowCart: string;
};

type ShowStyleSettingsPanelProps = {
    labels: ShowStyleLabels;
    initialColors: ShowThemeColors;
    initialStorefront: StorefrontSettings;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

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

export function ShowStyleSettingsPanel({ labels, initialColors, initialStorefront }: ShowStyleSettingsPanelProps) {
    const [colors, setColors] = useState<ShowThemeColors>(() => normalizeShowThemeColors(initialColors));
    const [storefront, setStorefront] = useState<StorefrontSettings>(() => normalizeStorefrontSettings(initialStorefront));
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
        shopPage: labels.roleShopPage,
        shopHeader: labels.roleShopHeader,
        shopHero: labels.roleShopHero,
        shopGrid: labels.roleShopGrid,
        shopFooter: labels.roleShopFooter,
    };
    const roles: ShowThemeColorRole[] = [
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
                body: JSON.stringify({ themeColors: colors, storefront }),
            });
            if (!response.ok) throw new Error("save failed");
            setSaveStatus("saved");
        } catch {
            setSaveStatus("error");
        }
    }

    return (
        <div className="grid w-full gap-4">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4">
                <div className="grid gap-4">
                    <div className="grid gap-1">
                        <div className="auth-title">{labels.title}</div>
                        <div className="text-xs text-[rgb(var(--muted))]">{labels.hint}</div>
                    </div>

                    <div className="grid gap-3">
                        {roles.map((role) => {
                            const rgbValue = colors[role];
                            const hexValue = rgbTripletToHexString(rgbValue);
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
                                    <div className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[10px] text-[rgb(var(--muted))]">
                                        rgb({rgbValue})
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="grid gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                        <div className="text-sm font-medium">{labels.storefrontTitle}</div>
                        <div className="text-xs text-[rgb(var(--muted))]">{labels.storefrontHint}</div>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={storefront.shoppingEnabled}
                                onChange={(event) => {
                                    setSaveStatus("idle");
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
                                    setSaveStatus("idle");
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
                                    setSaveStatus("idle");
                                    setStorefront((prev) => ({ ...prev, showCartOnNavForCustomer: event.target.checked }));
                                }}
                            />
                            <span>{labels.storefrontShowCart}</span>
                        </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setColors(DEFAULT_SHOW_THEME_COLORS);
                                setStorefront(DEFAULT_STOREFRONT_SETTINGS);
                            }}
                        >
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
