import "server-only";
import {
    invoiceTrackSettingDocPath,
    invoiceTrackSettingsCollectionPath,
    normalizeInvoiceTrackSetting,
    type InvoiceTrackSetting,
} from "@/lib/schema/invoice-track-settings.schema";
import type { InvoiceIntegrationMode, ReceiptDocumentType } from "@/lib/schema/receipt-document.schema";
import type { BusinessRegion } from "@/lib/schema/regional-receipt-settings.schema";
import { createInvoiceEntityId, getInvoiceDb, resolveInvoiceServiceScope } from "@/lib/services/invoice-service.shared";

const memory: Record<string, InvoiceTrackSetting[]> = {};

function listFromMemory(companyId: string): InvoiceTrackSetting[] {
    return [...(memory[companyId] ?? [])].sort((a, b) => a.prefix.localeCompare(b.prefix));
}

function upsertMemory(companyId: string, track: InvoiceTrackSetting): void {
    const list = memory[companyId] ?? [];
    memory[companyId] = [...list.filter((item) => item.id !== track.id), track].sort((a, b) => a.prefix.localeCompare(b.prefix));
}

function padTrackNumber(value: number): string {
    return String(value).padStart(8, "0");
}

function buildMockDocumentNo(region: BusinessRegion, documentType: ReceiptDocumentType): { documentNo: string; trackPrefix: string } {
    const prefix = region === "TW" ? "MK" : documentType === "tax-invoice" ? "AUTF" : documentType === "invoice" ? "AUIN" : "AURC";
    return {
        trackPrefix: prefix,
        documentNo: `${prefix}${Date.now().toString().slice(-8)}`,
    };
}

function buildAuDocumentNo(documentType: ReceiptDocumentType): { documentNo: string; trackPrefix: string } {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const prefix = documentType === "tax-invoice" ? "AUTF" : documentType === "invoice" ? "AUIN" : "AURC";
    return {
        trackPrefix: prefix,
        documentNo: `${prefix}-${yyyy}${mm}${dd}-${String(Date.now()).slice(-5)}`,
    };
}

export async function listInvoiceTrackSettings(companyId?: string): Promise<InvoiceTrackSetting[]> {
    const scope = companyId ? null : await resolveInvoiceServiceScope();
    const resolvedCompanyId = companyId ?? scope?.companyId ?? "";
    if (!resolvedCompanyId) return [];

    const db = await getInvoiceDb();
    if (!db) return listFromMemory(resolvedCompanyId);

    const snap = await db.collection(invoiceTrackSettingsCollectionPath(resolvedCompanyId)).orderBy("prefix", "asc").get();
    const rows = snap.docs.map((doc) =>
        normalizeInvoiceTrackSetting({
            id: doc.id,
            companyId: resolvedCompanyId,
            ...(doc.data() as Partial<InvoiceTrackSetting>),
        }),
    );
    memory[resolvedCompanyId] = rows;
    return rows;
}

export async function saveInvoiceTrackSetting(
    input: Partial<Omit<InvoiceTrackSetting, "id" | "companyId" | "createdAt" | "updatedAt" | "updatedBy">> & { id?: string },
): Promise<InvoiceTrackSetting | null> {
    const scope = await resolveInvoiceServiceScope();
    if (!scope) return null;

    const next = normalizeInvoiceTrackSetting({
        id: input.id ?? createInvoiceEntityId("itrack"),
        companyId: scope.companyId,
        region: input.region ?? "TW",
        integrationMode: input.integrationMode ?? "mock",
        documentType: input.documentType ?? "electronic-invoice",
        prefix: input.prefix ?? "",
        startNo: input.startNo ?? 0,
        endNo: input.endNo ?? 0,
        nextNo: input.nextNo ?? input.startNo ?? 0,
        active: input.active ?? true,
        label: input.label ?? "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: scope.uid,
    });
    upsertMemory(scope.companyId, next);

    const db = await getInvoiceDb();
    if (!db) return next;

    await db.doc(invoiceTrackSettingDocPath(scope.companyId, next.id)).set(next, { merge: true });
    return next;
}

export async function allocateInvoiceTrackNumber(input: {
    companyId: string;
    region: BusinessRegion;
    documentType: ReceiptDocumentType;
    integrationMode: InvoiceIntegrationMode;
}): Promise<{ documentNo: string; trackPrefix: string; trackId?: string }> {
    if (input.region === "AU") {
        return input.integrationMode === "mock" ? buildMockDocumentNo("AU", input.documentType) : buildAuDocumentNo(input.documentType);
    }

    if (input.integrationMode === "mock") {
        return buildMockDocumentNo("TW", input.documentType);
    }

    const tracks = await listInvoiceTrackSettings(input.companyId);
    const matched = tracks.find(
        (track) =>
            track.active &&
            track.region === "TW" &&
            track.integrationMode === input.integrationMode &&
            track.documentType === input.documentType &&
            track.nextNo <= track.endNo,
    );
    if (!matched) {
        throw new Error(`No active invoice track for ${input.integrationMode}/${input.documentType}`);
    }

    const allocatedNo = matched.nextNo;
    const nextTrack = normalizeInvoiceTrackSetting({
        ...matched,
        companyId: input.companyId,
        nextNo: matched.nextNo + 1,
        active: matched.nextNo + 1 <= matched.endNo ? matched.active : false,
        updatedAt: new Date().toISOString(),
    });
    upsertMemory(input.companyId, nextTrack);

    const db = await getInvoiceDb();
    if (db) {
        await db.doc(invoiceTrackSettingDocPath(input.companyId, matched.id)).set(nextTrack, { merge: true });
    }

    return {
        documentNo: `${matched.prefix}${padTrackNumber(allocatedNo)}`,
        trackPrefix: matched.prefix,
        trackId: matched.id,
    };
}
