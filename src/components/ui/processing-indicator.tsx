import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

type ProcessingIndicatorProps = {
    label?: ReactNode;
    size?: "sm" | "md" | "lg";
    className?: string;
    spinnerClassName?: string;
    labelClassName?: string;
};

const SIZE_CLASS: Record<NonNullable<ProcessingIndicatorProps["size"]>, string> = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
};

export function ProcessingIndicator({
    label,
    size = "md",
    className,
    spinnerClassName,
    labelClassName,
}: ProcessingIndicatorProps) {
    return (
        <span className={cn("inline-flex items-center gap-2", className)} role="status" aria-live="polite">
            <Loader2
                className={cn(SIZE_CLASS[size], "animate-spin text-[rgb(var(--accent))]", spinnerClassName)}
                aria-hidden="true"
            />
            {label ? <span className={cn("text-sm text-[rgb(var(--text))]", labelClassName)}>{label}</span> : null}
        </span>
    );
}
