export const SOFT_DELETE_STATUSES = ["active", "soft_deleted", "restored", "hard_deleted"] as const;

export type SoftDeleteStatus = (typeof SOFT_DELETE_STATUSES)[number];

export type SoftDeleteMeta = {
    isDeleted: boolean;
    deleteStatus: SoftDeleteStatus;
    deletedAt?: string;
    deletedBy?: string;
    deletedReason?: string;
    restoredAt?: string;
    restoredBy?: string;
    restoreReason?: string;
    hardDeletedAt?: string;
    hardDeletedBy?: string;
    hardDeleteReason?: string;
};

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toNullableText(value: unknown, max = 240): string | undefined {
    const cleaned = toText(value, max);
    return cleaned || undefined;
}

function toStatus(value: unknown): SoftDeleteStatus {
    if (value === "soft_deleted") return "soft_deleted";
    if (value === "restored") return "restored";
    if (value === "hard_deleted") return "hard_deleted";
    return "active";
}

export function createSoftDeleteMeta(): SoftDeleteMeta {
    return {
        isDeleted: false,
        deleteStatus: "active",
    };
}

export function normalizeSoftDeleteMeta(value: unknown): SoftDeleteMeta {
    if (!value || typeof value !== "object") {
        return createSoftDeleteMeta();
    }
    const row = value as Record<string, unknown>;
    const deleteStatus = toStatus(row.deleteStatus);
    return {
        isDeleted: Boolean(row.isDeleted) || deleteStatus === "soft_deleted" || deleteStatus === "hard_deleted",
        deleteStatus,
        deletedAt: toNullableText(row.deletedAt, 60),
        deletedBy: toNullableText(row.deletedBy, 160),
        deletedReason: toNullableText(row.deletedReason, 2000),
        restoredAt: toNullableText(row.restoredAt, 60),
        restoredBy: toNullableText(row.restoredBy, 160),
        restoreReason: toNullableText(row.restoreReason, 2000),
        hardDeletedAt: toNullableText(row.hardDeletedAt, 60),
        hardDeletedBy: toNullableText(row.hardDeletedBy, 160),
        hardDeleteReason: toNullableText(row.hardDeleteReason, 2000),
    };
}

export function withSoftDeleted(meta: SoftDeleteMeta, payload: { by: string; reason?: string; at?: string }): SoftDeleteMeta {
    const at = toText(payload.at, 60) || new Date().toISOString();
    return {
        ...meta,
        isDeleted: true,
        deleteStatus: "soft_deleted",
        deletedAt: at,
        deletedBy: toText(payload.by, 160),
        deletedReason: toNullableText(payload.reason, 2000),
    };
}

export function withRestored(meta: SoftDeleteMeta, payload: { by: string; reason?: string; at?: string }): SoftDeleteMeta {
    const at = toText(payload.at, 60) || new Date().toISOString();
    return {
        ...meta,
        isDeleted: false,
        deleteStatus: "restored",
        restoredAt: at,
        restoredBy: toText(payload.by, 160),
        restoreReason: toNullableText(payload.reason, 2000),
    };
}

export function withHardDeleted(meta: SoftDeleteMeta, payload: { by: string; reason?: string; at?: string }): SoftDeleteMeta {
    const at = toText(payload.at, 60) || new Date().toISOString();
    return {
        ...meta,
        isDeleted: true,
        deleteStatus: "hard_deleted",
        hardDeletedAt: at,
        hardDeletedBy: toText(payload.by, 160),
        hardDeleteReason: toNullableText(payload.reason, 2000),
    };
}
