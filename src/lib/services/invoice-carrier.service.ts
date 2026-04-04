import "server-only";
import {
    invoiceCarrierDocPath,
    invoiceCarriersCollectionPath,
    normalizeInvoiceCarrierRecord,
    type InvoiceCarrierRecord,
    type InvoiceCarrierType,
} from "@/lib/schema/invoice-carrier.schema";
import { createInvoiceEntityId, getInvoiceDb, resolveInvoiceServiceScope } from "@/lib/services/invoice-service.shared";

const memory: Record<string, InvoiceCarrierRecord[]> = {};

function listFromMemory(companyId: string): InvoiceCarrierRecord[] {
    return [...(memory[companyId] ?? [])].sort((a, b) => (a.isDefault === b.isDefault ? a.label.localeCompare(b.label) : a.isDefault ? -1 : 1));
}

function upsertMemory(companyId: string, record: InvoiceCarrierRecord): void {
    const list = memory[companyId] ?? [];
    const next = record.isDefault
        ? list.map((item) => (item.customerId === record.customerId ? { ...item, isDefault: item.id === record.id } : item))
        : list;
    memory[companyId] = [...next.filter((item) => item.id !== record.id), record];
}

export async function listInvoiceCarriers(params?: { companyId?: string; customerId?: string }): Promise<InvoiceCarrierRecord[]> {
    const scope = params?.companyId ? null : await resolveInvoiceServiceScope();
    const companyId = params?.companyId ?? scope?.companyId ?? "";
    if (!companyId) return [];

    const db = await getInvoiceDb();
    if (!db) {
        return listFromMemory(companyId).filter((item) => (params?.customerId ? item.customerId === params.customerId : true));
    }

    const snap = await db.collection(invoiceCarriersCollectionPath(companyId)).orderBy("updatedAt", "desc").limit(200).get();
    const rows = snap.docs.map((doc) =>
        normalizeInvoiceCarrierRecord({
            id: doc.id,
            companyId,
            ...(doc.data() as Partial<InvoiceCarrierRecord>),
        }),
    );
    memory[companyId] = rows;
    return rows.filter((item) => (params?.customerId ? item.customerId === params.customerId : true));
}

export async function upsertInvoiceCarrier(input: {
    companyId?: string;
    customerId: string;
    type: InvoiceCarrierType;
    code: string;
    label?: string;
    isDefault?: boolean;
    updatedBy?: string;
}): Promise<InvoiceCarrierRecord | null> {
    const scope = input.companyId ? null : await resolveInvoiceServiceScope();
    const companyId = input.companyId ?? scope?.companyId ?? "";
    const updatedBy = input.updatedBy ?? scope?.uid ?? "system";
    if (!companyId || !input.customerId || input.type === "none" || !input.code.trim()) return null;

    const existing = (await listInvoiceCarriers({ companyId, customerId: input.customerId })).find(
        (item) => item.type === input.type && item.code === input.code.trim(),
    );
    const next = normalizeInvoiceCarrierRecord({
        ...(existing ?? {}),
        id: existing?.id ?? createInvoiceEntityId("icarrier"),
        companyId,
        customerId: input.customerId,
        type: input.type,
        code: input.code,
        label: input.label ?? input.code,
        isDefault: input.isDefault ?? true,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy,
    });
    upsertMemory(companyId, next);

    const db = await getInvoiceDb();
    if (db) {
        await db.doc(invoiceCarrierDocPath(companyId, next.id)).set(next, { merge: true });
    }
    return next;
}
