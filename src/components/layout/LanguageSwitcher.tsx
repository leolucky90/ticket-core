"use client";

type LanguageSwitcherProps = {
    currentLang: "zh" | "en";
};

function setLangCookie(lang: "zh" | "en") {
    document.cookie = `lang=${lang}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageSwitcher({ currentLang }: LanguageSwitcherProps) {
    function switchLang(lang: "zh" | "en") {
        if (lang === currentLang) return;
        setLangCookie(lang);
        window.location.reload();
    }

    return (
        <div className="flex items-center gap-1 rounded-md border border-[rgb(var(--border))] p-0.5">
            <button
                type="button"
                className={`rounded px-2 py-0.5 text-xs ${
                    currentLang === "zh" ? "bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "text-[rgb(var(--text))]"
                }`}
                onClick={() => switchLang("zh")}
            >
                中
            </button>
            <button
                type="button"
                className={`rounded px-2 py-0.5 text-xs ${
                    currentLang === "en" ? "bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "text-[rgb(var(--text))]"
                }`}
                onClick={() => switchLang("en")}
            >
                EN
            </button>
        </div>
    );
}
