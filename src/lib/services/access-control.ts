import "server-only";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { fbAdminDb } from "@/lib/firebase-server";
import { normalizeCompanyId } from "@/lib/tenant-scope";
import { getUserCompanyId, getUserDoc, toAccountType } from "@/lib/services/user.service";

export type OperatorContext = {
    uid: string;
    email: string;
    operatorName: string;
    accountType: "company" | "customer";
    companyId: string | null;
    roleLevel: number;
    isOwner: boolean;
    staffMemberId?: string;
};

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function mapRoleToLevel(role: unknown): number {
    if (role === "super_admin" || role === "owner") return 9;
    if (role === "company_admin") return 8;
    if (role === "manager") return 7;
    if (role === "staff") return 5;
    if (role === "viewer") return 2;
    return 1;
}

async function findStaffMember(companyId: string, uid: string, email: string): Promise<{ id: string; roleLevel: number; name: string } | null> {
    const byUid = await fbAdminDb.collection(`companies/${companyId}/staffMembers`).where("uid", "==", uid).limit(1).get();
    if (!byUid.empty) {
        const first = byUid.docs[0];
        const data = first.data() as Record<string, unknown>;
        const level = Number(data.roleLevel);
        return {
            id: first.id,
            roleLevel: Number.isFinite(level) ? Math.min(9, Math.max(1, Math.round(level))) : 1,
            name: toText(data.name, 120) || toText(email.split("@")[0], 120) || "Staff",
        };
    }

    const byEmail = await fbAdminDb.collection(`companies/${companyId}/staffMembers`).where("email", "==", email.toLowerCase()).limit(1).get();
    if (!byEmail.empty) {
        const first = byEmail.docs[0];
        const data = first.data() as Record<string, unknown>;
        const level = Number(data.roleLevel);
        return {
            id: first.id,
            roleLevel: Number.isFinite(level) ? Math.min(9, Math.max(1, Math.round(level))) : 1,
            name: toText(data.name, 120) || toText(email.split("@")[0], 120) || "Staff",
        };
    }

    return null;
}

export async function resolveOperatorContext(): Promise<OperatorContext | null> {
    const session = await getSessionUser();
    if (!session) return null;

    const userDoc = await getUserDoc(session.uid);
    const accountType = toAccountType(userDoc?.role ?? null);
    const companyId = normalizeCompanyId(getUserCompanyId(userDoc, session.uid));
    const roleLevel = mapRoleToLevel(userDoc?.role);
    const isOwner = userDoc?.role === "owner" || userDoc?.role === "super_admin";
    const fallbackName = toText(session.email.split("@")[0], 120) || "Operator";

    if (!companyId) {
        return {
            uid: session.uid,
            email: session.email.toLowerCase(),
            operatorName: fallbackName,
            accountType,
            companyId: null,
            roleLevel,
            isOwner,
        };
    }

    const staff = await findStaffMember(companyId, session.uid, session.email);
    return {
        uid: session.uid,
        email: session.email.toLowerCase(),
        operatorName: staff?.name || fallbackName,
        accountType,
        companyId,
        roleLevel: staff?.roleLevel ?? roleLevel,
        isOwner,
        staffMemberId: staff?.id,
    };
}

export async function requireCompanyOperator(): Promise<OperatorContext> {
    const context = await resolveOperatorContext();
    if (!context?.companyId) {
        throw new Error("Unauthorized: company operator required");
    }
    return context;
}
