"use client";

import { useEffect, useMemo, useState } from "react";
import { getUiText, type UiLanguage } from "@/lib/i18n/ui-text";

function readUiLanguage(): UiLanguage {
    if (typeof document === "undefined") return "zh";
    const match = document.cookie.match(/(?:^|;\s*)lang=(en|zh)\b/);
    return match?.[1] === "en" ? "en" : "zh";
}

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [lang] = useState<UiLanguage>(() => readUiLanguage());

    useEffect(() => {
        console.error("[global-error]", error);
    }, [error]);

    const ui = useMemo(() => getUiText(lang).globalErrorPage, [lang]);

    return (
        <html lang={lang === "en" ? "en" : "zh-Hant"}>
            <body className="min-h-dvh bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
                <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-start justify-center gap-4 px-6">
                    <h1 className="text-2xl font-bold">{ui.title}</h1>
                    <p className="text-sm text-[rgb(var(--muted))]">
                        {ui.description}
                    </p>
                    {error.digest ? (
                        <p className="rounded bg-[rgb(var(--panel2))] px-2 py-1 text-xs text-[rgb(var(--muted))]">digest: {error.digest}</p>
                    ) : null}
                    <button
                        type="button"
                        onClick={reset}
                        className="rounded-full bg-[rgb(var(--accent))] px-4 py-2 text-sm font-semibold text-[rgb(var(--bg))] hover:opacity-90"
                    >
                        {ui.retry}
                    </button>
                </main>
            </body>
        </html>
    );
}
