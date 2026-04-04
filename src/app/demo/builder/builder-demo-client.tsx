"use client";

import { useState } from "react";
import { AutoCarouselBanner } from "@/components/ui/builder/AutoCarouselBanner";
import { BuilderMediaBadge } from "@/components/ui/builder/BuilderMediaBadge";
import { BuilderMediaField, type BuilderMediaFieldLabels } from "@/components/ui/builder/BuilderMediaField";
import { BuilderSectionLabel } from "@/components/ui/builder/BuilderSectionLabel";
import { HeroBackgroundMedia } from "@/components/ui/builder/HeroBackgroundMedia";
import { OFFICIAL_BUILDER_HOMEPAGE_CONFIG, TENANT_BUILDER_HOMEPAGE_CONFIG } from "@/lib/constants/builder-demo";
import type { HeroBackgroundMediaConfig } from "@/lib/types/builder";

function buildDemoAnimatedHero(copy: {
    eyebrow: string;
    title: string;
    description: string;
    primaryLabel: string;
}): HeroBackgroundMediaConfig {
    return {
        enabled: true,
        backgroundType: "animated",
        height: "compact",
        contentAlign: "center",
        textAlign: "center",
        overlayStrength: 0.22,
        animatedVariant: "gradient",
        eyebrow: copy.eyebrow,
        title: copy.title,
        description: copy.description,
        primaryAction: { label: copy.primaryLabel, href: "#builder-media-demo", variant: "primary", openInNewTab: false },
        secondaryAction: null,
    };
}

function buildDemoImageHero(copy: {
    eyebrow: string;
    title: string;
    description: string;
    primaryLabel: string;
    secondaryLabel: string;
}): HeroBackgroundMediaConfig {
    return {
        enabled: true,
        backgroundType: "image",
        height: "standard",
        contentAlign: "left",
        textAlign: "left",
        overlayStrength: 0.4,
        imageUrl: "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=1600",
        eyebrow: copy.eyebrow,
        title: copy.title,
        description: copy.description,
        primaryAction: { label: copy.primaryLabel, href: "#builder-media-demo", variant: "primary", openInNewTab: false },
        secondaryAction: { label: copy.secondaryLabel, href: "#builder-media-demo", variant: "secondary", openInNewTab: false },
    };
}

type BuilderDemoClientProps = {
    lang: "zh" | "en";
    title: string;
    subtitle: string;
    sectionOfficialHero: string;
    sectionOfficialCarousel: string;
    sectionTenantHero: string;
    sectionTenantCarousel: string;
    sectionAnimatedHero: string;
    sectionUrlHero: string;
    sectionMedia: string;
    carouselLabels: { prev: string; next: string; goTo: string };
    mediaImage: BuilderMediaFieldLabels;
    mediaVideo: BuilderMediaFieldLabels;
    demoAnimated: {
        eyebrow: string;
        title: string;
        description: string;
        primaryLabel: string;
    };
    demoImage: {
        eyebrow: string;
        title: string;
        description: string;
        primaryLabel: string;
        secondaryLabel: string;
    };
};

export function BuilderDemoClient({
    lang,
    title,
    subtitle,
    sectionOfficialHero,
    sectionOfficialCarousel,
    sectionTenantHero,
    sectionTenantCarousel,
    sectionAnimatedHero,
    sectionUrlHero,
    sectionMedia,
    carouselLabels,
    mediaImage,
    mediaVideo,
    demoAnimated,
    demoImage,
}: BuilderDemoClientProps) {
    const [imageUrl, setImageUrl] = useState(
        "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=1200",
    );
    const [videoUrl, setVideoUrl] = useState(
        "https://videos.pexels.com/video-files/3045163/3045163-hd_1920_1080_30fps.mp4",
    );

    const demoAnimatedHero = buildDemoAnimatedHero(demoAnimated);
    const demoImageHero = buildDemoImageHero(demoImage);

    return (
        <div className="min-h-dvh bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
            <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
                <header className="mb-10 space-y-2 border-b border-[rgb(var(--border))] pb-8">
                    <BuilderMediaBadge>
                        demo / {lang}
                    </BuilderMediaBadge>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
                    <p className="max-w-3xl text-sm leading-relaxed text-[rgb(var(--muted))] md:text-base">{subtitle}</p>
                </header>

                <div className="builder-canonical-official space-y-14">
                    <section className="space-y-3">
                        <BuilderSectionLabel>{sectionOfficialHero}</BuilderSectionLabel>
                        <HeroBackgroundMedia config={OFFICIAL_BUILDER_HOMEPAGE_CONFIG.hero} />
                    </section>

                    <section className="space-y-3">
                        <BuilderSectionLabel>{sectionOfficialCarousel}</BuilderSectionLabel>
                        <AutoCarouselBanner config={OFFICIAL_BUILDER_HOMEPAGE_CONFIG.carousel} labels={carouselLabels} />
                    </section>
                </div>

                <div className="builder-canonical-official mt-14 space-y-14 border-t border-[rgb(var(--border))] pt-14">
                    <section className="space-y-3">
                        <BuilderSectionLabel>{sectionTenantHero}</BuilderSectionLabel>
                        <HeroBackgroundMedia config={TENANT_BUILDER_HOMEPAGE_CONFIG.hero} />
                    </section>

                    <section className="space-y-3">
                        <BuilderSectionLabel>{sectionTenantCarousel}</BuilderSectionLabel>
                        <AutoCarouselBanner config={TENANT_BUILDER_HOMEPAGE_CONFIG.carousel} labels={carouselLabels} />
                    </section>
                </div>

                <div className="builder-canonical-official mt-14 space-y-14 border-t border-[rgb(var(--border))] pt-14">
                    <section className="space-y-3">
                        <BuilderSectionLabel>{sectionAnimatedHero}</BuilderSectionLabel>
                        <HeroBackgroundMedia config={demoAnimatedHero} />
                    </section>

                    <section className="space-y-3">
                        <BuilderSectionLabel>{sectionUrlHero}</BuilderSectionLabel>
                        <HeroBackgroundMedia config={demoImageHero} />
                    </section>
                </div>

                <section id="builder-media-demo" className="builder-canonical-official mt-14 space-y-8 border-t border-[rgb(var(--border))] pt-14">
                    <BuilderSectionLabel>{sectionMedia}</BuilderSectionLabel>
                    <div className="grid gap-10 md:grid-cols-2">
                        <BuilderMediaField kind="image" value={imageUrl} onChange={setImageUrl} labels={mediaImage} />
                        <BuilderMediaField kind="video" value={videoUrl} onChange={setVideoUrl} labels={mediaVideo} />
                    </div>
                </section>
            </div>
        </div>
    );
}
