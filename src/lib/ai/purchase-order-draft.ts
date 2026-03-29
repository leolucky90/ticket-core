/**
 * AI-assisted purchase order draft extraction (placeholder).
 * Real implementation must stay human-in-the-loop: returns suggestions only; writes go through confirmed server actions.
 */

import type { AiPurchaseOrderExtractionResult } from "@/lib/types/purchase-order";

const PLACEHOLDER_VERSION = "ai-po-draft-0";

/**
 * Reserved for future multimodal / document parsing. Not wired yet.
 */
export async function extractPurchaseOrderDraftFromUploadPlaceholder(input: {
    companyId: string;
    fileNames: string[];
    bytesByFileName?: Record<string, Uint8Array>;
}): Promise<AiPurchaseOrderExtractionResult> {
    void input;
    return {
        ok: false,
        version: PLACEHOLDER_VERSION,
        warnings: ["AI 採購草稿模組尚未接通：請改用人工建立，或待後續上線後重新上傳。"],
    };
}

/**
 * Reserved: extract tracking numbers from email body or attachment text (future).
 */
export async function extractTrackingHintsPlaceholder(text: string): Promise<string[]> {
    void text;
    return [];
}
