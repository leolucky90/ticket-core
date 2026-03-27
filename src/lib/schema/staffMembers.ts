import { createSoftDeleteMeta, normalizeSoftDeleteMeta, type SoftDeleteMeta } from "@/lib/schema/softDelete";

export const STAFF_MEMBER_STATUSES = ["active", "inactive", "pending_activation", "locked", "deleted"] as const;

export type StaffMemberStatus = (typeof STAFF_MEMBER_STATUSES)[number];

export type StaffMember = SoftDeleteMeta & {
    id: string;
    uid?: string;
    name: string;
    phone: string;
    address: string;
    email: string;
    roleLevel: number;
    roleNameSnapshot: string;
    status: StaffMemberStatus;
    mustChangePassword: boolean;
    isRepairTechnician: boolean;
    googleLinked: boolean;
    googleEmail?: string;
    googleUid?: string;
    lastLoginAt?: string;
    passwordResetAt?: string;
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
    note?: string;
};

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toIso(value: unknown, fallback?: string): string {
    if (typeof value === "string" && value.trim()) {
        const ts = Date.parse(value);
        if (Number.isFinite(ts)) return new Date(ts).toISOString();
    }
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return new Date(Math.round(value)).toISOString();
    }
    if (fallback) return fallback;
    return new Date().toISOString();
}

function toEmail(value: unknown): string {
    return toText(value, 160).toLowerCase();
}

function toBool(value: unknown, fallback: boolean): boolean {
    if (typeof value === "boolean") return value;
    return fallback;
}

function toLevel(value: unknown, fallback: number): number {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    if (n < 1) return 1;
    if (n > 9) return 9;
    return Math.round(n);
}

function toStatus(value: unknown, fallback: StaffMemberStatus = "active"): StaffMemberStatus {
    if (value === "inactive") return "inactive";
    if (value === "pending_activation") return "pending_activation";
    if (value === "locked") return "locked";
    if (value === "deleted") return "deleted";
    if (value === "active") return "active";
    return fallback;
}

export function staffMembersCollectionPath(companyId: string): string {
    return `companies/${toText(companyId, 120)}/staffMembers`;
}

export function normalizeStaffMember(input: Partial<StaffMember> & Pick<StaffMember, "id" | "email">): StaffMember {
    const nowIso = new Date().toISOString();
    const createdAt = toIso(input.createdAt, nowIso);
    const softDelete = normalizeSoftDeleteMeta(input);
    const statusFallback: StaffMemberStatus = softDelete.isDeleted ? "deleted" : "active";

    return {
        ...createSoftDeleteMeta(),
        ...softDelete,
        id: toText(input.id, 120),
        uid: toText(input.uid, 160) || undefined,
        name: toText(input.name, 120) || "未命名員工",
        phone: toText(input.phone, 64),
        address: toText(input.address, 360),
        email: toEmail(input.email),
        roleLevel: toLevel(input.roleLevel, 1),
        roleNameSnapshot: toText(input.roleNameSnapshot, 120) || "Lv1",
        status: toStatus(input.status, statusFallback),
        mustChangePassword: toBool(input.mustChangePassword, false),
        isRepairTechnician: toBool(input.isRepairTechnician, false),
        googleLinked: toBool(input.googleLinked, false),
        googleEmail: toEmail(input.googleEmail) || undefined,
        googleUid: toText(input.googleUid, 200) || undefined,
        lastLoginAt: toText(input.lastLoginAt, 60) || undefined,
        passwordResetAt: toText(input.passwordResetAt, 60) || undefined,
        createdAt,
        createdBy: toText(input.createdBy, 160) || "system",
        updatedAt: toIso(input.updatedAt, createdAt),
        updatedBy: toText(input.updatedBy, 160) || "system",
        note: toText(input.note, 2000) || undefined,
    };
}
