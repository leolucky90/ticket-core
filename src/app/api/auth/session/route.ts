import { NextResponse } from "next/server";
import { fbAdminAuth } from "@/lib/firebase-server";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import { getStaffLoginGuardByEmail, markStaffLoginSuccess } from "@/lib/services/staff.service";

const SESSION_DAYS = 14;
const SESSION_EXPIRES_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

function normalizeTenantId(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/[/?#]/.test(trimmed)) return null;
    return trimmed;
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as { idToken?: string; tenantId?: string };
        if (!body.idToken) {
            return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
        }
        const tenantId = normalizeTenantId(body.tenantId);

        // ✅ 真正會爆的地方通常在這裡：Admin SDK / env / project mismatch
        const decoded = await fbAdminAuth.verifyIdToken(body.idToken);

        if (decoded.email && decoded.email_verified === false) {
            return NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 403 });
        }

        if (tenantId) {
            const userDoc = await getUserDoc(decoded.uid);
            if (!userDoc) {
                return NextResponse.json({ error: "TENANT_USER_NOT_BOUND" }, { status: 403 });
            }

            if (toAccountType(userDoc.role) !== "customer") {
                return NextResponse.json({ error: "TENANT_LOGIN_FORBIDDEN" }, { status: 403 });
            }

            const boundTenantId = getShowcaseTenantId(userDoc, decoded.uid);
            if (!boundTenantId || boundTenantId !== tenantId) {
                return NextResponse.json({ error: "TENANT_SCOPE_MISMATCH" }, { status: 403 });
            }
        }

        const providerId = typeof decoded.firebase?.sign_in_provider === "string" ? decoded.firebase.sign_in_provider : "";
        const signInEmail = typeof decoded.email === "string" ? decoded.email.toLowerCase() : "";
        const staffGuard = signInEmail ? await getStaffLoginGuardByEmail(signInEmail) : null;
        if (staffGuard) {
            if (staffGuard.isDeleted || staffGuard.status === "deleted") {
                return NextResponse.json({ error: "STAFF_ACCOUNT_DELETED" }, { status: 403 });
            }
            if (staffGuard.status === "pending_activation") {
                return NextResponse.json({ error: "STAFF_ACCOUNT_NOT_ACTIVATED" }, { status: 403 });
            }
            if (staffGuard.status === "inactive") {
                return NextResponse.json({ error: "STAFF_ACCOUNT_INACTIVE" }, { status: 403 });
            }
            if (staffGuard.status === "locked") {
                return NextResponse.json({ error: "STAFF_ACCOUNT_LOCKED" }, { status: 403 });
            }
            if (providerId === "google.com" && !staffGuard.googleLinked) {
                return NextResponse.json({ error: "STAFF_GOOGLE_NOT_LINKED" }, { status: 403 });
            }
            if (providerId === "google.com" && staffGuard.googleLinked && staffGuard.googleEmail && signInEmail !== staffGuard.googleEmail.toLowerCase()) {
                return NextResponse.json({ error: "STAFF_GOOGLE_EMAIL_MISMATCH" }, { status: 403 });
            }
        }

        const sessionCookie = await fbAdminAuth.createSessionCookie(body.idToken, {
            expiresIn: SESSION_EXPIRES_MS,
        });

        await markStaffLoginSuccess({
            uid: decoded.uid,
            email: signInEmail,
        });

        const res = NextResponse.json({
            ok: true,
            mustChangePassword: Boolean(staffGuard?.mustChangePassword),
            googleLinked: Boolean(staffGuard?.googleLinked),
        });
        res.cookies.set("session", sessionCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: SESSION_EXPIRES_MS / 1000,
        });

        return res;
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[api/auth/session] error:", err);
        return NextResponse.json({ error: "SESSION_CREATE_FAILED", message }, { status: 500 });
    }
}

export async function DELETE() {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("session", "", { path: "/", maxAge: 0 });
    return res;
}
