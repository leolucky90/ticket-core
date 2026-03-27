import { LIST_DISPLAY_OPTIONS, type ListDisplayOption } from "@/lib/ui/list-display";

const LIST_DISPLAY_VALUES = LIST_DISPLAY_OPTIONS.map((item) => Number.parseInt(item, 10)).filter((item) => Number.isFinite(item));

export function parseListPageSize(text: string, fallback: ListDisplayOption = "10"): number {
    const fallbackValue = Number.parseInt(fallback, 10);
    const value = Number.parseInt(text, 10);
    if (!Number.isFinite(value)) return fallbackValue;
    for (const allowed of LIST_DISPLAY_VALUES) {
        if (value <= allowed) return allowed;
    }
    return LIST_DISPLAY_VALUES.at(-1) ?? fallbackValue;
}

export function decodeCursorStack(text: string): string[] {
    if (!text) return [];
    try {
        const parsed = JSON.parse(Buffer.from(text, "base64url").toString("utf8"));
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    } catch {
        return [];
    }
}

export function encodeCursorStack(items: string[]): string {
    if (items.length === 0) return "";
    return Buffer.from(JSON.stringify(items)).toString("base64url");
}
