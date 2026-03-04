"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/components/ui/cn";

type SignOutButtonProps = {
    className?: string;
    label?: string;
};

export function SignOutButton({ className, label = "登出" }: SignOutButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleSignOut() {
        setLoading(true);
        try {
            await fetch("/api/auth/session", { method: "DELETE" });
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
            {loading ? `${label}...` : label}
        </button>
    );
}
