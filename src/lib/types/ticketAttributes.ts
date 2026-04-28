export type TicketAttributePreferences = {
    caseStatuses: string[];
    quoteStatuses: string[];
    warrantyDurationPreset?: "3m" | "6m" | "12m" | "custom";
    warrantyCustomValue?: number;
    warrantyCustomUnit?: "week" | "month";
    updatedAt: number;
    updatedBy: string;
};
