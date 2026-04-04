import "server-only";
import { updateBusinessProfile } from "@/lib/services/business-profile.service";
import { updateRegionalReceiptSettings } from "@/lib/services/regional-receipt-settings.service";
import type { BusinessRegion, DocumentMode, InvoiceTitleMode } from "@/lib/schema/regional-receipt-settings.schema";

function readText(formData: FormData, key: string): string {
    const values = formData.getAll(key);
    if (values.length === 0) return "";
    return String(values[values.length - 1] ?? "");
}

function readBoolean(formData: FormData, key: string): boolean {
    return formData
        .getAll(key)
        .some((value) => value === "on" || value === "true" || value === "1");
}

export async function updateBusinessProfileFromFormData(formData: FormData) {
    return updateBusinessProfile({
        companyName: readText(formData, "companyName"),
        displayName: readText(formData, "displayName"),
        contactName: readText(formData, "contactName"),
        phone: readText(formData, "phone"),
        email: readText(formData, "email"),
        website: readText(formData, "website"),
        address: readText(formData, "address"),
        country: readText(formData, "country"),
        region: readText(formData, "region"),
        postcode: readText(formData, "postcode"),
    });
}

export async function updateRegionalReceiptSettingsFromFormData(formData: FormData) {
    return updateRegionalReceiptSettings({
        businessRegion: readText(formData, "businessRegion") as BusinessRegion,
        locale: readText(formData, "locale"),
        currency: readText(formData, "currency"),
        timezone: readText(formData, "timezone"),
        documentMode: readText(formData, "documentMode") as DocumentMode,
        tw: {
            taxId: readText(formData, "tw.taxId"),
            electronicInvoiceEnabled: readBoolean(formData, "tw.electronicInvoiceEnabled"),
            carrierEnabled: readBoolean(formData, "tw.carrierEnabled"),
            mobileBarcodeEnabled: readBoolean(formData, "tw.mobileBarcodeEnabled"),
            memberCarrierEnabled: readBoolean(formData, "tw.memberCarrierEnabled"),
            donationCodeEnabled: readBoolean(formData, "tw.donationCodeEnabled"),
            invoiceNote: readText(formData, "tw.invoiceNote"),
            receiptNote: readText(formData, "tw.receiptNote"),
        },
        au: {
            abn: readText(formData, "au.abn"),
            businessRegistrationNumber: readText(formData, "au.businessRegistrationNumber"),
            gstRegistered: readBoolean(formData, "au.gstRegistered"),
            showAbnOnReceipt: readBoolean(formData, "au.showAbnOnReceipt"),
            showGstBreakdown: readBoolean(formData, "au.showGstBreakdown"),
            invoiceTitleMode: readText(formData, "au.invoiceTitleMode") as InvoiceTitleMode,
            invoiceNote: readText(formData, "au.invoiceNote"),
            receiptNote: readText(formData, "au.receiptNote"),
        },
    });
}
