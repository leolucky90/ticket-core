"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BuilderCarouselConfig } from "@/lib/types/builder";
import { filterActiveCarouselSlides } from "@/lib/services/builder-media";
import { CarouselArrowButton } from "@/components/ui/builder/carousel/CarouselArrowButton";
import { CarouselDots } from "@/components/ui/builder/carousel/CarouselDots";

type AutoCarouselBannerProps = {
    config: BuilderCarouselConfig;
    className?: string;
    labels: {
        prev: string;
        next: string;
        goTo: string;
    };
};

function overlayClass(strength: number, enabled: boolean): string {
    if (!enabled || strength <= 0) return "opacity-0";
    if (strength <= 0.2) return "opacity-15";
    if (strength <= 0.35) return "opacity-30";
    if (strength <= 0.5) return "opacity-45";
    if (strength <= 0.65) return "opacity-60";
    return "opacity-75";
}

export function AutoCarouselBanner({ config, className = "", labels }: AutoCarouselBannerProps) {
    const slides = useMemo(() => filterActiveCarouselSlides(config.slides), [config.slides]);
    const count = slides.length;
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const indexRef = useRef(0);

    useEffect(() => {
        indexRef.current = index;
    }, [index]);

    const go = useCallback(
        (next: number) => {
            if (count <= 0) return;
            const wrapped = ((next % count) + count) % count;
            setIndex(wrapped);
        },
        [count],
    );

    useEffect(() => {
        if (!config.enabled || count <= 1 || !config.autoplay || paused) return undefined;
        const id = window.setInterval(() => {
            go(indexRef.current + 1);
        }, Math.max(2000, config.intervalMs));
        return () => window.clearInterval(id);
    }, [config.autoplay, config.enabled, config.intervalMs, count, go, paused]);

    const onPrev = useCallback(() => go(index - 1), [go, index]);
    const onNext = useCallback(() => go(index + 1), [go, index]);

    if (!config.enabled || count === 0) {
        return null;
    }

    const single = count <= 1;
    const showChrome = !single && (config.showArrows || config.showDots);
    const pauseHandlers = config.pauseOnHover && !single ? { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false) } : {};

    const current = slides[index] ?? slides[0];
    const usesInlineContent = config.contentPresentation === "inline";

    const ctaClassName =
        usesInlineContent
            ? "inline-flex w-fit rounded-full bg-[rgb(var(--accent))] px-5 py-2.5 text-sm font-semibold text-[rgb(var(--panel))] shadow-[0_16px_36px_-14px_rgba(0,0,0,0.38)] transition hover:opacity-95"
            : "inline-flex w-fit rounded-full bg-[rgb(var(--accent))] px-5 py-2.5 text-sm font-semibold text-[rgb(var(--panel))] shadow-sm transition hover:opacity-95";

    return (
        <section className={`relative w-full ${className}`} {...pauseHandlers}>
            <div className="relative aspect-[21/9] min-h-[220px] w-full overflow-hidden rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] shadow-[0_26px_70px_-48px_rgba(14,62,53,0.32)] md:aspect-[24/9]">
                <picture className="absolute inset-0 block h-full w-full">
                    <source media="(max-width: 767px)" srcSet={current.mobileImageUrl} />
                    <img
                        src={current.desktopImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading={index === 0 ? "eager" : "lazy"}
                    />
                </picture>

                <div
                    className={`pointer-events-none absolute inset-0 bg-[rgb(var(--text))] transition-opacity ${overlayClass(current.overlayStrength, current.overlayEnabled)}`}
                    aria-hidden
                />

                <div
                    className={`pointer-events-none absolute inset-0 ${
                        usesInlineContent
                            ? "bg-[linear-gradient(115deg,rgba(13,22,31,0.78)_0%,rgba(13,22,31,0.42)_34%,rgba(13,22,31,0.08)_62%,rgba(13,22,31,0.04)_100%)]"
                            : "bg-gradient-to-t from-[rgb(var(--panel))]/95 via-[rgb(var(--panel))]/20 to-transparent"
                    }`}
                    aria-hidden
                />

                <div className={`absolute inset-0 flex flex-col ${usesInlineContent ? "justify-center" : "justify-end"} p-5 md:p-8 lg:p-10`}>
                    <div
                        className={`pointer-events-auto max-w-2xl space-y-3 ${
                            usesInlineContent
                                ? "max-w-xl rounded-none border-0 bg-transparent p-0 shadow-none backdrop-blur-0"
                                : "rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))]/90 p-5 shadow-lg backdrop-blur-md md:p-6"
                        }`}
                    >
                        <h2
                            className={`text-xl font-semibold tracking-tight md:text-2xl ${
                                usesInlineContent
                                    ? "text-white drop-shadow-[0_20px_34px_rgba(0,0,0,0.4)] md:text-[2.2rem] md:leading-tight"
                                    : "text-[rgb(var(--text))]"
                            }`}
                        >
                            {current.title}
                        </h2>
                        <p
                            className={`text-sm leading-relaxed md:text-base ${
                                usesInlineContent
                                    ? "max-w-lg text-[rgb(255,255,255)]/82 drop-shadow-[0_10px_22px_rgba(0,0,0,0.32)]"
                                    : "text-[rgb(var(--muted))]"
                            }`}
                        >
                            {current.description}
                        </p>
                        {current.buttonText ? (
                            current.buttonHref.startsWith("/") ? (
                                <Link
                                    href={current.buttonHref}
                                    className={ctaClassName}
                                    {...(current.openInNewTab ? { target: "_blank", rel: "noreferrer" } : {})}
                                >
                                    {current.buttonText}
                                </Link>
                            ) : (
                                <a
                                    href={current.buttonHref}
                                    className={ctaClassName}
                                    {...(current.openInNewTab ? { target: "_blank", rel: "noreferrer" } : {})}
                                >
                                    {current.buttonText}
                                </a>
                            )
                        ) : null}
                    </div>
                </div>

                {showChrome ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 md:p-6">
                        {config.showArrows && !single ? (
                            <div className="pointer-events-auto flex gap-2">
                                <CarouselArrowButton direction="prev" onClick={onPrev} label={labels.prev} />
                                <CarouselArrowButton direction="next" onClick={onNext} label={labels.next} />
                            </div>
                        ) : (
                            <span className="hidden md:block" />
                        )}
                        {config.showDots && !single ? (
                            <div className="pointer-events-auto rounded-full border border-[rgba(255,255,255,0.24)] bg-[rgba(11,20,29,0.16)] px-3 py-2 backdrop-blur-sm">
                                <CarouselDots count={count} activeIndex={index} onSelect={(i) => go(i)} labels={{ goTo: labels.goTo }} />
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </section>
    );
}
