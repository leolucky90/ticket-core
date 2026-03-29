import { NextResponse } from "next/server";
import { poDraftSchema } from "@/lib/schema/ai/po-draft";
import { confirmPoDraft } from "@/lib/services/documents/confirm-po";
import { requireMerchantDocumentIntakeSession } from "@/lib/services/documents/document-intake-session";

export async function POST(req: Request) {
    const session = await requireMerchantDocumentIntakeSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const record = body as { draftId?: unknown; poDraft?: unknown };
    const draftId = typeof record.draftId === "string" ? record.draftId : "";
    if (!draftId) {
        return NextResponse.json({ error: "draftId required" }, { status: 400 });
    }

    let poDraftParsed = null;
    if (record.poDraft !== undefined && record.poDraft !== null) {
        const parsed = poDraftSchema.safeParse(record.poDraft);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid poDraft payload" }, { status: 400 });
        }
        poDraftParsed = parsed.data;
    }

    try {
        const result = await confirmPoDraft({
            companyId: session.companyId,
            draftId,
            poDraftSnapshot: poDraftParsed,
            confirmedByUid: session.uid,
        });
        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Confirm failed";
        const status = message === "Draft not found" ? 404 : message === "Draft already confirmed" ? 409 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
