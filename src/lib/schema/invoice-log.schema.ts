import { sanitizeIso, sanitizeText } from "@/lib/schema/company-settings.shared";

export const INVOICE_LOG_ACTIONS = [
    "draft_created",
    "issue_requested",
    "track_allocated",
    "issued",
    "issue_failed",
    "void_requested",
    "voided",
    "void_failed",
    "reissue_requested",
    "reissued",
] as const;
export type InvoiceLogAction = (typeof INVOICE_LOG_ACTIONS)[number];

export const INVOICE_LOG_LEVELS = ["info", "warning", "error"] as const;
export type InvoiceLogLevel = (typeof INVOICE_LOG_LEVELS)[number];

export type InvoiceLogRecord = {
    id: string;
    companyId: string;
    documentId: string;
    draftId: string;
    voidId: string;
    action: InvoiceLogAction;
    level: InvoiceLogLevel;
    message: string;
    actorUid: string;
    payload: unknown;
    createdAt: string;
};

function normalizeAction(value: unknown): InvoiceLogAction {
    return INVOICE_LOG_ACTIONS.find((item) => item === value) ?? "draft_created";
}

function normalizeLevel(value: unknown): InvoiceLogLevel {
    return INVOICE_LOG_LEVELS.find((item) => item === value) ?? "info";
}

export function invoiceLogsCollectionPath(companyId: string): string {
    return `companies/${sanitizeText(companyId, 120)}/invoiceLogs`;
}

export function invoiceLogDocPath(companyId: string, logId: string): string {
    return `${invoiceLogsCollectionPath(companyId)}/${sanitizeText(logId, 120)}`;
}

export function normalizeInvoiceLogRecord(
    input: Partial<InvoiceLogRecord> & { id: string; companyId: string },
): InvoiceLogRecord {
    const nowIso = new Date().toISOString();
    return {
        id: sanitizeText(input.id, 120),
        companyId: sanitizeText(input.companyId, 120),
        documentId: sanitizeText(input.documentId, 120),
        draftId: sanitizeText(input.draftId, 120),
        voidId: sanitizeText(input.voidId, 120),
        action: normalizeAction(input.action),
        level: normalizeLevel(input.level),
        message: sanitizeText(input.message, 500),
        actorUid: sanitizeText(input.actorUid, 120),
        payload: input.payload ?? null,
        createdAt: sanitizeIso(input.createdAt, nowIso),
    };
}
