import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

type SectionShellProps = {
    id?: string;
    eyebrow?: string;
    title: string;
    description?: string;
    className?: string;
    children: ReactNode;
};

export function SectionShell({ id, eyebrow, title, description, className, children }: SectionShellProps) {
    return (
        <section id={id} className={cn("mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-20", className)}>
            <div className="max-w-3xl space-y-4">
                {eyebrow ? (
                    <p className="inline-flex rounded-full border border-[var(--biz-border-strong)] bg-[var(--biz-surface-soft)] px-3 py-1 text-xs font-semibold tracking-[0.12em] text-[var(--biz-accent-ink)] uppercase">
                        {eyebrow}
                    </p>
                ) : null}
                <h2 className="[font-family:'Fraunces','Noto_Serif_TC',serif] text-3xl leading-tight text-[var(--biz-heading)] md:text-4xl">
                    {title}
                </h2>
                {description ? <p className="text-base leading-relaxed text-[var(--biz-body)] md:text-lg">{description}</p> : null}
            </div>
            <div className="mt-8 md:mt-10">{children}</div>
        </section>
    );
}
