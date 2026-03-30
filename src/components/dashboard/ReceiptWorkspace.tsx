import { ArrowLeft, ArrowRight, Filter, ReceiptText, RotateCcw, Search } from "lucide-react";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import { MerchantListPagination, MerchantListShell, MerchantSectionCard, MerchantStatGrid, MerchantToolbar } from "@/components/merchant/shell";
import type { MerchantStatItem } from "@/components/merchant/shell";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { getUiText, type UiLanguage, uiLocale } from "@/lib/i18n/ui-text";
import type { Sale } from "@/lib/types/sale";
import { LIST_DISPLAY_OPTIONS } from "@/lib/ui/list-display";

type ReceiptWorkspaceProps = {
    lang: UiLanguage;
    receipts: Sale[];
    keyword?: string;
    pageSize: string;
    currentCursor: string;
    previousCursor: string;
    previousCursorStack: string;
    nextCursor: string;
    nextCursorStack: string;
    hasNextPage: boolean;
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

function paymentStatusText(value: Sale["paymentStatus"], ui: ReturnType<typeof getUiText>["receiptWorkspace"]) {
    if (value === "unpaid") return ui.paymentStatusUnpaid;
    if (value === "deposit") return ui.paymentStatusDeposit;
    if (value === "installment") return ui.paymentStatusInstallment;
    return ui.paymentStatusPaid;
}

export function ReceiptWorkspace({
    lang,
    receipts,
    keyword = "",
    pageSize,
    currentCursor,
    previousCursor,
    previousCursorStack,
    nextCursor,
    nextCursorStack,
    hasNextPage,
}: ReceiptWorkspaceProps) {
    const ui = getUiText(lang).receiptWorkspace;
    const locale = uiLocale(lang);
    const totalAmount = receipts.reduce((sum, row) => sum + Math.max(0, row.amount), 0);
    const paidCount = receipts.filter((row) => row.paymentStatus === "paid").length;
    const receiptSuggestions = receipts.map((receipt) => ({
        id: receipt.id,
        value: receipt.receiptNo || receipt.id,
        title: receipt.receiptNo || receipt.id,
        subtitle: [receipt.customerName || ui.walkin, receipt.customerPhone, receipt.customerEmail].filter(Boolean).join(" / ") || undefined,
        keywords: [receipt.receiptNo, receipt.id, receipt.customerName, receipt.customerPhone, receipt.customerEmail].filter((value): value is string => Boolean(value)),
    }));
    const stats: MerchantStatItem[] = [
        { id: "count", label: ui.statsCount, value: receipts.length },
        { id: "total", label: ui.statsTotal, value: formatMoney(totalAmount, locale) },
        { id: "paid", label: ui.statsPaid, value: paidCount },
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
                    <input type="hidden" name="pageSize" value={pageSize} />
                    <div className="flex items-center gap-2">
                        <IconActionButton icon={Search} type="submit" label={ui.searchAction} tooltip={ui.searchAction} />
                        <IconActionButton href="/dashboard/receipts" icon={RotateCcw} label={ui.clearSearch} tooltip={ui.clearSearchTooltip} />
                    </div>
                </form>
            }
            filtersSlot={
                <form action="/dashboard/receipts" method="get" className="flex items-center gap-2">
                    {keyword ? <input type="hidden" name="q" value={keyword} /> : null}
                    <span className="text-xs text-[rgb(var(--muted))]">{ui.perPage}</span>
                    <select
                        name="pageSize"
                        defaultValue={pageSize}
                        className="h-10 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 text-sm text-[rgb(var(--text))]"
                    >
                        {LIST_DISPLAY_OPTIONS.map((size) => (
                            <option key={`receipt-page-size-${size}`} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                    <IconTextActionButton type="submit" icon={Filter} label={ui.applyPageSize} tooltip={ui.applyPageSize} className="h-10 px-3">
                        {ui.apply}
                    </IconTextActionButton>
                </form>
            }
        />
    );

    const list = (
        <MerchantSectionCard
            title={ui.title.replace("{count}", String(receipts.length))}
            emptyState={
                receipts.length === 0
                    ? {
                          icon: ReceiptText,
                          title: ui.emptyTitle,
                          description: ui.emptyDescription,
                      }
                    : undefined
            }
        >
            {receipts.length === 0 ? null : (
                <div className="space-y-3">
                    <MerchantListPagination
                        summary={<span>{ui.summary.replace("{count}", String(receipts.length))}</span>}
                        previousAction={
                            <form action="/dashboard/receipts" method="get">
                                {keyword ? <input type="hidden" name="q" value={keyword} /> : null}
                                <input type="hidden" name="pageSize" value={pageSize} />
                                {previousCursor ? <input type="hidden" name="cursor" value={previousCursor} /> : null}
                                {previousCursorStack ? <input type="hidden" name="cursorStack" value={previousCursorStack} /> : null}
                                <IconTextActionButton
                                    type="submit"
                                    icon={ArrowLeft}
                                    label={ui.previousPage}
                                    tooltip={ui.previousTooltip}
                                    className="h-9 px-3"
                                    disabled={!currentCursor}
                                >
                                    {ui.previousPage}
                                </IconTextActionButton>
                            </form>
                        }
                        nextAction={
                            <form action="/dashboard/receipts" method="get">
                                {keyword ? <input type="hidden" name="q" value={keyword} /> : null}
                                <input type="hidden" name="pageSize" value={pageSize} />
                                <input type="hidden" name="cursor" value={nextCursor} />
                                {nextCursorStack ? <input type="hidden" name="cursorStack" value={nextCursorStack} /> : null}
                                <IconTextActionButton
                                    type="submit"
                                    icon={ArrowRight}
                                    label={ui.nextPage}
                                    tooltip={ui.nextTooltip}
                                    className="h-9 px-3"
                                    disabled={!hasNextPage || !nextCursor}
                                >
                                    {ui.nextPage}
                                </IconTextActionButton>
                            </form>
                        }
                    />
                    <div className="grid h-[720px] gap-2 overflow-y-auto pr-1">
                        {receipts.map((receipt) => (
                        <details key={receipt.id} className="rounded-lg border border-[rgb(var(--border))]">
                            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm [&::-webkit-details-marker]:hidden">
                                <span className="font-semibold">{receipt.receiptNo || receipt.id}</span>
                                <span>{receipt.customerName || ui.walkin}</span>
                                <span>{formatMoney(receipt.amount, locale)}</span>
                                <span>{formatTime(receipt.checkoutAt, locale)}</span>
                            </summary>
                            <div className="border-t border-[rgb(var(--border))] p-3 text-sm">
                                <div>{ui.customer}：{receipt.customerName || ui.walkin}</div>
                                <div>{ui.phone}：{receipt.customerPhone || "-"}</div>
                                <div>{ui.email}：{receipt.customerEmail || "-"}</div>
                                <div>
                                    {ui.promotions}：
                                    {(receipt.appliedPromotions ?? []).length > 0
                                        ? (receipt.appliedPromotions ?? []).map((row) => `${row.promotionName}（${row.effectType}）`).join("、")
                                        : ui.none}
                                </div>
                                <div>
                                    {ui.entitlements}：
                                    {(receipt.createdEntitlements ?? []).length > 0
                                        ? (receipt.createdEntitlements ?? [])
                                              .map((row) =>
                                                  row.scopeType === "product"
                                                      ? `${row.entitlementType} / ${ui.scopeProductPrefix}${row.productName || "-"} / ${ui.remainingPrefix}${row.remainingQty}`
                                                      : `${row.entitlementType} / ${ui.scopeCategoryPrefix}${row.categoryName || "-"} / ${ui.remainingPrefix}${row.remainingQty}`,
                                              )
                                              .join("、")
                                        : ui.noNewEntitlements}
                                </div>
                                <div>
                                    {ui.pickupReservations}：
                                    {(receipt.createdPickupReservations ?? []).length > 0
                                        ? (receipt.createdPickupReservations ?? [])
                                              .map((row) => `${row.reservationId} / ${row.status} / ${row.lineItemCount}${ui.lineItemSuffix}`)
                                              .join("、")
                                        : ui.noNewPickupReservations}
                                </div>
                                <div>
                                    {ui.cases}：
                                    {(receipt.caseRefs ?? []).length > 0
                                        ? (receipt.caseRefs ?? []).map((row) => `${row.caseNo} / ${row.caseTitle || "-"}`).join("、")
                                        : ui.noLinkedCase}
                                </div>
                                <div>{ui.paymentMethod}：{receipt.paymentMethod === "card" ? ui.paymentMethodCard : ui.paymentMethodCash}</div>
                                <div>{ui.paymentStatus}：{paymentStatusText(receipt.paymentStatus, ui)}</div>
                                <div>{ui.createdAt}：{formatTime(receipt.createdAt, locale)}</div>
                                <div className="mt-2 text-xs font-semibold text-[rgb(var(--muted))]">{ui.lineItems}</div>
                                <div className="mt-1 overflow-x-auto">
                                    <table className="min-w-full text-xs">
                                        <thead>
                                            <tr className="text-left text-[rgb(var(--muted))]">
                                                <th className="px-1 py-1">{ui.colProduct}</th>
                                                <th className="px-1 py-1">{ui.colQty}</th>
                                                <th className="px-1 py-1">{ui.colUnitPrice}</th>
                                                <th className="px-1 py-1">{ui.colSubtotal}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(receipt.lineItems ?? []).map((item, index) => (
                                                <tr key={`${receipt.id}_${index}`}>
                                                    <td className="px-1 py-1">{item.productName}</td>
                                                    <td className="px-1 py-1">{item.qty}</td>
                                                                <td className="px-1 py-1">{formatMoney(item.unitPrice, locale)}</td>
                                                                <td className="px-1 py-1">{formatMoney(item.subtotal, locale)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                    </table>
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
