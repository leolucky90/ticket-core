import { cn } from "@/components/ui/cn";

type StatusBadgeTone = "neutral" | "success" | "warning" | "danger";

type StatusBadgeProps = {
    label: string;
    tone?: StatusBadgeTone;
    className?: string;
};

export function StatusBadge({ label, tone = "neutral", className }: StatusBadgeProps) {
    const toneClass =
        tone === "success"
            ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel2))]"
            : tone === "warning"
              ? "border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
              : tone === "danger"
                ? "border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                : "border-[rgb(var(--border))] bg-[rgb(var(--panel2))]";

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-[rgb(var(--text))]",
                toneClass,
                className,
            )}
        >
            {label}
        </span>
    );
}

