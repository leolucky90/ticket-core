import { NextResponse } from "next/server";
import { fbAdminAuth } from "@/lib/firebase-server";

const SESSION_DAYS = 14;
const SESSION_EXPIRES_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as { idToken?: string };
        if (!body.idToken) return NextResponse.json({ error: "Missing idToken" }, { status: 400 });

        const decoded = await fbAdminAuth.verifyIdToken(body.idToken);

        // ✅ Email/Password 必須驗證 email 才能建立 session（防攻擊）
        if (decoded.email && decoded.email_verified === false) {
            return NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 403 });
        }

        const sessionCookie = await fbAdminAuth.createSessionCookie(body.idToken, {
            expiresIn: SESSION_EXPIRES_MS,
        });

        const res = NextResponse.json({ ok: true });
        res.cookies.set("session", sessionCookie, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            maxAge: SESSION_EXPIRES_MS / 1000,
        });
        return res;
    } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
}

export async function DELETE() {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("session", "", { path: "/", maxAge: 0 });
    return res;
}