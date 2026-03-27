export const STAFF_PERMISSION_KEYS = [
    "staff.view",
    "staff.create",
    "staff.edit",
    "staff.delete",
    "staff.resetPassword",
    "staff.deleted.view",
    "staff.restore",
    "staff.hardDelete",
] as const;

export const SECURITY_PERMISSION_KEYS = [
    "security.deleteControl.view",
    "security.deleteControl.edit",
] as const;

export const DELETE_LOG_PERMISSION_KEYS = [
    "deleteLogs.view",
    "deleteLogs.restore",
    "deleteLogs.hardDelete",
] as const;

export const GENERAL_PERMISSION_KEYS = [
    "dashboard.view",
    "settings.view",
    "settings.edit",
    "products.view",
    "products.delete",
    "inventory.edit",
    "customers.delete",
    "campaigns.manage",
    "reports.export",
] as const;

export const HARD_DELETE_AUTHORIZATION_KEY = "hard_delete_authorized";

export const ALL_PERMISSION_KEYS = [
    ...STAFF_PERMISSION_KEYS,
    ...SECURITY_PERMISSION_KEYS,
    ...DELETE_LOG_PERMISSION_KEYS,
    ...GENERAL_PERMISSION_KEYS,
    HARD_DELETE_AUTHORIZATION_KEY,
] as const;

export type PermissionKey = (typeof ALL_PERMISSION_KEYS)[number] | `${string}.${string}`;

