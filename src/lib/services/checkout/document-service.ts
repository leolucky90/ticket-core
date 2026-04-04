import type { BusinessProfile } from "@/lib/schema/business-profile.schema";
import {
    createDefaultCheckoutDocument,
    normalizeCheckoutDocument,
    type CheckoutDocument,
    type CheckoutDocumentMode,
} from "@/lib/schema/checkout-document.schema";
import type { RegionalReceiptSettings } from "@/lib/schema/regional-receipt-settings.schema";
import type { PaymentMethod, PaymentStatus } from "@/lib/types/sale";

export type CheckoutReceiptPreviewLine = {
    label: string;
    value: string;
};

export type CheckoutReceiptPreviewModel = {
    businessRegion: RegionalReceiptSettings["businessRegion"];
    documentMode: CheckoutDocumentMode;
    documentTitle: string;
    headlineValue: string;
    lines: CheckoutReceiptPreviewLine[];
    badges: string[];
    note?: string;
};

function formatAmount(value: number, locale: string, currency: string): string {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(Math.max(0, value));
}

function documentTitleForPreview(input: { region: RegionalReceiptSettings["businessRegion"]; mode: CheckoutDocumentMode }): string {
    if (input.region === "TW") {
        return input.mode === "electronic-invoice" ? "電子發票" : "收據";
    }
    if (input.mode === "tax-invoice") return "Tax Invoice";
    if (input.mode === "invoice") return "Invoice";
    return "Receipt";
}

function isTraditionalChinese(locale: string): boolean {
    return locale.toLowerCase().startsWith("zh");
}

function paymentMethodLabel(method: PaymentMethod): string {
    return method === "card" ? "Card" : "Cash";
}

function paymentStatusLabel(status: PaymentStatus): string {
    if (status === "unpaid") return "Unpaid";
    if (status === "deposit") return "Deposit";
    if (status === "installment") return "Installment";
    return "Paid";
}

function paymentMethodLabelForLocale(method: PaymentMethod, locale: string): string {
    if (isTraditionalChinese(locale)) {
        return method === "card" ? "刷卡" : "現金";
    }
    return paymentMethodLabel(method);
}

function paymentStatusLabelForLocale(status: PaymentStatus, locale: string): string {
    if (isTraditionalChinese(locale)) {
        if (status === "unpaid") return "未付";
        if (status === "deposit") return "訂金";
        if (status === "installment") return "分期";
        return "結清";
    }
    return paymentStatusLabel(status);
}

function twCarrierTypeLabel(type: CheckoutDocument["tw"]["carrierType"], locale: string): string {
    if (type === "mobile-barcode") return isTraditionalChinese(locale) ? "手機條碼" : "Mobile barcode";
    if (type === "member-carrier") return isTraditionalChinese(locale) ? "會員載具" : "Member carrier";
    return isTraditionalChinese(locale) ? "不使用載具" : "No carrier";
}

export function createCheckoutDocumentState(params: {
    settings: RegionalReceiptSettings;
    buyerName?: string;
}): CheckoutDocument {
    return createDefaultCheckoutDocument(params.settings, params.buyerName);
}

export function syncCheckoutDocumentWithCustomer(params: {
    document: CheckoutDocument;
    settings: RegionalReceiptSettings;
    buyerName: string;
}): CheckoutDocument {
    return normalizeCheckoutDocument(
        {
            ...params.document,
            au: {
                ...params.document.au,
                buyerName: params.buyerName,
            },
        },
        params.settings,
        params.buyerName,
    );
}

export function readCheckoutDocumentFromFormData(params: {
    formData: FormData;
    settings: RegionalReceiptSettings;
    buyerName?: string;
}): CheckoutDocument {
    const { formData, settings, buyerName } = params;
    return normalizeCheckoutDocument(
        {
            documentMode: (formData.get("checkoutDocument.documentMode") as CheckoutDocument["documentMode"] | null) ?? undefined,
            buyerType: (formData.get("checkoutDocument.buyerType") as CheckoutDocument["buyerType"] | null) ?? undefined,
            tw: {
                taxId: String(formData.get("checkoutDocument.tw.taxId") ?? ""),
                carrierType:
                    (formData.get("checkoutDocument.tw.carrierType") as CheckoutDocument["tw"]["carrierType"] | null) ?? "none",
                carrierCode: String(formData.get("checkoutDocument.tw.carrierCode") ?? ""),
                donationCode: String(formData.get("checkoutDocument.tw.donationCode") ?? ""),
                printMode: (formData.get("checkoutDocument.tw.printMode") as CheckoutDocument["tw"]["printMode"] | null) ?? "display",
            },
            au: {
                buyerName: String(formData.get("checkoutDocument.au.buyerName") ?? buyerName ?? ""),
                buyerAbn: String(formData.get("checkoutDocument.au.buyerAbn") ?? ""),
                showBusinessAbn: String(formData.get("checkoutDocument.au.showBusinessAbn") ?? "") === "true",
                note: String(formData.get("checkoutDocument.au.note") ?? ""),
            },
        },
        settings,
        buyerName,
    );
}

export function buildCheckoutReceiptPreview(input: {
    businessProfile: BusinessProfile | null;
    settings: RegionalReceiptSettings;
    document: CheckoutDocument;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    totalAmount: number;
    locale: string;
}): CheckoutReceiptPreviewModel {
    const { businessProfile, settings, document } = input;
    const zh = isTraditionalChinese(input.locale);
    const companyName = businessProfile?.companyName || "Company Name";
    const displayName = businessProfile?.displayName || companyName;
    const documentTitle = documentTitleForPreview({
        region: settings.businessRegion,
        mode: document.documentMode,
    });
    const amount = formatAmount(input.totalAmount, input.locale, settings.currency);
    const paymentMethod = paymentMethodLabelForLocale(input.paymentMethod, input.locale);
    const paymentStatus = paymentStatusLabelForLocale(input.paymentStatus, input.locale);

    if (settings.businessRegion === "TW") {
        const lines: CheckoutReceiptPreviewLine[] = [
            { label: zh ? "公司名稱" : "Company", value: companyName },
            {
                label: zh ? "買受人類型" : "Buyer type",
                value: document.buyerType === "business" ? (zh ? "公司戶" : "Business") : zh ? "個人" : "Personal",
            },
            document.buyerType === "business" ? { label: zh ? "買受人統編" : "Buyer tax ID", value: document.tw.taxId || "-" } : null,
            settings.tw.taxId ? { label: zh ? "店家統編" : "Seller tax ID", value: settings.tw.taxId } : null,
            document.tw.carrierType !== "none"
                ? {
                      label: zh ? "載具" : "Carrier",
                      value: `${twCarrierTypeLabel(document.tw.carrierType, input.locale)}${document.tw.carrierCode ? ` / ${document.tw.carrierCode}` : ""}`,
                  }
                : null,
            document.tw.donationCode ? { label: zh ? "捐贈碼" : "Donation code", value: document.tw.donationCode } : null,
            { label: zh ? "付款方式" : "Payment", value: paymentMethod },
            { label: zh ? "付款狀態" : "Status", value: paymentStatus },
            { label: zh ? "金額" : "Total", value: amount },
        ].filter((line): line is CheckoutReceiptPreviewLine => line !== null);

        return {
            businessRegion: settings.businessRegion,
            documentMode: document.documentMode,
            documentTitle,
            headlineValue: displayName,
            lines,
            badges: [documentTitle, document.tw.printMode === "print" ? (zh ? "列印" : "Print") : zh ? "畫面顯示" : "Display"],
        };
    }

    const lines: CheckoutReceiptPreviewLine[] = [
        { label: "Company", value: companyName },
        document.au.showBusinessAbn && settings.au.abn ? { label: "ABN", value: settings.au.abn } : null,
        { label: "Buyer type", value: document.buyerType === "business" ? "Business" : "Personal" },
        { label: "Buyer", value: document.au.buyerName || "-" },
        document.buyerType === "business" && document.au.buyerAbn ? { label: "Buyer ABN", value: document.au.buyerAbn } : null,
        settings.au.gstRegistered && settings.au.showGstBreakdown ? { label: "GST", value: "GST breakdown enabled" } : null,
        { label: "Payment", value: paymentMethod },
        { label: "Status", value: paymentStatus },
        { label: "Total", value: amount },
    ].filter((line): line is CheckoutReceiptPreviewLine => line !== null);

    return {
        businessRegion: settings.businessRegion,
        documentMode: document.documentMode,
        documentTitle,
        headlineValue: displayName,
        lines,
        badges: [documentTitle, settings.au.gstRegistered ? "GST" : "No GST"],
        note: document.au.note || undefined,
    };
}
