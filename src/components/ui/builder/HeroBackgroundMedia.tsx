"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { HeroBackgroundMediaConfig, HeroContentPanelSize, HeroContentPresentation } from "@/lib/types/builder";
import { AnimatedBackground } from "@/components/ui/builder/background/AnimatedBackground";

type HeroBackgroundMediaProps = {
    config: HeroBackgroundMediaConfig;
    className?: string;
};

function heightClass(h: HeroBackgroundMediaConfig["height"]): string {
    switch (h) {
        case "compact":
            return "min-h-[280px]";
        case "standard":
            return "min-h-[400px]";
        case "tall":
            return "min-h-[520px]";
        case "screen":
        default:
            return "min-h-[72vh] max-h-[920px]";
    }
}

function panelSizeClass(size: HeroContentPanelSize | undefined): { wrap: string; title: string; desc: string; pad: string } {
    switch (size) {
        case "lg":
            return {
                wrap: "max-w-3xl",
                title: "text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl",
                desc: "mt-4 text-base leading-relaxed md:text-lg",
                pad: "p-6 md:p-8",
            };
        case "sm":
            return {
                wrap: "max-w-md sm:max-w-lg",
                title: "text-2xl font-semibold leading-snug tracking-tight md:text-3xl",
                desc: "mt-3 text-sm leading-relaxed md:text-base",
                pad: "p-4 md:p-5",
            };
        case "md":
        default:
            return {
                wrap: "max-w-xl lg:max-w-2xl",
                title: "text-3xl font-semibold leading-tight tracking-tight md:text-4xl",
                desc: "mt-3 text-sm leading-relaxed md:text-base",
                pad: "p-5 md:p-6",
            };
    }
}

function panelPresentationClass(presentation: HeroContentPresentation | undefined): {
    frame: string;
    eyebrow: string;
    title: string;
    desc: string;
} {
    switch (presentation) {
        case "inline":
            return {
                frame: "border-0 bg-transparent p-0 shadow-none backdrop-blur-0",
                eyebrow: "text-[rgb(255,255,255)]/78",
                title: "text-white drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]",
                desc: "text-[rgb(255,255,255)]/82 drop-shadow-[0_10px_22px_rgba(0,0,0,0.32)]",
            };
        case "panel":
        default:
            return {
                frame: "rounded-2xl border border-[color-mix(in_srgb,rgb(var(--border))_85%,transparent)] bg-[color-mix(in_srgb,rgb(var(--panel))_88%,transparent)] shadow-lg backdrop-blur-md",
                eyebrow: "text-[rgb(var(--muted))]",
                title: "text-[rgb(var(--text))]",
                desc: "text-[rgb(var(--muted))]",
            };
    }
}

function justifyClass(align: HeroBackgroundMediaConfig["contentAlign"]): string {
    switch (align) {
        case "center":
            return "justify-center";
        case "right":
            return "justify-end";
        case "left":
        default:
            return "justify-start";
    }
}

function textAlignClass(align: HeroBackgroundMediaConfig["textAlign"]): string {
    switch (align) {
        case "center":
            return "text-center";
        case "right":
            return "text-right";
        case "left":
        default:
            return "text-left";
    }
}

function overlayOpacityClass(strength: number): string {
    if (strength <= 0) return "opacity-0";
    if (strength <= 0.2) return "opacity-15";
    if (strength <= 0.35) return "opacity-30";
    if (strength <= 0.5) return "opacity-45";
    if (strength <= 0.65) return "opacity-60";
    return "opacity-75";
}

export function HeroBackgroundMedia({ config, className = "" }: HeroBackgroundMediaProps) {
    const [videoFailed, setVideoFailed] = useState(false);

    const onVideoError = useCallback(() => {
        setVideoFailed(true);
    }, []);

    if (!config.enabled) {
        return null;
    }

    const minH = heightClass(config.height);
    const primary = config.primaryAction;
    const secondary = config.secondaryAction;
    const panel = panelSizeClass(config.contentPanelSize);
    const presentation = panelPresentationClass(config.contentPresentation);

    const primaryBtn =
        "inline-flex min-h-[44px] items-center justify-center rounded-full bg-[rgb(var(--accent))] px-6 py-2.5 text-sm font-semibold text-[rgb(var(--panel))] shadow-[0_14px_40px_-12px_color-mix(in_srgb,rgb(var(--accent))_45%,transparent)] ring-2 ring-[color-mix(in_srgb,rgb(var(--accent))_28%,transparent)] transition hover:brightness-105";
    const secondaryBtn =
        "inline-flex min-h-[44px] items-center justify-center rounded-full border border-[color-mix(in_srgb,rgb(var(--border))_90%,rgb(var(--muted))_10%)] bg-[color-mix(in_srgb,rgb(var(--panel))_82%,transparent)] px-5 py-2.5 text-sm font-medium text-[rgb(var(--text))] backdrop-blur-sm transition hover:bg-[rgb(var(--panel2))]";

    const renderCta = (action: NonNullable<typeof primary>, classNameBtn: string) => {
        if (action.href.startsWith("/")) {
            return (
                <Link
                    href={action.href}
                    className={classNameBtn}
                    {...(action.openInNewTab ? { target: "_blank", rel: "noreferrer" } : {})}
                >
                    {action.label}
                </Link>
            );
        }
        return (
            <a href={action.href} className={classNameBtn} {...(action.openInNewTab ? { target: "_blank", rel: "noreferrer" } : {})}>
                {action.label}
            </a>
        );
    };

    return (
        <section className={`relative isolate w-full overflow-hidden ${minH} ${className}`}>
            <div className="absolute inset-0 z-0">
                {config.backgroundType === "none" ? (
                    <div className="h-full w-full bg-[rgb(var(--panel2))]" />
                ) : null}

                {config.backgroundType === "image" && config.imageUrl ? (
                    <div className="builder-hero-subtle-drift h-full w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary CMS/CDN hero assets */}
                        <img src={config.imageUrl} alt="" className="h-full w-full object-cover" loading="eager" />
                    </div>
                ) : null}

                {config.backgroundType === "video" && config.videoUrl ? (
                    !videoFailed ? (
                        <div className="builder-hero-subtle-drift h-full w-full">
                            <video
                                className="h-full w-full object-cover"
                                autoPlay
                                muted
                                playsInline
                                loop
                                poster={config.posterUrl}
                                onError={onVideoError}
                            >
                                <source src={config.videoUrl} />
                            </video>
                        </div>
                    ) : config.posterUrl ? (
                        <div className="builder-hero-subtle-drift h-full w-full">
                            {/* eslint-disable-next-line @next/next/no-img-element -- video fallback poster from external URL */}
                            <img src={config.posterUrl} alt="" className="h-full w-full object-cover" loading="eager" />
                        </div>
                    ) : (
                        <div className="h-full w-full bg-[rgb(var(--panel2))]" />
                    )
                ) : null}

                {config.backgroundType === "animated" ? (
                    <div className="relative h-full w-full bg-[rgb(var(--panel2))]">
                        <AnimatedBackground variant={config.animatedVariant ?? "layers"} />
                    </div>
                ) : null}

                <div
                    className={`pointer-events-none absolute inset-0 z-[1] bg-[rgb(var(--text))] ${overlayOpacityClass(config.overlayStrength)}`}
                    aria-hidden
                />
            </div>

            <div className={`relative z-10 flex h-full w-full items-center px-4 py-10 md:px-6 md:py-14 ${justifyClass(config.contentAlign)}`}>
                <div className={`pointer-events-auto flex w-full flex-col gap-4 ${panel.wrap} ${textAlignClass(config.textAlign)}`}>
                    <div className={`${presentation.frame} ${panel.pad}`}>
                        {config.eyebrow ? (
                            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${presentation.eyebrow}`}>{config.eyebrow}</p>
                        ) : null}
                        <h1 className={`mt-2 ${panel.title} ${presentation.title}`}>{config.title}</h1>
                        {config.description ? <p className={`${panel.desc} ${presentation.desc}`}>{config.description}</p> : null}

                        {(primary || secondary) && (
                            <div
                                className={`mt-5 flex flex-wrap items-center gap-3 ${config.textAlign === "center" ? "justify-center" : config.textAlign === "right" ? "justify-end" : "justify-start"}`}
                            >
                                {primary ? renderCta(primary, primaryBtn) : null}
                                {secondary ? renderCta(secondary, secondaryBtn) : null}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
