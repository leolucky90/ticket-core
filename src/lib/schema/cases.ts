export type CaseType = "refurbish" | "repair" | (string & {});

export type CaseRecord = {
    id: string;
    title: string;
    status: string;
    quoteStatus: string;
    repairTechnicianId?: string;
    repairTechnicianName?: string;
    linkedUsedProductId?: string;
    linkedUsedProductName?: string;
    caseType?: CaseType;
    createdAt: number;
    updatedAt: number;
};

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
        caseType: toText(input.caseType, 40) || undefined,
        createdAt,
        updatedAt: toMs(input.updatedAt, createdAt),
    };
}
