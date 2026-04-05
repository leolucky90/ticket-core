import "server-only";
import {
    normalizeUsedProductTypeSetting,
    usedProductTypeSettingsCollectionPath,
    type UsedProductTypeSetting,
    type UsedProductTypeSpecificationTemplate,
} from "@/lib/schema";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { normalizeCompanyId } from "@/lib/tenant-scope";
import { getUserCompanyId, getUserDoc, toAccountType } from "@/lib/services/user.service";

const memory: { settingsByCompany: Record<string, UsedProductTypeSetting[]> } = { settingsByCompany: {} };

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function makeId(prefix = "upt"): string {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function slugify(value: string): string {
    const slug = toText(value, 120)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
    return slug || makeId("upt");
}

function toInputType(value: unknown): "text" | "select" {
    return value === "select" ? "select" : "text";
}

function normalizeOptions(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    const options: string[] = [];

    for (const row of value) {
        const text = toText(row, 120);
        if (!text) continue;
        const normalized = text.toLowerCase();
        if (seen.has(normalized)) continue;
        seen.add(normalized);
        options.push(text);
        if (options.length >= 40) break;
    }

    return options;
}

function normalizeTemplates(value: UsedProductTypeSpecificationTemplate[]): UsedProductTypeSpecificationTemplate[] {
    return value
        .map((row) => {
            const options = normalizeOptions(row.options);
            const inputType = toInputType(row.inputType);
            return {
                key: toText(row.key, 120),
                label: toText(row.label, 120),
                labelZh: toText(row.labelZh, 120) || undefined,
                labelEn: toText(row.labelEn, 120) || undefined,
                placeholder: toText(row.placeholder, 240) || undefined,
                placeholderZh: toText(row.placeholderZh, 240) || undefined,
                placeholderEn: toText(row.placeholderEn, 240) || undefined,
                inputType: (inputType === "select" && options.length > 0 ? "select" : "text") as UsedProductTypeSpecificationTemplate["inputType"],
                options: inputType === "select" && options.length > 0 ? options : undefined,
                isRequired: row.isRequired === true,
            };
        })
        .filter((row) => row.key || row.label)
        .map((row) => ({
            ...row,
            key: row.key || row.label,
            label: row.label || row.labelZh || row.labelEn || row.key,
        }))
        .slice(0, 40);
}

async function resolveScope(): Promise<{ companyId: string; uid: string } | null> {
    const session = await getSessionUser();
    if (!session) return null;

    const user = await getUserDoc(session.uid);
    if (!user || toAccountType(user.role) !== "company") return null;

    const companyId = normalizeCompanyId(getUserCompanyId(user, session.uid));
    if (!companyId) return null;

    return {
        companyId,
        uid: session.uid,
    };
}

async function getDb() {
    try {
        const { fbAdminDb } = await import("@/lib/firebase-server");
        return fbAdminDb;
    } catch {
        return null;
    }
}

async function listEnabledTypeNamesFromBrandDocs(db: FirebaseFirestore.Firestore, companyId: string): Promise<string[]> {
    const snap = await db.collection(`companies/${companyId}/brands`).get();
    const seen = new Set<string>();
    const names: string[] = [];

    for (const doc of snap.docs) {
        const rows = Array.isArray(doc.get("usedProductTypes")) ? doc.get("usedProductTypes") : [];
        for (const row of rows) {
            const name = toText(row, 120);
            if (!name) continue;
            const normalized = name.toLowerCase();
            if (seen.has(normalized)) continue;
            seen.add(normalized);
            names.push(name);
        }
    }

    return names.sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

async function ensureSeededFromBrandDocs(
    db: FirebaseFirestore.Firestore,
    scope: { companyId: string; uid: string },
    existing: UsedProductTypeSetting[],
): Promise<UsedProductTypeSetting[]> {
    const enabledNames = await listEnabledTypeNamesFromBrandDocs(db, scope.companyId);
    if (enabledNames.length === 0) return existing;

    const existingByName = new Map(existing.map((row) => [row.name.trim().toLowerCase(), row] as const));
    const writes: Promise<unknown>[] = [];
    const merged = new Map(existingByName);
    const nowIso = new Date().toISOString();

    for (const name of enabledNames) {
        const key = name.trim().toLowerCase();
        const current = merged.get(key) ?? null;
        if (current) {
            if (!current.isActive) {
                const next = normalizeUsedProductTypeSetting({
                    ...current,
                    isActive: true,
                    updatedAt: nowIso,
                    updatedBy: scope.uid,
                });
                merged.set(key, next);
                writes.push(db.collection(usedProductTypeSettingsCollectionPath(scope.companyId)).doc(next.id).set(next, { merge: true }));
            }
            continue;
        }

        const created = normalizeUsedProductTypeSetting({
            id: `upt_${slugify(name)}`,
            name,
            isActive: true,
            specificationTemplates: [],
            createdAt: nowIso,
            updatedAt: nowIso,
            updatedBy: scope.uid,
        });
        merged.set(key, created);
        writes.push(db.collection(usedProductTypeSettingsCollectionPath(scope.companyId)).doc(created.id).set(created, { merge: true }));
    }

    if (writes.length > 0) await Promise.all(writes);
    return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
}

function listMemory(companyId: string): UsedProductTypeSetting[] {
    return [...(memory.settingsByCompany[companyId] ?? [])].sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
}

function upsertMemory(companyId: string, value: UsedProductTypeSetting): void {
    const current = memory.settingsByCompany[companyId] ?? [];
    memory.settingsByCompany[companyId] = [value, ...current.filter((row) => row.id !== value.id)];
}

function removeMemory(companyId: string, settingId: string): void {
    const current = memory.settingsByCompany[companyId] ?? [];
    memory.settingsByCompany[companyId] = current.filter((row) => row.id !== settingId);
}

export async function listUsedProductTypeSettings(): Promise<UsedProductTypeSetting[]> {
    const scope = await resolveScope();
    if (!scope) return [];

    const db = await getDb();
    if (!db) return listMemory(scope.companyId);

    const snap = await db.collection(usedProductTypeSettingsCollectionPath(scope.companyId)).orderBy("name", "asc").limit(300).get();
    const existing = snap.docs.map((doc) =>
        normalizeUsedProductTypeSetting({
            id: doc.id,
            ...(doc.data() as Partial<UsedProductTypeSetting>),
        }),
    );
    const seeded = await ensureSeededFromBrandDocs(db, scope, existing);
    memory.settingsByCompany[scope.companyId] = seeded;
    return seeded;
}

export async function createUsedProductTypeSetting(input: {
    name: string;
    isActive?: boolean;
    specificationTemplates?: UsedProductTypeSpecificationTemplate[];
}): Promise<UsedProductTypeSetting | null> {
    const scope = await resolveScope();
    if (!scope) return null;

    const next = normalizeUsedProductTypeSetting({
        id: makeId(),
        name: input.name,
        isActive: input.isActive !== false,
        specificationTemplates: normalizeTemplates(input.specificationTemplates ?? []),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: scope.uid,
    });

    upsertMemory(scope.companyId, next);

    const db = await getDb();
    if (!db) return next;

    await db.collection(usedProductTypeSettingsCollectionPath(scope.companyId)).doc(next.id).set(next, { merge: false });
    return next;
}

export async function updateUsedProductTypeSetting(input: {
    id: string;
    name?: string;
    isActive?: boolean;
    specificationTemplates?: UsedProductTypeSpecificationTemplate[];
}): Promise<UsedProductTypeSetting | null> {
    const scope = await resolveScope();
    if (!scope) return null;

    const settingId = toText(input.id, 120);
    if (!settingId) return null;

    const existingList = await listUsedProductTypeSettings();
    const current = existingList.find((row) => row.id === settingId);
    if (!current) return null;

    const next = normalizeUsedProductTypeSetting({
        ...current,
        name: input.name ?? current.name,
        isActive: input.isActive ?? current.isActive,
        specificationTemplates:
            input.specificationTemplates === undefined ? current.specificationTemplates : normalizeTemplates(input.specificationTemplates),
        updatedAt: new Date().toISOString(),
        updatedBy: scope.uid,
    });

    upsertMemory(scope.companyId, next);

    const db = await getDb();
    if (!db) return next;

    await db.collection(usedProductTypeSettingsCollectionPath(scope.companyId)).doc(settingId).set(next, { merge: true });
    return next;
}

export async function deleteUsedProductTypeSetting(id: string): Promise<boolean> {
    const scope = await resolveScope();
    if (!scope) return false;

    const settingId = toText(id, 120);
    if (!settingId) return false;

    removeMemory(scope.companyId, settingId);

    const db = await getDb();
    if (!db) return true;

    await db.collection(usedProductTypeSettingsCollectionPath(scope.companyId)).doc(settingId).delete();
    return true;
}

export async function syncUsedProductTypeSettings(activeTypeNames: string[]): Promise<UsedProductTypeSetting[]> {
    const normalizedNames = activeTypeNames
        .map((name) => toText(name, 120))
        .filter((name, index, all) => name.length > 0 && all.findIndex((item) => item.toLowerCase() === name.toLowerCase()) === index)
        .sort((a, b) => a.localeCompare(b, "zh-Hant"));
    const existing = await listUsedProductTypeSettings();
    const existingByName = new Map(existing.map((row) => [row.name.trim().toLowerCase(), row] as const));

    for (const name of normalizedNames) {
        const current = existingByName.get(name.toLowerCase()) ?? null;
        if (!current) {
            const created = await createUsedProductTypeSetting({ name, isActive: true });
            if (created) existingByName.set(name.toLowerCase(), created);
            continue;
        }
        if (!current.isActive) {
            const updated = await updateUsedProductTypeSetting({ id: current.id, isActive: true });
            if (updated) existingByName.set(name.toLowerCase(), updated);
        }
    }

    for (const row of existing) {
        if (!row.isActive) continue;
        const stillActive = normalizedNames.some((name) => name.toLowerCase() === row.name.trim().toLowerCase());
        if (stillActive) continue;
        await updateUsedProductTypeSetting({ id: row.id, isActive: false });
    }

    return listUsedProductTypeSettings();
}
