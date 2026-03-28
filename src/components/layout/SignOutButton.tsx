"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startNavigationProgress } from "@/components/layout/navigation-progress";
import { useUiLanguage } from "@/components/layout/ui-language-provider";
import { cn } from "@/components/ui/cn";
import { ProcessingIndicator } from "@/components/ui/processing-indicator";
import { getUiText } from "@/lib/i18n/ui-text";

type SignOutButtonProps = {
    className?: string;
    label?: string;
};

export function SignOutButton({ className, label = "登出" }: SignOutButtonProps) {
    const lang = useUiLanguage();
    const ui = getUiText(lang);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const resolvedLabel = label === "登出" ? ui.shell.signOut : label;

    async function handleSignOut() {
        setLoading(true);
        try {
            await fetch("/api/auth/session", { method: "DELETE" });
            startNavigationProgress();
            router.replace("/");
            router.refresh();
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            type="button"
            className={cn(
                "rounded-lg border border-[rgb(var(--border))] px-3 py-1.5 text-sm text-[rgb(var(--text))] hover:border-[rgb(var(--accent))] disabled:cursor-not-allowed disabled:opacity-60",
                className,
            )}
            onClick={handleSignOut}
            disabled={loading}
        >
            {loading ? (
                <ProcessingIndicator
                    label={ui.processing.signOutLoading}
                    size="sm"
                    spinnerClassName="text-current"
                    labelClassName="text-current"
                />
            ) : (
                resolvedLabel
            )}
        </button>
    );
}
