export const PERMISSION_LEVEL_RANGE = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export type PermissionLevelNumber = (typeof PERMISSION_LEVEL_RANGE)[number];

export type PermissionLevel = {
    level: PermissionLevelNumber;
    code: string;
    displayName: string;
    isActive: boolean;
    permissions: string[];
    createdAt: string;
    updatedAt: string;
    updatedBy: string;
};

export const PERMISSION_LEVEL_DEFAULT_NAMES: Record<PermissionLevelNumber, string> = {
    1: "新員工",
    2: "員工",
    3: "資深員工",
    4: "組長",
    5: "店長",
    6: "區主管",
    7: "營運主管",
    8: "管理員",
    9: "超級管理員",
};

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toIso(value: unknown): string {
    if (typeof value === "string" && value.trim()) {
        const ts = Date.parse(value);
        if (Number.isFinite(ts)) return new Date(ts).toISOString();
    }
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return new Date(Math.round(value)).toISOString();
    }
    return new Date().toISOString();
}

function toBool(value: unknown, fallback = true): boolean {
    if (typeof value === "boolean") return value;
    return fallback;
}

function toLevel(value: unknown, fallback: PermissionLevelNumber): PermissionLevelNumber {
    const n = typeof value === "number" ? value : Number(value);
    if (n >= 1 && n <= 9) return Math.round(n) as PermissionLevelNumber;
    return fallback;
}

function toPermissions(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const item of value) {
        const next = toText(item, 160);
        if (!next) continue;
        const key = next.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(next);
    }
    return out;
}

export function permissionLevelsCollectionPath(companyId: string): string {
    return `companies/${toText(companyId, 120)}/permissionLevels`;
}

export function permissionLevelDocPath(companyId: string, level: PermissionLevelNumber): string {
    return `${permissionLevelsCollectionPath(companyId)}/lv${level}`;
}

export function createDefaultPermissionLevel(level: PermissionLevelNumber, updatedBy = "system"): PermissionLevel {
    const ts = new Date().toISOString();
    return {
        level,
        code: `LV${level}`,
        displayName: PERMISSION_LEVEL_DEFAULT_NAMES[level],
        isActive: true,
        permissions: [],
        createdAt: ts,
        updatedAt: ts,
        updatedBy: toText(updatedBy, 160) || "system",
    };
}

export function normalizePermissionLevel(
    level: PermissionLevelNumber,
    input: Partial<PermissionLevel> | null | undefined,
    updatedByFallback = "system",
): PermissionLevel {
    const fallback = createDefaultPermissionLevel(level, updatedByFallback);
    const row = (input ?? {}) as Partial<PermissionLevel>;

    return {
        level: toLevel(row.level, level),
        code: toText(row.code, 32) || fallback.code,
        displayName: toText(row.displayName, 120) || fallback.displayName,
        isActive: toBool(row.isActive, fallback.isActive),
        permissions: toPermissions(row.permissions),
        createdAt: toIso(row.createdAt ?? fallback.createdAt),
        updatedAt: toIso(row.updatedAt ?? fallback.updatedAt),
        updatedBy: toText(row.updatedBy, 160) || toText(updatedByFallback, 160) || fallback.updatedBy,
    };
}

