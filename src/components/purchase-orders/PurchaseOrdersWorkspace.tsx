"use client";

import { useMemo } from "react";
import { PackagePlus, Truck } from "lucide-react";
import { MerchantListShell, MerchantSectionCard, EmptyStateCard } from "@/components/merchant/shell";
import { PoDraftReviewPanel, PurchaseOrderAiIntakeCard } from "@/components/feature/receipt-po/receipt-po-form";
import { formatIsoForDisplay } from "@/lib/format/datetime-display";
import type { DimensionPickerBundle } from "@/lib/types/catalog";
import type { PurchaseOrderDraft } from "@/lib/types/purchase-order";
import { createManualPurchaseOrderDraftAction } from "@/app/(merchant)/dashboard/purchase-orders/actions";
import type { UiLanguage } from "@/lib/i18n/ui-text";
import { getUiText } from "@/lib/i18n/ui-text";

type PurchaseOrdersWorkspaceProps = {
    drafts: PurchaseOrderDraft[];
    lang: UiLanguage;
    flash?: string;
    reviewDraft?: PurchaseOrderDraft | null;
    dimensionBundle: DimensionPickerBundle;
};

type PoWorkspaceCopy = ReturnType<typeof getUiText>["purchaseOrdersWorkspace"];

function statusLabel(draft: PurchaseOrderDraft, ui: PoWorkspaceCopy): string {
    switch (draft.status) {
        case "draft":
            return ui.statusDraft;
        case "pending_ai":
            return ui.statusPendingAi;
        case "ready_for_review":
            return ui.statusReady;
        case "confirmed":
            return ui.statusConfirmed;
        case "receiving":
            return ui.statusReceiving;
        case "closed":
            return ui.statusClosed;
        default:
            return draft.status;
    }
}

function sourceLabel(draft: PurchaseOrderDraft, ui: PoWorkspaceCopy): string {
    return draft.source === "ai_upload" ? ui.sourceAi : ui.sourceManual;
}

function isOverdueEta(draft: PurchaseOrderDraft): boolean {
    if (!draft.expectedDeliveryAt) return false;
    if (draft.status === "closed" || draft.status === "confirmed") return false;
    const eta = new Date(draft.expectedDeliveryAt);
    if (!Number.isFinite(eta.getTime())) return false;
    const today = new Date();
    eta.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return today.getTime() > eta.getTime();
}

export function PurchaseOrdersWorkspace({ drafts, lang, flash, reviewDraft, dimensionBundle }: PurchaseOrdersWorkspaceProps) {
    const ui = getUiText(lang).purchaseOrdersWorkspace;

    const flashText = useMemo(() => {
        if (!flash) return null;
        if (flash === "created") return ui.flashCreated;
        if (flash === "ai_queued") return ui.flashAiQueued;
        if (flash === "po_confirmed") return ui.flashPoConfirmed;
        if (flash === "missing_supplier") return ui.flashMissingSupplier;
        if (flash === "missing_lines") return ui.flashMissingLines;
        if (flash === "missing_files") return ui.flashMissingFiles;
        if (flash === "error") return ui.flashError;
        return null;
    }, [flash, ui]);

    const logisticsRows = useMemo(() => {
        const rows: Array<{ key: string; tracking: string; eta: string; overdue: boolean }> = [];
        for (const d of drafts) {
            if (d.trackingHints.length === 0) continue;
            for (const t of d.trackingHints) {
                rows.push({
                    key: `${d.id}-${t}`,
                    tracking: t,
                    eta: d.expectedDeliveryAt ? formatIsoForDisplay(d.expectedDeliveryAt, lang) : ui.logisticsPlaceholder,
                    overdue: isOverdueEta(d),
                });
            }
        }
        return rows;
    }, [drafts, lang, ui.logisticsPlaceholder]);

    const listBody =
        drafts.length === 0 ? (
            <EmptyStateCard title={ui.emptyTitle} description={ui.emptyDesc} />
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-[rgb(var(--border))] text-left text-[rgb(var(--muted))]">
                            <th className="py-2 pr-3 font-medium">{ui.colId}</th>
                            <th className="py-2 pr-3 font-medium">{ui.colSource}</th>
                            <th className="py-2 pr-3 font-medium">{ui.colSupplier}</th>
                            <th className="py-2 pr-3 font-medium">{ui.colStatus}</th>
                            <th className="py-2 pr-3 font-medium">{ui.colExpected}</th>
                            <th className="py-2 pr-3 font-medium">{ui.colTracking}</th>
                            <th className="py-2 font-medium">{ui.colActions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {drafts.map((row) => {
                            const overdue = isOverdueEta(row);
                            return (
                                <tr key={row.id} className="border-b border-[rgb(var(--border))]/80">
                                    <td className="py-3 pr-3 align-top font-mono text-xs text-[rgb(var(--muted))]">{row.id}</td>
                                    <td className="py-3 pr-3 align-top">{sourceLabel(row, ui)}</td>
                                    <td className="py-3 pr-3 align-top">
                                        <div className="font-medium text-[rgb(var(--text))]">{row.supplierLabel}</div>
                                        {row.note ? <p className="mt-1 text-xs text-[rgb(var(--muted))]">{row.note}</p> : null}
                                        {row.lines.length > 0 ? (
                                            <ul className="mt-2 list-inside list-disc text-xs text-[rgb(var(--muted))]">
                                                {row.lines.map((line) => (
                                                    <li key={line.id}>
                                                        {line.label} × {line.qty}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </td>
                                    <td className="py-3 pr-3 align-top">
                                        <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-xs">{statusLabel(row, ui)}</span>
                                    </td>
                                    <td className="py-3 pr-3 align-top">
                                        {row.expectedDeliveryAt ? formatIsoForDisplay(row.expectedDeliveryAt, lang) : "—"}
                                        {overdue ? (
                                            <span className="mt-1 block text-xs font-medium text-[rgb(var(--accent))]">{ui.overdue}</span>
                                        ) : null}
                                    </td>
                                    <td className="py-3 pr-3 align-top text-xs">
                                        {row.trackingHints.length > 0 ? row.trackingHints.join(", ") : "—"}
                                    </td>
                                    <td className="py-3 align-top">
                                        <button
                                            type="button"
                                            disabled
                                            title={ui.btnConfirmInboundHint}
                                            className="rounded-lg border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--muted))]"
                                        >
                                            {ui.btnConfirmInbound}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );

    return (
        <div className="space-y-6">
            {flashText ? (
                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-4 py-3 text-sm text-[rgb(var(--text))]">
                    {flashText}
                </div>
            ) : null}

            {reviewDraft && reviewDraft.status !== "confirmed" ? (
                <MerchantSectionCard title={ui.reviewSectionTitle} description={ui.reviewSectionDesc}>
                    <PoDraftReviewPanel
                        key={reviewDraft.id}
                        lang={lang}
                        draft={reviewDraft}
                        dimensionBundle={dimensionBundle}
                    />
                </MerchantSectionCard>
            ) : null}

            <MerchantSectionCard title={ui.listTitle} description={ui.listDesc}>
                <MerchantListShell list={listBody} />
            </MerchantSectionCard>

            <MerchantSectionCard title={ui.createTitle} description={ui.createDesc}>
                <div className="grid gap-6 lg:grid-cols-2">
                    <PurchaseOrderAiIntakeCard lang={lang} />

                    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-5">
                        <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--panel2))] text-[rgb(var(--accent))]">
                                <PackagePlus className="h-5 w-5" aria-hidden />
                            </span>
                            <div>
                                <h3 className="text-base font-semibold text-[rgb(var(--text))]">{ui.manualCardTitle}</h3>
                                <p className="mt-1 text-sm text-[rgb(var(--muted))]">{ui.manualCardDesc}</p>
                            </div>
                        </div>
                        <form action={createManualPurchaseOrderDraftAction} className="mt-4 space-y-3">
                            <label className="block text-xs font-medium text-[rgb(var(--muted))]">
                                {ui.supplier}
                                <input
                                    name="supplierLabel"
                                    required
                                    className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                                />
                            </label>
                            <label className="block text-xs font-medium text-[rgb(var(--muted))]">
                                {ui.note}
                                <textarea
                                    name="note"
                                    rows={2}
                                    className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                                />
                            </label>
                            <label className="block text-xs font-medium text-[rgb(var(--muted))]">
                                {ui.expected}
                                <input
                                    type="date"
                                    name="expectedDeliveryAt"
                                    className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                                />
                            </label>
                            <label className="block text-xs font-medium text-[rgb(var(--muted))]">
                                {ui.tracking}
                                <input
                                    name="trackingHints"
                                    placeholder="1234567890, ABC123"
                                    className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                                />
                            </label>
                            <div className="space-y-2">
                                <p className="text-xs text-[rgb(var(--muted))]">{ui.addLine}</p>
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                                        <label className="block min-w-0 flex-1 text-xs font-medium text-[rgb(var(--muted))]">
                                            {ui.lineProduct}
                                            <input
                                                name="lineLabel[]"
                                                className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                                            />
                                        </label>
                                        <label className="block w-full shrink-0 text-xs font-medium text-[rgb(var(--muted))] sm:w-28">
                                            {ui.lineQty}
                                            <input
                                                name="lineQty[]"
                                                type="number"
                                                min={1}
                                                step={1}
                                                defaultValue={i === 0 ? 1 : undefined}
                                                className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                                            />
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="submit"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel))]"
                            >
                                {ui.manualSubmit}
                            </button>
                        </form>
                    </div>
                </div>
            </MerchantSectionCard>

            <MerchantSectionCard title={ui.logisticsTitle} description={ui.logisticsDesc}>
                {logisticsRows.length === 0 ? (
                    <EmptyStateCard title={ui.logisticsEmpty} description={ui.logisticsDesc} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-[rgb(var(--border))] text-left text-[rgb(var(--muted))]">
                                    <th className="py-2 pr-3 font-medium">{ui.colLogisticsTracking}</th>
                                    <th className="py-2 pr-3 font-medium">{ui.colLogisticsStatus}</th>
                                    <th className="py-2 font-medium">{ui.colLogisticsEta}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logisticsRows.map((r) => (
                                    <tr key={r.key} className="border-b border-[rgb(var(--border))]/80">
                                        <td className="py-3 pr-3 font-mono text-xs">{r.tracking}</td>
                                        <td className="py-3 pr-3">
                                            {r.overdue ? (
                                                <span className="rounded-full border border-[rgb(var(--accent))] px-2 py-0.5 text-xs text-[rgb(var(--accent))]">{ui.overdue}</span>
                                            ) : (
                                                <span className="text-[rgb(var(--muted))]">{ui.logisticsPlaceholder}</span>
                                            )}
                                        </td>
                                        <td className="py-3 text-xs text-[rgb(var(--muted))]">{r.eta}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="mt-4 flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                    <Truck className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{ui.carrierNotConnected}</span>
                </div>
            </MerchantSectionCard>
        </div>
    );
}
