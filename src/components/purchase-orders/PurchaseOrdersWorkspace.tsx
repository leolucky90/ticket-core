"use client";

import { useMemo } from "react";
import { PackagePlus, Truck } from "lucide-react";
import { MerchantListShell, MerchantSectionCard, EmptyStateCard } from "@/components/merchant/shell";
import { PoDraftReviewPanel, PurchaseOrderAiIntakeCard } from "@/components/feature/receipt-po/receipt-po-form";
import { formatIsoForDisplay } from "@/lib/format/datetime-display";
import type { DimensionPickerBundle } from "@/lib/types/catalog";
import type { PurchaseOrderDraft } from "@/lib/types/purchase-order";
import { createManualPurchaseOrderDraftAction } from "@/app/(merchant)/dashboard/purchase-orders/actions";

type PurchaseOrdersWorkspaceProps = {
    drafts: PurchaseOrderDraft[];
    lang: "zh" | "en";
    flash?: string;
    reviewDraft?: PurchaseOrderDraft | null;
    dimensionBundle: DimensionPickerBundle;
};

const copy = {
    zh: {
        listTitle: "訂購單草稿",
        listDesc: "人工建立與 AI 上傳佇列；確認後後續將串接入庫與物流追蹤。",
        emptyTitle: "尚無訂購單草稿",
        emptyDesc: "使用右側「人工建立」或「上傳檔案給 AI」新增一筆。",
        colId: "編號",
        colSource: "來源",
        colSupplier: "供應商／摘要",
        colStatus: "狀態",
        colExpected: "預計到貨",
        colTracking: "追蹤／備註",
        colActions: "操作",
        sourceManual: "人工",
        sourceAi: "AI 上傳",
        statusDraft: "草稿",
        statusPendingAi: "待 AI 解析",
        statusReady: "待審核",
        statusConfirmed: "已確認",
        statusReceiving: "收貨中",
        statusClosed: "結案",
        overdue: "已逾預計到貨日",
        btnConfirmInbound: "確認收貨入庫",
        btnConfirmInboundHint: "預留：待收貨比對與庫存寫入接通",
        reviewSectionTitle: "審核草稿（人工確認）",
        reviewSectionDesc: "儲存變更後再確認建立正式採購單；未確認前不會寫入採購單主檔。",
        createTitle: "建立訂購單",
        createDesc: "可從檔案交給 AI 解析（預留），或直接人工填寫。",
        aiCardTitle: "上傳檔案（OCR + AI 草稿）",
        aiCardDesc: "收據影像（JPEG／PNG／WebP／GIF）。會先 OCR，再結構化為草稿；請於下方確認後才建立正式採購單。",
        aiSubmit: "送出 AI 解析（預留）",
        aiFiles: "選擇檔案",
        manualCardTitle: "人工建立訂購單",
        manualCardDesc: "不依賴 AI，直接建立草稿供後續確認。",
        supplier: "供應商／抬頭",
        note: "備註",
        expected: "預計到貨日",
        tracking: "追蹤碼（可填多個，空白或逗號分隔）",
        lineProduct: "品項說明",
        lineQty: "數量",
        addLine: "至少一列品項與數量",
        manualSubmit: "建立草稿",
        logisticsTitle: "物流追蹤（預留）",
        logisticsDesc: "未來將由追蹤碼自動查狀態；逾期將於此列表提醒。",
        colLogisticsTracking: "追蹤碼",
        colLogisticsStatus: "狀態",
        colLogisticsEta: "預計／更新",
        logisticsEmpty: "尚無追蹤資料（待承運 API 與 AI 抽碼接通）",
        logisticsPlaceholder: "—",
        flashCreated: "已建立人工草稿。",
        flashAiQueued: "已加入 AI 上傳佇列（解析尚未接通）。",
        flashPoConfirmed: "已確認採購單（Firestore）。",
        flashMissingSupplier: "請填寫供應商／抬頭。",
        flashMissingLines: "請至少填寫一列有效品項與數量。",
        flashMissingFiles: "請選擇至少一個檔案。",
        flashError: "操作失敗，請稍後再試。",
    },
    en: {
        listTitle: "Purchase order drafts",
        listDesc: "Manual drafts and AI upload queue; confirmation will later tie to inbound and tracking.",
        emptyTitle: "No drafts yet",
        emptyDesc: "Use “Manual create” or “Upload for AI” on the right.",
        colId: "ID",
        colSource: "Source",
        colSupplier: "Supplier",
        colStatus: "Status",
        colExpected: "ETA",
        colTracking: "Tracking / notes",
        colActions: "Actions",
        sourceManual: "Manual",
        sourceAi: "AI upload",
        statusDraft: "Draft",
        statusPendingAi: "Pending AI",
        statusReady: "Review",
        statusConfirmed: "Confirmed",
        statusReceiving: "Receiving",
        statusClosed: "Closed",
        overdue: "Past ETA",
        btnConfirmInbound: "Confirm receipt",
        btnConfirmInboundHint: "Reserved: inbound reconciliation not wired yet",
        reviewSectionTitle: "Review draft (human confirm)",
        reviewSectionDesc: "Save edits or confirm to create a purchase order; nothing is finalized until you confirm.",
        createTitle: "Create purchase order",
        createDesc: "Upload for AI (placeholder) or fill the manual form.",
        aiCardTitle: "Upload (OCR + AI draft)",
        aiCardDesc: "Receipt images (JPEG/PNG/WebP/GIF). We OCR then structure a draft; confirm to create a PO.",
        aiSubmit: "Send to AI (reserved)",
        aiFiles: "Choose files",
        manualCardTitle: "Manual purchase order",
        manualCardDesc: "Create a draft without AI.",
        supplier: "Supplier / title",
        note: "Notes",
        expected: "Expected arrival date",
        tracking: "Tracking numbers (space or comma separated)",
        lineProduct: "Line description",
        lineQty: "Qty",
        addLine: "At least one line with qty",
        manualSubmit: "Create draft",
        logisticsTitle: "Shipment tracking (reserved)",
        logisticsDesc: "Future: carrier lookup by tracking code; overdue alerts here.",
        colLogisticsTracking: "Tracking",
        colLogisticsStatus: "Status",
        colLogisticsEta: "ETA / updated",
        logisticsEmpty: "No tracking rows yet (carrier API + AI extraction pending)",
        logisticsPlaceholder: "—",
        flashCreated: "Manual draft created.",
        flashAiQueued: "Queued for AI upload (parser not connected yet).",
        flashPoConfirmed: "Purchase order confirmed (Firestore).",
        flashMissingSupplier: "Supplier / title is required.",
        flashMissingLines: "Add at least one valid line with quantity.",
        flashMissingFiles: "Select at least one file.",
        flashError: "Something went wrong. Try again.",
    },
} as const;

type CopyUi = (typeof copy)[keyof typeof copy];

function statusLabel(draft: PurchaseOrderDraft, ui: CopyUi): string {
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

function sourceLabel(draft: PurchaseOrderDraft, ui: CopyUi): string {
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
    const ui = copy[lang];

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
                    <span>{lang === "zh" ? "承運商查詢與郵件抽追蹤碼尚未接通。" : "Carrier lookup and email parsing not connected yet."}</span>
                </div>
            </MerchantSectionCard>
        </div>
    );
}
