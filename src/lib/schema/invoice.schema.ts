import {
    normalizeReceiptDocumentRecord,
    receiptDocumentDocPath,
    receiptDocumentsCollectionPath,
    type ReceiptDocumentRecord,
} from "@/lib/schema/receipt-document.schema";

export type InvoiceRecord = ReceiptDocumentRecord;

export function invoicesCollectionPath(companyId: string): string {
    return receiptDocumentsCollectionPath(companyId);
}

export function invoiceDocPath(companyId: string, invoiceId: string): string {
    return receiptDocumentDocPath(companyId, invoiceId);
}

export function normalizeInvoiceRecord(input: Partial<InvoiceRecord> & { id: string; companyId: string }): InvoiceRecord {
    return normalizeReceiptDocumentRecord(input);
}
