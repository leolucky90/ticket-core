// Legacy Firestore `cases` collection bridge.
// The business capability is treated as `Ticket`, but the persisted collection path remains `cases`.
export type CaseType = "refurbish" | "repair" | "warranty" | (string & {});

export type CaseRecord = {
    id: string;
    title: string;
    status: string;
    quoteStatus: string;
    repairTechnicianId?: string;
    repairTechnicianName?: string;
    linkedUsedProductId?: string;
    linkedUsedProductName?: string;
    parentCaseId?: string;
    parentCaseTitle?: string;
    relatedCaseIds?: string[];
    historySummary?: string;
    caseType?: CaseType;
    createdAt: number;
    updatedAt: number;
};

export type TicketCaseType = CaseType;
export type TicketCaseRecord = CaseRecord;

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toMs(value: unknown, fallback: number): number {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.round(value);
    if (typeof value === "string" && value.trim()) {
        const ts = Date.parse(value);
        if (Number.isFinite(ts)) return ts;
    }
    return fallback;
}

function normalizeCaseIds(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const row of value) {
        const id = toText(row, 120);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        ids.push(id);
        if (ids.length >= 50) break;
    }
    return ids;
}

export function normalizeCaseRecord(input: Partial<CaseRecord> & Pick<CaseRecord, "id">): CaseRecord {
    const now = Date.now();
    const createdAt = toMs(input.createdAt, now);

    return {
        id: toText(input.id, 120),
        title: toText(input.title, 240),
        status: toText(input.status, 80) || "new",
        quoteStatus: toText(input.quoteStatus, 80) || "inspection_estimate",
        repairTechnicianId: toText(input.repairTechnicianId, 120) || undefined,
        repairTechnicianName: toText(input.repairTechnicianName, 120) || undefined,
        linkedUsedProductId: toText(input.linkedUsedProductId, 120) || undefined,
        linkedUsedProductName: toText(input.linkedUsedProductName, 240) || undefined,
        parentCaseId: toText(input.parentCaseId, 120) || undefined,
        parentCaseTitle: toText(input.parentCaseTitle, 240) || undefined,
        relatedCaseIds: normalizeCaseIds(input.relatedCaseIds),
        historySummary: toText(input.historySummary, 1000) || undefined,
        caseType: toText(input.caseType, 40) || undefined,
        createdAt,
        updatedAt: toMs(input.updatedAt, createdAt),
    };
}

export const normalizeTicketCaseRecord = normalizeCaseRecord;
