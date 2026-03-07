import { NextResponse } from "next/server";
import { fbAdminAuth } from "@/lib/firebase-server";
import { ensureUserDoc } from "@/lib/services/user.service";

type RegisterProfileBody = {
    idToken?: string;
    accountType?: "customer" | "company";
};

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as RegisterProfileBody;
        const idToken = (body.idToken ?? "").trim();
        const accountType = body.accountType === "company" ? "company" : "customer";
        if (!idToken) return NextResponse.json({ error: "Missing idToken" }, { status: 400 });

        const decoded = await fbAdminAuth.verifyIdToken(idToken);
        const record = await fbAdminAuth.getUser(decoded.uid);
        const providers = (record.providerData ?? []).map((p) => p.providerId).filter(Boolean);

        const role = accountType === "company" ? "company_admin" : "customer";
        const doc = await ensureUserDoc({
            uid: decoded.uid,
            email: (decoded.email ?? record.email ?? "").toLowerCase(),
            providers,
            defaultRole: role,
        });

        return NextResponse.json({ ok: true, user: doc });
    } catch {
        return NextResponse.json({ error: "Unable to setup profile" }, { status: 400 });
    }
}
