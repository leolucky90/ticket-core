import { cn } from "@/components/ui/cn";
import type { InvoiceStatus } from "@/lib/schema";

type InvoiceStatusBadgeProps = {
    status: InvoiceStatus;
    labels: Record<InvoiceStatus, string>;
};

export function InvoiceStatusBadge({ status, labels }: InvoiceStatusBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                status === "issued"
                    ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel2))] text-[rgb(var(--text))]"
                    : status === "voided"
                      ? "border-[rgb(var(--border))] bg-[rgb(var(--panel))] text-[rgb(var(--muted))]"
                      : status === "issue_failed"
                        ? "border-[rgb(var(--border))] bg-[rgb(var(--panel2))] text-[rgb(var(--text))]"
                        : "border-[rgb(var(--border))] bg-[rgb(var(--panel))] text-[rgb(var(--text))]",
            )}
        >
            {labels[status]}
        </span>
    );
}
