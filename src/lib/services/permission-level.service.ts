import "server-only";
import { fbAdminDb } from "@/lib/firebase-server";
import {
    createDefaultPermissionLevel,
    normalizePermissionLevel,
    permissionLevelDocPath,
    permissionLevelsCollectionPath,
    PERMISSION_LEVEL_RANGE,
    type PermissionLevel,
    type PermissionLevelNumber,
} from "@/lib/schema";
import { requireCompanyOperator } from "@/lib/services/access-control";

const DEFAULT_PERMISSION_MAP: Record<PermissionLevelNumber, string[]> = {
    1: ["dashboard.view"],
    2: ["dashboard.view", "products.view"],
    3: ["dashboard.view", "products.view", "inventory.edit"],
    4: ["dashboard.view", "products.view", "inventory.edit", "customers.delete"],
    5: ["dashboard.view", "settings.view", "products.delete", "deleteLogs.view", "deleteLogs.restore"],
    6: ["dashboard.view", "settings.view", "settings.edit", "campaigns.manage", "deleteLogs.view", "deleteLogs.restore"],
    7: ["dashboard.view", "settings.view", "settings.edit", "campaigns.manage", "reports.export", "deleteLogs.view", "deleteLogs.restore"],
    8: [
        "dashboard.view",
        "settings.view",
        "settings.edit",
        "staff.view",
        "staff.create",
        "staff.edit",
        "staff.delete",
        "staff.resetPassword",
        "staff.deleted.view",
        "staff.restore",
        "security.deleteControl.view",
        "security.deleteControl.edit",
        "deleteLogs.view",
        "deleteLogs.restore",
    ],
    9: [
        "dashboard.view",
        "settings.view",
        "settings.edit",
        "staff.view",
        "staff.create",
        "staff.edit",
        "staff.delete",
        "staff.resetPassword",
        "staff.deleted.view",
        "staff.restore",
        "staff.hardDelete",
        "security.deleteControl.view",
        "security.deleteControl.edit",
        "deleteLogs.view",
        "deleteLogs.restore",
        "deleteLogs.hardDelete",
        "hard_delete_authorized",
    ],
};

function normalizePermissionList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const item of value) {
        if (typeof item !== "string") continue;
        const cleaned = item.trim();
        if (!cleaned) continue;
        const key = cleaned.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(cleaned);
    }
    return out;
}

async function ensurePermissionLevelDocs(companyId: string, updatedBy: string): Promise<void> {
    const collection = fbAdminDb.collection(permissionLevelsCollectionPath(companyId));
    const snapshot = await collection.get();
    const existing = new Set(snapshot.docs.map((doc) => doc.id));

    const writes = PERMISSION_LEVEL_RANGE.filter((level) => !existing.has(`lv${level}`)).map((level) => {
        const base = createDefaultPermissionLevel(level, updatedBy);
        const next = normalizePermissionLevel(level, {
            ...base,
            permissions: DEFAULT_PERMISSION_MAP[level],
        });
        return collection.doc(`lv${level}`).set(next, { merge: true });
    });

    if (writes.length > 0) {
        await Promise.all(writes);
    }
}

export async function getPermissionLevels(companyIdInput?: string): Promise<PermissionLevel[]> {
    const operator = companyIdInput?.trim() ? null : await requireCompanyOperator();
    const companyId = companyIdInput?.trim() || operator?.companyId;
    if (!companyId) throw new Error("Missing companyId");
    await ensurePermissionLevelDocs(companyId, operator?.uid ?? "system");

    const collection = fbAdminDb.collection(permissionLevelsCollectionPath(companyId));
    const snapshot = await collection.get();
    const map = new Map<string, Partial<PermissionLevel>>();
    for (const doc of snapshot.docs) {
        map.set(doc.id, doc.data() as Partial<PermissionLevel>);
    }

    return PERMISSION_LEVEL_RANGE.map((level) =>
        normalizePermissionLevel(level, map.get(`lv${level}`) ?? {
            ...createDefaultPermissionLevel(level, operator?.uid ?? "system"),
            permissions: DEFAULT_PERMISSION_MAP[level],
        }, operator?.uid ?? "system"),
    );
}

export async function updatePermissionLevel(input: {
    companyId?: string;
    level: number;
    displayName?: string;
    isActive?: boolean;
    permissions?: string[];
    updatedBy?: string;
}): Promise<PermissionLevel> {
    const operator = await requireCompanyOperator();
    const companyId = input.companyId?.trim() || operator.companyId!;
    const level = Math.min(9, Math.max(1, Math.round(input.level))) as PermissionLevelNumber;
    const path = permissionLevelDocPath(companyId, level);
    const currentSnap = await fbAdminDb.doc(path).get();
    const current = currentSnap.exists ? (currentSnap.data() as Partial<PermissionLevel>) : createDefaultPermissionLevel(level, operator.uid);
    const next = normalizePermissionLevel(level, {
        ...current,
        displayName: input.displayName ?? current.displayName,
        isActive: typeof input.isActive === "boolean" ? input.isActive : current.isActive,
        permissions: input.permissions ? normalizePermissionList(input.permissions) : current.permissions ?? DEFAULT_PERMISSION_MAP[level],
        updatedAt: new Date().toISOString(),
        updatedBy: input.updatedBy ?? operator.uid,
    }, operator.uid);

    await fbAdminDb.doc(path).set(next, { merge: true });
    return next;
}

export async function resolveUserPermissions(params: {
    companyId: string;
    roleLevel: number;
    extraPermissions?: string[];
}): Promise<string[]> {
    const companyId = params.companyId.trim();
    const levels = await getPermissionLevels(companyId);
    const level = Math.min(9, Math.max(1, Math.round(params.roleLevel)));
    const matched = levels.find((item) => item.level === level);
    const base = matched?.isActive ? matched.permissions : DEFAULT_PERMISSION_MAP[level as PermissionLevelNumber] ?? [];
    const extra = normalizePermissionList(params.extraPermissions ?? []);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const key of [...base, ...extra]) {
        const normalized = key.trim().toLowerCase();
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        out.push(key.trim());
    }
    return out;
}
