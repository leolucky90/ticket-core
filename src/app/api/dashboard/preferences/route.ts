import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import {
    getDashboardPreferences,
    saveDashboardPreferences,
} from "@/features/dashboard/services/dashboardPreferences.server";

type UpdateDashboardPreferencesBody = {
    theme?: unknown;
};

export async function GET() {
    const session = await getSessionUser();
    if (!session) {
        const preferences = await getDashboardPreferences({ tenantId: null });
        return NextResponse.json({ ok: true, preferences });
    }

    const userDoc = await getUserDoc(session.uid);
    const tenantId = getShowcaseTenantId(userDoc, session.uid);
    const preferences = await getDashboardPreferences({ tenantId });
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

    let body: UpdateDashboardPreferencesBody;
    try {
        body = (await req.json()) as UpdateDashboardPreferencesBody;
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (body.theme === undefined) {
        return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
    }

    const preferences = await saveDashboardPreferences({
        tenantId,
        updatedBy: session.uid,
        theme: body.theme,
    });

    return NextResponse.json({ ok: true, preferences });
}
