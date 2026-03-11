"use client";

import { useEffect } from "react";
import { applyThemeState, normalizeThemeState } from "@/lib/services/themePreferences";

type DashboardPreferencesResponse = {
    preferences?: {
        theme?: unknown;
    };
};

export function DashboardThemeSync() {
    useEffect(() => {
        let cancelled = false;

        void (async () => {
            try {
                const response = await fetch("/api/dashboard/preferences", {
                    method: "GET",
                    cache: "no-store",
                });
                if (!response.ok || cancelled) return;

                const payload = (await response.json().catch(() => null)) as DashboardPreferencesResponse | null;
                if (!payload?.preferences?.theme || cancelled) return;

                applyThemeState(normalizeThemeState(payload.preferences.theme));
            } catch {
                // Keep local fallback theme when remote fetch fails.
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return null;
}
