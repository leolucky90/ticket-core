import type {
    RgbTriplet,
    ThemeColorRole,
    ThemeCustomColors,
    ThemeMode,
    ThemeState,
} from "@/lib/types/theme";

export const THEME_EVENT = "app-theme-change";
const THEME_STORAGE_KEY = "theme";
const CUSTOM_COLORS_STORAGE_KEY = "theme-custom-colors";
const RGB_TRIPLET_PATTERN = /^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/;
const HEX_COLOR_PATTERN = /^#?([0-9a-fA-F]{6})$/;
let cachedThemeState: ThemeState | null = null;

export const DEFAULT_THEME_MODE: ThemeMode = "dark";
export const DEFAULT_THEME_CUSTOM_COLORS: ThemeCustomColors = {
    bg: "10 10 12",
    panel: "18 18 22",
    panel2: "22 22 28",
    nav: "18 18 22",
    text: "235 235 245",
    accent: "120 180 255",
    border: "60 60 75",
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

function toHexPair(value: number) {
    return clampColorValue(value).toString(16).padStart(2, "0");
}

export function rgbTripletToHex(value: string, fallback = "#000000") {
    const parsed = parseRgbTriplet(value) ?? parseHexColor(value);
    if (!parsed) return fallback;
    return `#${toHexPair(parsed[0])}${toHexPair(parsed[1])}${toHexPair(parsed[2])}`;
}

function mixColors(base: RgbTriplet, target: RgbTriplet, baseWeight: number): RgbTriplet {
    const baseParts = parseRgbTriplet(base) ?? parseRgbTriplet(DEFAULT_THEME_CUSTOM_COLORS.text);
    const targetParts = parseRgbTriplet(target) ?? parseRgbTriplet(DEFAULT_THEME_CUSTOM_COLORS.panel);
    if (!baseParts || !targetParts) return DEFAULT_THEME_CUSTOM_COLORS.panel;

    const weight = Math.max(0, Math.min(1, baseWeight));
    const mixed: [number, number, number] = [
        clampColorValue(baseParts[0] * weight + targetParts[0] * (1 - weight)),
        clampColorValue(baseParts[1] * weight + targetParts[1] * (1 - weight)),
        clampColorValue(baseParts[2] * weight + targetParts[2] * (1 - weight)),
    ];
    return toRgbTriplet(mixed);
}

function shiftColor(color: RgbTriplet, offset: number): RgbTriplet {
    const parts = parseRgbTriplet(color) ?? parseRgbTriplet(DEFAULT_THEME_CUSTOM_COLORS.panel);
    if (!parts) return DEFAULT_THEME_CUSTOM_COLORS.panel;
    return toRgbTriplet([
        clampColorValue(parts[0] + offset),
        clampColorValue(parts[1] + offset),
        clampColorValue(parts[2] + offset),
    ]);
}

function derivePanel2(panel: RgbTriplet): RgbTriplet {
    const parts = parseRgbTriplet(panel) ?? parseRgbTriplet(DEFAULT_THEME_CUSTOM_COLORS.panel);
    if (!parts) return DEFAULT_THEME_CUSTOM_COLORS.panel;
    const luminance = (parts[0] + parts[1] + parts[2]) / 3;
    const offset = luminance < 128 ? 12 : -10;
    return shiftColor(panel, offset);
}

function normalizeCustomColors(input: Partial<ThemeCustomColors> | null | undefined): ThemeCustomColors {
    const legacy = (input ?? {}) as Partial<ThemeCustomColors> & {
        deep?: string;
        light?: string;
    };
    const panel = normalizeRgbTriplet(legacy.panel ?? legacy.light ?? "", DEFAULT_THEME_CUSTOM_COLORS.panel);
    const panel2 = normalizeRgbTriplet(legacy.panel2 ?? "", derivePanel2(panel));

    return {
        bg: normalizeRgbTriplet(legacy.bg ?? legacy.deep ?? "", DEFAULT_THEME_CUSTOM_COLORS.bg),
        panel,
        panel2,
        nav: normalizeRgbTriplet(legacy.nav ?? legacy.panel ?? legacy.light ?? "", DEFAULT_THEME_CUSTOM_COLORS.nav),
        text: normalizeRgbTriplet(legacy.text ?? "", DEFAULT_THEME_CUSTOM_COLORS.text),
        accent: normalizeRgbTriplet(legacy.accent ?? "", DEFAULT_THEME_CUSTOM_COLORS.accent),
        border: normalizeRgbTriplet(legacy.border ?? "", DEFAULT_THEME_CUSTOM_COLORS.border),
    };
}

function deriveCustomTokens(customColors: ThemeCustomColors) {
    return {
        muted: mixColors(customColors.text, customColors.panel, 0.7),
    };
}

function isThemeMode(value: string | null | undefined): value is ThemeMode {
    return value === "light" || value === "dark" || value === "custom";
}

function getStoredCustomColors(storage: Storage): ThemeCustomColors {
    const raw = storage.getItem(CUSTOM_COLORS_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME_CUSTOM_COLORS;

    try {
        const parsed = JSON.parse(raw) as Partial<ThemeCustomColors>;
        return normalizeCustomColors(parsed);
    } catch {
        return DEFAULT_THEME_CUSTOM_COLORS;
    }
}

function applyCustomColorVariables(root: HTMLElement, customColors: ThemeCustomColors) {
    const derived = deriveCustomTokens(customColors);
    root.style.setProperty("--custom-bg", customColors.bg);
    root.style.setProperty("--custom-panel", customColors.panel);
    root.style.setProperty("--custom-nav", customColors.nav);
    root.style.setProperty("--custom-panel2", customColors.panel2);
    root.style.setProperty("--custom-text", customColors.text);
    root.style.setProperty("--custom-muted", derived.muted);
    root.style.setProperty("--custom-border", customColors.border);
    root.style.setProperty("--custom-accent", customColors.accent);
}

function clearCustomColorVariables(root: HTMLElement) {
    root.style.removeProperty("--custom-bg");
    root.style.removeProperty("--custom-panel");
    root.style.removeProperty("--custom-nav");
    root.style.removeProperty("--custom-panel2");
    root.style.removeProperty("--custom-text");
    root.style.removeProperty("--custom-muted");
    root.style.removeProperty("--custom-border");
    root.style.removeProperty("--custom-accent");
}

function syncThemeToDocument(root: HTMLElement, mode: ThemeMode, customColors: ThemeCustomColors) {
    root.setAttribute("data-theme", mode);
    if (mode === "custom") {
        applyCustomColorVariables(root, customColors);
        return;
    }
    clearCustomColorVariables(root);
}

export function getThemeStateFromClient(): ThemeState {
    if (typeof window === "undefined") {
        return {
            mode: DEFAULT_THEME_MODE,
            customColors: DEFAULT_THEME_CUSTOM_COLORS,
        };
    }

    const storedMode = localStorage.getItem(THEME_STORAGE_KEY);
    const attrTheme = document.documentElement.getAttribute("data-theme");
    const mode = isThemeMode(storedMode) ? storedMode : isThemeMode(attrTheme) ? attrTheme : DEFAULT_THEME_MODE;
    const customColors = getStoredCustomColors(localStorage);
    const previous = cachedThemeState;

    if (
        previous &&
        previous.mode === mode &&
        previous.customColors.bg === customColors.bg &&
        previous.customColors.panel === customColors.panel &&
        previous.customColors.panel2 === customColors.panel2 &&
        previous.customColors.nav === customColors.nav &&
        previous.customColors.text === customColors.text &&
        previous.customColors.accent === customColors.accent &&
        previous.customColors.border === customColors.border
    ) {
        return previous;
    }

    cachedThemeState = {
        mode,
        customColors,
    };

    return cachedThemeState;
}

export function applyThemeState(nextState: ThemeState) {
    if (typeof window === "undefined") return;

    const mode = isThemeMode(nextState.mode) ? nextState.mode : DEFAULT_THEME_MODE;
    const customColors = normalizeCustomColors(nextState.customColors);
    const root = document.documentElement;

    syncThemeToDocument(root, mode, customColors);

    localStorage.setItem(THEME_STORAGE_KEY, mode);
    localStorage.setItem(CUSTOM_COLORS_STORAGE_KEY, JSON.stringify(customColors));
    window.dispatchEvent(new Event(THEME_EVENT));
}

export function setThemeMode(mode: ThemeMode) {
    const current = getThemeStateFromClient();
    applyThemeState({ ...current, mode });
}

export function setThemeColor(role: ThemeColorRole, color: string) {
    const current = getThemeStateFromClient();
    const nextColors: ThemeCustomColors = {
        ...current.customColors,
        [role]: normalizeRgbTriplet(color, DEFAULT_THEME_CUSTOM_COLORS[role]),
    };

    applyThemeState({
        mode: "custom",
        customColors: nextColors,
    });
}

export function subscribeThemeState(onStoreChange: () => void) {
    if (typeof window === "undefined") return () => {};

    const handleStorage = (event: StorageEvent) => {
        if (
            event.key &&
            event.key !== THEME_STORAGE_KEY &&
            event.key !== CUSTOM_COLORS_STORAGE_KEY
        ) {
            return;
        }

        const latest = getThemeStateFromClient();
        syncThemeToDocument(document.documentElement, latest.mode, latest.customColors);
        onStoreChange();
    };

    window.addEventListener(THEME_EVENT, onStoreChange);
    window.addEventListener("storage", handleStorage);

    return () => {
        window.removeEventListener(THEME_EVENT, onStoreChange);
        window.removeEventListener("storage", handleStorage);
    };
}

export function getThemeInitScript() {
    const modeKey = JSON.stringify(THEME_STORAGE_KEY);
    const customKey = JSON.stringify(CUSTOM_COLORS_STORAGE_KEY);
    const defaultMode = JSON.stringify(DEFAULT_THEME_MODE);
    const defaultColors = JSON.stringify(DEFAULT_THEME_CUSTOM_COLORS);

    return `(() => {
  try {
    const MODE_KEY = ${modeKey};
    const COLORS_KEY = ${customKey};
    const DEFAULT_MODE = ${defaultMode};
    const DEFAULT_COLORS = ${defaultColors};
    const RGB_PATTERN = /^(\\d{1,3})\\s+(\\d{1,3})\\s+(\\d{1,3})$/;
    const HEX_PATTERN = /^#?([0-9a-fA-F]{6})$/;

    const clamp = (value) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return 0;
      return Math.max(0, Math.min(255, Math.round(num)));
    };

    const parseTriplet = (value) => {
      const match = String(value ?? "").trim().match(RGB_PATTERN);
      if (!match) return null;
      return [clamp(match[1]), clamp(match[2]), clamp(match[3])];
    };

    const parseHex = (value) => {
      const match = String(value ?? "").trim().match(HEX_PATTERN);
      if (!match) return null;
      const hex = match[1];
      return [
        clamp(Number.parseInt(hex.slice(0, 2), 16)),
        clamp(Number.parseInt(hex.slice(2, 4), 16)),
        clamp(Number.parseInt(hex.slice(4, 6), 16)),
      ];
    };

    const stringifyTriplet = (parts) => parts.join(" ");
    const normalizeTriplet = (value, fallback) => {
      const parsed = parseTriplet(value) || parseHex(value);
      if (!parsed) return fallback;
      return stringifyTriplet(parsed);
    };

    const normalizeColors = (candidate) => {
      const normalizedPanel = normalizeTriplet(candidate?.panel ?? candidate?.light, DEFAULT_COLORS.panel);
      return {
        bg: normalizeTriplet(candidate?.bg ?? candidate?.deep, DEFAULT_COLORS.bg),
        panel: normalizedPanel,
        panel2: normalizeTriplet(candidate?.panel2, panel2(normalizedPanel)),
        nav: normalizeTriplet(candidate?.nav ?? candidate?.panel ?? candidate?.light, DEFAULT_COLORS.nav),
        text: normalizeTriplet(candidate?.text, DEFAULT_COLORS.text),
        accent: normalizeTriplet(candidate?.accent, DEFAULT_COLORS.accent),
        border: normalizeTriplet(candidate?.border, DEFAULT_COLORS.border),
      };
    };

    const mix = (base, target, weight) => {
      const a = parseTriplet(base) || parseHex(base) || parseTriplet(DEFAULT_COLORS.text);
      const b = parseTriplet(target) || parseHex(target) || parseTriplet(DEFAULT_COLORS.panel);
      if (!a || !b) return DEFAULT_COLORS.panel;
      const ratio = Math.max(0, Math.min(1, weight));
      return stringifyTriplet([
        clamp(a[0] * ratio + b[0] * (1 - ratio)),
        clamp(a[1] * ratio + b[1] * (1 - ratio)),
        clamp(a[2] * ratio + b[2] * (1 - ratio)),
      ]);
    };

    const shift = (base, offset) => {
      const parts = parseTriplet(base) || parseHex(base) || parseTriplet(DEFAULT_COLORS.panel);
      if (!parts) return DEFAULT_COLORS.panel;
      return stringifyTriplet([
        clamp(parts[0] + offset),
        clamp(parts[1] + offset),
        clamp(parts[2] + offset),
      ]);
    };

    const panel2 = (panel) => {
      const parts = parseTriplet(panel) || parseHex(panel) || parseTriplet(DEFAULT_COLORS.panel);
      if (!parts) return DEFAULT_COLORS.panel;
      const luminance = (parts[0] + parts[1] + parts[2]) / 3;
      return shift(panel, luminance < 128 ? 12 : -10);
    };

    const storedMode = localStorage.getItem(MODE_KEY);
    const mode = storedMode === "light" || storedMode === "dark" || storedMode === "custom" ? storedMode : DEFAULT_MODE;

    let parsedColors = DEFAULT_COLORS;
    try {
      const rawColors = localStorage.getItem(COLORS_KEY);
      if (rawColors) {
        parsedColors = normalizeColors(JSON.parse(rawColors));
      }
    } catch {}

    const root = document.documentElement;
    root.setAttribute("data-theme", mode);

    if (mode === "custom") {
      root.style.setProperty("--custom-bg", parsedColors.bg);
      root.style.setProperty("--custom-panel", parsedColors.panel);
      root.style.setProperty("--custom-nav", parsedColors.nav);
      root.style.setProperty("--custom-panel2", parsedColors.panel2);
      root.style.setProperty("--custom-text", parsedColors.text);
      root.style.setProperty("--custom-muted", mix(parsedColors.text, parsedColors.panel, 0.7));
      root.style.setProperty("--custom-border", parsedColors.border);
      root.style.setProperty("--custom-accent", parsedColors.accent);
    } else {
      root.style.removeProperty("--custom-bg");
      root.style.removeProperty("--custom-panel");
      root.style.removeProperty("--custom-nav");
      root.style.removeProperty("--custom-panel2");
      root.style.removeProperty("--custom-text");
      root.style.removeProperty("--custom-muted");
      root.style.removeProperty("--custom-border");
      root.style.removeProperty("--custom-accent");
    }

    localStorage.setItem(MODE_KEY, mode);
    localStorage.setItem(COLORS_KEY, JSON.stringify(parsedColors));
  } catch {}
})();`;
}
