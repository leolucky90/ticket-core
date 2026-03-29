import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import type { PoDraft } from "@/lib/schema/ai/po-draft";
import {
    intakeDocumentDocPath,
    poDraftDocPath,
    purchaseOrdersCollectionPath,
} from "@/lib/schema/receiptPoIntake";
import { createDoc, getDoc, updateDoc } from "@/lib/services/db/firestore";
import {
    deriveLinesFromPoDraft,
    deriveNoteFromPoDraft,
    deriveSupplierLabelFromPoDraft,
} from "@/lib/services/documents/po-draft-fields";
import type { PurchaseOrderDraftLine } from "@/lib/types/purchase-order";

export async function confirmPoDraft(params: {
    companyId: string;
    draftId: string;
    /** Optional user-edited snapshot; defaults to stored poDraftSnapshot. */
    poDraftSnapshot?: PoDraft | null;
    confirmedByUid: string;
}): Promise<{ poId: string }> {
    const draftPath = poDraftDocPath(params.companyId, params.draftId);
    const draft = await getDoc(draftPath);
    if (!draft) {
        throw new Error("Draft not found");
    }

    const status = draft.status as string | undefined;
    if (status === "confirmed") {
        throw new Error("Draft already confirmed");
    }

    const snapshot =
        params.poDraftSnapshot ??
        (draft.poDraftSnapshot as PoDraft | undefined | null) ??
        null;

    let supplierLabel: string;
    let note: string | null;
    let lines: PurchaseOrderDraftLine[];

    if (snapshot) {
        supplierLabel = deriveSupplierLabelFromPoDraft(snapshot);
        note = deriveNoteFromPoDraft(snapshot);
        lines = deriveLinesFromPoDraft(snapshot);
    } else {
        supplierLabel = typeof draft.supplierLabel === "string" ? draft.supplierLabel : "";
        note = (draft.note as string | null | undefined) ?? null;
        lines = Array.isArray(draft.lines) ? (draft.lines as PurchaseOrderDraftLine[]) : [];
    }

    const documentIntakeId =
        typeof draft.documentIntakeId === "string" ? draft.documentIntakeId : null;

    const poId = await createDoc(purchaseOrdersCollectionPath(params.companyId), {
        companyId: params.companyId,
        poDraftId: params.draftId,
        documentIntakeId,
        vendorName: snapshot?.vendorName ?? supplierLabel,
        supplierLabel,
        note,
        lines,
        total: snapshot?.total ?? null,
        tax: snapshot?.tax ?? null,
        subtotal: snapshot?.subtotal ?? null,
        currency: snapshot?.currency ?? null,
        documentType: snapshot?.documentType ?? "unknown",
        documentNumber: snapshot?.documentNumber ?? null,
        documentDate: snapshot?.documentDate ?? null,
        status: "confirmed",
        poDraftSnapshot: snapshot,
        confirmedAt: FieldValue.serverTimestamp(),
        confirmedByUid: params.confirmedByUid,
    });

    await updateDoc(draftPath, {
        status: "confirmed",
        confirmedPoId: poId,
        poId,
        supplierLabel,
        note,
        lines,
        poDraftSnapshot: snapshot ?? draft.poDraftSnapshot ?? null,
    });

    if (documentIntakeId) {
        await updateDoc(intakeDocumentDocPath(params.companyId, documentIntakeId), {
            status: "confirmed",
        });
    }

    return { poId };
}
