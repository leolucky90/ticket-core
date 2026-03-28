function toPrimaryString(value: unknown): string | null {
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== "string") return null;
    const trimmed = raw.replace(/[\u0000-\u001F\u007F]/g, "").trim();
    return trimmed || null;
}

export function normalizeScopedId(value: unknown): string | null {
    const text = toPrimaryString(value);
    if (!text) return null;
    if (/[/?#]/.test(text)) return null;
    return text;
}

export function normalizeCompanyId(value: unknown): string | null {
    return normalizeScopedId(value);
}

export function normalizeTenantId(value: unknown): string | null {
    return normalizeScopedId(value);
}

export function normalizeAuthTenantId(value: unknown): string | null {
    const text = toPrimaryString(value);
    if (!text) return null;
    if (!/^[a-zA-Z0-9-]+$/.test(text)) return null;
    return text;
}
