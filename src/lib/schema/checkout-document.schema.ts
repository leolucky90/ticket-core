import type { BusinessRegion, DocumentMode, RegionalReceiptSettings } from "@/lib/schema/regional-receipt-settings.schema";
import { sanitizeBoolean, sanitizeText } from "@/lib/schema/company-settings.shared";

export const CHECKOUT_DOCUMENT_MODES = ["receipt", "invoice", "tax-invoice", "electronic-invoice"] as const;
export type CheckoutDocumentMode = (typeof CHECKOUT_DOCUMENT_MODES)[number];

export const CHECKOUT_BUYER_TYPES = ["personal", "business"] as const;
export type CheckoutBuyerType = (typeof CHECKOUT_BUYER_TYPES)[number];

export const CHECKOUT_CARRIER_TYPES = ["none", "mobile-barcode", "member-carrier"] as const;
export type CheckoutCarrierType = (typeof CHECKOUT_CARRIER_TYPES)[number];

export const CHECKOUT_PRINT_MODES = ["print", "display"] as const;
export type CheckoutPrintMode = (typeof CHECKOUT_PRINT_MODES)[number];

export type CheckoutDocumentTwFields = {
    taxId: string;
    carrierType: CheckoutCarrierType;
    carrierCode: string;
    donationCode: string;
    printMode: CheckoutPrintMode;
};

export type CheckoutDocumentAuFields = {
    buyerName: string;
    buyerAbn: string;
    showBusinessAbn: boolean;
    note: string;
};

export type CheckoutDocument = {
    businessRegion: BusinessRegion;
    documentMode: CheckoutDocumentMode;
    buyerType: CheckoutBuyerType;
    tw: CheckoutDocumentTwFields;
    au: CheckoutDocumentAuFields;
};

function normalizeCheckoutDocumentMode(value: unknown, fallback: CheckoutDocumentMode): CheckoutDocumentMode {
    if (value === "receipt" || value === "invoice" || value === "tax-invoice" || value === "electronic-invoice") {
        return value;
    }
    return fallback;
}

function normalizeCheckoutBuyerType(value: unknown): CheckoutBuyerType {
    return value === "business" ? "business" : "personal";
}

function normalizeCheckoutCarrierType(value: unknown): CheckoutCarrierType {
    if (value === "mobile-barcode" || value === "member-carrier") return value;
    return "none";
}

function normalizeCheckoutPrintMode(value: unknown): CheckoutPrintMode {
    return value === "print" ? "print" : "display";
}

export function resolveCheckoutDocumentModeFromRegionalSettings(settings: RegionalReceiptSettings): CheckoutDocumentMode {
    const requested = settings.documentMode;
    if (settings.businessRegion === "TW") {
        if (requested === "electronic-invoice") return "electronic-invoice";
        if (requested === "invoice") return "receipt";
        if (requested === "tax-invoice") return "receipt";
        if (requested === "receipt") return "receipt";
        return settings.tw.electronicInvoiceEnabled ? "electronic-invoice" : "receipt";
    }

    if (requested === "tax-invoice" || requested === "invoice" || requested === "receipt") return requested;
    return settings.au.gstRegistered && settings.au.showGstBreakdown ? "tax-invoice" : "invoice";
}

export function allowedCheckoutDocumentModesForRegion(region: BusinessRegion): CheckoutDocumentMode[] {
    return region === "AU" ? ["receipt", "invoice", "tax-invoice"] : ["receipt", "electronic-invoice"];
}

export function createDefaultCheckoutDocument(settings: RegionalReceiptSettings, buyerName = ""): CheckoutDocument {
    return {
        businessRegion: settings.businessRegion,
        documentMode: resolveCheckoutDocumentModeFromRegionalSettings(settings),
        buyerType: "personal",
        tw: {
            taxId: "",
            carrierType: "none",
            carrierCode: "",
            donationCode: "",
            printMode: "display",
        },
        au: {
            buyerName: sanitizeText(buyerName, 160),
            buyerAbn: "",
            showBusinessAbn: settings.au.showAbnOnReceipt,
            note: "",
        },
    };
}

export function normalizeCheckoutDocument(
    input: Partial<CheckoutDocument> | null | undefined,
    settings: RegionalReceiptSettings,
    buyerName = "",
): CheckoutDocument {
    const defaults = createDefaultCheckoutDocument(settings, buyerName);
    const fallbackMode = resolveCheckoutDocumentModeFromRegionalSettings(settings);
    const nextMode = normalizeCheckoutDocumentMode(input?.documentMode, fallbackMode);
    const allowedModes = allowedCheckoutDocumentModesForRegion(settings.businessRegion);

    return {
        businessRegion: settings.businessRegion,
        documentMode: allowedModes.includes(nextMode) ? nextMode : fallbackMode,
        buyerType: normalizeCheckoutBuyerType(input?.buyerType ?? defaults.buyerType),
        tw: {
            taxId: sanitizeText(input?.tw?.taxId, 80),
            carrierType: normalizeCheckoutCarrierType(input?.tw?.carrierType ?? defaults.tw.carrierType),
            carrierCode: sanitizeText(input?.tw?.carrierCode, 120),
            donationCode: sanitizeText(input?.tw?.donationCode, 40),
            printMode: normalizeCheckoutPrintMode(input?.tw?.printMode ?? defaults.tw.printMode),
        },
        au: {
            buyerName: sanitizeText(input?.au?.buyerName, 160) || defaults.au.buyerName,
            buyerAbn: sanitizeText(input?.au?.buyerAbn, 80),
            showBusinessAbn: sanitizeBoolean(input?.au?.showBusinessAbn, defaults.au.showBusinessAbn),
            note: sanitizeText(input?.au?.note, 1000),
        },
    };
}

export function checkoutDocumentModeFromRegionalMode(mode: DocumentMode, settings: RegionalReceiptSettings): CheckoutDocumentMode {
    if (mode === "receipt" || mode === "invoice" || mode === "tax-invoice" || mode === "electronic-invoice") return mode;
    return resolveCheckoutDocumentModeFromRegionalSettings(settings);
}
