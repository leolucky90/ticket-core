import "server-only";
import { fbAdminDb } from "@/lib/firebase-server";
import { hasLevel, hasPermission, type PermissionSubject } from "@/lib/permissions";
import { normalizeSecuritySettings, securitySettingsDocPath, type SecuritySettings } from "@/lib/schema";
import { requireCompanyOperator } from "@/lib/services/access-control";
import { resolveUserPermissions } from "@/lib/services/permission-level.service";

async function resolvePermissionSubject(companyId: string): Promise<PermissionSubject> {
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

export async function getSecuritySettings(companyIdInput?: string): Promise<SecuritySettings> {
    const operator = await requireCompanyOperator();
    const companyId = companyIdInput?.trim() || operator.companyId!;
    const subject = await resolvePermissionSubject(companyId);
    if (!hasPermission(subject, "security.deleteControl.view") && !hasLevel(subject, 8)) {
        throw new Error("Forbidden: security settings view");
    }

    const path = securitySettingsDocPath(companyId);
    const snap = await fbAdminDb.doc(path).get();
    const data = snap.exists ? (snap.data() as Partial<SecuritySettings>) : null;
    const next = normalizeSecuritySettings(data, operator.uid);

    if (!snap.exists) {
        await fbAdminDb.doc(path).set(next, { merge: true });
    }

    return next;
}

export async function updateSecuritySettings(input: {
    companyId?: string;
    patch: Partial<SecuritySettings>;
}): Promise<SecuritySettings> {
    const operator = await requireCompanyOperator();
    const companyId = input.companyId?.trim() || operator.companyId!;
    const subject = await resolvePermissionSubject(companyId);
    if (!hasPermission(subject, "security.deleteControl.edit") && !hasLevel(subject, 8)) {
        throw new Error("Forbidden: security settings edit");
    }

    const path = securitySettingsDocPath(companyId);
    const snap = await fbAdminDb.doc(path).get();
    const current = normalizeSecuritySettings(snap.exists ? (snap.data() as Partial<SecuritySettings>) : null, operator.uid);
    const next = normalizeSecuritySettings(
        {
            ...current,
            ...input.patch,
            updatedAt: new Date().toISOString(),
            updatedBy: operator.uid,
        },
        operator.uid,
    );

    await fbAdminDb.doc(path).set(next, { merge: true });
    return next;
}

