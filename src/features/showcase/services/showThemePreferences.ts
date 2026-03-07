import type { RgbTriplet } from "@/lib/types/theme";
import type { ShowThemeColors } from "@/features/showcase/types/showTheme";

const RGB_TRIPLET_PATTERN = /^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/;
const HEX_COLOR_PATTERN = /^#?([0-9a-fA-F]{6})$/;

export const DEFAULT_SHOW_THEME_COLORS: ShowThemeColors = {
    page: "255 253 246",
    header: "255 203 45",
    hero: "25 24 21",
    about: "255 255 255",
    services: "243 238 225",
    contact: "255 253 246",
    ad: "25 24 21",
    footer: "255 203 45",
};

function clampColorValue(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(255, Math.round(value)));
}

function parseRgbTriplet(value: string): [number, number, number] | null {
    const trimmed = value.trim();
    const matched = trimmed.match(RGB_TRIPLET_PATTERN);
    if (!matched) return null;
    const r = clampColorValue(Number(matched[1]));
    const g = clampColorValue(Number(matched[2]));
    const b = clampColorValue(Number(matched[3]));
    return [r, g, b];
}

function parseHexColor(value: string): [number, number, number] | null {
    const matched = value.trim().match(HEX_COLOR_PATTERN);
    if (!matched) return null;
    const hex = matched[1];
    const r = clampColorValue(Number.parseInt(hex.slice(0, 2), 16));
    const g = clampColorValue(Number.parseInt(hex.slice(2, 4), 16));
    const b = clampColorValue(Number.parseInt(hex.slice(4, 6), 16));
    return [r, g, b];
}

function toRgbTriplet(parts: [number, number, number]): RgbTriplet {
    return `${parts[0]} ${parts[1]} ${parts[2]}`;
}

function normalizeRgbTriplet(value: string, fallback: RgbTriplet): RgbTriplet {
    const parsed = parseRgbTriplet(value) ?? parseHexColor(value);
    if (!parsed) return fallback;
    return toRgbTriplet(parsed);
}

export function normalizeShowThemeColors(input: Partial<ShowThemeColors> | null | undefined): ShowThemeColors {
    const candidate = input ?? {};
    return {
        page: normalizeRgbTriplet(candidate.page ?? "", DEFAULT_SHOW_THEME_COLORS.page),
        header: normalizeRgbTriplet(candidate.header ?? "", DEFAULT_SHOW_THEME_COLORS.header),
        hero: normalizeRgbTriplet(candidate.hero ?? "", DEFAULT_SHOW_THEME_COLORS.hero),
        about: normalizeRgbTriplet(candidate.about ?? "", DEFAULT_SHOW_THEME_COLORS.about),
        services: normalizeRgbTriplet(candidate.services ?? "", DEFAULT_SHOW_THEME_COLORS.services),
        contact: normalizeRgbTriplet(candidate.contact ?? "", DEFAULT_SHOW_THEME_COLORS.contact),
        ad: normalizeRgbTriplet(candidate.ad ?? "", DEFAULT_SHOW_THEME_COLORS.ad),
        footer: normalizeRgbTriplet(candidate.footer ?? "", DEFAULT_SHOW_THEME_COLORS.footer),
    };
}
