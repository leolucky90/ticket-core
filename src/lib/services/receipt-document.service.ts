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

function listFromMemory(companyId: string): ReceiptDocumentRecord[] {
    return [...(memory[companyId] ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function upsertMemory(companyId: string, record: ReceiptDocumentRecord): void {
    const list = memory[companyId] ?? [];
    memory[companyId] = [record, ...list.filter((item) => item.id !== record.id)];
}

export async function saveReceiptDocument(record: ReceiptDocumentRecord): Promise<ReceiptDocumentRecord> {
    upsertMemory(record.companyId, record);
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
}): Promise<ReceiptDocumentRecord[]> {
    const scope = params?.companyId ? null : await resolveInvoiceServiceScope();
    const companyId = params?.companyId ?? scope?.companyId ?? "";
    if (!companyId) return [];

    const limit = Math.max(1, Math.min(200, params?.limit ?? 100));
    const keyword = (params?.keyword ?? "").trim().toLowerCase();
    const status = params?.status ?? "all";
    const db = await getInvoiceDb();
    const rows =
        db
            ? (
                  await db
                      .collection(receiptDocumentsCollectionPath(companyId))
                      .orderBy("updatedAt", "desc")
                      .limit(limit * 2)
                      .get()
              ).docs.map((doc) =>
                  normalizeReceiptDocumentRecord({
                      id: doc.id,
                      companyId,
                      ...(doc.data() as Partial<ReceiptDocumentRecord>),
                  }),
              )
            : listFromMemory(companyId);

    memory[companyId] = rows;

    return rows
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
}
