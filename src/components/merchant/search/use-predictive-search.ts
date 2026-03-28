"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type { PredictiveSearchSuggestion, PredictiveSearchTarget } from "@/lib/types/search";

type UsePredictiveSearchParams = {
    query: string;
    targets: PredictiveSearchTarget[];
    staticSuggestions?: PredictiveSearchSuggestion[];
    limit?: number;
    debounceMs?: number;
    enabled?: boolean;
    onEnterSelect?: (item: PredictiveSearchSuggestion) => void;
};

type UsePredictiveSearchResult = {
    loading: boolean;
    error: string;
    open: boolean;
    setOpen: (open: boolean) => void;
    activeIndex: number;
    suggestions: PredictiveSearchSuggestion[];
    empty: boolean;
    handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    selectSuggestion: (item: PredictiveSearchSuggestion) => void;
    selectByIndex: (index: number) => void;
};

type SuggestResponse = {
    ok?: boolean;
    query?: string;
    suggestions?: PredictiveSearchSuggestion[];
};

function toQueryString(params: { query: string; targets: PredictiveSearchTarget[]; limit: number }): string {
    const search = new URLSearchParams();
    search.set("q", params.query);
    search.set("limit", String(params.limit));
    search.set("targets", params.targets.join(","));
    return search.toString();
}

function rankStaticSuggestions(items: PredictiveSearchSuggestion[], query: string, limit: number): PredictiveSearchSuggestion[] {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];

    return items
        .map((item) => {
            const keywordsText = typeof item.meta?.keywordsText === "string" ? item.meta.keywordsText : "";
            const haystacks = [
                item.value,
                item.title,
                item.subtitle ?? "",
                keywordsText,
            ]
                .join(" ")
                .toLowerCase();
            const startsWith = item.value.toLowerCase().startsWith(normalizedQuery) || item.title.toLowerCase().startsWith(normalizedQuery);
            const index = haystacks.indexOf(normalizedQuery);
            if (index < 0) return null;
            return {
                ...item,
                score: startsWith ? 10_000 - index : 5_000 - index,
            };
        })
        .filter((item): item is PredictiveSearchSuggestion => item !== null)
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "zh-Hant"))
        .slice(0, limit);
}

export function usePredictiveSearch({
    query,
    targets,
    staticSuggestions = [],
    limit = 12,
    debounceMs = 180,
    enabled = true,
    onEnterSelect,
}: UsePredictiveSearchParams): UsePredictiveSearchResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [suggestions, setSuggestions] = useState<PredictiveSearchSuggestion[]>([]);

    const normalizedQuery = query.trim();
    const normalizedTargets = useMemo(() => Array.from(new Set(targets)), [targets]);

    useEffect(() => {
        if (!enabled || !normalizedQuery) {
            setSuggestions((current) => (current.length === 0 ? current : []));
            setLoading(false);
            setError("");
            setActiveIndex(-1);
            return;
        }

        const staticMatches = rankStaticSuggestions(staticSuggestions, normalizedQuery, limit);
        if (normalizedTargets.length === 0) {
            setSuggestions(staticMatches);
            setLoading(false);
            setError("");
            setActiveIndex(staticMatches.length > 0 ? 0 : -1);
            return;
        }

        let cancelled = false;
        const handle = window.setTimeout(async () => {
            setLoading(true);
            setError("");
            try {
                const queryString = toQueryString({
                    query: normalizedQuery,
                    targets: normalizedTargets,
                    limit,
                });
                const response = await fetch(`/api/merchant/search/suggest?${queryString}`, {
                    method: "GET",
                    cache: "no-store",
                });
                if (!response.ok) {
                    if (!cancelled) {
                        setError("查詢失敗");
                        setSuggestions([]);
                        setActiveIndex(-1);
                    }
                    return;
                }
                const payload = (await response.json()) as SuggestResponse;
                const remote = Array.isArray(payload.suggestions) ? payload.suggestions : [];
                const deduped = new Map<string, PredictiveSearchSuggestion>();
                for (const item of [...staticMatches, ...remote]) {
                    deduped.set(`${item.target}:${item.id}:${item.value}`.toLowerCase(), item);
                }
                const next = [...deduped.values()]
                    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "zh-Hant"))
                    .slice(0, limit);
                if (!cancelled) {
                    setSuggestions(next);
                    setActiveIndex(next.length > 0 ? 0 : -1);
                }
            } catch {
                if (!cancelled) {
                    setError("查詢失敗");
                    setSuggestions(staticMatches);
                    setActiveIndex(staticMatches.length > 0 ? 0 : -1);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, debounceMs);

        return () => {
            cancelled = true;
            window.clearTimeout(handle);
        };
    }, [debounceMs, enabled, limit, normalizedQuery, normalizedTargets, staticSuggestions]);

    const selectSuggestion = useCallback(
        (item: PredictiveSearchSuggestion) => {
            onEnterSelect?.(item);
            setOpen(false);
        },
        [onEnterSelect],
    );

    const selectByIndex = useCallback(
        (index: number) => {
            if (index < 0 || index >= suggestions.length) return;
            const target = suggestions[index];
            selectSuggestion(target);
        },
        [selectSuggestion, suggestions],
    );

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
                setOpen(true);
            }
            if (event.key === "ArrowDown") {
                event.preventDefault();
                if (suggestions.length === 0) return;
                setActiveIndex((prev) => (prev + 1 >= suggestions.length ? 0 : prev + 1));
                return;
            }
            if (event.key === "ArrowUp") {
                event.preventDefault();
                if (suggestions.length === 0) return;
                setActiveIndex((prev) => (prev - 1 < 0 ? suggestions.length - 1 : prev - 1));
                return;
            }
            if (event.key === "Escape") {
                setOpen(false);
                return;
            }
            if (event.key === "Enter" && open && activeIndex >= 0 && activeIndex < suggestions.length) {
                event.preventDefault();
                selectByIndex(activeIndex);
            }
        },
        [activeIndex, open, selectByIndex, suggestions.length],
    );

    return {
        loading,
        error,
        open,
        setOpen,
        activeIndex,
        suggestions,
        empty: !loading && normalizedQuery.length > 0 && suggestions.length === 0 && !error,
        handleKeyDown,
        selectSuggestion,
        selectByIndex,
    };
}
