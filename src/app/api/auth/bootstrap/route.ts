import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { fbAdminAuth } from "@/lib/firebase-server";
import { ensureUserDoc } from "@/lib/services/user.service";

export async function POST() {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const record = await fbAdminAuth.getUser(session.uid);
    const providers = (record.providerData ?? []).map((p) => p.providerId).filter(Boolean);

    const doc = await ensureUserDoc({
        uid: session.uid,
        email: session.email,
        providers,
    });

    return NextResponse.json({ ok: true, user: doc });
}