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
        <div className="ml-1 flex items-center gap-1 rounded-full border border-[#191815] p-1">
            <button
                type="button"
                className={`rounded-full px-2 py-1 text-[11px] font-bold leading-none ${
                    currentLang === "zh" ? "bg-[#191815] text-[#ffcb2d]" : "text-[#191815] hover:bg-[#191815] hover:text-[#ffcb2d]"
                }`}
                onClick={() => switchLang("zh")}
            >
                中
            </button>
            <button
                type="button"
                className={`rounded-full px-2 py-1 text-[11px] font-bold leading-none ${
                    currentLang === "en" ? "bg-[#191815] text-[#ffcb2d]" : "text-[#191815] hover:bg-[#191815] hover:text-[#ffcb2d]"
                }`}
                onClick={() => switchLang("en")}
            >
                EN
            </button>
        </div>
    );
}
