import "server-only";
import { FieldPath } from "firebase-admin/firestore";
import { fbAdminDb } from "@/lib/firebase-server";
import { canHardDelete, canRestore, type PermissionModule, type PermissionSubject } from "@/lib/permissions";
import {
    deleteLogsCollectionPath,
    normalizeDeleteLog,
    normalizeSecuritySettings,
    securitySettingsDocPath,
    type DeleteLog,
    type SecuritySettings,
} from "@/lib/schema";
import { createAuditLog } from "@/lib/services/audit-log.service";
import { requireCompanyOperator } from "@/lib/services/access-control";
import { resolveUserPermissions } from "@/lib/services/permission-level.service";
import type { CursorPageResult } from "@/lib/types/pagination";

type DeleteLogModule = PermissionModule | "activities";

type DeleteLogFilter = {
    module?: string;
    keyword?: string;
    deletedBy?: string;
    deleteReason?: string;
    status?: "soft_deleted" | "restored" | "hard_deleted";
    hardDeleted?: "yes" | "no";
    restored?: "yes" | "no";
    dateFrom?: string;
    dateTo?: string;
};

type DeleteLogCursor = {
    updatedAt: string;
    id: string;
};

type DeleteLogPageQuery = DeleteLogFilter & {
    pageSize?: number;
    cursor?: string;
};

type ModuleConfig = {
    module: DeleteLogModule;
    collection: string;
    permissionModule: PermissionModule;
};

const MODULE_CONFIGS: ModuleConfig[] = [
    { module: "staff", collection: "staffMembers", permissionModule: "staff" },
    { module: "products", collection: "products", permissionModule: "products" },
    { module: "inventory", collection: "inventory", permissionModule: "inventory" },
    { module: "customers", collection: "customers", permissionModule: "customers" },
    { module: "tickets", collection: "tickets", permissionModule: "tickets" },
    { module: "campaigns", collection: "campaigns", permissionModule: "campaigns" },
    { module: "activities", collection: "campaigns", permissionModule: "campaigns" },
    { module: "settings", collection: "settingsData", permissionModule: "settings" },
    { module: "deleteLogs", collection: "deleteLogs", permissionModule: "deleteLogs" },
];

function makeId(prefix: string): string {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function toFirestoreData<T>(input: T): T {
    const walk = (value: unknown): unknown => {
        if (Array.isArray(value)) return value.map((item) => walk(item)).filter((item) => item !== undefined);
        if (value && typeof value === "object") {
            const out: Record<string, unknown> = {};
            for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
                const next = walk(raw);
                if (next !== undefined) out[key] = next;
            }
            return out;
        }
        if (value === undefined) return undefined;
        return value;
    };
    return walk(input) as T;
}

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

async function verifyEmailPassword(email: string, password: string): Promise<boolean> {
    const accountEmail = toText(email, 160).toLowerCase();
    const secret = toText(password, 200);
    const apiKey = toText(process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "", 200);
    if (!accountEmail || !secret || !apiKey) return false;
    const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`;
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                email: accountEmail,
                password: secret,
                returnSecureToken: false,
            }),
            cache: "no-store",
        });
        return response.ok;
    } catch {
        return false;
    }
}

function normalizeModuleName(value: unknown): DeleteLogModule {
    const input = toText(value, 120).toLowerCase();
    const matched = MODULE_CONFIGS.find((item) => item.module === input);
    return matched?.module ?? "settings";
}

function getModuleConfig(moduleName: DeleteLogModule): ModuleConfig {
    return MODULE_CONFIGS.find((item) => item.module === moduleName) ?? MODULE_CONFIGS[0];
}

function moduleDocPath(companyId: string, moduleName: DeleteLogModule, targetId: string): string {
    const config = getModuleConfig(moduleName);
    return `companies/${companyId}/${config.collection}/${targetId}`;
}

async function resolveSubject(companyId: string): Promise<PermissionSubject> {
    const operator = await requireCompanyOperator();
    const permissions = await resolveUserPermissions({
        companyId,
        roleLevel: operator.roleLevel,
    });
    return {
        uid: operator.uid,
        roleLevel: operator.roleLevel,
        permissions,
        isOwner: operator.isOwner,
    };
}

async function getSecuritySettingsUnsafe(companyId: string): Promise<SecuritySettings> {
    const snap = await fbAdminDb.doc(securitySettingsDocPath(companyId)).get();
    return normalizeSecuritySettings(snap.exists ? (snap.data() as Partial<SecuritySettings>) : null, "system");
}

function matchesFilter(log: DeleteLog, filter: DeleteLogFilter): boolean {
    if (filter.module && log.module !== filter.module) return false;
    if (filter.deletedBy && !toText(log.deletedBy, 160).includes(toText(filter.deletedBy, 160))) return false;
    if (filter.deleteReason && !toText(log.deleteReason, 2000).includes(toText(filter.deleteReason, 2000))) return false;
    if (filter.status && log.status !== filter.status) return false;
    if (filter.hardDeleted === "yes" && !log.hardDeletedAt) return false;
    if (filter.hardDeleted === "no" && log.hardDeletedAt) return false;
    if (filter.restored === "yes" && !log.restoredAt) return false;
    if (filter.restored === "no" && log.restoredAt) return false;

    const keyword = toText(filter.keyword, 200).toLowerCase();
    if (keyword) {
        const stack = `${log.module} ${log.targetLabel} ${log.targetId} ${log.deleteReason ?? ""}`.toLowerCase();
        if (!stack.includes(keyword)) return false;
    }

    const deletedTs = Date.parse(log.deletedAt ?? log.createdAt);
    if (filter.dateFrom) {
        const fromTs = Date.parse(filter.dateFrom);
        if (Number.isFinite(fromTs) && deletedTs < fromTs) return false;
    }
    if (filter.dateTo) {
        const toTs = Date.parse(filter.dateTo);
        if (Number.isFinite(toTs) && deletedTs > toTs + 24 * 60 * 60 * 1000 - 1) return false;
    }

    return true;
}

function normalizePageSize(input: number | undefined, fallback = 10): number {
    const value = Number(input);
    if (!Number.isFinite(value)) return fallback;
    if (value <= 5) return 5;
    if (value <= 10) return 10;
    if (value <= 15) return 15;
    return 20;
}

function encodeDeleteLogCursor(cursor: DeleteLogCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeDeleteLogCursor(value: string | undefined): DeleteLogCursor | null {
    const text = toText(value, 240);
    if (!text) return null;
    try {
        const parsed = JSON.parse(Buffer.from(text, "base64url").toString("utf8")) as Partial<DeleteLogCursor>;
        const updatedAt = toText(parsed.updatedAt, 80);
        const id = toText(parsed.id, 120);
        if (!updatedAt || !id) return null;
        return { updatedAt, id };
    } catch {
        return null;
    }
}

export async function createDeleteLog(input: {
    companyId?: string;
    module: string;
    targetId: string;
    targetType?: string;
    targetLabel?: string;
    snapshot?: Record<string, unknown>;
    deleteReason?: string;
    deletedBy?: string;
    deletedByName?: string;
    canRestore?: boolean;
    canHardDelete?: boolean;
}): Promise<DeleteLog> {
    const operator = await requireCompanyOperator();
    const companyId = input.companyId?.trim() || operator.companyId!;
    const nowIso = new Date().toISOString();
    const log = normalizeDeleteLog({
        id: makeId("dlog"),
        module: normalizeModuleName(input.module),
        targetId: input.targetId,
        targetType: input.targetType ?? "record",
        targetLabel: input.targetLabel ?? input.targetId,
        snapshot: input.snapshot,
        status: "soft_deleted",
        deletedAt: nowIso,
        deletedBy: input.deletedBy ?? operator.uid,
        deletedByName: input.deletedByName ?? operator.operatorName,
        deleteReason: input.deleteReason,
        canRestore: input.canRestore ?? true,
        canHardDelete: input.canHardDelete ?? true,
        createdAt: nowIso,
        updatedAt: nowIso,
    });

    await fbAdminDb.collection(deleteLogsCollectionPath(companyId)).doc(log.id).set(toFirestoreData(log), { merge: false });
    const security = await getSecuritySettingsUnsafe(companyId);
    if (security.deleteAuditLogEnabled) {
        await createAuditLog({
            companyId,
            module: log.module,
            action: "soft_delete",
            targetId: log.targetId,
            targetType: log.targetType,
            reason: log.deleteReason,
            metadata: { deleteLogId: log.id },
        });
    }
    return log;
}

export async function listDeleteLogs(filter: DeleteLogFilter = {}): Promise<DeleteLog[]> {
    const operator = await requireCompanyOperator();
    const companyId = operator.companyId!;
    const subject = await resolveSubject(companyId);
    if (!subject.permissions.includes("deleteLogs.view") && subject.roleLevel < 5) {
        throw new Error("Forbidden: delete logs view");
    }
    const snap = await fbAdminDb.collection(deleteLogsCollectionPath(companyId)).orderBy("updatedAt", "desc").limit(2000).get();
    return snap.docs.map((doc) => normalizeDeleteLog(doc.data() as Partial<DeleteLog> & Pick<DeleteLog, "id" | "module" | "targetId">)).filter((log) => matchesFilter(log, filter));
}

export async function queryDeleteLogsPage(params: DeleteLogPageQuery = {}): Promise<CursorPageResult<DeleteLog>> {
    const operator = await requireCompanyOperator();
    const companyId = operator.companyId!;
    const subject = await resolveSubject(companyId);
    const pageSize = normalizePageSize(params.pageSize, 10);
    if (!subject.permissions.includes("deleteLogs.view") && subject.roleLevel < 5) {
        throw new Error("Forbidden: delete logs view");
    }

    const decodedCursor = decodeDeleteLogCursor(params.cursor);
    let query = fbAdminDb.collection(deleteLogsCollectionPath(companyId)).orderBy("updatedAt", "desc").orderBy(FieldPath.documentId(), "desc");
    if (params.module) query = query.where("module", "==", params.module);
    if (params.status) query = query.where("status", "==", params.status);
    if (decodedCursor) query = query.startAfter(decodedCursor.updatedAt, decodedCursor.id);

    const batchSize = Math.max(pageSize * 3, 30);
    const items: DeleteLog[] = [];

    for (let round = 0; round < 8; round += 1) {
        const snap = await query.limit(batchSize).get();
        if (snap.empty) break;

        const docs = snap.docs;
        let lastCursor: DeleteLogCursor | null = null;

        for (let index = 0; index < docs.length; index += 1) {
            const doc = docs[index];
            const log = normalizeDeleteLog(doc.data() as Partial<DeleteLog> & Pick<DeleteLog, "id" | "module" | "targetId">);
            lastCursor = { updatedAt: log.updatedAt, id: log.id };
            if (!matchesFilter(log, params)) continue;
            items.push(log);
            if (items.length >= pageSize) {
                const hasNextPage = index < docs.length - 1 || docs.length === batchSize;
                return {
                    items,
                    pageSize,
                    nextCursor: hasNextPage && lastCursor ? encodeDeleteLogCursor(lastCursor) : "",
                    hasNextPage,
                };
            }
        }

        if (!lastCursor || docs.length < batchSize) break;
        query = fbAdminDb.collection(deleteLogsCollectionPath(companyId)).orderBy("updatedAt", "desc").orderBy(FieldPath.documentId(), "desc");
        if (params.module) query = query.where("module", "==", params.module);
        if (params.status) query = query.where("status", "==", params.status);
        query = query.startAfter(lastCursor.updatedAt, lastCursor.id);
    }

    return {
        items,
        pageSize,
        nextCursor: "",
        hasNextPage: false,
    };
}

export async function restoreDeletedRecord(input: {
    companyId?: string;
    deleteLogId: string;
    restoreReason?: string;
    restoreMode?: "active" | "inactive";
    resetPassword?: boolean;
    requirePasswordChange?: boolean;
}): Promise<DeleteLog> {
    const operator = await requireCompanyOperator();
    const companyId = input.companyId?.trim() || operator.companyId!;
    const security = await getSecuritySettingsUnsafe(companyId);
    const subject = await resolveSubject(companyId);

    const logRef = fbAdminDb.collection(deleteLogsCollectionPath(companyId)).doc(toText(input.deleteLogId, 120));
    const snap = await logRef.get();
    if (!snap.exists) throw new Error("Delete log not found");
    const log = normalizeDeleteLog(snap.data() as Partial<DeleteLog> & Pick<DeleteLog, "id" | "module" | "targetId">);
    const moduleConfig = getModuleConfig(normalizeModuleName(log.module));
    if (!canRestore(subject, moduleConfig.permissionModule, security)) {
        throw new Error("Forbidden: restore");
    }
    if (!log.canRestore) {
        throw new Error("Restore disabled on this record");
    }

    const path = moduleDocPath(companyId, normalizeModuleName(log.module), log.targetId);
    const docRef = fbAdminDb.doc(path);
    const targetSnap = await docRef.get();
    if (!targetSnap.exists && log.snapshot) {
        await docRef.set(log.snapshot, { merge: true });
    } else if (targetSnap.exists) {
        const patch: Record<string, unknown> = {
            isDeleted: false,
            deleteStatus: "restored",
            restoredAt: new Date().toISOString(),
            restoredBy: operator.uid,
            restoreReason: toText(input.restoreReason, 2000),
            updatedAt: new Date().toISOString(),
            updatedBy: operator.uid,
        };
        if (normalizeModuleName(log.module) === "staff") {
            patch.status = input.restoreMode === "inactive" ? "inactive" : "active";
            if (input.resetPassword) patch.passwordResetAt = new Date().toISOString();
            if (typeof input.requirePasswordChange === "boolean") patch.mustChangePassword = input.requirePasswordChange;
        }
        await docRef.set(patch, { merge: true });
    }

    const next = normalizeDeleteLog({
        ...log,
        status: "restored",
        restoredAt: new Date().toISOString(),
        restoredBy: operator.uid,
        restoredByName: operator.operatorName,
        restoreReason: input.restoreReason,
        updatedAt: new Date().toISOString(),
    });
    await logRef.set(toFirestoreData(next), { merge: true });

    if (security.deleteAuditLogEnabled) {
        await createAuditLog({
            companyId,
            module: next.module,
            action: "restore",
            targetId: next.targetId,
            targetType: next.targetType,
            reason: input.restoreReason,
            metadata: { deleteLogId: next.id },
        });
    }
    return next;
}

export async function hardDeleteRecord(input: {
    companyId?: string;
    deleteLogId: string;
    reason?: string;
    authorizationPassword?: string;
}): Promise<DeleteLog> {
    const operator = await requireCompanyOperator();
    const companyId = input.companyId?.trim() || operator.companyId!;
    const security = await getSecuritySettingsUnsafe(companyId);
    const subject = await resolveSubject(companyId);

    const logRef = fbAdminDb.collection(deleteLogsCollectionPath(companyId)).doc(toText(input.deleteLogId, 120));
    const snap = await logRef.get();
    if (!snap.exists) throw new Error("Delete log not found");
    const log = normalizeDeleteLog(snap.data() as Partial<DeleteLog> & Pick<DeleteLog, "id" | "module" | "targetId">);
    const moduleConfig = getModuleConfig(normalizeModuleName(log.module));
    if (!canHardDelete(subject, moduleConfig.permissionModule, security)) {
        throw new Error("Forbidden: hard delete");
    }
    if (!log.canHardDelete) {
        throw new Error("Hard delete disabled on this record");
    }
    if (security.requireReasonOnHardDelete && !toText(input.reason, 2000)) {
        throw new Error("Hard delete reason required");
    }
    if (security.requirePasswordForHardDelete && !toText(input.authorizationPassword, 200)) {
        throw new Error("Hard delete authorization password required");
    }
    if (security.requirePasswordForHardDelete) {
        const verified = await verifyEmailPassword(operator.email, String(input.authorizationPassword ?? ""));
        if (!verified) throw new Error("Hard delete authorization password invalid");
    }

    const path = moduleDocPath(companyId, normalizeModuleName(log.module), log.targetId);
    await fbAdminDb.doc(path).delete();

    const next = normalizeDeleteLog({
        ...log,
        status: "hard_deleted",
        hardDeletedAt: new Date().toISOString(),
        hardDeletedBy: operator.uid,
        hardDeletedByName: operator.operatorName,
        hardDeleteReason: input.reason,
        updatedAt: new Date().toISOString(),
    });
    await logRef.set(toFirestoreData(next), { merge: true });

    if (security.deleteAuditLogEnabled) {
        await createAuditLog({
            companyId,
            module: next.module,
            action: "hard_delete",
            targetId: next.targetId,
            targetType: next.targetType,
            reason: input.reason,
            metadata: { deleteLogId: next.id },
        });
    }
    return next;
}
