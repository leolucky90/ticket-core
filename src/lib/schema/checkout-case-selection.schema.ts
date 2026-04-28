import type { Ticket } from "@/lib/types/ticket";
import { sanitizeText } from "@/lib/schema/company-settings.shared";

export type CheckoutCaseSelection = {
    caseId: string;
    caseNo: string;
    caseTitle: string;
    deviceLabel: string;
    status: string;
    repairAmount: number;
    inspectionFee: number;
    pendingFee: number;
    repairParts: Array<{
        productId: string;
        productName: string;
        usedQty: number;
    }>;
    updatedAt: number;
};

function createCaseNo(ticket: Pick<Ticket, "id" | "createdAt">): string {
    const d = new Date(ticket.createdAt > 0 ? ticket.createdAt : Date.now());
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const suffix = ticket.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "0000";
    return `CASE-${yyyy}${mm}${dd}-${suffix}`;
}

export function normalizeCheckoutCaseSelection(input: Partial<CheckoutCaseSelection> & { caseId: string }): CheckoutCaseSelection {
    const updatedAt =
        typeof input.updatedAt === "number" && Number.isFinite(input.updatedAt) && input.updatedAt > 0
            ? Math.round(input.updatedAt)
            : 0;

    return {
        caseId: sanitizeText(input.caseId, 120),
        caseNo: sanitizeText(input.caseNo, 120),
        caseTitle: sanitizeText(input.caseTitle, 240),
        deviceLabel: sanitizeText(input.deviceLabel, 240),
        status: sanitizeText(input.status, 80),
        repairAmount: Math.max(0, Math.round(Number(input.repairAmount ?? 0))),
        inspectionFee: Math.max(0, Math.round(Number(input.inspectionFee ?? 0))),
        pendingFee: Math.max(0, Math.round(Number(input.pendingFee ?? 0))),
        repairParts: Array.isArray(input.repairParts)
            ? input.repairParts
                  .map((row) => {
                      if (!row || typeof row !== "object") return null;
                      const part = row as Record<string, unknown>;
                      const productId = sanitizeText(String(part.productId ?? ""), 120);
                      const productName = sanitizeText(String(part.productName ?? ""), 240) || productId;
                      const usedQty = Math.max(1, Math.round(Number(part.usedQty ?? 1)));
                      if (!productId && !productName) return null;
                      return { productId, productName, usedQty };
                  })
                  .filter((row): row is { productId: string; productName: string; usedQty: number } => row !== null)
                  .slice(0, 30)
            : [],
        updatedAt,
    };
}

export function createCheckoutCaseSelectionFromTicket(ticket: Ticket): CheckoutCaseSelection {
    return normalizeCheckoutCaseSelection({
        caseId: ticket.id,
        caseNo: createCaseNo(ticket),
        caseTitle: `${ticket.device.name} ${ticket.device.model}`.trim() || sanitizeText(ticket.title, 240),
        deviceLabel: `${sanitizeText(ticket.device.name, 120)} ${sanitizeText(ticket.device.model, 120)}`.trim(),
        status: sanitizeText(ticket.status, 80),
        repairAmount: Math.max(0, Math.round(ticket.repairAmount ?? 0)),
        inspectionFee: Math.max(0, Math.round(ticket.inspectionFee ?? 0)),
        pendingFee: Math.max(0, Math.round(ticket.pendingFee ?? 0)),
        repairParts: (ticket.repairParts ?? []).map((part) => ({
            productId: sanitizeText(part.productId, 120),
            productName: sanitizeText(part.productName, 240),
            usedQty: Math.max(1, Math.round(part.usedQty ?? 1)),
        })),
        updatedAt: ticket.updatedAt,
    });
}
