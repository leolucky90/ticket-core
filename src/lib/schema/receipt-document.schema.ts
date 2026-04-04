import { sanitizeIso, sanitizeText } from "@/lib/schema/company-settings.shared";
import { normalizeInvoiceItem, type InvoiceItem } from "@/lib/schema/invoice-item.schema";
import type { BusinessRegion } from "@/lib/schema/regional-receipt-settings.schema";
import type { InvoiceCarrierType } from "@/lib/schema/invoice-carrier.schema";

export const INVOICE_INTEGRATION_MODES = ["mock", "mof-test", "mof-production", "vac-test", "vac-production"] as const;
export type InvoiceIntegrationMode = (typeof INVOICE_INTEGRATION_MODES)[number];

export const INVOICE_STATUSES = ["draft", "issue_pending", "issued", "issue_failed", "void_pending", "voided", "reissued"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_VOID_STATUSES = ["pending", "succeeded", "failed"] as const;
export type InvoiceVoidStatus = (typeof INVOICE_VOID_STATUSES)[number];

export const INVOICE_BUYER_TYPES = ["personal", "business"] as const;
export type InvoiceBuyerType = (typeof INVOICE_BUYER_TYPES)[number];

export const RECEIPT_DOCUMENT_TYPES = ["receipt", "invoice", "tax-invoice", "electronic-invoice"] as const;
export type ReceiptDocumentType = (typeof RECEIPT_DOCUMENT_TYPES)[number];

export const INVOICE_PLATFORM_STATUSES = ["not_sent", "pending", "succeeded", "failed", "stubbed"] as const;
export type InvoicePlatformStatus = (typeof INVOICE_PLATFORM_STATUSES)[number];

export type ReceiptDocumentRecord = {
    id: string;
    companyId: string;
    branchId: string;
    region: BusinessRegion;
    integrationMode: InvoiceIntegrationMode;
    documentType: ReceiptDocumentType;
    orderId: string;
    checkoutId: string;
    draftId: string;
    documentNo: string;
    trackPrefix: string;
    issuedAt: string;
    buyerType: InvoiceBuyerType;
    buyerName: string;
    buyerTaxId: string;
    buyerAbn: string;
    carrierType: InvoiceCarrierType;
    carrierCode: string;
    donationCode: string;
    currency: string;
    items: InvoiceItem[];
    amount: number;
    taxAmount: number;
    totalAmount: number;
    status: InvoiceStatus;
    voidedAt: string;
    voidReason: string;
    voidRequestId: string;
    reissueFromDocumentId: string;
    reissueToDocumentId: string;
    platformRequestPayload: unknown;
    platformResponsePayload: unknown;
    platformStatus: InvoicePlatformStatus;
    createdAt: string;
    updatedAt: string;
};

function toMoney(value: unknown): number {
    const amount = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(amount)) return 0;
    return Math.round(Math.max(0, amount) * 100) / 100;
}

function normalizeMode(value: unknown): InvoiceIntegrationMode {
    return INVOICE_INTEGRATION_MODES.find((item) => item === value) ?? "mock";
}

function normalizeStatus(value: unknown): InvoiceStatus {
    return INVOICE_STATUSES.find((item) => item === value) ?? "draft";
}

function normalizeBuyerType(value: unknown): InvoiceBuyerType {
    return value === "business" ? "business" : "personal";
}

function normalizeDocumentType(value: unknown): ReceiptDocumentType {
    return RECEIPT_DOCUMENT_TYPES.find((item) => item === value) ?? "receipt";
}

function normalizePlatformStatus(value: unknown): InvoicePlatformStatus {
    return INVOICE_PLATFORM_STATUSES.find((item) => item === value) ?? "not_sent";
}

function normalizeCarrierType(value: unknown): InvoiceCarrierType {
    if (value === "mobile-barcode") return "mobile-barcode";
    if (value === "member-carrier") return "member-carrier";
    if (value === "citizen-digital-certificate") return "citizen-digital-certificate";
    return "none";
}

function normalizeRegion(value: unknown): BusinessRegion {
    return value === "AU" ? "AU" : "TW";
}

export function receiptDocumentsCollectionPath(companyId: string): string {
    return `companies/${sanitizeText(companyId, 120)}/receiptDocuments`;
}

export function receiptDocumentDocPath(companyId: string, documentId: string): string {
    return `${receiptDocumentsCollectionPath(companyId)}/${sanitizeText(documentId, 120)}`;
}

export function normalizeReceiptDocumentRecord(
    input: Partial<ReceiptDocumentRecord> & { id: string; companyId: string },
): ReceiptDocumentRecord {
    const nowIso = new Date().toISOString();
    const createdAt = sanitizeIso(input.createdAt, nowIso);
    const issuedAt = sanitizeIso(input.issuedAt, createdAt);
    const items = Array.isArray(input.items)
        ? input.items
              .map((item, index) => normalizeInvoiceItem({ ...(item ?? {}), id: item?.id ?? `item_${index + 1}` }))
              .slice(0, 200)
        : [];

    return {
        id: sanitizeText(input.id, 120),
        companyId: sanitizeText(input.companyId, 120),
        branchId: sanitizeText(input.branchId, 120),
        region: normalizeRegion(input.region),
        integrationMode: normalizeMode(input.integrationMode),
        documentType: normalizeDocumentType(input.documentType),
        orderId: sanitizeText(input.orderId, 120),
        checkoutId: sanitizeText(input.checkoutId, 120),
        draftId: sanitizeText(input.draftId, 120),
        documentNo: sanitizeText(input.documentNo, 120),
        trackPrefix: sanitizeText(input.trackPrefix, 32),
        issuedAt,
        buyerType: normalizeBuyerType(input.buyerType),
        buyerName: sanitizeText(input.buyerName, 240),
        buyerTaxId: sanitizeText(input.buyerTaxId, 80),
        buyerAbn: sanitizeText(input.buyerAbn, 80),
        carrierType: normalizeCarrierType(input.carrierType),
        carrierCode: sanitizeText(input.carrierCode, 160),
        donationCode: sanitizeText(input.donationCode, 40),
        currency: sanitizeText(input.currency, 16) || (normalizeRegion(input.region) === "AU" ? "AUD" : "TWD"),
        items,
        amount: toMoney(input.amount),
        taxAmount: toMoney(input.taxAmount),
        totalAmount: toMoney(input.totalAmount || toMoney(input.amount) + toMoney(input.taxAmount)),
        status: normalizeStatus(input.status),
        voidedAt: sanitizeIso(input.voidedAt, ""),
        voidReason: sanitizeText(input.voidReason, 500),
        voidRequestId: sanitizeText(input.voidRequestId, 160),
        reissueFromDocumentId: sanitizeText(input.reissueFromDocumentId, 120),
        reissueToDocumentId: sanitizeText(input.reissueToDocumentId, 120),
        platformRequestPayload: input.platformRequestPayload ?? null,
        platformResponsePayload: input.platformResponsePayload ?? null,
        platformStatus: normalizePlatformStatus(input.platformStatus),
        createdAt,
        updatedAt: sanitizeIso(input.updatedAt, createdAt),
    };
}
