import { NextResponse } from "next/server";
import { poDraftSchema } from "@/lib/schema/ai/po-draft";
import { requireMerchantDocumentIntakeSession } from "@/lib/services/documents/document-intake-session";
import { updatePoDraftSnapshot } from "@/lib/services/documents/update-po-draft";
import { deletePurchaseOrderDraftForSession } from "@/lib/services/merchant/purchase-order-draft.service";

type RouteContext = { params: Promise<{ draftId: string }> };

export async function PATCH(req: Request, context: RouteContext) {
    const session = await requireMerchantDocumentIntakeSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { draftId } = await context.params;
    if (!draftId) {
        return NextResponse.json({ error: "draftId required" }, { status: 400 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const record = body as { poDraft?: unknown };
    const parsed = poDraftSchema.safeParse(record.poDraft);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid poDraft" }, { status: 400 });
    }

    try {
        await updatePoDraftSnapshot({
            companyId: session.companyId,
            draftId,
            poDraft: parsed.data,
        });
        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Update failed";
        const status =
            message === "Draft not found" ? 404 : message === "Draft already confirmed" ? 409 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function DELETE(_req: Request, context: RouteContext) {
    const session = await requireMerchantDocumentIntakeSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { draftId } = await context.params;
    if (!draftId) {
        return NextResponse.json({ error: "draftId required" }, { status: 400 });
    }

    try {
        await deletePurchaseOrderDraftForSession(draftId);
        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Delete failed";
        const status = message === "Draft not found" ? 404 : message === "Cannot delete confirmed draft" ? 409 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
