import "server-only";
import type { InvoiceStatus } from "@/lib/schema";
import type { ReceiptDocumentRecord } from "@/lib/schema";
import { getInvoiceSettings } from "@/lib/services/invoice-settings.service";
import { listInvoiceLogs } from "@/lib/services/invoice-log.service";
import { listInvoiceTrackSettings } from "@/lib/services/invoice-track.service";
import { getReceiptDocumentById, listReceiptDocuments } from "@/lib/services/receipt-document.service";
import { resolveCompanySettingsScope } from "@/lib/services/company-settings-scope.service";

export type ReceiptDocumentsRouteData = {
    companyId: string;
    documents: ReceiptDocumentRecord[];
};

export type InvoiceSettingsRouteData = {
    companyId: string;
    settings: NonNullable<Awaited<ReturnType<typeof getInvoiceSettings>>>;
};

export type InvoiceTrackSettingsRouteData = {
    companyId: string;
    tracks: Awaited<ReturnType<typeof listInvoiceTrackSettings>>;
};

export type ReceiptDocumentDetailRouteData = {
    companyId: string;
    document: ReceiptDocumentRecord;
    logs: Awaited<ReturnType<typeof listInvoiceLogs>>;
};

export async function getReceiptDocumentsRouteData(params?: {
    keyword?: string;
    status?: InvoiceStatus | "all";
    limit?: number;
    issuedAtFrom?: string;
    issuedAtTo?: string;
}): Promise<ReceiptDocumentsRouteData | null> {
    const scope = await resolveCompanySettingsScope();
    if (!scope) return null;

    const documents = await listReceiptDocuments({
        companyId: scope.companyId,
        keyword: params?.keyword,
        status: params?.status,
        limit: params?.limit,
        issuedAtFrom: params?.issuedAtFrom,
        issuedAtTo: params?.issuedAtTo,
    });

    return {
        companyId: scope.companyId,
        documents,
    };
}

export async function getInvoiceSettingsRouteData(): Promise<InvoiceSettingsRouteData | null> {
    const scope = await resolveCompanySettingsScope();
    if (!scope) return null;

    const settings = await getInvoiceSettings(scope.companyId);
    if (!settings) return null;

    return {
        companyId: scope.companyId,
        settings,
    };
}

export async function getInvoiceTrackSettingsRouteData(): Promise<InvoiceTrackSettingsRouteData | null> {
    const scope = await resolveCompanySettingsScope();
    if (!scope) return null;

    const tracks = await listInvoiceTrackSettings(scope.companyId);

    return {
        companyId: scope.companyId,
        tracks,
    };
}

export async function getReceiptDocumentDetailRouteData(documentId: string): Promise<ReceiptDocumentDetailRouteData | null> {
    const scope = await resolveCompanySettingsScope();
    if (!scope) return null;

    const document = await getReceiptDocumentById(documentId, scope.companyId);
    if (!document) return null;

    const logs = await listInvoiceLogs({
        companyId: scope.companyId,
        documentId: document.id,
        limit: 100,
    });

    return {
        companyId: scope.companyId,
        document,
        logs,
    };
}
