import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

// https://firebase.google.com/docs/auth/admin/manage-cookies
const SESSION_DAYS = 14;
const SESSION_EXPIRES_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as { idToken?: string };
        if (!body.idToken) {
            return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
        }

        const decoded = await adminAuth.verifyIdToken(body.idToken);

        // ✅ 防攻擊/防濫用核心：Email/Password 註冊必須完成驗證才允許建立 session
        // Google provider 通常會是 verified（仍以 decoded 為準）
        if (decoded.email && decoded.email_verified === false) {
            return NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 403 });
        }

        const sessionCookie = await adminAuth.createSessionCookie(body.idToken, {
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