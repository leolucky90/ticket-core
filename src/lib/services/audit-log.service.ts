import "server-only";
import { fbAdminDb } from "@/lib/firebase-server";
import { auditLogsCollectionPath, normalizeAuditLog, type AuditLog } from "@/lib/schema";
import { requireCompanyOperator } from "@/lib/services/access-control";

function makeId(prefix: string): string {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function toFirestoreData<T>(input: T): T {
    const walk = (value: unknown): unknown => {
        if (Array.isArray(value)) return value.map((item) => walk(item)).filter((item) => item !== undefined);
        if (value && typeof value === "object") {
            const out: Record<string, unknown> = {};
            for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
                const next = walk(raw);
                if (next !== undefined) out[key] = next;
            }
            return out;
        }
        if (value === undefined) return undefined;
        return value;
    };
    return walk(input) as T;
}

export async function createAuditLog(input: {
    companyId?: string;
    module: string;
    action: string;
    targetId: string;
    targetType?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
    operatorId?: string;
    operatorName?: string;
}): Promise<AuditLog> {
    const operator = await requireCompanyOperator();
    const companyId = input.companyId?.trim() || operator.companyId!;
    const log = normalizeAuditLog({
        id: makeId("audit"),
        module: input.module,
        action: input.action,
        targetId: input.targetId,
        targetType: input.targetType ?? "record",
        operatorId: input.operatorId ?? operator.uid,
        operatorName: input.operatorName ?? operator.operatorName,
        reason: input.reason,
        metadata: input.metadata,
        createdAt: new Date().toISOString(),
    });
    await fbAdminDb.collection(auditLogsCollectionPath(companyId)).doc(log.id).set(toFirestoreData(log), { merge: false });
    return log;
}
