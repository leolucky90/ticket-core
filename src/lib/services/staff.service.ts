import "server-only";
import { fbAdminAuth, fbAdminDb } from "@/lib/firebase-server";
import { canDelete, hasLevel, hasPermission, type PermissionSubject } from "@/lib/permissions";
import { normalizeCompanyId } from "@/lib/tenant-scope";
import { getUserCompanyId, getShowcaseTenantId, getUserDoc, toAccountType, type AccountType, type UserDoc } from "@/lib/services/user.service";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { createDeleteLog, hardDeleteRecord, restoreDeletedRecord } from "@/lib/services/delete-log.service";
import { createAuditLog } from "@/lib/services/audit-log.service";
import { resolveUserPermissions, getPermissionLevels } from "@/lib/services/permission-level.service";
import { normalizeSecuritySettings, securitySettingsDocPath, type SecuritySettings, type StaffMember } from "@/lib/schema";
import { normalizeStaffMember, staffMembersCollectionPath } from "@/lib/schema/staffMembers";
import { withSoftDeleted } from "@/lib/schema/softDelete";

type StaffStatus = StaffMember["status"];
type CurrentStaffMembership = {
    companyId: string;
    staff: StaffMember;
};

export type CurrentSessionAccountContext = {
    userDoc: UserDoc | null;
    accountType: AccountType;
    tenantId: string | null;
    staffProfile: StaffMember | null;
};

export type StaffCreateInput = {
    name: string;
    phone: string;
    address?: string;
    email: string;
    password: string;
    roleLevel: number;
    enabled: boolean;
    note?: string;
    mustChangePassword?: boolean;
    isRepairTechnician?: boolean;
};

export type StaffUpdateInput = {
    id: string;
    name: string;
    phone: string;
    address?: string;
    email: string;
    roleLevel: number;
    enabled: boolean;
    note?: string;
    mustChangePassword?: boolean;
    isRepairTechnician?: boolean;
};

type Operator = {
    uid: string;
    email: string;
    name: string;
    companyId: string;
    roleLevel: number;
    isOwner: boolean;
    permissions: string[];
};

type StaffDeleteInput = {
    id: string;
    reason?: string;
    confirmPassword?: string;
};

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toBool(value: unknown, fallback: boolean): boolean {
    if (typeof value === "boolean") return value;
    return fallback;
}

function toLevel(value: unknown, fallback = 1): number {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    const rounded = Math.round(n);
    if (rounded < 1) return 1;
    if (rounded > 9) return 9;
    return rounded;
}

function normalizeEmail(value: unknown): string {
    return toText(value, 160).toLowerCase();
}

function extractCompanyIdFromStaffPath(path: string): string | null {
    const parts = path.split("/");
    if (parts.length >= 4 && parts[0] === "companies" && parts[2] === "staffMembers") {
        return normalizeCompanyId(parts[1]);
    }
    return null;
}

function isFirestoreFailedPrecondition(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const raw = error as { code?: unknown; message?: unknown };
    if (raw.code === 9 || raw.code === "9" || raw.code === "failed-precondition") return true;
    if (typeof raw.message === "string" && raw.message.includes("FAILED_PRECONDITION")) return true;
    return false;
}

function makeId(prefix: string): string {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function toFirestoreData<T>(input: T): T {
    const walk = (value: unknown): unknown => {
        if (Array.isArray(value)) {
            return value.map((item) => walk(item)).filter((item) => item !== undefined);
        }
        if (value && typeof value === "object") {
            const out: Record<string, unknown> = {};
            for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
                const next = walk(raw);
                if (next !== undefined) {
                    out[key] = next;
                }
            }
            return out;
        }
        if (value === undefined) return undefined;
        return value;
    };
    return walk(input) as T;
}

function statusByEnabled(enabled: boolean): StaffStatus {
    return enabled ? "active" : "inactive";
}

async function getSecuritySettings(companyId: string): Promise<SecuritySettings> {
    const snap = await fbAdminDb.doc(securitySettingsDocPath(companyId)).get();
    return normalizeSecuritySettings(snap.exists ? (snap.data() as Partial<SecuritySettings>) : null, "system");
}

async function resolveOperator(): Promise<Operator> {
    const session = await getSessionUser();
    if (!session) throw new Error("Unauthorized");
    const userDoc = await getUserDoc(session.uid);
    const companyId = normalizeCompanyId(getUserCompanyId(userDoc, session.uid));
    if (!companyId || toAccountType(userDoc?.role ?? null) !== "company") {
        throw new Error("Forbidden");
    }

    const staffByUid = await fbAdminDb.collection(staffMembersCollectionPath(companyId)).where("uid", "==", session.uid).limit(1).get();
    const staffByEmail = staffByUid.empty
        ? await fbAdminDb.collection(staffMembersCollectionPath(companyId)).where("email", "==", session.email.toLowerCase()).limit(1).get()
        : staffByUid;
    const operatorLevel = !staffByEmail.empty ? toLevel((staffByEmail.docs[0].data() as Record<string, unknown>).roleLevel, 8) : 8;
    const permissions = await resolveUserPermissions({
        companyId,
        roleLevel: operatorLevel,
    });

    return {
        uid: session.uid,
        email: session.email.toLowerCase(),
        name: toText(session.email.split("@")[0], 120) || "Operator",
        companyId,
        roleLevel: operatorLevel,
        isOwner: userDoc?.role === "owner" || userDoc?.role === "super_admin",
        permissions,
    };
}

async function loadRoleName(companyId: string, roleLevel: number): Promise<string> {
    const levels = await getPermissionLevels(companyId);
    return levels.find((row) => row.level === roleLevel)?.displayName ?? `Lv${roleLevel}`;
}

function hasStaffPrivilege(subject: PermissionSubject, action: "view" | "create" | "edit" | "delete" | "resetPassword" | "deleted.view" | "restore" | "hardDelete"): boolean {
    const key = `staff.${action}`;
    return hasPermission(subject, key) || hasLevel(subject, 8);
}

async function writeUserDocFromStaff(params: {
    uid: string;
    email: string;
    companyId: string;
    roleLevel: number;
    operatorUid: string;
}): Promise<void> {
    const role = params.roleLevel >= 8 ? "company_admin" : "staff";
    await fbAdminDb.doc(`users/${params.uid}`).set(
        toFirestoreData({
            uid: params.uid,
            email: params.email,
            role,
            companyId: params.companyId,
            customerId: null,
            providers: [],
            updatedAt: Date.now(),
            updatedBy: params.operatorUid,
            createdAt: Date.now(),
        }),
        { merge: true },
    );
}

async function findStaffById(companyId: string, id: string): Promise<StaffMember | null> {
    const snap = await fbAdminDb.doc(`${staffMembersCollectionPath(companyId)}/${toText(id, 120)}`).get();
    if (!snap.exists) return null;
    const raw = snap.data() as Partial<StaffMember>;
    return normalizeStaffMember({
        id: snap.id,
        email: normalizeEmail(raw.email),
        ...raw,
    });
}

function mapUserRoleToLevel(role: unknown): number {
    if (role === "owner" || role === "super_admin") return 9;
    if (role === "company_admin") return 8;
    if (role === "manager") return 7;
    if (role === "staff") return 5;
    if (role === "viewer") return 2;
    return 1;
}

async function ensureStaffMembersFromUsers(companyId: string, operatorUid: string): Promise<void> {
    const usersSnap = await fbAdminDb.collection("users").where("companyId", "==", companyId).limit(1000).get();
    if (usersSnap.empty) return;

    const existingSnap = await fbAdminDb.collection(staffMembersCollectionPath(companyId)).limit(1000).get();
    const byUid = new Set(existingSnap.docs.map((doc) => toText((doc.data() as Record<string, unknown>).uid, 200)).filter(Boolean));
    const byEmail = new Set(existingSnap.docs.map((doc) => normalizeEmail((doc.data() as Record<string, unknown>).email)).filter(Boolean));
    const levels = await getPermissionLevels(companyId);
    const levelNameMap = new Map<number, string>(levels.map((row) => [row.level, row.displayName]));

    const writes: Array<Promise<unknown>> = [];
    for (const userDoc of usersSnap.docs) {
        const row = userDoc.data() as Record<string, unknown>;
        const uid = toText(row.uid, 200) || userDoc.id;
        const email = normalizeEmail(row.email);
        if (!email) continue;
        if (byUid.has(uid) || byEmail.has(email)) continue;

        const roleLevel = mapUserRoleToLevel(row.role);
        const roleNameSnapshot = levelNameMap.get(roleLevel) ?? `Lv${roleLevel}`;
        const nowIso = new Date().toISOString();
        const staff = normalizeStaffMember({
            id: makeId("staff"),
            uid,
            email,
            name: toText(row.displayName, 120) || toText(email.split("@")[0], 120) || "員工",
            phone: "",
            address: "",
            roleLevel,
            roleNameSnapshot,
            status: "active",
            mustChangePassword: false,
            googleLinked: false,
            createdAt: nowIso,
            createdBy: operatorUid,
            updatedAt: nowIso,
            updatedBy: operatorUid,
        });
        writes.push(fbAdminDb.doc(`${staffMembersCollectionPath(companyId)}/${staff.id}`).set(toFirestoreData(staff), { merge: false }));
        byUid.add(uid);
        byEmail.add(email);
    }
    if (writes.length > 0) {
        await Promise.all(writes);
    }
}

export async function listStaffMembers(params?: { includeDeleted?: boolean; keyword?: string }): Promise<StaffMember[]> {
    const operator = await resolveOperator();
    const subject: PermissionSubject = {
        uid: operator.uid,
        roleLevel: operator.roleLevel,
        permissions: operator.permissions,
        isOwner: operator.isOwner,
    };
    if (!hasStaffPrivilege(subject, "view")) {
        throw new Error("Forbidden");
    }

    await ensureStaffMembersFromUsers(operator.companyId, operator.uid);

    const snap = await fbAdminDb.collection(staffMembersCollectionPath(operator.companyId)).orderBy("updatedAt", "desc").limit(1000).get();
    const keyword = toText(params?.keyword, 200).toLowerCase();
    return snap.docs
        .map((doc) => {
            const raw = doc.data() as Partial<StaffMember>;
            return normalizeStaffMember({ id: doc.id, email: normalizeEmail(raw.email), ...raw });
        })
        .filter((item) => (params?.includeDeleted ? true : !item.isDeleted && item.deleteStatus !== "soft_deleted"))
        .filter((item) => {
            if (!keyword) return true;
            return `${item.name} ${item.email} ${item.phone} ${item.address}`.toLowerCase().includes(keyword);
        });
}

export async function getStaffMemberById(id: string): Promise<StaffMember | null> {
    const operator = await resolveOperator();
    const subject: PermissionSubject = {
        uid: operator.uid,
        roleLevel: operator.roleLevel,
        permissions: operator.permissions,
        isOwner: operator.isOwner,
    };
    if (!hasStaffPrivilege(subject, "view")) throw new Error("Forbidden");
    return findStaffById(operator.companyId, id);
}

export async function createStaff(input: StaffCreateInput): Promise<StaffMember> {
    const operator = await resolveOperator();
    const subject: PermissionSubject = {
        uid: operator.uid,
        roleLevel: operator.roleLevel,
        permissions: operator.permissions,
        isOwner: operator.isOwner,
    };
    if (!hasStaffPrivilege(subject, "create")) throw new Error("Forbidden");

    const roleLevel = toLevel(input.roleLevel, 1);
    const roleNameSnapshot = await loadRoleName(operator.companyId, roleLevel);
    const email = normalizeEmail(input.email);
    if (!email || !toText(input.password, 120)) throw new Error("Invalid email or password");

    const authUser = await fbAdminAuth.createUser({
        email,
        password: toText(input.password, 120),
        disabled: !toBool(input.enabled, true),
        displayName: toText(input.name, 120),
    });

    const nowIso = new Date().toISOString();
    const doc = normalizeStaffMember({
        id: makeId("staff"),
        uid: authUser.uid,
        name: input.name,
        phone: input.phone,
        address: input.address,
        email,
        roleLevel,
        roleNameSnapshot,
        status: statusByEnabled(toBool(input.enabled, true)),
        mustChangePassword: toBool(input.mustChangePassword, true),
        isRepairTechnician: toBool(input.isRepairTechnician, false),
        googleLinked: false,
        createdAt: nowIso,
        createdBy: operator.uid,
        updatedAt: nowIso,
        updatedBy: operator.uid,
        note: input.note,
    });

    await fbAdminDb.doc(`${staffMembersCollectionPath(operator.companyId)}/${doc.id}`).set(toFirestoreData(doc), { merge: false });
    await writeUserDocFromStaff({
        uid: authUser.uid,
        email: doc.email,
        companyId: operator.companyId,
        roleLevel: doc.roleLevel,
        operatorUid: operator.uid,
    });
    await createAuditLog({
        companyId: operator.companyId,
        module: "staff",
        action: "create",
        targetId: doc.id,
        targetType: "staffMember",
        metadata: { roleLevel: doc.roleLevel },
    });
    return doc;
}

export async function updateStaff(input: StaffUpdateInput): Promise<StaffMember> {
    const operator = await resolveOperator();
    const subject: PermissionSubject = {
        uid: operator.uid,
        roleLevel: operator.roleLevel,
        permissions: operator.permissions,
        isOwner: operator.isOwner,
    };
    if (!hasStaffPrivilege(subject, "edit")) throw new Error("Forbidden");

    const current = await findStaffById(operator.companyId, input.id);
    if (!current) throw new Error("Staff not found");

    const roleLevel = toLevel(input.roleLevel, current.roleLevel);
    const roleNameSnapshot = await loadRoleName(operator.companyId, roleLevel);
    const next = normalizeStaffMember({
        ...current,
        name: input.name,
        phone: input.phone,
        address: input.address,
        email: normalizeEmail(input.email),
        roleLevel,
        roleNameSnapshot,
        status: statusByEnabled(toBool(input.enabled, true)),
        mustChangePassword: toBool(input.mustChangePassword, current.mustChangePassword),
        isRepairTechnician: toBool(input.isRepairTechnician, current.isRepairTechnician),
        note: input.note,
        updatedAt: new Date().toISOString(),
        updatedBy: operator.uid,
    });

    await fbAdminDb.doc(`${staffMembersCollectionPath(operator.companyId)}/${next.id}`).set(toFirestoreData(next), { merge: true });
    if (next.uid) {
        await fbAdminAuth.updateUser(next.uid, {
            email: next.email,
            disabled: next.status !== "active",
            displayName: next.name,
        });
        await writeUserDocFromStaff({
            uid: next.uid,
            email: next.email,
            companyId: operator.companyId,
            roleLevel: next.roleLevel,
            operatorUid: operator.uid,
        });
    }

    await createAuditLog({
        companyId: operator.companyId,
        module: "staff",
        action: "update",
        targetId: next.id,
        targetType: "staffMember",
    });
    return next;
}

export async function deactivateStaff(id: string): Promise<StaffMember> {
    const operator = await resolveOperator();
    const subject: PermissionSubject = {
        uid: operator.uid,
        roleLevel: operator.roleLevel,
        permissions: operator.permissions,
        isOwner: operator.isOwner,
    };
    if (!hasStaffPrivilege(subject, "edit")) throw new Error("Forbidden");

    const current = await findStaffById(operator.companyId, id);
    if (!current) throw new Error("Staff not found");
    const next = normalizeStaffMember({
        ...current,
        status: "inactive",
        updatedAt: new Date().toISOString(),
        updatedBy: operator.uid,
    });
    await fbAdminDb.doc(`${staffMembersCollectionPath(operator.companyId)}/${id}`).set(toFirestoreData(next), { merge: true });
    if (current.uid) {
        await fbAdminAuth.updateUser(current.uid, { disabled: true });
    }
    await createAuditLog({
        companyId: operator.companyId,
        module: "staff",
        action: "deactivate",
        targetId: id,
        targetType: "staffMember",
    });
    return next;
}

export async function softDeleteStaff(input: StaffDeleteInput): Promise<StaffMember> {
    const operator = await resolveOperator();
    const subject: PermissionSubject = {
        uid: operator.uid,
        roleLevel: operator.roleLevel,
        permissions: operator.permissions,
        isOwner: operator.isOwner,
    };
    const security = await getSecuritySettings(operator.companyId);
    if (!canDelete(subject, "staff", security)) throw new Error("Forbidden");
    if (security.requireReasonOnDelete && !toText(input.reason, 2000)) throw new Error("Delete reason required");
    if (!security.deleteButtonEnabled && security.requirePasswordWhenDeleteDisabled && !toText(input.confirmPassword, 120)) {
        throw new Error("Manager password required for delete unlock");
    }

    const current = await findStaffById(operator.companyId, input.id);
    if (!current) throw new Error("Staff not found");
    const deletedMeta = withSoftDeleted(current, {
        by: operator.uid,
        reason: toText(input.reason, 2000),
    });
    const next = normalizeStaffMember({
        ...current,
        ...deletedMeta,
        status: "deleted",
        updatedAt: new Date().toISOString(),
        updatedBy: operator.uid,
    });

    await fbAdminDb.doc(`${staffMembersCollectionPath(operator.companyId)}/${input.id}`).set(toFirestoreData(next), { merge: true });
    await createDeleteLog({
        companyId: operator.companyId,
        module: "staff",
        targetId: next.id,
        targetType: "staffMember",
        targetLabel: next.name,
        snapshot: next as unknown as Record<string, unknown>,
        deleteReason: input.reason,
        deletedBy: operator.uid,
        deletedByName: operator.name,
        canRestore: true,
        canHardDelete: true,
    });
    await createAuditLog({
        companyId: operator.companyId,
        module: "staff",
        action: "soft_delete",
        targetId: next.id,
        targetType: "staffMember",
        reason: input.reason,
    });
    return next;
}

export async function restoreStaff(input: {
    deleteLogId: string;
    restoreReason?: string;
    restoreMode?: "active" | "inactive";
    resetPassword?: boolean;
    requirePasswordChange?: boolean;
}): Promise<StaffMember | null> {
    const operator = await resolveOperator();
    const log = await restoreDeletedRecord({
        companyId: operator.companyId,
        deleteLogId: input.deleteLogId,
        restoreReason: input.restoreReason,
        restoreMode: input.restoreMode,
        resetPassword: input.resetPassword,
        requirePasswordChange: input.requirePasswordChange,
    });
    return findStaffById(operator.companyId, log.targetId);
}

export async function hardDeleteStaff(input: {
    deleteLogId: string;
    reason?: string;
    authorizationPassword?: string;
}): Promise<void> {
    const operator = await resolveOperator();
    await hardDeleteRecord({
        companyId: operator.companyId,
        deleteLogId: input.deleteLogId,
        reason: input.reason,
        authorizationPassword: input.authorizationPassword,
    });
}

export async function resetStaffPassword(input: {
    id: string;
    newPassword: string;
    requirePasswordChange?: boolean;
}): Promise<StaffMember> {
    const operator = await resolveOperator();
    const subject: PermissionSubject = {
        uid: operator.uid,
        roleLevel: operator.roleLevel,
        permissions: operator.permissions,
        isOwner: operator.isOwner,
    };
    if (!hasStaffPrivilege(subject, "resetPassword")) throw new Error("Forbidden");

    const current = await findStaffById(operator.companyId, input.id);
    if (!current?.uid) throw new Error("Staff not found");
    const password = toText(input.newPassword, 120);
    if (password.length < 8) throw new Error("Password too short");

    await fbAdminAuth.updateUser(current.uid, { password });
    const next = normalizeStaffMember({
        ...current,
        mustChangePassword: toBool(input.requirePasswordChange, true),
        passwordResetAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: operator.uid,
    });
    await fbAdminDb.doc(`${staffMembersCollectionPath(operator.companyId)}/${input.id}`).set(toFirestoreData(next), { merge: true });
    await createAuditLog({
        companyId: operator.companyId,
        module: "staff",
        action: "reset_password",
        targetId: input.id,
        targetType: "staffMember",
    });
    return next;
}

export async function linkStaffGoogleAccount(input: {
    id: string;
    googleEmail: string;
    googleUid: string;
}): Promise<StaffMember> {
    const operator = await resolveOperator();
    const subject: PermissionSubject = {
        uid: operator.uid,
        roleLevel: operator.roleLevel,
        permissions: operator.permissions,
        isOwner: operator.isOwner,
    };
    const current = await findStaffById(operator.companyId, input.id);
    if (!current) throw new Error("Staff not found");
    const selfOperator = current.uid === operator.uid || current.email.toLowerCase() === operator.email.toLowerCase();
    if (!hasStaffPrivilege(subject, "edit") && !selfOperator) throw new Error("Forbidden");
    const googleEmail = normalizeEmail(input.googleEmail);
    if (!googleEmail || googleEmail !== current.email) {
        throw new Error("Google email must match staff primary email");
    }
    const duplicate = await fbAdminDb
        .collection(staffMembersCollectionPath(operator.companyId))
        .where("googleEmail", "==", googleEmail)
        .limit(5)
        .get();
    if (!duplicate.empty && duplicate.docs.some((doc) => doc.id !== current.id)) {
        throw new Error("Google account already linked by another staff member");
    }

    const next = normalizeStaffMember({
        ...current,
        googleLinked: true,
        googleEmail,
        googleUid: toText(input.googleUid, 200),
        updatedAt: new Date().toISOString(),
        updatedBy: operator.uid,
    });
    await fbAdminDb.doc(`${staffMembersCollectionPath(operator.companyId)}/${input.id}`).set(toFirestoreData(next), { merge: true });
    await createAuditLog({
        companyId: operator.companyId,
        module: "staff",
        action: "google_link",
        targetId: input.id,
        targetType: "staffMember",
    });
    return next;
}

export async function unlinkStaffGoogleAccount(id: string): Promise<StaffMember> {
    const operator = await resolveOperator();
    const subject: PermissionSubject = {
        uid: operator.uid,
        roleLevel: operator.roleLevel,
        permissions: operator.permissions,
        isOwner: operator.isOwner,
    };
    const current = await findStaffById(operator.companyId, id);
    if (!current) throw new Error("Staff not found");
    const selfOperator = current.uid === operator.uid || current.email.toLowerCase() === operator.email.toLowerCase();
    if (!hasStaffPrivilege(subject, "edit") && !selfOperator) throw new Error("Forbidden");
    const next = normalizeStaffMember({
        ...current,
        googleLinked: false,
        googleEmail: undefined,
        googleUid: undefined,
        updatedAt: new Date().toISOString(),
        updatedBy: operator.uid,
    });
    await fbAdminDb.doc(`${staffMembersCollectionPath(operator.companyId)}/${id}`).set(toFirestoreData(next), { merge: true });
    await createAuditLog({
        companyId: operator.companyId,
        module: "staff",
        action: "google_unlink",
        targetId: id,
        targetType: "staffMember",
    });
    return next;
}

export async function getStaffLoginGuardByEmail(emailInput: string): Promise<{
    id: string;
    uid?: string;
    email: string;
    companyId: string;
    status: StaffMember["status"];
    mustChangePassword: boolean;
    googleLinked: boolean;
    googleEmail?: string;
    isDeleted: boolean;
} | null> {
    const email = normalizeEmail(emailInput);
    if (!email) return null;

    let snap;
    try {
        snap = await fbAdminDb.collectionGroup("staffMembers").where("email", "==", email).limit(20).get();
    } catch (error) {
        if (isFirestoreFailedPrecondition(error)) return null;
        throw error;
    }
    if (snap.empty) return null;

    const docs = snap.docs.map((doc) => {
        const raw = doc.data() as Partial<StaffMember>;
        const data = normalizeStaffMember({
            id: doc.id,
            email: normalizeEmail(raw.email),
            ...raw,
        });
        const parent = doc.ref.parent.parent;
        const companyId = parent ? toText(parent.id, 120) : "";
        return { data, companyId };
    });

    const sorted = docs.sort((a, b) => {
        if (a.data.status === "active" && b.data.status !== "active") return -1;
        if (b.data.status === "active" && a.data.status !== "active") return 1;
        return Date.parse(b.data.updatedAt) - Date.parse(a.data.updatedAt);
    });
    const target = sorted[0];
    if (!target) return null;
    return {
        id: target.data.id,
        uid: target.data.uid,
        email: target.data.email,
        companyId: target.companyId,
        status: target.data.status,
        mustChangePassword: target.data.mustChangePassword,
        googleLinked: target.data.googleLinked,
        googleEmail: target.data.googleEmail,
        isDeleted: target.data.isDeleted || target.data.deleteStatus === "soft_deleted",
    };
}

export async function markStaffLoginSuccess(input: { uid: string; email: string }): Promise<void> {
    const uid = toText(input.uid, 200);
    const email = normalizeEmail(input.email);
    if (!uid && !email) return;

    try {
        const byUid = uid ? await fbAdminDb.collectionGroup("staffMembers").where("uid", "==", uid).limit(5).get() : null;
        const byEmail = !byUid || byUid.empty ? await fbAdminDb.collectionGroup("staffMembers").where("email", "==", email).limit(5).get() : byUid;
        if (!byEmail || byEmail.empty) return;

        const nowIso = new Date().toISOString();
        await Promise.all(
            byEmail.docs.map((doc) =>
                doc.ref.set(
                    toFirestoreData({
                        lastLoginAt: nowIso,
                        updatedAt: nowIso,
                        updatedBy: uid || "system",
                    }),
                    { merge: true },
                ),
            ),
        );
    } catch {
        // Login success should not be blocked by optional staff login audit updates.
        return;
    }
}

export async function getCurrentStaffProfile(): Promise<StaffMember | null> {
    const membership = await getCurrentStaffMembership();
    return membership?.staff ?? null;
}

async function findStaffMembershipForSession(params: { uid: string; email: string; userDoc: UserDoc | null }): Promise<CurrentStaffMembership | null> {
    const normalizedEmail = params.email.toLowerCase();
    const companyId = normalizeCompanyId(getUserCompanyId(params.userDoc, params.uid));
    const byUid =
        companyId !== null ? await fbAdminDb.collection(staffMembersCollectionPath(companyId)).where("uid", "==", params.uid).limit(1).get() : null;
    const byEmail =
        companyId !== null && (byUid === null || byUid.empty)
            ? await fbAdminDb.collection(staffMembersCollectionPath(companyId)).where("email", "==", normalizedEmail).limit(1).get()
            : byUid;
    let snapshot = byEmail;

    if (snapshot === null || snapshot.empty) {
        try {
            const globalByUid = await fbAdminDb.collectionGroup("staffMembers").where("uid", "==", params.uid).limit(1).get();
            snapshot = globalByUid.empty
                ? await fbAdminDb.collectionGroup("staffMembers").where("email", "==", normalizedEmail).limit(1).get()
                : globalByUid;
        } catch (error) {
            if (isFirestoreFailedPrecondition(error)) {
                return null;
            }
            throw error;
        }
    }

    if (!snapshot || snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const fallbackCompanyId = extractCompanyIdFromStaffPath(doc.ref.path);
    const resolvedCompanyId = companyId ?? fallbackCompanyId;
    if (!resolvedCompanyId) return null;
    const raw = doc.data() as Partial<StaffMember>;
    return {
        companyId: resolvedCompanyId,
        staff: normalizeStaffMember({
            id: doc.id,
            email: normalizeEmail(raw.email),
            ...raw,
        }),
    };
}

async function getCurrentStaffMembership(): Promise<CurrentStaffMembership | null> {
    const session = await getSessionUser();
    if (!session) return null;
    const userDoc = await getUserDoc(session.uid);
    return findStaffMembershipForSession({
        uid: session.uid,
        email: session.email,
        userDoc,
    });
}

export async function getCurrentSessionAccountContext(): Promise<CurrentSessionAccountContext | null> {
    const session = await getSessionUser();
    if (!session) return null;

    let userDoc = await getUserDoc(session.uid);
    const rawAccountType = toAccountType(userDoc?.role ?? null);
    const rawTenantId = normalizeCompanyId(getShowcaseTenantId(userDoc, session.uid));
    if (rawAccountType === "company") {
        return {
            userDoc,
            accountType: "company",
            tenantId: rawTenantId,
            staffProfile: null,
        };
    }

    const membership = await findStaffMembershipForSession({
        uid: session.uid,
        email: session.email,
        userDoc,
    });
    if (membership) {
        await writeUserDocFromStaff({
            uid: session.uid,
            email: membership.staff.email || session.email.toLowerCase(),
            companyId: membership.companyId,
            roleLevel: membership.staff.roleLevel,
            operatorUid: session.uid,
        });
        userDoc = await getUserDoc(session.uid);
        return {
            userDoc,
            accountType: "company",
            tenantId: membership.companyId,
            staffProfile: membership.staff,
        };
    }

    return {
        userDoc,
        accountType: rawAccountType,
        tenantId: rawTenantId,
        staffProfile: null,
    };
}

export async function markCurrentStaffPasswordChanged(): Promise<void> {
    const session = await getSessionUser();
    if (!session) throw new Error("Unauthorized");
    const userDoc = await getUserDoc(session.uid);
    const companyId = normalizeCompanyId(getUserCompanyId(userDoc, session.uid));
    if (!companyId) throw new Error("Company scope missing");

    const byUid = await fbAdminDb.collection(staffMembersCollectionPath(companyId)).where("uid", "==", session.uid).limit(1).get();
    const snapshot = byUid.empty
        ? await fbAdminDb.collection(staffMembersCollectionPath(companyId)).where("email", "==", session.email.toLowerCase()).limit(1).get()
        : byUid;
    if (snapshot.empty) return;
    const doc = snapshot.docs[0];
    await doc.ref.set(
        toFirestoreData({
            mustChangePassword: false,
            updatedAt: new Date().toISOString(),
            updatedBy: session.uid,
        }),
        { merge: true },
    );
}
