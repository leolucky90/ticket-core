import Link from "next/link";

type CtaStripProps = {
    id?: string;
    title: string;
    description: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref: string;
    secondaryLabel: string;
};

export function CtaStrip({
    id,
    title,
    description,
    primaryHref,
    primaryLabel,
    secondaryHref,
    secondaryLabel,
}: CtaStripProps) {
    return (
        <section id={id} className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-6 md:pb-24">
            <div className="rounded-3xl border border-[var(--biz-border-strong)] bg-[var(--biz-cta-bg)] p-8 text-[var(--biz-cta-text)] shadow-[0_28px_72px_-48px_var(--biz-shadow)] md:p-10">
                <p className="text-xs font-semibold tracking-[0.12em] text-[var(--biz-cta-muted)] uppercase">Proposal / Contact</p>
                <h2 className="mt-3 max-w-3xl text-3xl [font-family:'Fraunces','Noto_Serif_TC',serif] leading-tight md:text-4xl">{title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--biz-cta-muted)] md:text-base">{description}</p>

                <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                        href={primaryHref}
                        className="rounded-full bg-[var(--biz-cta-button)] px-6 py-3 text-sm font-semibold text-[var(--biz-cta-button-text)] transition hover:translate-y-[-1px]"
                    >
                        {primaryLabel}
                    </Link>
                    <Link
                        href={secondaryHref}
                        className="rounded-full border border-[var(--biz-cta-border)] px-6 py-3 text-sm font-semibold text-[var(--biz-cta-text)] transition hover:bg-white/6"
                    >
                        {secondaryLabel}
                    </Link>
                </div>
            </div>
        </section>
    );
}
