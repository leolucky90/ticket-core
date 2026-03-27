export type CompanyProfile = {
    companyId: string;
    companyName: string;
    displayName: string;
    contactName: string;
    phone: string;
    email: string;
    address: string;
    country: string;
    region: string;
    postcode: string;
    taxId: string;
    abn: string;
    businessRegistrationNumber: string;
    invoiceNote: string;
    receiptNote: string;
    createdAt: string;
    updatedAt: string;
    updatedBy: string;
};

function toText(value: unknown, max = 320): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toIso(value: unknown, fallback: string): string {
    if (typeof value === "string" && value.trim()) {
        const ts = Date.parse(value);
        if (Number.isFinite(ts)) return new Date(ts).toISOString();
    }
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return new Date(Math.round(value)).toISOString();
    }
    return fallback;
}

export function companyProfileDocPath(companyId: string): string {
    return `companies/${toText(companyId, 120)}/settings/companyProfile`;
}

export function normalizeCompanyProfile(input: Partial<CompanyProfile> & { companyId: string }): CompanyProfile {
    const nowIso = new Date().toISOString();
    const createdAt = toIso(input.createdAt, nowIso);

    return {
        companyId: toText(input.companyId, 120),
        companyName: toText(input.companyName, 160),
        displayName: toText(input.displayName, 160),
        contactName: toText(input.contactName, 160),
        phone: toText(input.phone, 80),
        email: toText(input.email, 160).toLowerCase(),
        address: toText(input.address, 500),
        country: toText(input.country, 120),
        region: toText(input.region, 120),
        postcode: toText(input.postcode, 40),
        taxId: toText(input.taxId, 80),
        abn: toText(input.abn, 80),
        businessRegistrationNumber: toText(input.businessRegistrationNumber, 80),
        invoiceNote: toText(input.invoiceNote, 2000),
        receiptNote: toText(input.receiptNote, 2000),
        createdAt,
        updatedAt: toIso(input.updatedAt, createdAt),
        updatedBy: toText(input.updatedBy, 120) || "system",
    };
}

export function isCompanyProfile(value: unknown): value is CompanyProfile {
    if (!value || typeof value !== "object") return false;
    const row = value as Record<string, unknown>;
    return Boolean(toText(row.companyId, 120));
}
