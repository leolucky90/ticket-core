import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { unlinkStaffGoogleAccount } from "@/lib/services/staff.service";

export async function POST(req: Request) {
    try {
        const session = await getSessionUser();
        if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
        const body = (await req.json()) as { staffId?: string };
        if (!body.staffId) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

        const staff = await unlinkStaffGoogleAccount(body.staffId);
        return NextResponse.json({ ok: true, staff });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Google unlink failed";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

