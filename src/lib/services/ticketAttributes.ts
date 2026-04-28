import "server-only";
import { fbAdminDb } from "@/lib/firebase-server";
import { normalizeTenantId } from "@/lib/tenant-scope";
import type { KnownQuoteStatus, KnownTicketStatus } from "@/lib/types/ticket";
import type { TicketAttributePreferences } from "@/lib/types/ticketAttributes";

export const DEFAULT_CASE_STATUSES: KnownTicketStatus[] = ["new", "in_progress", "waiting_customer", "resolved", "closed"];
export const DEFAULT_QUOTE_STATUSES: KnownQuoteStatus[] = ["inspection_estimate", "quoted", "requote", "rejected", "accepted"];
const MAX_ITEM_COUNT = 20;
const MAX_ITEM_LENGTH = 40;
const WARRANTY_PRESETS = new Set(["3m", "6m", "12m", "custom"]);
const WARRANTY_UNITS = new Set(["week", "month"]);

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

function dedupeStatusesForPreferences(statuses: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const status of statuses) {
        const cleaned = status.trim();
        if (!cleaned) continue;
        const key = cleaned.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(cleaned);
    }
    return result;
}

function toPreferences(input: unknown): TicketAttributePreferences {
    const candidate = (input ?? {}) as Partial<TicketAttributePreferences>;
    const warrantyDurationPreset = WARRANTY_PRESETS.has(String(candidate.warrantyDurationPreset))
        ? (candidate.warrantyDurationPreset as "3m" | "6m" | "12m" | "custom")
        : "3m";
    const rawCustomValue = Number(candidate.warrantyCustomValue);
    const warrantyCustomValue = Number.isFinite(rawCustomValue) ? Math.max(1, Math.min(120, Math.round(rawCustomValue))) : 3;
    const warrantyCustomUnit = WARRANTY_UNITS.has(String(candidate.warrantyCustomUnit))
        ? (candidate.warrantyCustomUnit as "week" | "month")
        : "month";
    return {
        caseStatuses: sanitizeStatuses(candidate.caseStatuses, DEFAULT_CASE_STATUSES),
        quoteStatuses: sanitizeStatuses(
            dedupeStatusesForPreferences([
                ...sanitizeStatuses(candidate.quoteStatuses, DEFAULT_QUOTE_STATUSES),
                "requote",
            ]),
            DEFAULT_QUOTE_STATUSES,
        ),
        warrantyDurationPreset,
        warrantyCustomValue,
        warrantyCustomUnit,
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
            warrantyDurationPreset: "3m",
            warrantyCustomValue: 3,
            warrantyCustomUnit: "month",
            updatedAt: 0,
            updatedBy: "",
        };
    }

    const snap = await fbAdminDb.doc(docPath(tenantId)).get();
    if (!snap.exists) {
        return {
            caseStatuses: [...DEFAULT_CASE_STATUSES],
            quoteStatuses: [...DEFAULT_QUOTE_STATUSES],
            warrantyDurationPreset: "3m",
            warrantyCustomValue: 3,
            warrantyCustomUnit: "month",
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
    warrantyDurationPreset?: unknown;
    warrantyCustomValue?: unknown;
    warrantyCustomUnit?: unknown;
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
        warrantyDurationPreset:
            params.warrantyDurationPreset !== undefined && WARRANTY_PRESETS.has(String(params.warrantyDurationPreset))
                ? (params.warrantyDurationPreset as "3m" | "6m" | "12m" | "custom")
                : (current.warrantyDurationPreset ?? "3m"),
        warrantyCustomValue:
            params.warrantyCustomValue !== undefined
                ? Math.max(1, Math.min(120, Math.round(Number(params.warrantyCustomValue) || 3)))
                : (current.warrantyCustomValue ?? 3),
        warrantyCustomUnit:
            params.warrantyCustomUnit !== undefined && WARRANTY_UNITS.has(String(params.warrantyCustomUnit))
                ? (params.warrantyCustomUnit as "week" | "month")
                : (current.warrantyCustomUnit ?? "month"),
        updatedAt: Date.now(),
        updatedBy: params.updatedBy,
    };

    await fbAdminDb.doc(docPath(tenantId)).set(next, { merge: true });
    return next;
}
