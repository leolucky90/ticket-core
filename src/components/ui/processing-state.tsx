import { cn } from "@/components/ui/cn";
import { ProcessingIndicator } from "@/components/ui/processing-indicator";

type ProcessingStateProps = {
    title: string;
    description?: string;
    className?: string;
    compact?: boolean;
};

export function ProcessingState({
    title,
    description,
    className,
    compact = false,
}: ProcessingStateProps) {
    return (
        <div
            className={cn(
                "flex items-start gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] shadow-xl",
                compact ? "px-4 py-3" : "px-5 py-4",
                className,
            )}
            role="status"
            aria-live="polite"
        >
            <ProcessingIndicator size={compact ? "md" : "lg"} className="shrink-0" />
            <div className="grid gap-0.5">
                <div className="text-sm font-medium text-[rgb(var(--text))]">{title}</div>
                {description ? <div className="text-xs text-[rgb(var(--muted))]">{description}</div> : null}
            </div>
        </div>
    );
}
