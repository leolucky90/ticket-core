import "server-only";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import type { BusinessRegion, InvoiceIntegrationMode, InvoiceStatus, ReceiptDocumentType } from "@/lib/schema";
import { reissueVoidedReceiptDocument } from "@/lib/services/invoice-issue.service";
import { updateInvoiceSettings } from "@/lib/services/invoice-settings.service";
import { saveInvoiceTrackSetting } from "@/lib/services/invoice-track.service";
import { voidReceiptDocument } from "@/lib/services/invoice-void.service";
import { resolveCompanySettingsScope } from "@/lib/services/company-settings-scope.service";

function readText(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

function readBoolean(formData: FormData, key: string): boolean {
    return formData.getAll(key).some((value) => value === "true" || value === "1" || value === "on");
}

function readInteger(formData: FormData, key: string, fallback: number): number {
    const value = Number(readText(formData, key));
    if (!Number.isFinite(value)) return fallback;
    return Math.max(0, Math.round(value));
}

export function parseInvoiceStatus(value: string): InvoiceStatus | "all" {
    if (
        value === "draft" ||
        value === "issue_pending" ||
        value === "issued" ||
        value === "issue_failed" ||
        value === "void_pending" ||
        value === "voided" ||
        value === "reissued"
    ) {
        return value;
    }
    return "all";
}

export async function updateInvoiceSettingsFromFormData(formData: FormData) {
    return updateInvoiceSettings({
        enabled: readBoolean(formData, "enabled"),
        integrationMode: readText(formData, "integrationMode") as InvoiceIntegrationMode,
        defaultBranchId: readText(formData, "defaultBranchId"),
        autoIssueOnCheckout: readBoolean(formData, "autoIssueOnCheckout"),
        allowReissueAfterVoid: readBoolean(formData, "allowReissueAfterVoid"),
        twSellerName: readText(formData, "twSellerName"),
        twTaxId: readText(formData, "twTaxId"),
        auBusinessName: readText(formData, "auBusinessName"),
        auAbn: readText(formData, "auAbn"),
        simulateIssueFailure: readBoolean(formData, "simulateIssueFailure"),
        simulateVoidFailure: readBoolean(formData, "simulateVoidFailure"),
    });
}

export async function saveInvoiceTrackSettingFromFormData(formData: FormData) {
    return saveInvoiceTrackSetting({
        id: readText(formData, "id") || undefined,
        label: readText(formData, "label"),
        prefix: readText(formData, "prefix"),
        region: readText(formData, "region") as BusinessRegion,
        documentType: readText(formData, "documentType") as ReceiptDocumentType,
        integrationMode: readText(formData, "integrationMode") as InvoiceIntegrationMode,
        startNo: readInteger(formData, "startNo", 1),
        endNo: readInteger(formData, "endNo", 99999999),
        nextNo: readInteger(formData, "nextNo", 1),
        active: readBoolean(formData, "active"),
    });
}

export async function voidReceiptDocumentFromFormData(formData: FormData) {
    const scope = await resolveCompanySettingsScope();
    const session = await getSessionUser();
    if (!scope) return { document: null, voidRecord: null };

    return voidReceiptDocument({
        companyId: scope.companyId,
        documentId: readText(formData, "documentId"),
        reason: readText(formData, "reason"),
        operatorUid: scope.uid,
        operatorEmail: session?.email ?? "",
    });
}

export async function reissueReceiptDocumentFromFormData(formData: FormData) {
    const scope = await resolveCompanySettingsScope();
    if (!scope) return null;

    return reissueVoidedReceiptDocument({
        companyId: scope.companyId,
        operatorUid: scope.uid,
        documentId: readText(formData, "documentId"),
    });
}
