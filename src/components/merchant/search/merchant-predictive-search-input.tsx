"use client";

import { useState } from "react";
import type { FocusEvent } from "react";
import { cn } from "@/components/ui/cn";
import { Input } from "@/components/ui/input";
import { usePredictiveSearch } from "@/components/merchant/search/use-predictive-search";
import type { PredictiveSearchSuggestion, PredictiveSearchTarget } from "@/lib/types/search";

type MerchantPredictiveSearchInputProps = {
    id?: string;
    name?: string;
    defaultValue?: string;
    placeholder?: string;
    targets: PredictiveSearchTarget[];
    limit?: number;
    className?: string;
    dropdownClassName?: string;
    inputClassName?: string;
    disabled?: boolean;
    onSelect?: (item: PredictiveSearchSuggestion) => void;
};

export function MerchantPredictiveSearchInput({
    id,
    name,
    defaultValue = "",
    placeholder = "輸入關鍵字",
    targets,
    limit,
    className,
    dropdownClassName,
    inputClassName,
    disabled = false,
    onSelect,
}: MerchantPredictiveSearchInputProps) {
    const [query, setQuery] = useState(defaultValue);

    const { loading, open, setOpen, activeIndex, suggestions, empty, error, handleKeyDown, selectSuggestion } = usePredictiveSearch({
        query,
        targets,
        limit,
        enabled: !disabled,
        onEnterSelect: (item) => {
            setQuery(item.value);
            onSelect?.(item);
        },
    });

    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
        const nextTarget = event.relatedTarget;
        if (nextTarget && nextTarget instanceof HTMLElement && nextTarget.dataset.role === "predictive-option") {
            return;
        }
        window.setTimeout(() => setOpen(false), 80);
    };

    return (
        <div className={cn("relative", className)}>
            <Input
                id={id}
                name={name}
                value={query}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoComplete="off"
                className={inputClassName}
                disabled={disabled}
            />
            {open ? (
                <div
                    className={cn(
                        "absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] shadow-sm",
                        dropdownClassName,
                    )}
                >
                    {loading ? <div className="px-3 py-2 text-sm text-[rgb(var(--muted))]">搜尋中...</div> : null}
                    {!loading && error ? <div className="px-3 py-2 text-sm text-[rgb(var(--muted))]">{error}</div> : null}
                    {!loading && empty ? <div className="px-3 py-2 text-sm text-[rgb(var(--muted))]">找不到符合的結果</div> : null}
                    {!loading && !error && suggestions.length > 0 ? (
                        <ul className="py-1" role="listbox" aria-label="predictive suggestions">
                            {suggestions.map((item, index) => (
                                <li key={`${item.target}-${item.id}-${index}`}>
                                    <button
                                        data-role="predictive-option"
                                        type="button"
                                        className={cn(
                                            "w-full px-3 py-2 text-left transition",
                                            index === activeIndex
                                                ? "bg-[rgb(var(--panel2))] text-[rgb(var(--text))]"
                                                : "text-[rgb(var(--text))] hover:bg-[rgb(var(--panel2))]",
                                        )}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => {
                                            selectSuggestion(item);
                                            setQuery(item.value);
                                            onSelect?.(item);
                                        }}
                                    >
                                        <div className="text-sm">{item.title}</div>
                                        {item.subtitle ? <div className="text-xs text-[rgb(var(--muted))]">{item.subtitle}</div> : null}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
