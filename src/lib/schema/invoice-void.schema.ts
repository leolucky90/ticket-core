import { sanitizeIso, sanitizeText } from "@/lib/schema/company-settings.shared";
import { INVOICE_VOID_STATUSES, type InvoiceVoidStatus } from "@/lib/schema/receipt-document.schema";

export type InvoiceVoidRecord = {
    id: string;
    companyId: string;
    documentId: string;
    draftId: string;
    requestId: string;
    status: InvoiceVoidStatus;
    reason: string;
    operatorUid: string;
    operatorEmail: string;
    platformRequestPayload: unknown;
    platformResponsePayload: unknown;
    createdAt: string;
    updatedAt: string;
};

function normalizeStatus(value: unknown): InvoiceVoidStatus {
    return INVOICE_VOID_STATUSES.find((item) => item === value) ?? "pending";
}

export function invoiceVoidsCollectionPath(companyId: string): string {
    return `companies/${sanitizeText(companyId, 120)}/invoiceVoids`;
}

export function invoiceVoidDocPath(companyId: string, voidId: string): string {
    return `${invoiceVoidsCollectionPath(companyId)}/${sanitizeText(voidId, 120)}`;
}

export function normalizeInvoiceVoidRecord(
    input: Partial<InvoiceVoidRecord> & { id: string; companyId: string },
): InvoiceVoidRecord {
    const nowIso = new Date().toISOString();
    const createdAt = sanitizeIso(input.createdAt, nowIso);

    return {
        id: sanitizeText(input.id, 120),
        companyId: sanitizeText(input.companyId, 120),
        documentId: sanitizeText(input.documentId, 120),
        draftId: sanitizeText(input.draftId, 120),
        requestId: sanitizeText(input.requestId, 160),
        status: normalizeStatus(input.status),
        reason: sanitizeText(input.reason, 500),
        operatorUid: sanitizeText(input.operatorUid, 120),
        operatorEmail: sanitizeText(input.operatorEmail, 160).toLowerCase(),
        platformRequestPayload: input.platformRequestPayload ?? null,
        platformResponsePayload: input.platformResponsePayload ?? null,
        createdAt,
        updatedAt: sanitizeIso(input.updatedAt, createdAt),
    };
}
