import { FileText, ReceiptText, RotateCcw, Search } from "lucide-react";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import { MerchantListShell, MerchantSectionCard, MerchantStatGrid, MerchantToolbar } from "@/components/merchant/shell";
import type { MerchantStatItem } from "@/components/merchant/shell";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { getUiText, type UiLanguage, uiLocale } from "@/lib/i18n/ui-text";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import type { InvoiceStatus, ReceiptDocumentRecord } from "@/lib/schema";

type ReceiptWorkspaceProps = {
    lang: UiLanguage;
    documents: ReceiptDocumentRecord[];
    keyword?: string;
    statusFilter: InvoiceStatus | "all";
};

function formatMoney(value: number, locale: string) {
    return new Intl.NumberFormat(locale).format(value);
}

function formatTime(value: number, locale: string) {
    if (!Number.isFinite(value) || value <= 0) return "-";
    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(value);
}

export function ReceiptWorkspace({
    lang,
    documents,
    keyword = "",
    statusFilter,
}: ReceiptWorkspaceProps) {
    const ui = getUiText(lang).receiptWorkspace;
    const locale = uiLocale(lang);
    const totalAmount = documents.reduce((sum, row) => sum + Math.max(0, row.totalAmount), 0);
    const issuedCount = documents.filter((row) => row.status === "issued" || row.status === "reissued").length;
    const voidedCount = documents.filter((row) => row.status === "voided").length;
    const receiptSuggestions = documents.map((document) => ({
        id: document.id,
        value: document.documentNo || document.id,
        title: document.documentNo || document.id,
        subtitle: [document.buyerName, document.buyerTaxId || document.buyerAbn].filter(Boolean).join(" / ") || undefined,
        keywords: [document.documentNo, document.id, document.buyerName, document.buyerTaxId, document.buyerAbn].filter((value): value is string => Boolean(value)),
    }));
    const stats: MerchantStatItem[] = [
        { id: "count", label: ui.statsCount, value: documents.length },
        { id: "total", label: ui.statsTotal, value: formatMoney(totalAmount, locale) },
        { id: "issued", label: ui.statsIssued, value: issuedCount },
        { id: "voided", label: ui.statsVoided, value: voidedCount },
    ];

    const toolbar = (
        <MerchantToolbar
            searchSlot={
                <form action="/dashboard/receipts" method="get" className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                    <MerchantPredictiveSearchInput
                        name="q"
                        defaultValue={keyword}
                        placeholder={ui.searchPlaceholder}
                        localSuggestions={receiptSuggestions}
                        className="min-w-0 flex-1"
                    />
                    {statusFilter !== "all" ? <input type="hidden" name="status" value={statusFilter} /> : null}
                    <div className="flex items-center gap-2">
                        <IconActionButton icon={Search} type="submit" label={ui.searchAction} tooltip={ui.searchAction} />
                        <IconActionButton href="/dashboard/receipts" icon={RotateCcw} label={ui.clearSearch} tooltip={ui.clearSearchTooltip} />
                    </div>
                </form>
            }
            filtersSlot={
                <form action="/dashboard/receipts" method="get" className="flex items-center gap-2">
                    {keyword ? <input type="hidden" name="q" value={keyword} /> : null}
                    <span className="text-xs text-[rgb(var(--muted))]">{ui.statusFilter}</span>
                    <select
                        name="status"
                        defaultValue={statusFilter}
                        className="h-10 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 text-sm text-[rgb(var(--text))]"
                    >
                        <option value="all">{ui.statuses.all}</option>
                        <option value="draft">{ui.statuses.draft}</option>
                        <option value="issue_pending">{ui.statuses.issue_pending}</option>
                        <option value="issued">{ui.statuses.issued}</option>
                        <option value="issue_failed">{ui.statuses.issue_failed}</option>
                        <option value="void_pending">{ui.statuses.void_pending}</option>
                        <option value="voided">{ui.statuses.voided}</option>
                        <option value="reissued">{ui.statuses.reissued}</option>
                    </select>
                    <IconTextActionButton type="submit" icon={FileText} label={ui.apply} tooltip={ui.apply} className="h-10 px-3">
                        {ui.apply}
                    </IconTextActionButton>
                </form>
            }
        />
    );

    const list = (
        <MerchantSectionCard
            title={ui.title.replace("{count}", String(documents.length))}
            emptyState={
                documents.length === 0
                    ? {
                          icon: ReceiptText,
                          title: ui.emptyTitle,
                          description: ui.emptyDescription,
                      }
                    : undefined
            }
        >
            {documents.length === 0 ? null : (
                <div className="space-y-3">
                    <div className="grid h-[720px] gap-2 overflow-y-auto pr-1">
                        {documents.map((document) => (
                        <details key={document.id} className="rounded-lg border border-[rgb(var(--border))]">
                            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm [&::-webkit-details-marker]:hidden">
                                <span className="font-semibold">{document.documentNo || document.id}</span>
                                <InvoiceStatusBadge status={document.status} labels={ui.statuses} />
                                <span>{ui.documentTypes[document.documentType]}</span>
                                <span>{document.buyerName || ui.walkin}</span>
                                <span>{formatMoney(document.totalAmount, locale)}</span>
                                <span>{formatTime(Date.parse(document.issuedAt || document.createdAt), locale)}</span>
                            </summary>
                            <div className="border-t border-[rgb(var(--border))] p-3 text-sm">
                                <div>{ui.buyer}：{document.buyerName || ui.walkin}</div>
                                <div>{ui.documentNoLabel}：{document.documentNo || "-"}</div>
                                <div>{ui.platformStatusLabel}：{ui.platformStatuses[document.platformStatus]}</div>
                                <div>{ui.taxAmountLabel}：{formatMoney(document.taxAmount, locale)}</div>
                                <div>{ui.createdAt}：{formatTime(Date.parse(document.createdAt), locale)}</div>
                                <div className="mt-2 text-xs font-semibold text-[rgb(var(--muted))]">{ui.lineItems}</div>
                                <div className="mt-1 overflow-x-auto">
                                    <table className="min-w-full text-xs">
                                        <thead>
                                            <tr className="text-left text-[rgb(var(--muted))]">
                                                <th className="px-1 py-1">{ui.colProduct}</th>
                                                <th className="px-1 py-1">{ui.colQty}</th>
                                                <th className="px-1 py-1">{ui.colAmount}</th>
                                                <th className="px-1 py-1">{ui.colTax}</th>
                                                <th className="px-1 py-1">{ui.colTotal}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(document.items ?? []).map((item, index) => (
                                                <tr key={`${document.id}_${index}`}>
                                                    <td className="px-1 py-1">{item.name}</td>
                                                    <td className="px-1 py-1">{item.qty}</td>
                                                    <td className="px-1 py-1">{formatMoney(item.amount, locale)}</td>
                                                    <td className="px-1 py-1">{formatMoney(item.taxAmount, locale)}</td>
                                                    <td className="px-1 py-1">{formatMoney(item.totalAmount, locale)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                    </table>
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <IconTextActionButton icon={FileText} href={`/dashboard/receipts/${encodeURIComponent(document.id)}`} label={ui.viewDetail} tooltip={ui.viewDetail} />
                                </div>
                            </div>
                        </details>
                        ))}
                    </div>
                </div>
            )}
        </MerchantSectionCard>
    );

    return (
        <div className="space-y-4">
            <MerchantSectionCard title={ui.hubTitle} description={ui.hubDescription}>
                <MerchantStatGrid items={stats} />
            </MerchantSectionCard>
            <MerchantListShell toolbar={toolbar} list={list} />
        </div>
    );
}
