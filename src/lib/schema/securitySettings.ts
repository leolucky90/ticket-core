export type SecuritySettings = {
    deleteButtonEnabled: boolean;
    requirePasswordWhenDeleteDisabled: boolean;
    requireSecondConfirmation: boolean;
    requireReasonOnDelete: boolean;
    deleteAuditLogEnabled: boolean;
    softDeleteOnly: boolean;
    allowLevelToDeleteFrom: number;
    restoreEnabled: boolean;
    hardDeleteEnabled: boolean;
    allowLevelToHardDeleteFrom: number;
    requirePasswordForHardDelete: boolean;
    requireReasonOnHardDelete: boolean;
    employeeRestoreLevel: number;
    employeeHardDeleteLevel: number;
    employeeStrictOwnerOnly: boolean;
    updatedAt: string;
    updatedBy: string;
};

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toBool(value: unknown, fallback: boolean): boolean {
    if (typeof value === "boolean") return value;
    return fallback;
}

function toLevel(value: unknown, fallback: number): number {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    const rounded = Math.round(n);
    if (rounded < 1) return 1;
    if (rounded > 9) return 9;
    return rounded;
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

export function securitySettingsDocPath(companyId: string): string {
    return `companies/${toText(companyId, 120)}/settings/delete-control`;
}

export function createDefaultSecuritySettings(updatedBy = "system"): SecuritySettings {
    return {
        deleteButtonEnabled: true,
        requirePasswordWhenDeleteDisabled: true,
        requireSecondConfirmation: true,
        requireReasonOnDelete: false,
        deleteAuditLogEnabled: true,
        softDeleteOnly: true,
        allowLevelToDeleteFrom: 5,
        restoreEnabled: true,
        hardDeleteEnabled: false,
        allowLevelToHardDeleteFrom: 9,
        requirePasswordForHardDelete: true,
        requireReasonOnHardDelete: true,
        employeeRestoreLevel: 8,
        employeeHardDeleteLevel: 9,
        employeeStrictOwnerOnly: true,
        updatedAt: new Date().toISOString(),
        updatedBy: toText(updatedBy, 160) || "system",
    };
}

export function normalizeSecuritySettings(
    input: Partial<SecuritySettings> | null | undefined,
    updatedByFallback = "system",
): SecuritySettings {
    const fallback = createDefaultSecuritySettings(updatedByFallback);
    const row = (input ?? {}) as Partial<SecuritySettings>;

    return {
        deleteButtonEnabled: toBool(row.deleteButtonEnabled, fallback.deleteButtonEnabled),
        requirePasswordWhenDeleteDisabled: toBool(
            row.requirePasswordWhenDeleteDisabled,
            fallback.requirePasswordWhenDeleteDisabled,
        ),
        requireSecondConfirmation: toBool(row.requireSecondConfirmation, fallback.requireSecondConfirmation),
        requireReasonOnDelete: toBool(row.requireReasonOnDelete, fallback.requireReasonOnDelete),
        deleteAuditLogEnabled: toBool(row.deleteAuditLogEnabled, fallback.deleteAuditLogEnabled),
        softDeleteOnly: toBool(row.softDeleteOnly, fallback.softDeleteOnly),
        allowLevelToDeleteFrom: toLevel(row.allowLevelToDeleteFrom, fallback.allowLevelToDeleteFrom),
        restoreEnabled: toBool(row.restoreEnabled, fallback.restoreEnabled),
        hardDeleteEnabled: toBool(row.hardDeleteEnabled, fallback.hardDeleteEnabled),
        allowLevelToHardDeleteFrom: toLevel(row.allowLevelToHardDeleteFrom, fallback.allowLevelToHardDeleteFrom),
        requirePasswordForHardDelete: toBool(row.requirePasswordForHardDelete, fallback.requirePasswordForHardDelete),
        requireReasonOnHardDelete: toBool(row.requireReasonOnHardDelete, fallback.requireReasonOnHardDelete),
        employeeRestoreLevel: toLevel(row.employeeRestoreLevel, fallback.employeeRestoreLevel),
        employeeHardDeleteLevel: toLevel(row.employeeHardDeleteLevel, fallback.employeeHardDeleteLevel),
        employeeStrictOwnerOnly: toBool(row.employeeStrictOwnerOnly, fallback.employeeStrictOwnerOnly),
        updatedAt: toIso(row.updatedAt ?? fallback.updatedAt),
        updatedBy: toText(row.updatedBy, 160) || toText(updatedByFallback, 160) || fallback.updatedBy,
    };
}
