import type { BusinessProfile } from "@/lib/schema/business-profile.schema";
import type { AuReceiptSettings, DocumentMode, RegionalReceiptSettings, TwReceiptSettings } from "@/lib/schema/regional-receipt-settings.schema";

export type ReceiptTemplatePreviewModel = {
    businessRegion: RegionalReceiptSettings["businessRegion"];
    resolvedDocumentMode: DocumentMode;
    documentTitle: string;
    companyName: string;
    displayName: string;
    showTaxId: boolean;
    taxId: string;
    showCarrier: boolean;
    showDonationCode: boolean;
    invoiceNoPlaceholder: string;
    invoiceDatePlaceholder: string;
    showAbn: boolean;
    abn: string;
    showSubtotal: boolean;
    showGst: boolean;
    totalPlaceholder: string;
    subtotalPlaceholder: string;
    gstPlaceholder: string;
    invoiceNote: string;
    receiptNote: string;
};

function resolveTwDocumentMode(tw: TwReceiptSettings, mode: DocumentMode): DocumentMode {
    if (mode !== "auto") return mode;
    return tw.electronicInvoiceEnabled ? "electronic-invoice" : "receipt";
}

function resolveAuDocumentMode(au: AuReceiptSettings, mode: DocumentMode): DocumentMode {
    if (mode !== "auto") return mode;
    if (au.invoiceTitleMode === "tax-invoice" || (au.gstRegistered && au.showGstBreakdown)) return "tax-invoice";
    return "invoice";
}

function resolveDocumentTitle(settings: RegionalReceiptSettings, resolvedDocumentMode: DocumentMode): string {
    if (settings.businessRegion === "TW") {
        if (resolvedDocumentMode === "electronic-invoice") return "Electronic Invoice";
        if (resolvedDocumentMode === "invoice") return "Invoice";
        return "Receipt";
    }

    if (resolvedDocumentMode === "tax-invoice") return "Tax Invoice";
    if (resolvedDocumentMode === "receipt") return "Receipt";
    return "Invoice";
}

export function resolveReceiptTemplatePreviewModel(input: {
    businessProfile: BusinessProfile | null;
    regionalReceiptSettings: RegionalReceiptSettings;
}): ReceiptTemplatePreviewModel {
    const { businessProfile, regionalReceiptSettings } = input;
    const resolvedDocumentMode =
        regionalReceiptSettings.businessRegion === "AU"
            ? resolveAuDocumentMode(regionalReceiptSettings.au, regionalReceiptSettings.documentMode)
            : resolveTwDocumentMode(regionalReceiptSettings.tw, regionalReceiptSettings.documentMode);

    return {
        businessRegion: regionalReceiptSettings.businessRegion,
        resolvedDocumentMode,
        documentTitle: resolveDocumentTitle(regionalReceiptSettings, resolvedDocumentMode),
        companyName: businessProfile?.companyName || "Company Name",
        displayName: businessProfile?.displayName || businessProfile?.companyName || "Display Name",
        showTaxId: regionalReceiptSettings.businessRegion === "TW" && regionalReceiptSettings.tw.taxId.length > 0,
        taxId: regionalReceiptSettings.tw.taxId,
        showCarrier: regionalReceiptSettings.businessRegion === "TW" && regionalReceiptSettings.tw.carrierEnabled,
        showDonationCode: regionalReceiptSettings.businessRegion === "TW" && regionalReceiptSettings.tw.donationCodeEnabled,
        invoiceNoPlaceholder: "INV-2026-0001",
        invoiceDatePlaceholder: "2026-04-04",
        showAbn:
            regionalReceiptSettings.businessRegion === "AU" &&
            regionalReceiptSettings.au.showAbnOnReceipt &&
            regionalReceiptSettings.au.abn.length > 0,
        abn: regionalReceiptSettings.au.abn,
        showSubtotal: regionalReceiptSettings.businessRegion === "AU",
        showGst:
            regionalReceiptSettings.businessRegion === "AU" &&
            regionalReceiptSettings.au.gstRegistered &&
            regionalReceiptSettings.au.showGstBreakdown,
        totalPlaceholder: regionalReceiptSettings.businessRegion === "AU" ? "AUD 110.00" : "TWD 1,680",
        subtotalPlaceholder: "AUD 100.00",
        gstPlaceholder: "AUD 10.00",
        invoiceNote:
            regionalReceiptSettings.businessRegion === "AU"
                ? regionalReceiptSettings.au.invoiceNote
                : regionalReceiptSettings.tw.invoiceNote,
        receiptNote:
            regionalReceiptSettings.businessRegion === "AU"
                ? regionalReceiptSettings.au.receiptNote
                : regionalReceiptSettings.tw.receiptNote,
    };
}
