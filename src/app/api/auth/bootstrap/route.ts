import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { fbAdminAuth } from "@/lib/firebase-server";
import { ensureUserDoc, getShowcaseTenantId, toAccountType } from "@/lib/services/user.service";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";

export async function POST() {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const record = await fbAdminAuth.getUser(session.uid);
    const providers = (record.providerData ?? []).map((p) => p.providerId).filter(Boolean);

    const doc = await ensureUserDoc({
        uid: session.uid,
        email: session.email,
        providers,
        defaultRole: "customer",
    });

    const accountContext = await getCurrentSessionAccountContext();
    const accountType = accountContext?.accountType ?? toAccountType(doc.role);
    const tenantId = accountContext?.tenantId ?? getShowcaseTenantId(doc, session.uid);

    return NextResponse.json({ ok: true, user: doc, accountType, tenantId });
}
