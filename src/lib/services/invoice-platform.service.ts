import "server-only";
import type { InvoiceDraftRecord } from "@/lib/schema/invoice-draft.schema";
import type { InvoiceSettings } from "@/lib/schema/invoice-settings.schema";
import type { ReceiptDocumentRecord } from "@/lib/schema/receipt-document.schema";
import type { InvoiceIntegrationMode, InvoicePlatformStatus } from "@/lib/schema/receipt-document.schema";
import type { InvoiceVoidRecord } from "@/lib/schema/invoice-void.schema";

export type IssueInvoicePlatformResult = {
    success: boolean;
    documentStatus: ReceiptDocumentRecord["status"];
    platformStatus: InvoicePlatformStatus;
    requestId: string;
    requestPayload: unknown;
    responsePayload: unknown;
    message: string;
};

export type VoidInvoicePlatformResult = {
    success: boolean;
    voidStatus: InvoiceVoidRecord["status"];
    documentStatus: ReceiptDocumentRecord["status"];
    platformStatus: InvoicePlatformStatus;
    requestId: string;
    requestPayload: unknown;
    responsePayload: unknown;
    message: string;
};

export type InvoicePlatformAdapter = {
    mode: InvoiceIntegrationMode;
    issueInvoice: (input: { draft: InvoiceDraftRecord; settings: InvoiceSettings; documentNo: string; trackPrefix: string }) => Promise<IssueInvoicePlatformResult>;
    voidInvoice: (input: { document: ReceiptDocumentRecord; voidRecord: InvoiceVoidRecord; settings: InvoiceSettings }) => Promise<VoidInvoicePlatformResult>;
};

function createRequestId(mode: InvoiceIntegrationMode, kind: "issue" | "void"): string {
    return `${mode}_${kind}_${Date.now().toString(36)}`;
}

function buildIssuePayload(input: { draft: InvoiceDraftRecord; documentNo: string; trackPrefix: string; mode: InvoiceIntegrationMode }) {
    return {
        mode: input.mode,
        documentNo: input.documentNo,
        trackPrefix: input.trackPrefix,
        region: input.draft.region,
        documentType: input.draft.documentType,
        buyerType: input.draft.buyerType,
        buyerName: input.draft.buyerName,
        buyerTaxId: input.draft.buyerTaxId,
        buyerAbn: input.draft.buyerAbn,
        carrierType: input.draft.carrierType,
        carrierCode: input.draft.carrierCode,
        donationCode: input.draft.donationCode,
        amount: input.draft.amount,
        taxAmount: input.draft.taxAmount,
        totalAmount: input.draft.totalAmount,
        items: input.draft.items,
    };
}

function buildVoidPayload(input: { document: ReceiptDocumentRecord; voidRecord: InvoiceVoidRecord; mode: InvoiceIntegrationMode }) {
    return {
        mode: input.mode,
        documentId: input.document.id,
        documentNo: input.document.documentNo,
        reason: input.voidRecord.reason,
        issuedAt: input.document.issuedAt,
    };
}

function createMockAdapter(mode: InvoiceIntegrationMode): InvoicePlatformAdapter {
    return {
        mode,
        async issueInvoice(input) {
            const requestId = createRequestId(mode, "issue");
            const requestPayload = buildIssuePayload({ ...input, mode });
            if (input.settings.simulateIssueFailure) {
                return {
                    success: false,
                    documentStatus: "issue_failed",
                    platformStatus: "failed",
                    requestId,
                    requestPayload,
                    responsePayload: { ok: false, mode, error: "Simulated mock issue failure" },
                    message: "Mock issue failed",
                };
            }
            return {
                success: true,
                documentStatus: "issued",
                platformStatus: "succeeded",
                requestId,
                requestPayload,
                responsePayload: { ok: true, mode, stub: false },
                message: "Mock issue succeeded",
            };
        },
        async voidInvoice(input) {
            const requestId = createRequestId(mode, "void");
            const requestPayload = buildVoidPayload({ ...input, mode });
            if (input.settings.simulateVoidFailure) {
                return {
                    success: false,
                    voidStatus: "failed",
                    documentStatus: "issued",
                    platformStatus: "failed",
                    requestId,
                    requestPayload,
                    responsePayload: { ok: false, mode, error: "Simulated mock void failure" },
                    message: "Mock void failed",
                };
            }
            return {
                success: true,
                voidStatus: "succeeded",
                documentStatus: "voided",
                platformStatus: "succeeded",
                requestId,
                requestPayload,
                responsePayload: { ok: true, mode, stub: false },
                message: "Mock void succeeded",
            };
        },
    };
}

function createStubAdapter(mode: InvoiceIntegrationMode): InvoicePlatformAdapter {
    return {
        mode,
        async issueInvoice(input) {
            const requestId = createRequestId(mode, "issue");
            const requestPayload = buildIssuePayload({ ...input, mode });
            return {
                success: true,
                documentStatus: "issue_pending",
                platformStatus: "stubbed",
                requestId,
                requestPayload,
                responsePayload: {
                    ok: true,
                    mode,
                    stub: true,
                    message: "Adapter stub only. No external network request was performed.",
                },
                message: `${mode} issue adapter stubbed`,
            };
        },
        async voidInvoice(input) {
            const requestId = createRequestId(mode, "void");
            const requestPayload = buildVoidPayload({ ...input, mode });
            return {
                success: true,
                voidStatus: "pending",
                documentStatus: "void_pending",
                platformStatus: "stubbed",
                requestId,
                requestPayload,
                responsePayload: {
                    ok: true,
                    mode,
                    stub: true,
                    message: "Adapter stub only. No external network request was performed.",
                },
                message: `${mode} void adapter stubbed`,
            };
        },
    };
}

export function createInvoicePlatformAdapter(mode: InvoiceIntegrationMode): InvoicePlatformAdapter {
    if (mode === "mock") return createMockAdapter(mode);
    return createStubAdapter(mode);
}
