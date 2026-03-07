import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import { getShowcasePreferences, saveShowcasePreferences } from "@/features/showcase/services/showcasePreferences.server";

type UpdateShowcasePreferencesBody = {
    themeColors?: unknown;
    content?: unknown;
};

export async function GET() {
    const session = await getSessionUser();
    let tenantId: string | null = null;

    if (session) {
        const userDoc = await getUserDoc(session.uid);
        tenantId = getShowcaseTenantId(userDoc, session.uid);
    }

    const preferences = await getShowcasePreferences({ tenantId });
    return NextResponse.json({ ok: true, preferences });
}

export async function PUT(req: Request) {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userDoc = await getUserDoc(session.uid);
    if (toAccountType(userDoc?.role ?? null) !== "company") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const tenantId = getShowcaseTenantId(userDoc, session.uid);
    if (!tenantId) return NextResponse.json({ error: "Missing company tenant id" }, { status: 400 });

    let body: UpdateShowcasePreferencesBody;
    try {
        body = (await req.json()) as UpdateShowcasePreferencesBody;
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (body.themeColors === undefined && body.content === undefined) {
        return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
    }

    const preferences = await saveShowcasePreferences({
        tenantId,
        updatedBy: session.uid,
        themeColors: body.themeColors,
        content: body.content,
    });

    return NextResponse.json({ ok: true, preferences });
}
