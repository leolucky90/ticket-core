import "server-only";
import type { PoDraft } from "@/lib/schema/ai/po-draft";
import { poDraftDocPath } from "@/lib/schema/receiptPoIntake";
import { getDoc, updateDoc } from "@/lib/services/db/firestore";
import {
    deriveLinesFromPoDraft,
    deriveNoteFromPoDraft,
    deriveSupplierLabelFromPoDraft,
} from "@/lib/services/documents/po-draft-fields";

export async function updatePoDraftSnapshot(params: {
    companyId: string;
    draftId: string;
    poDraft: PoDraft;
}): Promise<void> {
    const path = poDraftDocPath(params.companyId, params.draftId);
    const existing = await getDoc(path);
    if (!existing) {
        throw new Error("Draft not found");
    }
    if (existing.status === "confirmed") {
        throw new Error("Draft already confirmed");
    }

    const supplierLabel = deriveSupplierLabelFromPoDraft(params.poDraft);
    const note = deriveNoteFromPoDraft(params.poDraft);
    const lines = deriveLinesFromPoDraft(params.poDraft);

    await updateDoc(path, {
        poDraftSnapshot: params.poDraft,
        supplierLabel,
        note,
        lines,
        status: "ready_for_review",
    });
}
