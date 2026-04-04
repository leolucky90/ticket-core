import "server-only";
import { businessProfileDocPath, createEmptyBusinessProfile, normalizeBusinessProfile, type BusinessProfile } from "@/lib/schema/business-profile.schema";
import {
    buildBusinessProfileFromLegacy,
    readLegacyCompanyProfileRecord,
    syncLegacyCompanyProfileRecord,
} from "@/lib/services/company-profile-compat.service";
import { getRegionalReceiptSettings } from "@/lib/services/regional-receipt-settings.service";
import { getCompanySettingsDb, resolveCompanySettingsScope } from "@/lib/services/company-settings-scope.service";

const memory: Record<string, BusinessProfile> = {};

export async function getBusinessProfile(): Promise<BusinessProfile | null> {
    const scope = await resolveCompanySettingsScope();
    if (!scope) return null;

    const db = await getCompanySettingsDb();
    if (!db) {
        return memory[scope.companyId] ?? createEmptyBusinessProfile(scope.companyId, scope.uid);
    }

    const ref = db.doc(businessProfileDocPath(scope.companyId));
    const snap = await ref.get();
    if (snap.exists) {
        const next = normalizeBusinessProfile({
            companyId: scope.companyId,
            ...(snap.data() as Partial<BusinessProfile>),
        });
        memory[scope.companyId] = next;
        return next;
    }

    const legacy = await readLegacyCompanyProfileRecord(db, scope.companyId);
    const next = buildBusinessProfileFromLegacy({
        companyId: scope.companyId,
        updatedBy: scope.uid,
        legacy,
    });
    memory[scope.companyId] = next;
    return next;
}

export async function updateBusinessProfile(
    input: Partial<Omit<BusinessProfile, "companyId" | "createdAt" | "updatedAt" | "updatedBy">>,
): Promise<BusinessProfile | null> {
    const scope = await resolveCompanySettingsScope();
    if (!scope) return null;

    const current = await getBusinessProfile();
    const next = normalizeBusinessProfile({
        ...(current ?? createEmptyBusinessProfile(scope.companyId, scope.uid)),
        ...input,
        companyId: scope.companyId,
        updatedAt: new Date().toISOString(),
        updatedBy: scope.uid,
    });

    memory[scope.companyId] = next;

    const db = await getCompanySettingsDb();
    if (!db) return next;

    await db.doc(businessProfileDocPath(scope.companyId)).set(next, { merge: true });
    const regionalReceiptSettings = await getRegionalReceiptSettings();
    if (regionalReceiptSettings) {
        await syncLegacyCompanyProfileRecord({
            db,
            businessProfile: next,
            regionalReceiptSettings,
        });
    }
    return next;
}
