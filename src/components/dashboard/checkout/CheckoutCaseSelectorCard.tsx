"use client";

import { MerchantSectionCard } from "@/components/merchant/shell";
import { CheckoutCaseSkeleton } from "@/components/dashboard/checkout/CheckoutCaseSkeleton";
import type { CheckoutCaseSelection } from "@/lib/schema";

type CheckoutCaseSelectorCardProps = {
    ui: ReturnType<typeof import("@/lib/i18n/ui-text").getUiText>["checkoutWorkspace"];
    cases: CheckoutCaseSelection[];
    selectedCaseIds: string[];
    closeCase: boolean;
    loading: boolean;
    onToggleCase: (caseId: string, checked: boolean) => void;
    onCloseCaseChange: (checked: boolean) => void;
};

export function CheckoutCaseSelectorCard({
    ui,
    cases,
    selectedCaseIds,
    closeCase,
    loading,
    onToggleCase,
    onCloseCaseChange,
}: CheckoutCaseSelectorCardProps) {
    const resolveStatusLabel = (status: string) => {
        if (status === "new") return ui.ticketStatusNew;
        if (status === "in_progress") return ui.ticketStatusInProgress;
        if (status === "waiting_customer") return ui.ticketStatusWaitingCustomer;
        if (status === "resolved") return ui.ticketStatusResolved;
        if (status === "closed") return ui.ticketStatusClosed;
        return status;
    };

    return (
        <MerchantSectionCard title={ui.casesSection} description={ui.casesSectionDescription} bodyClassName="grid gap-3">
            {loading ? (
                <CheckoutCaseSkeleton />
            ) : (
                <div className="grid gap-2">
                    {cases.map((ticket) => {
                        const checked = selectedCaseIds.includes(ticket.caseId);
                        return (
                            <label
                                key={ticket.caseId}
                                className={[
                                    "grid gap-1 rounded-xl border px-3 py-3 text-sm",
                                    checked
                                        ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel2))]"
                                        : "border-[rgb(var(--border))] bg-[rgb(var(--panel))]",
                                ].join(" ")}
                            >
                                <span className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        name="caseId[]"
                                        value={ticket.caseId}
                                        checked={checked}
                                        onChange={(event) => onToggleCase(ticket.caseId, event.target.checked)}
                                        className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]"
                                    />
                                    <span className="grid gap-1">
                                        <span className="font-medium text-[rgb(var(--text))]">{ticket.caseNo}</span>
                                        <span className="text-xs text-[rgb(var(--muted))]">{ticket.deviceLabel || ticket.caseTitle}</span>
                                        <span className="text-xs text-[rgb(var(--muted))]">{ui.status} {resolveStatusLabel(ticket.status)}</span>
                                    </span>
                                </span>
                            </label>
                        );
                    })}
                </div>
            )}

            {selectedCaseIds.length > 0 ? (
                <label className="inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3 text-sm text-[rgb(var(--text))]">
                    <input
                        type="checkbox"
                        checked={closeCase}
                        onChange={(event) => onCloseCaseChange(event.target.checked)}
                        className="h-4 w-4 accent-[rgb(var(--accent))]"
                    />
                    {ui.closeCaseAfterCheckout}
                </label>
            ) : null}
        </MerchantSectionCard>
    );
}
