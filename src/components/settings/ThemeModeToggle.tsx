"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";
const THEME_EVENT = "app-theme-change";

function applyTheme(theme: Theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    window.dispatchEvent(new Event(THEME_EVENT));
}

function getClientTheme(): Theme {
    const attrTheme = document.documentElement.getAttribute("data-theme");
    if (attrTheme === "light" || attrTheme === "dark") return attrTheme;
    const stored = localStorage.getItem("theme");
    return stored === "light" ? "light" : "dark";
}

function subscribe(onStoreChange: () => void) {
    window.addEventListener(THEME_EVENT, onStoreChange);
    window.addEventListener("storage", onStoreChange);
    return () => {
        window.removeEventListener(THEME_EVENT, onStoreChange);
        window.removeEventListener("storage", onStoreChange);
    };
}

export function ThemeModeToggle() {
    const theme = useSyncExternalStore(subscribe, getClientTheme, () => "dark");

    function handleChange(nextTheme: Theme) {
        applyTheme(nextTheme);
    }

    return (
        <div className="grid gap-3">
            <div className="text-sm text-[rgb(var(--muted))]">網站風格</div>
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant={theme === "light" ? "solid" : "ghost"}
                    onClick={() => handleChange("light")}
                >
                    白天模式
                </Button>
                <Button
                    type="button"
                    variant={theme === "dark" ? "solid" : "ghost"}
                    onClick={() => handleChange("dark")}
                >
                    黑夜模式
                </Button>
            </div>
        </div>
    );
}
