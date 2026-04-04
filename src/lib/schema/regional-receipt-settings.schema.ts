import { sanitizeBoolean, sanitizeIso, sanitizeText } from "@/lib/schema/company-settings.shared";

export const BUSINESS_REGIONS = ["TW", "AU"] as const;
export type BusinessRegion = (typeof BUSINESS_REGIONS)[number];

export const DOCUMENT_MODES = ["auto", "receipt", "invoice", "tax-invoice", "electronic-invoice"] as const;
export type DocumentMode = (typeof DOCUMENT_MODES)[number];

export const INVOICE_TITLE_MODES = ["auto", "invoice", "tax-invoice"] as const;
export type InvoiceTitleMode = (typeof INVOICE_TITLE_MODES)[number];

export type TwReceiptSettings = {
    taxId: string;
    electronicInvoiceEnabled: boolean;
    carrierEnabled: boolean;
    mobileBarcodeEnabled: boolean;
    memberCarrierEnabled: boolean;
    donationCodeEnabled: boolean;
    invoiceNote: string;
    receiptNote: string;
};

export type AuReceiptSettings = {
    abn: string;
    businessRegistrationNumber: string;
    gstRegistered: boolean;
    showAbnOnReceipt: boolean;
    showGstBreakdown: boolean;
    invoiceTitleMode: InvoiceTitleMode;
    invoiceNote: string;
    receiptNote: string;
};

export type RegionalReceiptSettings = {
    companyId: string;
    businessRegion: BusinessRegion;
    locale: string;
    currency: string;
    timezone: string;
    documentMode: DocumentMode;
    tw: TwReceiptSettings;
    au: AuReceiptSettings;
    createdAt: string;
    updatedAt: string;
    updatedBy: string;
};

export function regionalReceiptSettingsDocPath(companyId: string): string {
    return `companies/${sanitizeText(companyId, 120)}/settings/regionalReceiptSettings`;
}

export function getRegionalReceiptDefaults(region: BusinessRegion): Pick<RegionalReceiptSettings, "businessRegion" | "locale" | "currency" | "timezone" | "documentMode"> {
    if (region === "AU") {
        return {
            businessRegion: "AU",
            locale: "en-AU",
            currency: "AUD",
            timezone: "Australia/Sydney",
            documentMode: "invoice",
        };
    }

    return {
        businessRegion: "TW",
        locale: "zh-TW",
        currency: "TWD",
        timezone: "Asia/Taipei",
        documentMode: "electronic-invoice",
    };
}

function normalizeBusinessRegion(value: unknown): BusinessRegion {
    return value === "AU" ? "AU" : "TW";
}

function normalizeDocumentMode(value: unknown, fallback: DocumentMode): DocumentMode {
    if (typeof value !== "string") return fallback;
    return DOCUMENT_MODES.find((item) => item === value) ?? fallback;
}

function normalizeInvoiceTitleMode(value: unknown): InvoiceTitleMode {
    if (typeof value !== "string") return "auto";
    return INVOICE_TITLE_MODES.find((item) => item === value) ?? "auto";
}

function normalizeTwReceiptSettings(input: Partial<TwReceiptSettings> | null | undefined): TwReceiptSettings {
    return {
        taxId: sanitizeText(input?.taxId, 80),
        electronicInvoiceEnabled: sanitizeBoolean(input?.electronicInvoiceEnabled, true),
        carrierEnabled: sanitizeBoolean(input?.carrierEnabled, false),
        mobileBarcodeEnabled: sanitizeBoolean(input?.mobileBarcodeEnabled, false),
        memberCarrierEnabled: sanitizeBoolean(input?.memberCarrierEnabled, false),
        donationCodeEnabled: sanitizeBoolean(input?.donationCodeEnabled, false),
        invoiceNote: sanitizeText(input?.invoiceNote, 2000),
        receiptNote: sanitizeText(input?.receiptNote, 2000),
    };
}

function normalizeAuReceiptSettings(input: Partial<AuReceiptSettings> | null | undefined): AuReceiptSettings {
    return {
        abn: sanitizeText(input?.abn, 80),
        businessRegistrationNumber: sanitizeText(input?.businessRegistrationNumber, 80),
        gstRegistered: sanitizeBoolean(input?.gstRegistered, false),
        showAbnOnReceipt: sanitizeBoolean(input?.showAbnOnReceipt, true),
        showGstBreakdown: sanitizeBoolean(input?.showGstBreakdown, true),
        invoiceTitleMode: normalizeInvoiceTitleMode(input?.invoiceTitleMode),
        invoiceNote: sanitizeText(input?.invoiceNote, 2000),
        receiptNote: sanitizeText(input?.receiptNote, 2000),
    };
}

export function normalizeRegionalReceiptSettings(input: Partial<RegionalReceiptSettings> & { companyId: string }): RegionalReceiptSettings {
    const nowIso = new Date().toISOString();
    const createdAt = sanitizeIso(input.createdAt, nowIso);
    const businessRegion = normalizeBusinessRegion(input.businessRegion);
    const defaults = getRegionalReceiptDefaults(businessRegion);

    return {
        companyId: sanitizeText(input.companyId, 120),
        businessRegion,
        locale: sanitizeText(input.locale, 80) || defaults.locale,
        currency: sanitizeText(input.currency, 40) || defaults.currency,
        timezone: sanitizeText(input.timezone, 120) || defaults.timezone,
        documentMode: normalizeDocumentMode(input.documentMode, defaults.documentMode),
        tw: normalizeTwReceiptSettings(input.tw),
        au: normalizeAuReceiptSettings(input.au),
        createdAt,
        updatedAt: sanitizeIso(input.updatedAt, createdAt),
        updatedBy: sanitizeText(input.updatedBy, 120) || "system",
    };
}

export function createEmptyRegionalReceiptSettings(companyId: string, updatedBy: string, region: BusinessRegion = "TW"): RegionalReceiptSettings {
    const nowIso = new Date().toISOString();
    return normalizeRegionalReceiptSettings({
        companyId,
        ...getRegionalReceiptDefaults(region),
        tw: {
            taxId: "",
            electronicInvoiceEnabled: true,
            carrierEnabled: false,
            mobileBarcodeEnabled: false,
            memberCarrierEnabled: false,
            donationCodeEnabled: false,
            invoiceNote: "",
            receiptNote: "",
        },
        au: {
            abn: "",
            businessRegistrationNumber: "",
            gstRegistered: false,
            showAbnOnReceipt: true,
            showGstBreakdown: true,
            invoiceTitleMode: "auto",
            invoiceNote: "",
            receiptNote: "",
        },
        createdAt: nowIso,
        updatedAt: nowIso,
        updatedBy,
    });
}

export function isRegionalReceiptSettings(value: unknown): value is RegionalReceiptSettings {
    if (!value || typeof value !== "object") return false;
    const row = value as Record<string, unknown>;
    return Boolean(sanitizeText(row.companyId, 120));
}
