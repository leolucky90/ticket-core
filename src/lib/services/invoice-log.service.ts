import "server-only";
import {
    invoiceLogDocPath,
    invoiceLogsCollectionPath,
    normalizeInvoiceLogRecord,
    type InvoiceLogAction,
    type InvoiceLogLevel,
    type InvoiceLogRecord,
} from "@/lib/schema/invoice-log.schema";
import { createInvoiceEntityId, getInvoiceDb, resolveInvoiceServiceScope } from "@/lib/services/invoice-service.shared";

const memory: Record<string, InvoiceLogRecord[]> = {};

type AppendInvoiceLogInput = {
    companyId?: string;
    actorUid?: string;
    documentId?: string;
    draftId?: string;
    voidId?: string;
    action: InvoiceLogAction;
    level?: InvoiceLogLevel;
    message: string;
    payload?: unknown;
};

function upsertMemory(companyId: string, record: InvoiceLogRecord): void {
    const list = memory[companyId] ?? [];
    memory[companyId] = [record, ...list.filter((item) => item.id !== record.id)];
}

export async function appendInvoiceLog(input: AppendInvoiceLogInput): Promise<InvoiceLogRecord | null> {
    const scope = input.companyId ? null : await resolveInvoiceServiceScope();
    const companyId = input.companyId ?? scope?.companyId ?? "";
    if (!companyId) return null;

    const record = normalizeInvoiceLogRecord({
        id: createInvoiceEntityId("ilog"),
        companyId,
        documentId: input.documentId ?? "",
        draftId: input.draftId ?? "",
        voidId: input.voidId ?? "",
        action: input.action,
        level: input.level ?? "info",
        message: input.message,
        actorUid: input.actorUid ?? scope?.uid ?? "system",
        payload: input.payload ?? null,
        createdAt: new Date().toISOString(),
    });
    upsertMemory(companyId, record);

    const db = await getInvoiceDb();
    if (!db) return record;

    await db.doc(invoiceLogDocPath(companyId, record.id)).set(record, { merge: false });
    return record;
}

export async function listInvoiceLogs(params?: { companyId?: string; documentId?: string; draftId?: string; limit?: number }): Promise<InvoiceLogRecord[]> {
    const scope = params?.companyId ? null : await resolveInvoiceServiceScope();
    const companyId = params?.companyId ?? scope?.companyId ?? "";
    if (!companyId) return [];

    const limit = Math.max(1, Math.min(200, params?.limit ?? 100));
    const db = await getInvoiceDb();
    if (!db) {
        return (memory[companyId] ?? [])
            .filter((item) => (params?.documentId ? item.documentId === params.documentId : true))
            .filter((item) => (params?.draftId ? item.draftId === params.draftId : true))
            .slice(0, limit);
    }

    const snap = await db.collection(invoiceLogsCollectionPath(companyId)).orderBy("createdAt", "desc").limit(limit * 2).get();
    return snap.docs
        .map((doc) => normalizeInvoiceLogRecord({ id: doc.id, companyId, ...(doc.data() as Partial<InvoiceLogRecord>) }))
        .filter((item) => (params?.documentId ? item.documentId === params.documentId : true))
        .filter((item) => (params?.draftId ? item.draftId === params.draftId : true))
        .slice(0, limit);
}
