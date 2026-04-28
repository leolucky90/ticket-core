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
const LOG_QUERY_CACHE_TTL_MS = 20_000;
const queryCache: Record<
    string,
    {
        touchedAt: number;
        rows: InvoiceLogRecord[];
    }
> = {};

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

function buildListQueryKey(input: { companyId: string; documentId: string; draftId: string; limit: number }): string {
    return [input.companyId, input.documentId, input.draftId, String(input.limit)].join("|");
}

function hasFreshQueryCache(key: string): boolean {
    const touchedAt = queryCache[key]?.touchedAt ?? 0;
    return touchedAt > 0 && Date.now() - touchedAt <= LOG_QUERY_CACHE_TTL_MS;
}

function clearCompanyQueryCache(companyId: string): void {
    const prefix = `${companyId}|`;
    for (const key of Object.keys(queryCache)) {
        if (key.startsWith(prefix)) delete queryCache[key];
    }
}

function shouldFallbackToBroadLogQuery(error: unknown): boolean {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    return code === "failed-precondition" || message.includes("index");
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
    clearCompanyQueryCache(companyId);

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
    const documentId = params?.documentId ?? "";
    const draftId = params?.draftId ?? "";
    const queryKey = buildListQueryKey({
        companyId,
        documentId,
        draftId,
        limit,
    });
    if (hasFreshQueryCache(queryKey)) {
        return [...(queryCache[queryKey]?.rows ?? [])];
    }
    const db = await getInvoiceDb();
    if (!db) {
        const rows = (memory[companyId] ?? [])
            .filter((item) => (documentId ? item.documentId === documentId : true))
            .filter((item) => (draftId ? item.draftId === draftId : true))
            .slice(0, limit);
        queryCache[queryKey] = { touchedAt: Date.now(), rows };
        return rows;
    }

    const collection = db.collection(invoiceLogsCollectionPath(companyId));
    let snap;
    if (documentId || draftId) {
        try {
            let query = collection.orderBy("createdAt", "desc");
            if (documentId) query = query.where("documentId", "==", documentId);
            if (draftId) query = query.where("draftId", "==", draftId);
            snap = await query.limit(limit).get();
        } catch (error) {
            if (!shouldFallbackToBroadLogQuery(error)) throw error;
        }
    }
    snap ??= await collection.orderBy("createdAt", "desc").limit(limit * 2).get();
    const rows = snap.docs
        .map((doc) => normalizeInvoiceLogRecord({ id: doc.id, companyId, ...(doc.data() as Partial<InvoiceLogRecord>) }))
        .filter((item) => (documentId ? item.documentId === documentId : true))
        .filter((item) => (draftId ? item.draftId === draftId : true))
        .slice(0, limit);
    queryCache[queryKey] = { touchedAt: Date.now(), rows };
    return rows;
}
