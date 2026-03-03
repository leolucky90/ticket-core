import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export type SessionRole =
    | "super_admin"
    | "owner"
    | "company_admin"
    | "manager"
    | "staff"
    | "viewer";

export type SessionUser = {
    uid: string;
    email: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;

    try {
        const decoded = await adminAuth.verifySessionCookie(token, true);
        return {
            uid: decoded.uid,
            email: (decoded.email ?? "").toLowerCase(),
        };
    } catch {
        return null;
    }
}

export function canAccessRole(userRole: SessionRole, minRole: SessionRole) {
    const order: SessionRole[] = [
        "viewer",
        "staff",
        "manager",
        "company_admin",
        "owner",
        "super_admin",
    ];
    return order.indexOf(userRole) >= order.indexOf(minRole);
}