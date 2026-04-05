import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Sparkles } from "lucide-react";
import { MetricPanel } from "@/features/business/components/homepage/MetricPanel";

type Metric = { title: string; value: string; note: string };

type OfficialPostHeroSectionProps = {
    featureEyebrow: string;
    heroBullets: [string, string, string];
    ctaPrimary: string;
    ctaSecondary: string;
    entryHref: string;
    heroEntryLabel: string;
    heroFlowTitle: string;
    heroFlowLabel: string;
    heroMetrics: Metric[];
    heroFlowModules: string[];
    moduleIcons: LucideIcon[];
};

/**
 * First content band after builder Hero + carousel: compact rhythm (no oversized hero duplicate).
 */
export function OfficialPostHeroSection({
    featureEyebrow,
    heroBullets,
    ctaPrimary,
    ctaSecondary,
    entryHref,
    heroEntryLabel,
    heroFlowTitle,
    heroFlowLabel,
    heroMetrics,
    heroFlowModules,
    moduleIcons,
}: OfficialPostHeroSectionProps) {
    return (
        <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 md:px-6 md:pb-14 md:pt-10">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:items-start lg:gap-8">
                <div className="biz-fade-up rounded-[2rem] border border-[var(--biz-glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.68))] p-5 shadow-[0_24px_70px_-52px_var(--biz-shadow)] backdrop-blur-xl md:p-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--biz-glass-border)] bg-[var(--biz-surface)] px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[var(--biz-accent-ink)] uppercase">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{featureEyebrow}</span>
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-start">
                        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                            {heroBullets.map((line) => (
                                <div
                                    key={line}
                                    className="rounded-[1.35rem] border border-[var(--biz-border)] bg-[var(--biz-surface)] p-4 text-sm leading-relaxed text-[var(--biz-body)]"
                                >
                                    {line}
                                </div>
                            ))}
                        </div>

                        <div className="rounded-[1.5rem] border border-[var(--biz-border)] bg-[var(--biz-surface)] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--biz-muted)]">{heroFlowLabel}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {heroFlowModules.slice(0, 6).map((module, index) => {
                                    const Icon = moduleIcons[index % moduleIcons.length];
                                    return (
                                        <span
                                            key={module}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--biz-body)]"
                                        >
                                            <Icon className="h-3 w-3 text-[var(--biz-accent-ink)]" aria-hidden />
                                            {module}
                                        </span>
                                    );
                                })}
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <a
                                    href="#platform"
                                    className="biz-cta-primary inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition hover:translate-y-[-1px]"
                                >
                                    {ctaPrimary}
                                    <ArrowRight className="h-4 w-4" />
                                </a>
                                <a
                                    href="#about"
                                    className="rounded-full border border-[var(--biz-border-strong)] px-5 py-3 text-sm font-medium text-[var(--biz-accent-ink)] transition hover:bg-[var(--biz-surface-soft)]"
                                >
                                    {ctaSecondary}
                                </a>
                                <Link
                                    href={entryHref}
                                    className="rounded-full border border-dashed border-[var(--biz-border)] px-5 py-3 text-sm font-medium text-[var(--biz-muted)] transition hover:border-[var(--biz-border-strong)] hover:text-[var(--biz-body)]"
                                >
                                    {heroEntryLabel}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <aside className="biz-fade-up biz-delay-1 rounded-[2rem] border border-[var(--biz-glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(255,255,255,0.72))] p-4 shadow-[0_20px_60px_-40px_var(--biz-shadow)] backdrop-blur-xl md:p-5">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--biz-muted)]">{heroFlowTitle}</p>
                            <p className="mt-0.5 text-xs text-[var(--biz-body)]">{heroFlowLabel}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-[var(--biz-border)] bg-[var(--biz-surface)] px-2 py-0.5 text-[10px] text-[var(--biz-muted)]">
                            Live
                        </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        {heroMetrics.slice(0, 4).map((metric) => (
                            <MetricPanel
                                key={metric.title}
                                title={metric.title}
                                value={metric.value}
                                note={metric.note}
                                className="min-h-[9.5rem] bg-[var(--biz-surface)]/95 p-3.5"
                            />
                        ))}
                    </div>
                </aside>
            </div>
        </section>
    );
}
