export type AuditLog = {
    id: string;
    module: string;
    action: string;
    targetId: string;
    targetType: string;
    operatorId: string;
    operatorName: string;
    reason?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
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

export function auditLogsCollectionPath(companyId: string): string {
    return `companies/${toText(companyId, 120)}/auditLogs`;
}

export function normalizeAuditLog(input: Partial<AuditLog> & Pick<AuditLog, "id" | "module" | "action" | "targetId">): AuditLog {
    return {
        id: toText(input.id, 120),
        module: toText(input.module, 120) || "unknown",
        action: toText(input.action, 120) || "unknown",
        targetId: toText(input.targetId, 120),
        targetType: toText(input.targetType, 120) || "record",
        operatorId: toText(input.operatorId, 160),
        operatorName: toText(input.operatorName, 160) || "Unknown",
        reason: toText(input.reason, 2000) || undefined,
        metadata: input.metadata && typeof input.metadata === "object" ? (input.metadata as Record<string, unknown>) : undefined,
        createdAt: toIso(input.createdAt),
    };
}

