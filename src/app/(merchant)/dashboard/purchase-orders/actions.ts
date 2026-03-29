"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createManualPurchaseOrderDraft } from "@/lib/services/merchant/purchase-order-draft.service";

function safeText(value: FormDataEntryValue | null, max: number): string {
    const raw = typeof value === "string" ? value : "";
    return raw.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function parseLines(formData: FormData): Array<{ label: string; qty: number }> {
    const labels = formData.getAll("lineLabel[]");
    const qtys = formData.getAll("lineQty[]");
    const rows: Array<{ label: string; qty: number }> = [];
    for (let i = 0; i < Math.min(labels.length, qtys.length, 20); i += 1) {
        const label = safeText(labels[i], 240);
        const qty = Math.max(0, Math.round(Number(safeText(qtys[i], 20)) || 0));
        if (!label || qty <= 0) continue;
        rows.push({ label, qty });
    }
    return rows;
}

function parseTrackingHints(raw: string): string[] {
    return raw
        .split(/[\s,;，；]+/g)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20);
}

export async function createManualPurchaseOrderDraftAction(formData: FormData): Promise<void> {
    try {
        const supplierLabel = safeText(formData.get("supplierLabel"), 160);
        if (!supplierLabel) {
            redirect(`/dashboard/purchase-orders?flash=missing_supplier&ts=${Date.now()}`);
        }
        const note = safeText(formData.get("note"), 800) || null;
        const expectedRaw = safeText(formData.get("expectedDeliveryAt"), 40);
        const expectedDeliveryAt = expectedRaw ? `${expectedRaw}T00:00:00.000Z` : null;
        const trackingHints = parseTrackingHints(safeText(formData.get("trackingHints"), 800));
        const lines = parseLines(formData);
        if (lines.length === 0) {
            redirect(`/dashboard/purchase-orders?flash=missing_lines&ts=${Date.now()}`);
        }

        await createManualPurchaseOrderDraft({
            supplierLabel,
            note,
            expectedDeliveryAt,
            trackingHints,
            lines,
        });
        revalidatePath("/dashboard/purchase-orders");
        redirect(`/dashboard/purchase-orders?flash=created&ts=${Date.now()}`);
    } catch (error) {
        if (isRedirectError(error)) throw error;
        redirect(`/dashboard/purchase-orders?flash=error&ts=${Date.now()}`);
    }
}

