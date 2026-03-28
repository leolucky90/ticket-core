"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { MerchantSectionCard } from "@/components/merchant/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProcessingIndicator } from "@/components/ui/processing-indicator";
import type { UiLanguage } from "@/lib/i18n/ui-text";
import { getUiText } from "@/lib/i18n/ui-text";
import type { TicketAttributePreferences } from "@/lib/types/ticketAttributes";

type TicketAttributesSettingsPanelProps = {
    initialPreferences: TicketAttributePreferences;
    lang: UiLanguage;
};

function normalizeClientStatuses(values: string[]): string[] {
    return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

function updateItem(list: string[], index: number, value: string): string[] {
    return list.map((item, itemIndex) => (itemIndex === index ? value : item));
}

function removeItem(list: string[], index: number): string[] {
    return list.filter((_, itemIndex) => itemIndex !== index);
}

export function TicketAttributesSettingsPanel({ initialPreferences, lang }: TicketAttributesSettingsPanelProps) {
    const ui = getUiText(lang).ticketAttributes;
    const [caseStatuses, setCaseStatuses] = useState<string[]>(initialPreferences.caseStatuses);
    const [quoteStatuses, setQuoteStatuses] = useState<string[]>(initialPreferences.quoteStatuses);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [saveMessage, setSaveMessage] = useState("");

    const canSave = useMemo(
        () =>
            normalizeClientStatuses(caseStatuses).length > 0 &&
            normalizeClientStatuses(quoteStatuses).length > 0 &&
            saveStatus !== "saving",
        [caseStatuses, quoteStatuses, saveStatus],
    );

    async function handleSave() {
        const payload = {
            caseStatuses: normalizeClientStatuses(caseStatuses),
            quoteStatuses: normalizeClientStatuses(quoteStatuses),
        };

        if (payload.caseStatuses.length === 0 || payload.quoteStatuses.length === 0) {
            setSaveStatus("error");
            setSaveMessage(ui.invalid);
            return;
        }

        setSaveStatus("saving");
        setSaveMessage("");

        try {
            const response = await fetch("/api/ticket-attributes/preferences", {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = (await response.json()) as {
                error?: string;
                preferences?: TicketAttributePreferences;
            };

            if (!response.ok || !data.preferences) {
                throw new Error(data.error || "儲存失敗");
            }

            setCaseStatuses(data.preferences.caseStatuses);
            setQuoteStatuses(data.preferences.quoteStatuses);
            setSaveStatus("saved");
            setSaveMessage(ui.saved);
        } catch (error) {
            const message = error instanceof Error ? error.message : ui.saveFailed;
            setSaveStatus("error");
            setSaveMessage(message);
        }
    }

    return (
        <div className="grid max-w-3xl gap-4">
            <MerchantSectionCard title={ui.ticketStatuses} bodyClassName="grid gap-3">
                <div className="text-xs text-[rgb(var(--muted))]">
                    {ui.currentValues}：{normalizeClientStatuses(caseStatuses).join("、") || "-"}
                </div>
                <div className="grid gap-2">
                    {caseStatuses.map((status, index) => (
                        <div key={`case-status-${index}`} className="flex items-center gap-2">
                            <Input
                                value={status}
                                onChange={(event) => {
                                    setSaveStatus("idle");
                                    setSaveMessage("");
                                    setCaseStatuses((prev) => updateItem(prev, index, event.target.value));
                                }}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setSaveStatus("idle");
                                    setSaveMessage("");
                                    setCaseStatuses((prev) => removeItem(prev, index));
                                }}
                                disabled={caseStatuses.length <= 1}
                                aria-label={`remove-case-status-${index + 1}`}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
                <div>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            setSaveStatus("idle");
                            setSaveMessage("");
                            setCaseStatuses((prev) => [...prev, ""]);
                        }}
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        {ui.addTicketStatus}
                    </Button>
                </div>
            </MerchantSectionCard>

            <MerchantSectionCard title={ui.quoteStatuses} bodyClassName="grid gap-3">
                <div className="text-xs text-[rgb(var(--muted))]">
                    {ui.currentValues}：{normalizeClientStatuses(quoteStatuses).join("、") || "-"}
                </div>
                <div className="grid gap-2">
                    {quoteStatuses.map((status, index) => (
                        <div key={`quote-status-${index}`} className="flex items-center gap-2">
                            <Input
                                value={status}
                                onChange={(event) => {
                                    setSaveStatus("idle");
                                    setSaveMessage("");
                                    setQuoteStatuses((prev) => updateItem(prev, index, event.target.value));
                                }}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setSaveStatus("idle");
                                    setSaveMessage("");
                                    setQuoteStatuses((prev) => removeItem(prev, index));
                                }}
                                disabled={quoteStatuses.length <= 1}
                                aria-label={`remove-quote-status-${index + 1}`}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
                <div>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            setSaveStatus("idle");
                            setSaveMessage("");
                            setQuoteStatuses((prev) => [...prev, ""]);
                        }}
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        {ui.addQuoteStatus}
                    </Button>
                </div>
            </MerchantSectionCard>

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={!canSave}
                    loading={saveStatus === "saving"}
                    loadingLabel={ui.saving}
                >
                    <Save className="mr-1 h-4 w-4" />
                    {ui.save}
                </Button>
                {saveStatus === "saving" ? <ProcessingIndicator label={ui.syncing} size="sm" /> : null}
                {saveMessage ? <div className="text-sm text-[rgb(var(--muted))]">{saveMessage}</div> : null}
            </div>
        </div>
    );
}
