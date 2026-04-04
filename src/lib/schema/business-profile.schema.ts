import { sanitizeIso, sanitizeText } from "@/lib/schema/company-settings.shared";

export type BusinessProfile = {
    companyId: string;
    companyName: string;
    displayName: string;
    contactName: string;
    phone: string;
    email: string;
    website: string;
    address: string;
    country: string;
    region: string;
    postcode: string;
    createdAt: string;
    updatedAt: string;
    updatedBy: string;
};

export function businessProfileDocPath(companyId: string): string {
    return `companies/${sanitizeText(companyId, 120)}/settings/businessProfile`;
}

export function normalizeBusinessProfile(input: Partial<BusinessProfile> & { companyId: string }): BusinessProfile {
    const nowIso = new Date().toISOString();
    const createdAt = sanitizeIso(input.createdAt, nowIso);

    return {
        companyId: sanitizeText(input.companyId, 120),
        companyName: sanitizeText(input.companyName, 160),
        displayName: sanitizeText(input.displayName, 160),
        contactName: sanitizeText(input.contactName, 160),
        phone: sanitizeText(input.phone, 80),
        email: sanitizeText(input.email, 160).toLowerCase(),
        website: sanitizeText(input.website, 240),
        address: sanitizeText(input.address, 500),
        country: sanitizeText(input.country, 120),
        region: sanitizeText(input.region, 120),
        postcode: sanitizeText(input.postcode, 40),
        createdAt,
        updatedAt: sanitizeIso(input.updatedAt, createdAt),
        updatedBy: sanitizeText(input.updatedBy, 120) || "system",
    };
}

export function createEmptyBusinessProfile(companyId: string, updatedBy: string): BusinessProfile {
    const nowIso = new Date().toISOString();
    return normalizeBusinessProfile({
        companyId,
        companyName: "",
        displayName: "",
        contactName: "",
        phone: "",
        email: "",
        website: "",
        address: "",
        country: "",
        region: "",
        postcode: "",
        createdAt: nowIso,
        updatedAt: nowIso,
        updatedBy,
    });
}

export function isBusinessProfile(value: unknown): value is BusinessProfile {
    if (!value || typeof value !== "object") return false;
    const row = value as Record<string, unknown>;
    return Boolean(sanitizeText(row.companyId, 120));
}
