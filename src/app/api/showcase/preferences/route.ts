import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcasePreferences, saveShowcasePreferences } from "@/features/showcase/services/showcasePreferences.server";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";

type UpdateShowcasePreferencesBody = {
    themeColors?: unknown;
    storefront?: unknown;
    content?: unknown;
};

export async function GET() {
    const accountContext = await getCurrentSessionAccountContext();
    const tenantId = accountContext?.tenantId ?? null;

    const preferences = await getShowcasePreferences({ tenantId });
    return NextResponse.json({ ok: true, preferences });
}

export async function PUT(req: Request) {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const accountContext = await getCurrentSessionAccountContext();
    if (accountContext?.accountType !== "company") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const tenantId = accountContext.tenantId;
    if (!tenantId) return NextResponse.json({ error: "Missing company tenant id" }, { status: 400 });

    let body: UpdateShowcasePreferencesBody;
    try {
        body = (await req.json()) as UpdateShowcasePreferencesBody;
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (body.themeColors === undefined && body.storefront === undefined && body.content === undefined) {
        return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
    }

    try {
        const preferences = await saveShowcasePreferences({
            tenantId,
            updatedBy: session.uid,
            themeColors: body.themeColors,
            storefront: body.storefront,
            content: body.content,
        });

        return NextResponse.json({ ok: true, preferences });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Save failed";
        console.error("[showcase/preferences] save failed", {
            tenantId,
            accountType: accountContext.accountType,
            uid: session.uid,
            message,
        });
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
