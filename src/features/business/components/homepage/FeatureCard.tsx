import { cn } from "@/components/ui/cn";

type FeatureCardProps = {
    index: string;
    title: string;
    description: string;
    points: string[];
    className?: string;
};

export function FeatureCard({ index, title, description, points, className }: FeatureCardProps) {
    return (
        <article
            className={cn(
                "rounded-3xl border border-[var(--biz-border)] bg-[var(--biz-surface)] p-6 shadow-[0_24px_65px_-48px_var(--biz-shadow)]",
                className,
            )}
        >
            <p className="text-xs font-semibold tracking-[0.12em] text-[var(--biz-muted)] uppercase">{index}</p>
            <h3 className="mt-3 text-2xl font-semibold leading-tight text-[var(--biz-heading)]">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--biz-body)]">{description}</p>
            <ul className="mt-5 space-y-2 text-sm text-[var(--biz-body)]">
                {points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--biz-accent)]" />
                        <span>{point}</span>
                    </li>
                ))}
            </ul>
        </article>
    );
}
