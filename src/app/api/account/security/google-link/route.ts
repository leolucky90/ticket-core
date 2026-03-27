import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { fbAdminAuth } from "@/lib/firebase-server";
import { linkStaffGoogleAccount } from "@/lib/services/staff.service";

export async function POST(req: Request) {
    try {
        const session = await getSessionUser();
        if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

        const body = (await req.json()) as {
            idToken?: string;
            staffId?: string;
            googleEmail?: string;
            googleUid?: string;
        };
        if (!body.idToken || !body.staffId || !body.googleEmail || !body.googleUid) {
            return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
        }

        const decoded = await fbAdminAuth.verifyIdToken(body.idToken);
        if (!decoded.uid || decoded.uid !== session.uid) {
            return NextResponse.json({ error: "TOKEN_SESSION_MISMATCH" }, { status: 403 });
        }

        const staff = await linkStaffGoogleAccount({
            id: body.staffId,
            googleEmail: body.googleEmail,
            googleUid: body.googleUid,
        });
        return NextResponse.json({ ok: true, staff });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Google link failed";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

