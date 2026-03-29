import "server-only";

import { fbAdminDb } from "@/lib/firebase-server";
import { auditLogsCollectionPath, normalizeAuditLog, type AuditLog } from "@/lib/schema";
import { requireCompanyOperator } from "@/lib/services/access-control";

/**
 * 讀取公司稽核紀錄（誰對哪個目標做了什麼）。依 `createdAt` 降序。
 */
export async function queryCompanyAuditLogs(limit = 80): Promise<AuditLog[]> {
    const operator = await requireCompanyOperator();
    const companyId = operator.companyId!;
    const safeLimit = Math.min(Math.max(Math.round(limit), 1), 200);
    const snap = await fbAdminDb
        .collection(auditLogsCollectionPath(companyId))
        .orderBy("createdAt", "desc")
        .limit(safeLimit)
        .get();

    return snap.docs.map((doc) => {
        const row = (doc.data() ?? {}) as Record<string, unknown>;
        const str = (v: unknown) => (typeof v === "string" ? v : "");
        return normalizeAuditLog({
            id: doc.id,
            module: str(row.module),
            action: str(row.action),
            targetId: str(row.targetId),
            targetType: row.targetType ? str(row.targetType) : undefined,
            operatorId: row.operatorId ? str(row.operatorId) : undefined,
            operatorName: row.operatorName ? str(row.operatorName) : undefined,
            reason: row.reason ? str(row.reason) : undefined,
            metadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : undefined,
            createdAt: typeof row.createdAt === "string" ? row.createdAt : str(row.createdAt),
        });
    });
}
