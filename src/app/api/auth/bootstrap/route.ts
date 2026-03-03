import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session.server";
import { adminAuth } from "@/lib/firebase/admin";
import { ensureUserDoc } from "@/lib/services/user.service";

export async function POST() {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const record = await adminAuth.getUser(user.uid);
    const providers = (record.providerData ?? [])
        .map((p) => p.providerId)
        .filter(Boolean);

    const doc = await ensureUserDoc({
        uid: user.uid,
        email: user.email,
        providers,
    });

    return NextResponse.json({ ok: true, user: doc });
}