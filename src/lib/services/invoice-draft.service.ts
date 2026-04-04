import "server-only";
import {
    invoiceDraftDocPath,
    invoiceDraftsCollectionPath,
    normalizeInvoiceDraftRecord,
    type InvoiceDraftRecord,
} from "@/lib/schema/invoice-draft.schema";
import { createInvoiceEntityId, getInvoiceDb, resolveInvoiceServiceScope } from "@/lib/services/invoice-service.shared";

const memory: Record<string, InvoiceDraftRecord[]> = {};

function listFromMemory(companyId: string): InvoiceDraftRecord[] {
    return [...(memory[companyId] ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function upsertMemory(companyId: string, draft: InvoiceDraftRecord): void {
    const list = memory[companyId] ?? [];
    memory[companyId] = [draft, ...list.filter((item) => item.id !== draft.id)];
}

export async function createInvoiceDraft(
    input: Partial<Omit<InvoiceDraftRecord, "id" | "companyId" | "createdAt" | "updatedAt">> & { companyId?: string; updatedBy?: string },
): Promise<InvoiceDraftRecord | null> {
    const scope = input.companyId ? null : await resolveInvoiceServiceScope();
    const companyId = input.companyId ?? scope?.companyId ?? "";
    const updatedBy = input.updatedBy ?? scope?.uid ?? "system";
    if (!companyId) return null;

    const nowIso = new Date().toISOString();
    const draft = normalizeInvoiceDraftRecord({
        id: createInvoiceEntityId("idraft"),
        companyId,
        branchId: input.branchId ?? "main",
        checkoutId: input.checkoutId ?? "",
        orderId: input.orderId ?? "",
        region: input.region ?? "TW",
        integrationMode: input.integrationMode ?? "mock",
        documentType: input.documentType ?? "receipt",
        buyerType: input.buyerType ?? "personal",
        buyerName: input.buyerName ?? "",
        buyerTaxId: input.buyerTaxId ?? "",
        buyerAbn: input.buyerAbn ?? "",
        carrierType: input.carrierType ?? "none",
        carrierCode: input.carrierCode ?? "",
        donationCode: input.donationCode ?? "",
        currency: input.currency ?? "",
        items: input.items ?? [],
        amount: input.amount ?? 0,
        taxAmount: input.taxAmount ?? 0,
        totalAmount: input.totalAmount ?? 0,
        status: input.status ?? "draft",
        sourceDocumentId: input.sourceDocumentId ?? "",
        createdAt: nowIso,
        updatedAt: nowIso,
        updatedBy,
    });
    upsertMemory(companyId, draft);

    const db = await getInvoiceDb();
    if (db) {
        await db.doc(invoiceDraftDocPath(companyId, draft.id)).set(draft, { merge: false });
    }
    return draft;
}

export async function getInvoiceDraftById(draftId: string, companyId?: string): Promise<InvoiceDraftRecord | null> {
    const scope = companyId ? null : await resolveInvoiceServiceScope();
    const resolvedCompanyId = companyId ?? scope?.companyId ?? "";
    if (!resolvedCompanyId || !draftId) return null;

    const cached = listFromMemory(resolvedCompanyId).find((item) => item.id === draftId);
    if (cached) return cached;

    const db = await getInvoiceDb();
    if (!db) return null;

    const snap = await db.doc(invoiceDraftDocPath(resolvedCompanyId, draftId)).get();
    if (!snap.exists) return null;
    const next = normalizeInvoiceDraftRecord({
        id: snap.id,
        companyId: resolvedCompanyId,
        ...(snap.data() as Partial<InvoiceDraftRecord>),
    });
    upsertMemory(resolvedCompanyId, next);
    return next;
}

export async function updateInvoiceDraft(
    draftId: string,
    patch: Partial<Omit<InvoiceDraftRecord, "id" | "companyId" | "createdAt">>,
    companyId?: string,
): Promise<InvoiceDraftRecord | null> {
    const current = await getInvoiceDraftById(draftId, companyId);
    if (!current) return null;

    const next = normalizeInvoiceDraftRecord({
        ...current,
        ...patch,
        id: current.id,
        companyId: current.companyId,
        updatedAt: new Date().toISOString(),
    });
    upsertMemory(current.companyId, next);

    const db = await getInvoiceDb();
    if (db) {
        await db.doc(invoiceDraftDocPath(current.companyId, current.id)).set(next, { merge: true });
    }
    return next;
}

export async function listInvoiceDrafts(params?: { companyId?: string; limit?: number }): Promise<InvoiceDraftRecord[]> {
    const scope = params?.companyId ? null : await resolveInvoiceServiceScope();
    const companyId = params?.companyId ?? scope?.companyId ?? "";
    if (!companyId) return [];

    const limit = Math.max(1, Math.min(100, params?.limit ?? 50));
    const db = await getInvoiceDb();
    if (!db) return listFromMemory(companyId).slice(0, limit);

    const snap = await db.collection(invoiceDraftsCollectionPath(companyId)).orderBy("updatedAt", "desc").limit(limit).get();
    const rows = snap.docs.map((doc) =>
        normalizeInvoiceDraftRecord({
            id: doc.id,
            companyId,
            ...(doc.data() as Partial<InvoiceDraftRecord>),
        }),
    );
    memory[companyId] = rows;
    return rows;
}
