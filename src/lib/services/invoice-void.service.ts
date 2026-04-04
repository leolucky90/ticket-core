import "server-only";
import { invoiceVoidDocPath, normalizeInvoiceVoidRecord, type InvoiceVoidRecord } from "@/lib/schema/invoice-void.schema";
import { appendInvoiceLog } from "@/lib/services/invoice-log.service";
import { createInvoicePlatformAdapter } from "@/lib/services/invoice-platform.service";
import { getInvoiceSettings } from "@/lib/services/invoice-settings.service";
import { getReceiptDocumentById, saveReceiptDocument } from "@/lib/services/receipt-document.service";
import { createInvoiceEntityId, getInvoiceDb, resolveInvoiceServiceScope } from "@/lib/services/invoice-service.shared";
import { normalizeReceiptDocumentRecord } from "@/lib/schema/receipt-document.schema";

const memory: Record<string, InvoiceVoidRecord[]> = {};

function upsertMemory(companyId: string, record: InvoiceVoidRecord): void {
    const list = memory[companyId] ?? [];
    memory[companyId] = [record, ...list.filter((item) => item.id !== record.id)];
}

export async function voidReceiptDocument(input: {
    documentId: string;
    reason: string;
    companyId?: string;
    operatorUid?: string;
    operatorEmail?: string;
}): Promise<{ document: Awaited<ReturnType<typeof getReceiptDocumentById>>; voidRecord: InvoiceVoidRecord | null }> {
    const scope = input.companyId ? null : await resolveInvoiceServiceScope();
    const companyId = input.companyId ?? scope?.companyId ?? "";
    const operatorUid = input.operatorUid ?? scope?.uid ?? "system";
    const operatorEmail = input.operatorEmail ?? scope?.email ?? "";
    if (!companyId || !input.documentId) return { document: null, voidRecord: null };

    const document = await getReceiptDocumentById(input.documentId, companyId);
    const invoiceSettings = await getInvoiceSettings(companyId);
    if (!document || !invoiceSettings) return { document: null, voidRecord: null };
    if (document.status === "voided" || document.status === "void_pending") {
        return { document, voidRecord: null };
    }

    const voidRecord = normalizeInvoiceVoidRecord({
        id: createInvoiceEntityId("ivoid"),
        companyId,
        documentId: document.id,
        draftId: document.draftId,
        requestId: createInvoiceEntityId("req"),
        status: "pending",
        reason: input.reason,
        operatorUid,
        operatorEmail,
        platformRequestPayload: null,
        platformResponsePayload: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
    upsertMemory(companyId, voidRecord);

    const db = await getInvoiceDb();
    if (db) {
        await db.doc(invoiceVoidDocPath(companyId, voidRecord.id)).set(voidRecord, { merge: false });
    }

    await appendInvoiceLog({
        companyId,
        actorUid: operatorUid,
        documentId: document.id,
        voidId: voidRecord.id,
        action: "void_requested",
        message: `Void requested: ${input.reason}`,
        payload: { documentNo: document.documentNo, reason: input.reason },
    });

    const adapter = createInvoicePlatformAdapter(document.integrationMode);
    const result = await adapter.voidInvoice({
        document,
        voidRecord,
        settings: invoiceSettings,
    });

    const nextVoid = normalizeInvoiceVoidRecord({
        ...voidRecord,
        id: voidRecord.id,
        companyId,
        status: result.voidStatus,
        requestId: result.requestId,
        platformRequestPayload: result.requestPayload,
        platformResponsePayload: result.responsePayload,
        updatedAt: new Date().toISOString(),
    });
    upsertMemory(companyId, nextVoid);
    if (db) {
        await db.doc(invoiceVoidDocPath(companyId, nextVoid.id)).set(nextVoid, { merge: true });
    }

    const nextDocument = normalizeReceiptDocumentRecord({
        ...document,
        id: document.id,
        companyId,
        status: result.documentStatus,
        voidedAt: result.documentStatus === "voided" ? new Date().toISOString() : document.voidedAt,
        voidReason: input.reason,
        voidRequestId: result.requestId,
        platformRequestPayload: result.requestPayload,
        platformResponsePayload: result.responsePayload,
        platformStatus: result.platformStatus,
        updatedAt: new Date().toISOString(),
    });
    await saveReceiptDocument(nextDocument);

    await appendInvoiceLog({
        companyId,
        actorUid: operatorUid,
        documentId: nextDocument.id,
        voidId: nextVoid.id,
        action: result.success ? "voided" : "void_failed",
        level: result.success ? "info" : "error",
        message: result.message,
        payload: { requestId: result.requestId, status: result.documentStatus },
    });

    return { document: nextDocument, voidRecord: nextVoid };
}

export async function listInvoiceVoids(companyId?: string): Promise<InvoiceVoidRecord[]> {
    const scope = companyId ? null : await resolveInvoiceServiceScope();
    const resolvedCompanyId = companyId ?? scope?.companyId ?? "";
    if (!resolvedCompanyId) return [];

    const db = await getInvoiceDb();
    if (!db) return memory[resolvedCompanyId] ?? [];

    const snap = await db.collection(`companies/${resolvedCompanyId}/invoiceVoids`).orderBy("createdAt", "desc").limit(100).get();
    const rows = snap.docs.map((doc) =>
        normalizeInvoiceVoidRecord({
            id: doc.id,
            companyId: resolvedCompanyId,
            ...(doc.data() as Partial<InvoiceVoidRecord>),
        }),
    );
    memory[resolvedCompanyId] = rows;
    return rows;
}
