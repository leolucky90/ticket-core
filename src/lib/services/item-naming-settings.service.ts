import "server-only";
import { fbAdminDb } from "@/lib/firebase-server";
import { normalizeItemNamingSettings, itemNamingSettingsDocPath, type ItemNamingSettings } from "@/lib/schema/itemNamingSettings";
import { requireCompanyOperator } from "@/lib/services/access-control";

export async function getItemNamingSettings(companyIdInput?: string): Promise<ItemNamingSettings> {
    const operator = await requireCompanyOperator();
    const companyId = companyIdInput?.trim() || operator.companyId!;
    const path = itemNamingSettingsDocPath(companyId);
    const snap = await fbAdminDb.doc(path).get();
    const settings = normalizeItemNamingSettings(snap.exists ? (snap.data() as Partial<ItemNamingSettings>) : null, operator.uid);
    if (!snap.exists) {
        await fbAdminDb.doc(path).set(settings, { merge: true });
    }
    return settings;
}

export async function updateItemNamingSettings(input: {
    companyId?: string;
    patch: Partial<ItemNamingSettings>;
}): Promise<ItemNamingSettings> {
    const operator = await requireCompanyOperator();
    const companyId = input.companyId?.trim() || operator.companyId!;
    const current = await getItemNamingSettings(companyId);
    const next = normalizeItemNamingSettings(
        {
            ...current,
            ...input.patch,
            updatedAt: new Date().toISOString(),
            updatedBy: operator.uid,
        },
        operator.uid,
    );
    await fbAdminDb.doc(itemNamingSettingsDocPath(companyId)).set(next, { merge: true });
    return next;
}
