"use client";

type ShowcaseLanguageSwitcherProps = {
    currentLang: "zh" | "en";
};

function setLangCookie(lang: "zh" | "en") {
    document.cookie = `lang=${lang}; path=/; max-age=31536000; samesite=lax`;
}

export function ShowcaseLanguageSwitcher({ currentLang }: ShowcaseLanguageSwitcherProps) {
    function switchLang(lang: "zh" | "en") {
        if (lang === currentLang) return;
        setLangCookie(lang);
        window.location.reload();
    }

    return (
        <div className="ml-1 flex items-center gap-1 rounded-full p-1">
            <button
                type="button"
                className={`rounded-full px-2 py-1 text-[11px] font-semibold leading-none transition ${
                    currentLang === "zh"
                        ? "bg-[rgb(var(--showcase-accent))] text-[rgb(var(--showcase-accent-contrast))]"
                        : "text-[rgb(var(--showcase-text))] hover:bg-[rgb(var(--showcase-accent-soft))]"
                }`}
                onClick={() => switchLang("zh")}
            >
                中
            </button>
            <button
                type="button"
                className={`rounded-full px-2 py-1 text-[11px] font-semibold leading-none transition ${
                    currentLang === "en"
                        ? "bg-[rgb(var(--showcase-accent))] text-[rgb(var(--showcase-accent-contrast))]"
                        : "text-[rgb(var(--showcase-text))] hover:bg-[rgb(var(--showcase-accent-soft))]"
                }`}
                onClick={() => switchLang("en")}
            >
                EN
            </button>
        </div>
    );
}
