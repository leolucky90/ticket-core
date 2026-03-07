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
            <body className="min-h-dvh bg-[#191815] text-[#f5f1df]">
                <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-start justify-center gap-4 px-6">
                    <h1 className="text-2xl font-bold">頁面發生錯誤</h1>
                    <p className="text-sm text-[#d5d0bf]">
                        系統在開發模式遇到例外。請先重整，若持續發生可按下方按鈕重試。
                    </p>
                    {error.digest ? (
                        <p className="rounded bg-black/30 px-2 py-1 text-xs text-[#c9c2ae]">digest: {error.digest}</p>
                    ) : null}
                    <button
                        type="button"
                        onClick={reset}
                        className="rounded-full bg-[#ffcb2d] px-4 py-2 text-sm font-semibold text-[#191815] hover:bg-[#ffd95f]"
                    >
                        重試
                    </button>
                </main>
            </body>
        </html>
    );
}
