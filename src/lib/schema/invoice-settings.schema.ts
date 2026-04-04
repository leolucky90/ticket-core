import { sanitizeBoolean, sanitizeIso, sanitizeText } from "@/lib/schema/company-settings.shared";
import { INVOICE_INTEGRATION_MODES, type InvoiceIntegrationMode } from "@/lib/schema/receipt-document.schema";

export type InvoiceSettings = {
    companyId: string;
    enabled: boolean;
    integrationMode: InvoiceIntegrationMode;
    defaultBranchId: string;
    autoIssueOnCheckout: boolean;
    allowReissueAfterVoid: boolean;
    twSellerName: string;
    twTaxId: string;
    auBusinessName: string;
    auAbn: string;
    simulateIssueFailure: boolean;
    simulateVoidFailure: boolean;
    createdAt: string;
    updatedAt: string;
    updatedBy: string;
};

function normalizeMode(value: unknown): InvoiceIntegrationMode {
    return INVOICE_INTEGRATION_MODES.find((item) => item === value) ?? "mock";
}

export function invoiceSettingsDocPath(companyId: string): string {
    return `companies/${sanitizeText(companyId, 120)}/settings/invoiceSettings`;
}

export function normalizeInvoiceSettings(input: Partial<InvoiceSettings> & { companyId: string }): InvoiceSettings {
    const nowIso = new Date().toISOString();
    const createdAt = sanitizeIso(input.createdAt, nowIso);

    return {
        companyId: sanitizeText(input.companyId, 120),
        enabled: sanitizeBoolean(input.enabled, true),
        integrationMode: normalizeMode(input.integrationMode),
        defaultBranchId: sanitizeText(input.defaultBranchId, 120),
        autoIssueOnCheckout: sanitizeBoolean(input.autoIssueOnCheckout, true),
        allowReissueAfterVoid: sanitizeBoolean(input.allowReissueAfterVoid, true),
        twSellerName: sanitizeText(input.twSellerName, 240),
        twTaxId: sanitizeText(input.twTaxId, 80),
        auBusinessName: sanitizeText(input.auBusinessName, 240),
        auAbn: sanitizeText(input.auAbn, 80),
        simulateIssueFailure: sanitizeBoolean(input.simulateIssueFailure, false),
        simulateVoidFailure: sanitizeBoolean(input.simulateVoidFailure, false),
        createdAt,
        updatedAt: sanitizeIso(input.updatedAt, createdAt),
        updatedBy: sanitizeText(input.updatedBy, 120) || "system",
    };
}

export function createEmptyInvoiceSettings(companyId: string, updatedBy: string): InvoiceSettings {
    const nowIso = new Date().toISOString();
    return normalizeInvoiceSettings({
        companyId,
        enabled: true,
        integrationMode: "mock",
        defaultBranchId: "main",
        autoIssueOnCheckout: true,
        allowReissueAfterVoid: true,
        twSellerName: "",
        twTaxId: "",
        auBusinessName: "",
        auAbn: "",
        simulateIssueFailure: false,
        simulateVoidFailure: false,
        createdAt: nowIso,
        updatedAt: nowIso,
        updatedBy,
    });
}
