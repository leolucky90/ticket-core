import "server-only";
import type { PoDraft } from "@/lib/schema/ai/po-draft";
import type { PurchaseOrderDraftLine } from "@/lib/types/purchase-order";

function newLineId(index: number): string {
    return `pol_${Date.now()}_${index}_${Math.random().toString(16).slice(2, 10)}`;
}

export function deriveLinesFromPoDraft(snapshot: PoDraft): PurchaseOrderDraftLine[] {
    return snapshot.items.map((item, index) => {
        const qty = Math.max(1, Math.round(item.qty ?? 1));
        const unitPrice =
            item.unitPrice !== null && item.unitPrice !== undefined && Number.isFinite(item.unitPrice)
                ? item.unitPrice
                : null;
        const amount =
            item.amount !== null && item.amount !== undefined && Number.isFinite(item.amount)
                ? item.amount
                : unitPrice !== null
                  ? Math.round(qty * unitPrice * 100) / 100
                  : null;
        return {
            id: newLineId(index),
            label: item.description,
            qty,
            productId: item.productId ?? null,
            sku: item.sku ?? null,
            unitPrice,
            amount,
        };
    });
}

export function deriveNoteFromPoDraft(snapshot: PoDraft): string | null {
    const parts = [
        snapshot.documentNumber ? `單號 ${snapshot.documentNumber}` : "",
        snapshot.documentDate ? `日期 ${snapshot.documentDate}` : "",
        snapshot.currency ? `幣別 ${snapshot.currency}` : "",
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : null;
}

export function deriveSupplierLabelFromPoDraft(snapshot: PoDraft): string {
    const v = snapshot.vendorName?.trim();
    return v && v.length > 0 ? v : "（未辨識供應商）";
}
