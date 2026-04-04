import "server-only";
import { createEmptyInvoiceSettings, invoiceSettingsDocPath, normalizeInvoiceSettings, type InvoiceSettings } from "@/lib/schema/invoice-settings.schema";
import { getBusinessProfile } from "@/lib/services/business-profile.service";
import { getRegionalReceiptSettings } from "@/lib/services/regional-receipt-settings.service";
import { getInvoiceDb, resolveInvoiceServiceScope } from "@/lib/services/invoice-service.shared";

const memory: Record<string, InvoiceSettings> = {};

export async function getInvoiceSettings(companyId?: string): Promise<InvoiceSettings | null> {
    const scope = companyId ? null : await resolveInvoiceServiceScope();
    const resolvedCompanyId = companyId ?? scope?.companyId ?? "";
    const updatedBy = scope?.uid ?? "system";
    if (!resolvedCompanyId) return null;

    const db = await getInvoiceDb();
    if (!db) {
        return memory[resolvedCompanyId] ?? createEmptyInvoiceSettings(resolvedCompanyId, updatedBy);
    }

    const snap = await db.doc(invoiceSettingsDocPath(resolvedCompanyId)).get();
    if (snap.exists) {
        const next = normalizeInvoiceSettings({
            companyId: resolvedCompanyId,
            ...(snap.data() as Partial<InvoiceSettings>),
        });
        memory[resolvedCompanyId] = next;
        return next;
    }

    const [businessProfile, regionalReceiptSettings] = await Promise.all([getBusinessProfile(), getRegionalReceiptSettings()]);
    const next = normalizeInvoiceSettings({
        ...createEmptyInvoiceSettings(resolvedCompanyId, updatedBy),
        companyId: resolvedCompanyId,
        twSellerName: businessProfile?.companyName || "",
        twTaxId: regionalReceiptSettings?.tw.taxId || "",
        auBusinessName: businessProfile?.companyName || "",
        auAbn: regionalReceiptSettings?.au.abn || "",
        updatedBy,
    });
    memory[resolvedCompanyId] = next;
    return next;
}

export async function updateInvoiceSettings(
    input: Partial<Omit<InvoiceSettings, "companyId" | "createdAt" | "updatedAt" | "updatedBy">>,
): Promise<InvoiceSettings | null> {
    const scope = await resolveInvoiceServiceScope();
    if (!scope) return null;

    const current = await getInvoiceSettings(scope.companyId);
    const next = normalizeInvoiceSettings({
        ...(current ?? createEmptyInvoiceSettings(scope.companyId, scope.uid)),
        ...input,
        companyId: scope.companyId,
        updatedAt: new Date().toISOString(),
        updatedBy: scope.uid,
    });
    memory[scope.companyId] = next;

    const db = await getInvoiceDb();
    if (!db) return next;

    await db.doc(invoiceSettingsDocPath(scope.companyId)).set(next, { merge: true });
    return next;
}
