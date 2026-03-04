import { NextResponse } from "next/server";
import { fbAdminAuth } from "@/lib/firebase-server";

const SESSION_DAYS = 14;
const SESSION_EXPIRES_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as { idToken?: string };
        if (!body.idToken) {
            return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
        }

        // ✅ 真正會爆的地方通常在這裡：Admin SDK / env / project mismatch
        const decoded = await fbAdminAuth.verifyIdToken(body.idToken);

        if (decoded.email && decoded.email_verified === false) {
            return NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 403 });
        }

        const sessionCookie = await fbAdminAuth.createSessionCookie(body.idToken, {
            expiresIn: SESSION_EXPIRES_MS,
        });

        const res = NextResponse.json({ ok: true });
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