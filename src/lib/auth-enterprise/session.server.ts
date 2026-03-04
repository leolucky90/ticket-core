import "server-only";
import { cookies } from "next/headers";
import { fbAdminAuth } from "@/lib/firebase-server";

export type SessionUser = { uid: string; email: string };

export async function getSessionUser(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;

    try {
        const decoded = await fbAdminAuth.verifySessionCookie(token, true);
        return { uid: decoded.uid, email: (decoded.email ?? "").toLowerCase() };
    } catch {
        return null;
    }
}