import { cn } from "@/components/ui/cn";

type MetricPanelProps = {
    title: string;
    value: string;
    note: string;
    className?: string;
};

export function MetricPanel({ title, value, note, className }: MetricPanelProps) {
    return (
        <article className={cn("rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface)] p-4", className)}>
            <p className="text-xs font-semibold tracking-[0.1em] text-[var(--biz-muted)] uppercase">{title}</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--biz-heading)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--biz-body)]">{note}</p>
        </article>
    );
}
