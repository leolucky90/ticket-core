import "server-only";
import { fbAdminDb } from "@/lib/firebase-server";
import { normalizeTenantId } from "@/lib/tenant-scope";
import type { KnownQuoteStatus, KnownTicketStatus } from "@/lib/types/ticket";
import type { TicketAttributePreferences } from "@/lib/types/ticketAttributes";

export const DEFAULT_CASE_STATUSES: KnownTicketStatus[] = ["new", "in_progress", "waiting_customer", "resolved", "closed"];
export const DEFAULT_QUOTE_STATUSES: KnownQuoteStatus[] = ["inspection_estimate", "quoted", "rejected", "accepted"];
const MAX_ITEM_COUNT = 20;
const MAX_ITEM_LENGTH = 40;

function docPath(tenantId: string): string {
    return `companies/${tenantId}/app_config/ticket_attributes`;
}

function sanitizeStatuses(value: unknown, fallback: string[]): string[] {
    const source = Array.isArray(value) ? value : [];
    const seen = new Set<string>();
    const result: string[] = [];

    for (const item of source) {
        if (typeof item !== "string") continue;
        const cleaned = item.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, MAX_ITEM_LENGTH);
        if (!cleaned) continue;
        const dedupeKey = cleaned.toLowerCase();
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        result.push(cleaned);
        if (result.length >= MAX_ITEM_COUNT) break;
    }

    if (result.length > 0) return result;
    return [...fallback];
}

function toPreferences(input: unknown): TicketAttributePreferences {
    const candidate = (input ?? {}) as Partial<TicketAttributePreferences>;
    return {
        caseStatuses: sanitizeStatuses(candidate.caseStatuses, DEFAULT_CASE_STATUSES),
        quoteStatuses: sanitizeStatuses(candidate.quoteStatuses, DEFAULT_QUOTE_STATUSES),
        updatedAt: typeof candidate.updatedAt === "number" ? candidate.updatedAt : 0,
        updatedBy: typeof candidate.updatedBy === "string" ? candidate.updatedBy : "",
    };
}

export async function getTicketAttributePreferences(options: {
    tenantId: string | null | undefined;
}): Promise<TicketAttributePreferences> {
    const tenantId = normalizeTenantId(options.tenantId);
    if (!tenantId) {
        return {
            caseStatuses: [...DEFAULT_CASE_STATUSES],
            quoteStatuses: [...DEFAULT_QUOTE_STATUSES],
            updatedAt: 0,
            updatedBy: "",
        };
    }

    const snap = await fbAdminDb.doc(docPath(tenantId)).get();
    if (!snap.exists) {
        return {
            caseStatuses: [...DEFAULT_CASE_STATUSES],
            quoteStatuses: [...DEFAULT_QUOTE_STATUSES],
            updatedAt: 0,
            updatedBy: "",
        };
    }

    return toPreferences(snap.data());
}

export async function saveTicketAttributePreferences(params: {
    tenantId: string;
    updatedBy: string;
    caseStatuses?: unknown;
    quoteStatuses?: unknown;
}): Promise<TicketAttributePreferences> {
    const tenantId = normalizeTenantId(params.tenantId);
    if (!tenantId) throw new Error("Missing tenantId");

    const current = await getTicketAttributePreferences({ tenantId });
    const next: TicketAttributePreferences = {
        caseStatuses:
            params.caseStatuses !== undefined
                ? sanitizeStatuses(params.caseStatuses, DEFAULT_CASE_STATUSES)
                : current.caseStatuses,
        quoteStatuses:
            params.quoteStatuses !== undefined
                ? sanitizeStatuses(params.quoteStatuses, DEFAULT_QUOTE_STATUSES)
                : current.quoteStatuses,
        updatedAt: Date.now(),
        updatedBy: params.updatedBy,
    };

    await fbAdminDb.doc(docPath(tenantId)).set(next, { merge: true });
    return next;
}
