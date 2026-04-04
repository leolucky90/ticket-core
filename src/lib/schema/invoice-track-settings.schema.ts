import { sanitizeBoolean, sanitizeIso, sanitizeText } from "@/lib/schema/company-settings.shared";
import type { InvoiceIntegrationMode, ReceiptDocumentType } from "@/lib/schema/receipt-document.schema";
import type { BusinessRegion } from "@/lib/schema/regional-receipt-settings.schema";

export type InvoiceTrackSetting = {
    id: string;
    companyId: string;
    region: BusinessRegion;
    integrationMode: InvoiceIntegrationMode;
    documentType: ReceiptDocumentType;
    prefix: string;
    startNo: number;
    endNo: number;
    nextNo: number;
    active: boolean;
    label: string;
    createdAt: string;
    updatedAt: string;
    updatedBy: string;
};

function toInteger(value: unknown, fallback = 0): number {
    const amount = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(amount)) return fallback;
    return Math.max(0, Math.round(amount));
}

function normalizeMode(value: unknown): InvoiceIntegrationMode {
    if (value === "mof-test" || value === "mof-production" || value === "vac-test" || value === "vac-production") return value;
    return "mock";
}

function normalizeRegion(value: unknown): BusinessRegion {
    return value === "AU" ? "AU" : "TW";
}

function normalizeDocumentType(value: unknown): ReceiptDocumentType {
    if (value === "invoice" || value === "tax-invoice" || value === "electronic-invoice") return value;
    return "receipt";
}

export function invoiceTrackSettingsCollectionPath(companyId: string): string {
    return `companies/${sanitizeText(companyId, 120)}/invoiceTrackSettings`;
}

export function invoiceTrackSettingDocPath(companyId: string, trackId: string): string {
    return `${invoiceTrackSettingsCollectionPath(companyId)}/${sanitizeText(trackId, 120)}`;
}

export function normalizeInvoiceTrackSetting(
    input: Partial<InvoiceTrackSetting> & { id: string; companyId: string },
): InvoiceTrackSetting {
    const nowIso = new Date().toISOString();
    const createdAt = sanitizeIso(input.createdAt, nowIso);
    const startNo = toInteger(input.startNo);
    const endNo = Math.max(startNo, toInteger(input.endNo, startNo));
    const nextNo = Math.min(endNo, Math.max(startNo, toInteger(input.nextNo, startNo)));

    return {
        id: sanitizeText(input.id, 120),
        companyId: sanitizeText(input.companyId, 120),
        region: normalizeRegion(input.region),
        integrationMode: normalizeMode(input.integrationMode),
        documentType: normalizeDocumentType(input.documentType),
        prefix: sanitizeText(input.prefix, 16).toUpperCase(),
        startNo,
        endNo,
        nextNo,
        active: sanitizeBoolean(input.active, true),
        label: sanitizeText(input.label, 240),
        createdAt,
        updatedAt: sanitizeIso(input.updatedAt, createdAt),
        updatedBy: sanitizeText(input.updatedBy, 120) || "system",
    };
}
