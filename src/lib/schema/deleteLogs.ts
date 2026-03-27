import { normalizeSoftDeleteMeta, type SoftDeleteStatus } from "@/lib/schema/softDelete";

export type DeleteLogStatus = Extract<SoftDeleteStatus, "soft_deleted" | "restored" | "hard_deleted">;

export const DELETE_LOG_STATUSES = ["soft_deleted", "restored", "hard_deleted"] as const;

export type DeleteLog = {
    id: string;
    module: string;
    targetId: string;
    targetType: string;
    targetLabel: string;
    snapshot?: Record<string, unknown>;
    status: DeleteLogStatus;
    deletedAt?: string;
    deletedBy?: string;
    deletedByName?: string;
    deleteReason?: string;
    restoredAt?: string;
    restoredBy?: string;
    restoredByName?: string;
    restoreReason?: string;
    hardDeletedAt?: string;
    hardDeletedBy?: string;
    hardDeletedByName?: string;
    hardDeleteReason?: string;
    canRestore: boolean;
    canHardDelete: boolean;
    createdAt: string;
    updatedAt: string;
};

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toIso(value: unknown, fallback: string): string {
    if (typeof value === "string" && value.trim()) {
        const ts = Date.parse(value);
        if (Number.isFinite(ts)) return new Date(ts).toISOString();
    }
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return new Date(Math.round(value)).toISOString();
    }
    return fallback;
}

function toBool(value: unknown, fallback = false): boolean {
    if (typeof value === "boolean") return value;
    return fallback;
}

function toStatus(value: unknown, fallback: DeleteLogStatus = "soft_deleted"): DeleteLogStatus {
    if (value === "restored") return "restored";
    if (value === "hard_deleted") return "hard_deleted";
    if (value === "soft_deleted") return "soft_deleted";
    return fallback;
}

export function deleteLogsCollectionPath(companyId: string): string {
    return `companies/${toText(companyId, 120)}/deleteLogs`;
}

export function normalizeDeleteLog(input: Partial<DeleteLog> & Pick<DeleteLog, "id" | "module" | "targetId">): DeleteLog {
    const nowIso = new Date().toISOString();
    const meta = normalizeSoftDeleteMeta(input);

    return {
        id: toText(input.id, 120),
        module: toText(input.module, 120) || "unknown",
        targetId: toText(input.targetId, 120),
        targetType: toText(input.targetType, 120) || "record",
        targetLabel: toText(input.targetLabel, 240) || toText(input.targetId, 120),
        snapshot: input.snapshot && typeof input.snapshot === "object" ? (input.snapshot as Record<string, unknown>) : undefined,
        status: toStatus(input.status, meta.deleteStatus === "hard_deleted" ? "hard_deleted" : meta.deleteStatus === "restored" ? "restored" : "soft_deleted"),
        deletedAt: toText(input.deletedAt ?? meta.deletedAt, 60) || undefined,
        deletedBy: toText(input.deletedBy ?? meta.deletedBy, 160) || undefined,
        deletedByName: toText(input.deletedByName, 160) || undefined,
        deleteReason: toText(input.deleteReason ?? meta.deletedReason, 2000) || undefined,
        restoredAt: toText(input.restoredAt ?? meta.restoredAt, 60) || undefined,
        restoredBy: toText(input.restoredBy ?? meta.restoredBy, 160) || undefined,
        restoredByName: toText(input.restoredByName, 160) || undefined,
        restoreReason: toText(input.restoreReason ?? meta.restoreReason, 2000) || undefined,
        hardDeletedAt: toText(input.hardDeletedAt ?? meta.hardDeletedAt, 60) || undefined,
        hardDeletedBy: toText(input.hardDeletedBy ?? meta.hardDeletedBy, 160) || undefined,
        hardDeletedByName: toText(input.hardDeletedByName, 160) || undefined,
        hardDeleteReason: toText(input.hardDeleteReason ?? meta.hardDeleteReason, 2000) || undefined,
        canRestore: toBool(input.canRestore, true),
        canHardDelete: toBool(input.canHardDelete, true),
        createdAt: toIso(input.createdAt, nowIso),
        updatedAt: toIso(input.updatedAt, nowIso),
    };
}

