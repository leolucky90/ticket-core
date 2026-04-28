import "server-only";
import {
    normalizeReceiptDocumentRecord,
    receiptDocumentDocPath,
    receiptDocumentsCollectionPath,
    type InvoiceStatus,
    type ReceiptDocumentRecord,
} from "@/lib/schema/receipt-document.schema";
import { getInvoiceDb, resolveInvoiceServiceScope } from "@/lib/services/invoice-service.shared";

const memory: Record<string, ReceiptDocumentRecord[]> = {};
const READ_QUERY_CACHE_TTL_MS = 20_000;
const queryCache: Record<string, { touchedAt: number; rows: ReceiptDocumentRecord[] }> = {};

function buildListQueryCacheKey(input: {
    companyId: string;
    keyword: string;
    status: InvoiceStatus | "all";
    limit: number;
    issuedAtFrom: string;
    issuedAtTo: string;
}): string {
    return [
        input.companyId,
        input.keyword,
        input.status,
        String(input.limit),
        input.issuedAtFrom,
        input.issuedAtTo,
    ].join("|");
}

function hasFreshQueryCache(key: string): boolean {
    const touchedAt = queryCache[key]?.touchedAt ?? 0;
    return touchedAt > 0 && Date.now() - touchedAt <= READ_QUERY_CACHE_TTL_MS;
}

function clearCompanyQueryCache(companyId: string): void {
    const prefix = `${companyId}|`;
    for (const key of Object.keys(queryCache)) {
        if (key.startsWith(prefix)) {
            delete queryCache[key];
        }
    }
}

function shouldFallbackToBroadDocumentQuery(error: unknown): boolean {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    return code === "failed-precondition" || message.includes("index");
}

function listFromMemory(companyId: string): ReceiptDocumentRecord[] {
    return [...(memory[companyId] ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function upsertMemory(companyId: string, record: ReceiptDocumentRecord): void {
    const list = memory[companyId] ?? [];
    memory[companyId] = [record, ...list.filter((item) => item.id !== record.id)];
}

export async function saveReceiptDocument(record: ReceiptDocumentRecord): Promise<ReceiptDocumentRecord> {
    upsertMemory(record.companyId, record);
    clearCompanyQueryCache(record.companyId);
    const db = await getInvoiceDb();
    if (db) {
        await db.doc(receiptDocumentDocPath(record.companyId, record.id)).set(record, { merge: true });
    }
    return record;
}

export async function getReceiptDocumentById(documentId: string, companyId?: string): Promise<ReceiptDocumentRecord | null> {
    const scope = companyId ? null : await resolveInvoiceServiceScope();
    const resolvedCompanyId = companyId ?? scope?.companyId ?? "";
    if (!resolvedCompanyId || !documentId) return null;

    const cached = listFromMemory(resolvedCompanyId).find((item) => item.id === documentId);
    if (cached) return cached;

    const db = await getInvoiceDb();
    if (!db) return null;

    const snap = await db.doc(receiptDocumentDocPath(resolvedCompanyId, documentId)).get();
    if (!snap.exists) return null;
    const next = normalizeReceiptDocumentRecord({
        id: snap.id,
        companyId: resolvedCompanyId,
        ...(snap.data() as Partial<ReceiptDocumentRecord>),
    });
    upsertMemory(resolvedCompanyId, next);
    return next;
}

export async function listReceiptDocuments(params?: {
    companyId?: string;
    keyword?: string;
    status?: InvoiceStatus | "all";
    limit?: number;
    issuedAtFrom?: string;
    issuedAtTo?: string;
}): Promise<ReceiptDocumentRecord[]> {
    const scope = params?.companyId ? null : await resolveInvoiceServiceScope();
    const companyId = params?.companyId ?? scope?.companyId ?? "";
    if (!companyId) return [];

    const limit = Math.max(1, Math.min(200, params?.limit ?? 100));
    const keyword = (params?.keyword ?? "").trim().toLowerCase();
    const status = params?.status ?? "all";
    const issuedAtFrom = (params?.issuedAtFrom ?? "").trim();
    const issuedAtTo = (params?.issuedAtTo ?? "").trim();
    const queryCacheKey = buildListQueryCacheKey({
        companyId,
        keyword,
        status,
        limit,
        issuedAtFrom,
        issuedAtTo,
    });

    if (hasFreshQueryCache(queryCacheKey)) {
        return [...(queryCache[queryCacheKey]?.rows ?? [])];
    }

    const db = await getInvoiceDb();
    let rows: ReceiptDocumentRecord[];
    if (db) {
        const collection = db.collection(receiptDocumentsCollectionPath(companyId));
        let snap;
        if (status !== "all") {
            try {
                snap = await collection
                    .where("status", "==", status)
                    .where("issuedAt", ">=", issuedAtFrom || "0000-01-01T00:00:00.000Z")
                    .where("issuedAt", "<", issuedAtTo || "9999-12-31T23:59:59.999Z")
                    .orderBy("issuedAt", "desc")
                    .limit(limit * 2 + 40)
                    .get();
            } catch (error) {
                if (!shouldFallbackToBroadDocumentQuery(error)) throw error;
            }
        }
        snap ??= await collection
            .where("issuedAt", ">=", issuedAtFrom || "0000-01-01T00:00:00.000Z")
            .where("issuedAt", "<", issuedAtTo || "9999-12-31T23:59:59.999Z")
            .orderBy("issuedAt", "desc")
            .limit(limit * 2 + 40)
            .get();
        rows = snap.docs.map((doc) =>
            normalizeReceiptDocumentRecord({
                id: doc.id,
                companyId,
                ...(doc.data() as Partial<ReceiptDocumentRecord>),
            }),
        );
    } else {
        rows = listFromMemory(companyId);
    }

    memory[companyId] = rows;

    const result = rows
        .filter((item) => {
            if (issuedAtFrom && item.issuedAt < issuedAtFrom) return false;
            if (issuedAtTo && item.issuedAt >= issuedAtTo) return false;
            return true;
        })
        .filter((item) => (status === "all" ? true : item.status === status))
        .filter((item) => {
            if (!keyword) return true;
            const haystack = [
                item.id,
                item.documentNo,
                item.buyerName,
                item.buyerTaxId,
                item.buyerAbn,
                item.carrierCode,
                item.donationCode,
                item.documentType,
                item.status,
            ]
                .join(" ")
                .toLowerCase();
            return haystack.includes(keyword);
        })
        .slice(0, limit);

    queryCache[queryCacheKey] = {
        touchedAt: Date.now(),
        rows: result,
    };

    return result;
}
