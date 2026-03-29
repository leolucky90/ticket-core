import { DEFAULT_ITEM_NAMING_ORDER, normalizeItemNamingOrder } from "@/lib/services/productNaming";
import type { ItemNamingToken } from "@/lib/types/catalog";

export type ItemNamingSettings = {
    order: ItemNamingToken[];
    updatedAt: string;
    updatedBy: string;
};

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toIso(value: unknown): string {
    if (typeof value === "string" && value.trim()) {
        const parsed = Date.parse(value);
        if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
    }
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return new Date(Math.round(value)).toISOString();
    }
    return new Date().toISOString();
}

export function itemNamingSettingsDocPath(companyId: string): string {
    return `companies/${toText(companyId, 120)}/settings/itemNaming`;
}

export function createDefaultItemNamingSettings(updatedBy = "system"): ItemNamingSettings {
    return {
        order: [...DEFAULT_ITEM_NAMING_ORDER],
        updatedAt: new Date().toISOString(),
        updatedBy: toText(updatedBy, 160) || "system",
    };
}

export function normalizeItemNamingSettings(input: Partial<ItemNamingSettings> | null | undefined, updatedByFallback = "system"): ItemNamingSettings {
    const fallback = createDefaultItemNamingSettings(updatedByFallback);
    const row = (input ?? {}) as Partial<ItemNamingSettings>;
    return {
        order: normalizeItemNamingOrder(row.order),
        updatedAt: toIso(row.updatedAt ?? fallback.updatedAt),
        updatedBy: toText(row.updatedBy, 160) || toText(updatedByFallback, 160) || fallback.updatedBy,
    };
}
