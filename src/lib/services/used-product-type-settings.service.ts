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
    return snap.docs.map((doc) =>
        normalizeUsedProductTypeSetting({
            id: doc.id,
            ...(doc.data() as Partial<UsedProductTypeSetting>),
        }),
    );
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
