import { cn } from "@/components/ui/cn";

type CheckoutDocumentModeBadgeProps = {
    label: string;
    active?: boolean;
};

export function CheckoutDocumentModeBadge({ label, active = false }: CheckoutDocumentModeBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                active
                    ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel2))] text-[rgb(var(--text))]"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--panel))] text-[rgb(var(--muted))]",
            )}
        >
            {label}
        </span>
    );
}
