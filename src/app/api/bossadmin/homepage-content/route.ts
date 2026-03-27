import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
    getBusinessHomepageContentPreferences,
    saveBusinessHomepageContentPreferences,
} from "@/features/business/services/businessHomepageContent.server";
import { BOSS_ADMIN_COOKIE, BOSS_ADMIN_EMAIL, isBossAdminAuthed } from "@/lib/services/bossadmin-auth";

type UpdateBusinessHomepageContentBody = {
    content?: unknown;
};

async function ensureBossAdmin() {
    const cookieStore = await cookies();
    const isAuthed = isBossAdminAuthed(cookieStore.get(BOSS_ADMIN_COOKIE)?.value);
    return isAuthed;
}

export async function GET() {
    if (!(await ensureBossAdmin())) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await getBusinessHomepageContentPreferences();
    return NextResponse.json({ ok: true, preferences });
}

export async function PUT(req: Request) {
    if (!(await ensureBossAdmin())) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: UpdateBusinessHomepageContentBody;
    try {
        body = (await req.json()) as UpdateBusinessHomepageContentBody;
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (body.content === undefined) {
        return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
    }

    const preferences = await saveBusinessHomepageContentPreferences({
        updatedBy: BOSS_ADMIN_EMAIL,
        content: body.content,
    });

    return NextResponse.json({ ok: true, preferences });
}
