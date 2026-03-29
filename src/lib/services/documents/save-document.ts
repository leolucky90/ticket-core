import "server-only";
import type { PoDraft } from "@/lib/schema/ai/po-draft";
import type { IntakeDocumentStatus } from "@/lib/schema/receiptPoIntake";
import {
    intakeDocumentsCollectionPath,
    ocrResultsCollectionPath,
    poDraftsCollectionPath,
} from "@/lib/schema/receiptPoIntake";
import { createDoc } from "@/lib/services/db/firestore";
import {
    deriveLinesFromPoDraft,
    deriveNoteFromPoDraft,
    deriveSupplierLabelFromPoDraft,
} from "@/lib/services/documents/po-draft-fields";

export async function saveDocumentIntake(params: {
    companyId: string;
    fileName: string;
    mimeType: string;
    ocrText: string;
    draft: PoDraft;
}): Promise<{ documentId: string; draftId: string }> {
    const { companyId } = params;

    const documentId = await createDoc(intakeDocumentsCollectionPath(companyId), {
        companyId,
        fileName: params.fileName,
        mimeType: params.mimeType,
        status: "draft_ready" satisfies IntakeDocumentStatus,
    });

    await createDoc(ocrResultsCollectionPath(companyId), {
        companyId,
        documentId,
        rawText: params.ocrText,
    });

    const supplierLabel = deriveSupplierLabelFromPoDraft(params.draft);
    const note = deriveNoteFromPoDraft(params.draft);
    const lines = deriveLinesFromPoDraft(params.draft);

    const draftId = await createDoc(poDraftsCollectionPath(companyId), {
        companyId,
        documentIntakeId: documentId,
        source: "ai_upload",
        status: "ready_for_review",
        supplierLabel,
        note,
        expectedDeliveryAt: null,
        lines,
        trackingHints: [],
        aiUploadFileNames: [params.fileName],
        poDraftSnapshot: params.draft,
    });

    return { documentId, draftId };
}
