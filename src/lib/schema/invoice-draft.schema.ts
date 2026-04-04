import { sanitizeIso, sanitizeText } from "@/lib/schema/company-settings.shared";
import type { InvoiceCarrierType } from "@/lib/schema/invoice-carrier.schema";
import { normalizeInvoiceItem, type InvoiceItem } from "@/lib/schema/invoice-item.schema";
import type { InvoiceBuyerType, InvoiceIntegrationMode, ReceiptDocumentType } from "@/lib/schema/receipt-document.schema";
import type { BusinessRegion } from "@/lib/schema/regional-receipt-settings.schema";

export const INVOICE_DRAFT_STATUSES = ["draft", "issue_requested", "issued", "issue_failed", "voided"] as const;
export type InvoiceDraftStatus = (typeof INVOICE_DRAFT_STATUSES)[number];

export type InvoiceDraftRecord = {
    id: string;
    companyId: string;
    branchId: string;
    checkoutId: string;
    orderId: string;
    region: BusinessRegion;
    integrationMode: InvoiceIntegrationMode;
    documentType: ReceiptDocumentType;
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
    status: InvoiceDraftStatus;
    sourceDocumentId: string;
    createdAt: string;
    updatedAt: string;
    updatedBy: string;
};

function toMoney(value: unknown): number {
    const amount = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(amount)) return 0;
    return Math.round(Math.max(0, amount) * 100) / 100;
}

function normalizeStatus(value: unknown): InvoiceDraftStatus {
    return INVOICE_DRAFT_STATUSES.find((item) => item === value) ?? "draft";
}

function normalizeRegion(value: unknown): BusinessRegion {
    return value === "AU" ? "AU" : "TW";
}

function normalizeCarrierType(value: unknown): InvoiceCarrierType {
    if (value === "mobile-barcode") return "mobile-barcode";
    if (value === "member-carrier") return "member-carrier";
    if (value === "citizen-digital-certificate") return "citizen-digital-certificate";
    return "none";
}

function normalizeBuyerType(value: unknown): InvoiceBuyerType {
    return value === "business" ? "business" : "personal";
}

function normalizeDocumentType(value: unknown): ReceiptDocumentType {
    if (value === "invoice" || value === "tax-invoice" || value === "electronic-invoice") return value;
    return "receipt";
}

function normalizeMode(value: unknown): InvoiceIntegrationMode {
    if (value === "mof-test" || value === "mof-production" || value === "vac-test" || value === "vac-production") return value;
    return "mock";
}

export function invoiceDraftsCollectionPath(companyId: string): string {
    return `companies/${sanitizeText(companyId, 120)}/invoiceDrafts`;
}

export function invoiceDraftDocPath(companyId: string, draftId: string): string {
    return `${invoiceDraftsCollectionPath(companyId)}/${sanitizeText(draftId, 120)}`;
}

export function normalizeInvoiceDraftRecord(
    input: Partial<InvoiceDraftRecord> & { id: string; companyId: string },
): InvoiceDraftRecord {
    const nowIso = new Date().toISOString();
    const createdAt = sanitizeIso(input.createdAt, nowIso);
    const items = Array.isArray(input.items)
        ? input.items
              .map((item, index) => normalizeInvoiceItem({ ...(item ?? {}), id: item?.id ?? `draft_item_${index + 1}` }))
              .slice(0, 200)
        : [];

    return {
        id: sanitizeText(input.id, 120),
        companyId: sanitizeText(input.companyId, 120),
        branchId: sanitizeText(input.branchId, 120),
        checkoutId: sanitizeText(input.checkoutId, 120),
        orderId: sanitizeText(input.orderId, 120),
        region: normalizeRegion(input.region),
        integrationMode: normalizeMode(input.integrationMode),
        documentType: normalizeDocumentType(input.documentType),
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
        sourceDocumentId: sanitizeText(input.sourceDocumentId, 120),
        createdAt,
        updatedAt: sanitizeIso(input.updatedAt, createdAt),
        updatedBy: sanitizeText(input.updatedBy, 120) || "system",
    };
}
