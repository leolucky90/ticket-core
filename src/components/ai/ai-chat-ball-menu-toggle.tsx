"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUiLanguage } from "@/components/layout/ui-language-provider";
import { useAiChatBallVisibility } from "@/components/ai/ai-chat-ball-visibility-provider";
import { getUiText } from "@/lib/i18n/ui-text";

type AiChatBallMenuToggleProps = {
    initialEnabled: boolean;
};

export function AiChatBallMenuToggle({ initialEnabled }: AiChatBallMenuToggleProps) {
    const router = useRouter();
    const lang = useUiLanguage();
    const t = getUiText(lang).chatBallPreference;
    const ctx = useAiChatBallVisibility();
    const enabled = ctx ? ctx.enabled : initialEnabled;
    const [pending, startTransition] = useTransition();

    async function commit(next: boolean) {
        if (pending || next === enabled) return;
        const rollback = enabled;
        ctx?.setEnabled(next);
        try {
            const res = await fetch("/api/dashboard/preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ aiChatBallEnabled: next }),
            });
            if (!res.ok) throw new Error("save failed");
            startTransition(() => router.refresh());
        } catch {
            ctx?.setEnabled(rollback);
        }
    }

    return (
        <div className="flex shrink-0 items-center gap-1 rounded-md border border-[rgb(var(--border))] p-0.5">
            <button
                type="button"
                disabled={pending}
                className={`rounded px-2 py-0.5 text-xs ${
                    enabled ? "bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "text-[rgb(var(--text))]"
                }`}
                onClick={() => void commit(true)}
            >
                {t.menuOn}
            </button>
            <button
                type="button"
                disabled={pending}
                className={`rounded px-2 py-0.5 text-xs ${
                    !enabled ? "bg-[rgb(var(--accent))] text-[rgb(var(--bg))]" : "text-[rgb(var(--text))]"
                }`}
                onClick={() => void commit(false)}
            >
                {t.menuOff}
            </button>
        </div>
    );
}
