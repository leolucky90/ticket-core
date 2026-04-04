import { sanitizeBoolean, sanitizeIso, sanitizeText } from "@/lib/schema/company-settings.shared";

export const INVOICE_CARRIER_TYPES = ["none", "mobile-barcode", "member-carrier", "citizen-digital-certificate"] as const;
export type InvoiceCarrierType = (typeof INVOICE_CARRIER_TYPES)[number];

export type InvoiceCarrierRecord = {
    id: string;
    companyId: string;
    customerId: string;
    type: InvoiceCarrierType;
    code: string;
    label: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
    updatedBy: string;
};

function normalizeCarrierType(value: unknown): InvoiceCarrierType {
    return INVOICE_CARRIER_TYPES.find((item) => item === value) ?? "none";
}

export function invoiceCarriersCollectionPath(companyId: string): string {
    return `companies/${sanitizeText(companyId, 120)}/invoiceCarriers`;
}

export function invoiceCarrierDocPath(companyId: string, carrierId: string): string {
    return `${invoiceCarriersCollectionPath(companyId)}/${sanitizeText(carrierId, 120)}`;
}

export function normalizeInvoiceCarrierRecord(
    input: Partial<InvoiceCarrierRecord> & { id: string; companyId: string },
): InvoiceCarrierRecord {
    const nowIso = new Date().toISOString();
    const createdAt = sanitizeIso(input.createdAt, nowIso);

    return {
        id: sanitizeText(input.id, 120),
        companyId: sanitizeText(input.companyId, 120),
        customerId: sanitizeText(input.customerId, 120),
        type: normalizeCarrierType(input.type),
        code: sanitizeText(input.code, 160),
        label: sanitizeText(input.label, 240),
        isDefault: sanitizeBoolean(input.isDefault, false),
        createdAt,
        updatedAt: sanitizeIso(input.updatedAt, createdAt),
        updatedBy: sanitizeText(input.updatedBy, 120) || "system",
    };
}
