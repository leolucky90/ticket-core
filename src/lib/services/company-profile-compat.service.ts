import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { createEmptyBusinessProfile, normalizeBusinessProfile, type BusinessProfile } from "@/lib/schema/business-profile.schema";
import {
    createEmptyRegionalReceiptSettings,
    normalizeRegionalReceiptSettings,
    type BusinessRegion,
    type DocumentMode,
    type InvoiceTitleMode,
    type RegionalReceiptSettings,
} from "@/lib/schema/regional-receipt-settings.schema";

function toText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function toBoolean(value: unknown): boolean | undefined {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes") return true;
        if (normalized === "false" || normalized === "0" || normalized === "off" || normalized === "no") return false;
    }
    return undefined;
}

function toDocumentMode(value: unknown): DocumentMode | undefined {
    if (
        value === "auto" ||
        value === "receipt" ||
        value === "invoice" ||
        value === "tax-invoice" ||
        value === "electronic-invoice"
    ) {
        return value;
    }
    return undefined;
}

function toInvoiceTitleMode(value: unknown): InvoiceTitleMode | undefined {
    if (value === "auto" || value === "invoice" || value === "tax-invoice") {
        return value;
    }
    return undefined;
}

export function legacyCompanyProfileDocPath(companyId: string): string {
    return `companies/${companyId}/settings/companyProfile`;
}

export function inferLegacyBusinessRegion(input: Record<string, unknown> | null | undefined): BusinessRegion {
    if (!input) return "TW";
    const country = toText(input.country).toLowerCase();
    if (toText(input.abn) || toText(input.businessRegistrationNumber)) return "AU";
    if (country === "au" || country.includes("australia")) return "AU";
    return "TW";
}

export async function readLegacyCompanyProfileRecord(db: Firestore | null, companyId: string): Promise<Record<string, unknown> | null> {
    if (!db) return null;
    const snap = await db.doc(legacyCompanyProfileDocPath(companyId)).get();
    if (!snap.exists) return null;
    const raw = snap.data();
    return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
}

export function buildBusinessProfileFromLegacy(params: {
    companyId: string;
    updatedBy: string;
    legacy: Record<string, unknown> | null;
}): BusinessProfile {
    const { companyId, updatedBy, legacy } = params;
    if (!legacy) return createEmptyBusinessProfile(companyId, updatedBy);
    return normalizeBusinessProfile({
        companyId,
        companyName: toText(legacy.companyName),
        displayName: toText(legacy.displayName),
        contactName: toText(legacy.contactName),
        phone: toText(legacy.phone),
        email: toText(legacy.email),
        website: toText(legacy.website),
        address: toText(legacy.address),
        country: toText(legacy.country),
        region: toText(legacy.region),
        postcode: toText(legacy.postcode),
        createdAt: toText(legacy.createdAt),
        updatedAt: toText(legacy.updatedAt),
        updatedBy: toText(legacy.updatedBy) || updatedBy,
    });
}

export function buildRegionalReceiptSettingsFromLegacy(params: {
    companyId: string;
    updatedBy: string;
    legacy: Record<string, unknown> | null;
}): RegionalReceiptSettings {
    const { companyId, updatedBy, legacy } = params;
    if (!legacy) return createEmptyRegionalReceiptSettings(companyId, updatedBy);
    const businessRegion = inferLegacyBusinessRegion(legacy);
    return normalizeRegionalReceiptSettings({
        companyId,
        businessRegion,
        locale: toText(legacy.locale),
        currency: toText(legacy.currency),
        timezone: toText(legacy.timezone),
        documentMode: toDocumentMode(legacy.documentMode),
        tw: {
            taxId: toText(legacy.taxId),
            electronicInvoiceEnabled: toBoolean(legacy.electronicInvoiceEnabled) ?? true,
            carrierEnabled: toBoolean(legacy.carrierEnabled) ?? false,
            mobileBarcodeEnabled: toBoolean(legacy.mobileBarcodeEnabled) ?? false,
            memberCarrierEnabled: toBoolean(legacy.memberCarrierEnabled) ?? false,
            donationCodeEnabled: toBoolean(legacy.donationCodeEnabled) ?? false,
            invoiceNote: businessRegion === "TW" ? toText(legacy.invoiceNote) : "",
            receiptNote: businessRegion === "TW" ? toText(legacy.receiptNote) : "",
        },
        au: {
            abn: toText(legacy.abn),
            businessRegistrationNumber: toText(legacy.businessRegistrationNumber),
            gstRegistered: toBoolean(legacy.gstRegistered) ?? false,
            showAbnOnReceipt: toBoolean(legacy.showAbnOnReceipt) ?? true,
            showGstBreakdown: toBoolean(legacy.showGstBreakdown) ?? true,
            invoiceTitleMode: toInvoiceTitleMode(legacy.invoiceTitleMode) ?? "auto",
            invoiceNote: businessRegion === "AU" ? toText(legacy.invoiceNote) : "",
            receiptNote: businessRegion === "AU" ? toText(legacy.receiptNote) : "",
        },
        createdAt: toText(legacy.createdAt),
        updatedAt: toText(legacy.updatedAt),
        updatedBy: toText(legacy.updatedBy) || updatedBy,
    });
}

export function buildLegacyCompanyProfileRecord(params: {
    businessProfile: BusinessProfile;
    regionalReceiptSettings: RegionalReceiptSettings;
}): Record<string, unknown> {
    const { businessProfile, regionalReceiptSettings } = params;
    const activeRegion = regionalReceiptSettings.businessRegion === "AU" ? regionalReceiptSettings.au : regionalReceiptSettings.tw;

    return {
        companyId: businessProfile.companyId,
        companyName: businessProfile.companyName,
        displayName: businessProfile.displayName,
        contactName: businessProfile.contactName,
        phone: businessProfile.phone,
        email: businessProfile.email,
        website: businessProfile.website,
        address: businessProfile.address,
        country: businessProfile.country,
        region: businessProfile.region,
        postcode: businessProfile.postcode,
        businessRegion: regionalReceiptSettings.businessRegion,
        locale: regionalReceiptSettings.locale,
        currency: regionalReceiptSettings.currency,
        timezone: regionalReceiptSettings.timezone,
        documentMode: regionalReceiptSettings.documentMode,
        taxId: regionalReceiptSettings.tw.taxId,
        electronicInvoiceEnabled: regionalReceiptSettings.tw.electronicInvoiceEnabled,
        carrierEnabled: regionalReceiptSettings.tw.carrierEnabled,
        mobileBarcodeEnabled: regionalReceiptSettings.tw.mobileBarcodeEnabled,
        memberCarrierEnabled: regionalReceiptSettings.tw.memberCarrierEnabled,
        donationCodeEnabled: regionalReceiptSettings.tw.donationCodeEnabled,
        abn: regionalReceiptSettings.au.abn,
        businessRegistrationNumber: regionalReceiptSettings.au.businessRegistrationNumber,
        gstRegistered: regionalReceiptSettings.au.gstRegistered,
        showAbnOnReceipt: regionalReceiptSettings.au.showAbnOnReceipt,
        showGstBreakdown: regionalReceiptSettings.au.showGstBreakdown,
        invoiceTitleMode: regionalReceiptSettings.au.invoiceTitleMode,
        invoiceNote: activeRegion.invoiceNote,
        receiptNote: activeRegion.receiptNote,
        createdAt: businessProfile.createdAt,
        updatedAt: regionalReceiptSettings.updatedAt,
        updatedBy: regionalReceiptSettings.updatedBy,
    };
}

export async function syncLegacyCompanyProfileRecord(params: {
    db: Firestore | null;
    businessProfile: BusinessProfile;
    regionalReceiptSettings: RegionalReceiptSettings;
}): Promise<void> {
    const { db, businessProfile, regionalReceiptSettings } = params;
    if (!db) return;
    await db.doc(legacyCompanyProfileDocPath(businessProfile.companyId)).set(buildLegacyCompanyProfileRecord({ businessProfile, regionalReceiptSettings }), {
        merge: true,
    });
}
