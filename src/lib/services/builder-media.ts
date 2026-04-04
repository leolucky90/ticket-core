import type { BuilderCarouselSlide, BuilderHomepageConfig, BuilderSiteType } from "@/lib/types/builder";
import { OFFICIAL_BUILDER_HOMEPAGE_CONFIG, TENANT_BUILDER_HOMEPAGE_CONFIG } from "@/lib/constants/builder-demo";

export function getBuilderHomepageConfigForSiteType(siteType: BuilderSiteType): BuilderHomepageConfig {
    return siteType === "official" ? OFFICIAL_BUILDER_HOMEPAGE_CONFIG : TENANT_BUILDER_HOMEPAGE_CONFIG;
}

function parseInstant(value: string | null | undefined): number | null {
    if (!value) return null;
    const t = Date.parse(value);
    return Number.isFinite(t) ? t : null;
}

/**
 * Client-safe scheduling gate; backend should still enforce canonical windows.
 */
export function isCarouselSlideScheduledNow(slide: BuilderCarouselSlide, nowMs: number = Date.now()): boolean {
    const start = parseInstant(slide.startAt ?? undefined);
    const end = parseInstant(slide.endAt ?? undefined);
    if (start !== null && nowMs < start) return false;
    if (end !== null && nowMs > end) return false;
    return true;
}

export function filterActiveCarouselSlides(slides: BuilderCarouselSlide[], nowMs?: number): BuilderCarouselSlide[] {
    const t = nowMs ?? Date.now();
    return slides.filter((s) => s.isActive && isCarouselSlideScheduledNow(s, t));
}
