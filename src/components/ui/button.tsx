import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/components/ui/cn";
import { ProcessingIndicator } from "@/components/ui/processing-indicator";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "solid" | "ghost";
    loading?: boolean;
    loadingLabel?: ReactNode;
};

export function Button({
    className,
    variant = "solid",
    loading = false,
    loadingLabel,
    disabled,
    children,
    ...props
}: ButtonProps) {
    const base =
        "inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70";
    const solid = "border-[rgb(var(--border))] bg-[rgb(var(--accent))] text-[rgb(var(--bg))]";
    const ghost = "border-[rgb(var(--border))] bg-[rgb(var(--panel))] text-[rgb(var(--text))]";

    return (
        <button
            {...props}
            disabled={disabled || loading}
            className={cn(base, variant === "solid" ? solid : ghost, className)}
        >
            {loading ? (
                <ProcessingIndicator
                    label={loadingLabel ?? children}
                    spinnerClassName="text-current"
                    labelClassName="text-current"
                />
            ) : (
                children
            )}
        </button>
    );
}
