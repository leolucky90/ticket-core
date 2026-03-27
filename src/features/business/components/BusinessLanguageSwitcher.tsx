"use client";

import { cn } from "@/components/ui/cn";

type BusinessLanguageSwitcherProps = {
    currentLang: "zh" | "en";
    className?: string;
    activeClassName?: string;
    inactiveClassName?: string;
};

function setLangCookie(lang: "zh" | "en") {
    document.cookie = `lang=${lang}; path=/; max-age=31536000; samesite=lax`;
}

export function BusinessLanguageSwitcher({
    currentLang,
    className,
    activeClassName,
    inactiveClassName,
}: BusinessLanguageSwitcherProps) {
    function switchLang(lang: "zh" | "en") {
        if (lang === currentLang) return;
        setLangCookie(lang);
        window.location.reload();
    }

    return (
        <div
            className={cn(
                "flex items-center gap-1 rounded-full border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] p-1",
                className,
            )}
        >
            <button
                type="button"
                className={cn(
                    "rounded-full px-2 py-1 text-[11px] font-semibold leading-none transition",
                    currentLang === "zh"
                        ? cn("bg-[var(--biz-accent)] text-[var(--biz-accent-contrast)]", activeClassName)
                        : cn("text-[var(--biz-accent-ink)] hover:bg-[var(--biz-chip-bg)]", inactiveClassName),
                )}
                onClick={() => switchLang("zh")}
            >
                中
            </button>
            <button
                type="button"
                className={cn(
                    "rounded-full px-2 py-1 text-[11px] font-semibold leading-none transition",
                    currentLang === "en"
                        ? cn("bg-[var(--biz-accent)] text-[var(--biz-accent-contrast)]", activeClassName)
                        : cn("text-[var(--biz-accent-ink)] hover:bg-[var(--biz-chip-bg)]", inactiveClassName),
                )}
                onClick={() => switchLang("en")}
            >
                EN
            </button>
        </div>
    );
}
