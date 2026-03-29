/**
 * Purchase order / procurement drafts (human-in-the-loop; AI-assisted later).
 * Firestore: companies/{companyId}/poDrafts
 */

import type { PoDraft } from "@/lib/schema/ai/po-draft";

export type PurchaseOrderDraftSource = "manual" | "ai_upload";

export type PurchaseOrderDraftStatus =
    | "draft"
    | "pending_ai"
    | "ready_for_review"
    | "confirmed"
    | "receiving"
    | "closed";

export type PurchaseOrderDraftLine = {
    id: string;
    label: string;
    qty: number;
    /** Linked catalog product when user picks from search. */
    productId?: string | null;
    sku?: string | null;
    unitPrice?: number | null;
    amount?: number | null;
};

export type PurchaseOrderDraft = {
    id: string;
    companyId: string;
    source: PurchaseOrderDraftSource;
    status: PurchaseOrderDraftStatus;
    supplierLabel: string;
    note: string | null;
    expectedDeliveryAt: string | null;
    lines: PurchaseOrderDraftLine[];
    /** Parsed or hand-entered tracking hints (full carrier integration later). */
    trackingHints: string[];
    aiUploadFileNames: string[];
    createdAt: string;
    updatedAt: string;
    /** AI OCR + structured extraction; user may edit before confirm. */
    poDraftSnapshot?: PoDraft | null;
    documentIntakeId?: string | null;
    /** Set when draft is confirmed into purchaseOrders/{poId}. */
    confirmedPoId?: string | null;
};

/** Future: AI extraction result before human confirms PO draft. */
export type AiPurchaseOrderExtractionResult = {
    ok: boolean;
    version: string;
    supplierLabel?: string;
    lines?: Array<{ label: string; qty: number }>;
    trackingHints?: string[];
    expectedDeliveryAt?: string | null;
    warnings: string[];
};
