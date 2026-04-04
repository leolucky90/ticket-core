import "server-only";
import {
    createEmptyRegionalReceiptSettings,
    normalizeRegionalReceiptSettings,
    regionalReceiptSettingsDocPath,
    type RegionalReceiptSettings,
} from "@/lib/schema/regional-receipt-settings.schema";
import {
    buildRegionalReceiptSettingsFromLegacy,
    readLegacyCompanyProfileRecord,
    syncLegacyCompanyProfileRecord,
} from "@/lib/services/company-profile-compat.service";
import { getCompanySettingsDb, resolveCompanySettingsScope } from "@/lib/services/company-settings-scope.service";
import { getBusinessProfile } from "@/lib/services/business-profile.service";

const memory: Record<string, RegionalReceiptSettings> = {};

export async function getRegionalReceiptSettings(): Promise<RegionalReceiptSettings | null> {
    const scope = await resolveCompanySettingsScope();
    if (!scope) return null;

    const db = await getCompanySettingsDb();
    if (!db) {
        return memory[scope.companyId] ?? createEmptyRegionalReceiptSettings(scope.companyId, scope.uid);
    }

    const ref = db.doc(regionalReceiptSettingsDocPath(scope.companyId));
    const snap = await ref.get();
    if (snap.exists) {
        const next = normalizeRegionalReceiptSettings({
            companyId: scope.companyId,
            ...(snap.data() as Partial<RegionalReceiptSettings>),
        });
        memory[scope.companyId] = next;
        return next;
    }

    const legacy = await readLegacyCompanyProfileRecord(db, scope.companyId);
    const next = buildRegionalReceiptSettingsFromLegacy({
        companyId: scope.companyId,
        updatedBy: scope.uid,
        legacy,
    });
    memory[scope.companyId] = next;
    return next;
}

export async function updateRegionalReceiptSettings(
    input: Partial<Omit<RegionalReceiptSettings, "companyId" | "createdAt" | "updatedAt" | "updatedBy">>,
): Promise<RegionalReceiptSettings | null> {
    const scope = await resolveCompanySettingsScope();
    if (!scope) return null;

    const current = await getRegionalReceiptSettings();
    const next = normalizeRegionalReceiptSettings({
        ...(current ?? createEmptyRegionalReceiptSettings(scope.companyId, scope.uid)),
        ...input,
        companyId: scope.companyId,
        updatedAt: new Date().toISOString(),
        updatedBy: scope.uid,
    });

    memory[scope.companyId] = next;

    const db = await getCompanySettingsDb();
    if (!db) return next;

    await db.doc(regionalReceiptSettingsDocPath(scope.companyId)).set(next, { merge: true });
    const businessProfile = await getBusinessProfile();
    if (businessProfile) {
        await syncLegacyCompanyProfileRecord({
            db,
            businessProfile,
            regionalReceiptSettings: next,
        });
    }
    return next;
}
