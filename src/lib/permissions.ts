import type { SecuritySettings } from "@/lib/schema";
import { HARD_DELETE_AUTHORIZATION_KEY, type PermissionKey } from "@/lib/permissionKeys";

export type PermissionSubject = {
    uid: string;
    roleLevel: number;
    permissions: string[];
    isOwner?: boolean;
};

export type PermissionModule = "staff" | "products" | "inventory" | "customers" | "tickets" | "campaigns" | "settings" | "deleteLogs";

function normalizePermissionKey(value: string): string {
    return value.trim().toLowerCase();
}

export function hasPermission(user: PermissionSubject | null | undefined, permission: PermissionKey | string): boolean {
    if (!user) return false;
    const target = normalizePermissionKey(permission);
    return user.permissions.some((item) => normalizePermissionKey(item) === target);
}

export function hasLevel(user: PermissionSubject | null | undefined, level: number): boolean {
    if (!user) return false;
    return user.roleLevel >= level;
}

export function canResetPassword(user: PermissionSubject | null | undefined): boolean {
    return hasPermission(user, "staff.resetPassword") || hasLevel(user, 8);
}

export function canDelete(
    user: PermissionSubject | null | undefined,
    module: PermissionModule,
    settings: SecuritySettings,
): boolean {
    if (!user) return false;
    const moduleDeleteKey = `${module}.delete` as PermissionKey;
    if (hasPermission(user, moduleDeleteKey)) return true;
    if (module === "staff" && hasPermission(user, "staff.delete")) return true;
    if (module === "deleteLogs" && hasPermission(user, "deleteLogs.hardDelete")) return true;
    return hasLevel(user, settings.allowLevelToDeleteFrom);
}

export function canRestore(
    user: PermissionSubject | null | undefined,
    module: PermissionModule,
    settings: SecuritySettings,
): boolean {
    if (!user || !settings.restoreEnabled) return false;
    if (module === "staff") {
        return hasPermission(user, "staff.restore") || hasLevel(user, settings.employeeRestoreLevel);
    }
    if (hasPermission(user, `${module}.restore` as PermissionKey)) return true;
    if (hasPermission(user, "deleteLogs.restore")) return true;
    return hasLevel(user, 5);
}

export function canHardDelete(
    user: PermissionSubject | null | undefined,
    module: PermissionModule,
    settings: SecuritySettings,
): boolean {
    if (!user || !settings.hardDeleteEnabled) return false;
    if (module === "staff") {
        if (settings.employeeStrictOwnerOnly) {
            return hasLevel(user, 9) || hasPermission(user, "staff.hardDelete") || Boolean(user.isOwner);
        }
        return hasLevel(user, settings.employeeHardDeleteLevel) || hasPermission(user, "staff.hardDelete");
    }

    if (hasPermission(user, HARD_DELETE_AUTHORIZATION_KEY)) return true;
    if (hasPermission(user, `${module}.hardDelete` as PermissionKey)) return true;
    if (hasPermission(user, "deleteLogs.hardDelete")) return true;
    return hasLevel(user, settings.allowLevelToHardDeleteFrom);
}
