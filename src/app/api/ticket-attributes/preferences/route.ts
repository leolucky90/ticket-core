import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import {
    getTicketAttributePreferences,
    saveTicketAttributePreferences,
} from "@/lib/services/ticketAttributes";

type UpdateTicketAttributePreferencesBody = {
    caseStatuses?: unknown;
    quoteStatuses?: unknown;
};

export async function GET() {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userDoc = await getUserDoc(session.uid);
    if (toAccountType(userDoc?.role ?? null) !== "company") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenantId = getShowcaseTenantId(userDoc, session.uid);
    if (!tenantId) return NextResponse.json({ error: "Missing company tenant id" }, { status: 400 });

    const preferences = await getTicketAttributePreferences({ tenantId });
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

    let body: UpdateTicketAttributePreferencesBody;
    try {
        body = (await req.json()) as UpdateTicketAttributePreferencesBody;
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (body.caseStatuses === undefined && body.quoteStatuses === undefined) {
        return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
    }

    const preferences = await saveTicketAttributePreferences({
        tenantId,
        updatedBy: session.uid,
        caseStatuses: body.caseStatuses,
        quoteStatuses: body.quoteStatuses,
    });

    return NextResponse.json({ ok: true, preferences });
}
