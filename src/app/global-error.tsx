"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[global-error]", error);
    }, [error]);

    return (
        <html lang="zh-Hant">
            <body className="min-h-dvh bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
                <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-start justify-center gap-4 px-6">
                    <h1 className="text-2xl font-bold">頁面發生錯誤</h1>
                    <p className="text-sm text-[rgb(var(--muted))]">
                        系統在開發模式遇到例外。請先重整，若持續發生可按下方按鈕重試。
                    </p>
                    {error.digest ? (
                        <p className="rounded bg-[rgb(var(--panel2))] px-2 py-1 text-xs text-[rgb(var(--muted))]">digest: {error.digest}</p>
                    ) : null}
                    <button
                        type="button"
                        onClick={reset}
                        className="rounded-full bg-[rgb(var(--accent))] px-4 py-2 text-sm font-semibold text-[rgb(var(--bg))] hover:opacity-90"
                    >
                        重試
                    </button>
                </main>
            </body>
        </html>
    );
}
