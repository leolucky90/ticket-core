/**
 * Receipt / invoice intake → OCR → AI PO draft (company-scoped).
 * Canonical paths: companies/{companyId}/…
 */

export type IntakeDocumentStatus = "uploaded" | "draft_ready" | "confirmed";

export function intakeDocumentsCollectionPath(companyId: string): string {
    return `companies/${companyId}/intakeDocuments`;
}

export function intakeDocumentDocPath(companyId: string, documentId: string): string {
    return `${intakeDocumentsCollectionPath(companyId)}/${documentId}`;
}

export function ocrResultsCollectionPath(companyId: string): string {
    return `companies/${companyId}/ocrResults`;
}

export function ocrResultDocPath(companyId: string, ocrId: string): string {
    return `${ocrResultsCollectionPath(companyId)}/${ocrId}`;
}

export function poDraftsCollectionPath(companyId: string): string {
    return `companies/${companyId}/poDrafts`;
}

export function poDraftDocPath(companyId: string, draftId: string): string {
    return `${poDraftsCollectionPath(companyId)}/${draftId}`;
}

export function purchaseOrdersCollectionPath(companyId: string): string {
    return `companies/${companyId}/purchaseOrders`;
}

export function purchaseOrderDocPath(companyId: string, poId: string): string {
    return `${purchaseOrdersCollectionPath(companyId)}/${poId}`;
}
