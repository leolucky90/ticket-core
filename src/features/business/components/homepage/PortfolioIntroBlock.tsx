import { cn } from "@/components/ui/cn";

type PortfolioIntroBlockProps = {
    title: string;
    description: string;
    highlights: string[];
    stack: string[];
    className?: string;
};

export function PortfolioIntroBlock({ title, description, highlights, stack, className }: PortfolioIntroBlockProps) {
    return (
        <article
            className={cn(
                "rounded-3xl border border-[var(--biz-border)] bg-[var(--biz-surface)] p-6 shadow-[0_24px_70px_-52px_var(--biz-shadow)]",
                className,
            )}
        >
            <h3 className="text-2xl [font-family:'Fraunces','Noto_Serif_TC',serif] text-[var(--biz-heading)]">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--biz-body)]">{description}</p>

            <div className="mt-5 grid gap-2 text-sm text-[var(--biz-body)]">
                {highlights.map((item) => (
                    <p key={item} className="rounded-xl border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] px-3 py-2">
                        {item}
                    </p>
                ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
                {stack.map((tech) => (
                    <span
                        key={tech}
                        className="rounded-full border border-[var(--biz-border-strong)] bg-[var(--biz-chip-bg)] px-3 py-1 text-xs font-medium text-[var(--biz-accent-ink)]"
                    >
                        {tech}
                    </span>
                ))}
            </div>
        </article>
    );
}
