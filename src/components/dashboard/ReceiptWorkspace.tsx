import { ArrowLeft, ArrowRight, Filter, ReceiptText, RotateCcw, Search } from "lucide-react";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import { MerchantListPagination, MerchantListShell, MerchantSectionCard, MerchantStatGrid, MerchantToolbar } from "@/components/merchant/shell";
import type { MerchantStatItem } from "@/components/merchant/shell";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import type { Sale } from "@/lib/types/sale";
import { LIST_DISPLAY_OPTIONS } from "@/lib/ui/list-display";

type ReceiptWorkspaceProps = {
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

function formatMoney(value: number) {
    return new Intl.NumberFormat("zh-TW").format(value);
}

function formatTime(value: number) {
    if (!Number.isFinite(value) || value <= 0) return "-";
    return new Intl.DateTimeFormat("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(value);
}

function paymentStatusText(value: Sale["paymentStatus"]) {
    if (value === "unpaid") return "未付";
    if (value === "deposit") return "訂金";
    if (value === "installment") return "分期";
    return "結清";
}

export function ReceiptWorkspace({
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
    const totalAmount = receipts.reduce((sum, row) => sum + Math.max(0, row.amount), 0);
    const paidCount = receipts.filter((row) => row.paymentStatus === "paid").length;
    const receiptSuggestions = receipts.map((receipt) => ({
        id: receipt.id,
        value: receipt.receiptNo || receipt.id,
        title: receipt.receiptNo || receipt.id,
        subtitle: [receipt.customerName || "過路客", receipt.customerPhone, receipt.customerEmail].filter(Boolean).join(" / ") || undefined,
        keywords: [receipt.receiptNo, receipt.id, receipt.customerName, receipt.customerPhone, receipt.customerEmail].filter((value): value is string => Boolean(value)),
    }));
    const stats: MerchantStatItem[] = [
        { id: "count", label: "收據總數", value: receipts.length },
        { id: "total", label: "總營收", value: formatMoney(totalAmount) },
        { id: "paid", label: "結清筆數", value: paidCount },
    ];

    const toolbar = (
        <MerchantToolbar
            searchSlot={
                <form action="/dashboard/receipts" method="get" className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                    <MerchantPredictiveSearchInput
                        name="q"
                        defaultValue={keyword}
                        placeholder="查詢收據編號、客戶名稱、電話、Email"
                        localSuggestions={receiptSuggestions}
                        className="min-w-0 flex-1"
                    />
                    <input type="hidden" name="pageSize" value={pageSize} />
                    <div className="flex items-center gap-2">
                        <IconActionButton icon={Search} type="submit" label="搜尋收據" tooltip="搜尋收據" />
                        <IconActionButton href="/dashboard/receipts" icon={RotateCcw} label="清除搜尋" tooltip="清除搜尋條件" />
                    </div>
                </form>
            }
            filtersSlot={
                <form action="/dashboard/receipts" method="get" className="flex items-center gap-2">
                    {keyword ? <input type="hidden" name="q" value={keyword} /> : null}
                    <span className="text-xs text-[rgb(var(--muted))]">每頁</span>
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
                    <IconTextActionButton type="submit" icon={Filter} label="套用每頁筆數" tooltip="套用每頁顯示筆數" className="h-10 px-3">
                        套用
                    </IconTextActionButton>
                </form>
            }
        />
    );

    const list = (
        <MerchantSectionCard
            title={`收據明細（${receipts.length}）`}
            emptyState={
                receipts.length === 0
                    ? {
                          icon: ReceiptText,
                          title: "尚無收據資料",
                          description: "完成結帳後，收據會集中出現在這裡，方便後續營運與對帳。",
                      }
                    : undefined
            }
        >
            {receipts.length === 0 ? null : (
                <div className="space-y-3">
                    <MerchantListPagination
                        summary={<span>本頁顯示 {receipts.length} 筆，採用固定高度與 server 分頁。</span>}
                        previousAction={
                            <form action="/dashboard/receipts" method="get">
                                {keyword ? <input type="hidden" name="q" value={keyword} /> : null}
                                <input type="hidden" name="pageSize" value={pageSize} />
                                {previousCursor ? <input type="hidden" name="cursor" value={previousCursor} /> : null}
                                {previousCursorStack ? <input type="hidden" name="cursorStack" value={previousCursorStack} /> : null}
                                <IconTextActionButton
                                    type="submit"
                                    icon={ArrowLeft}
                                    label="上一頁"
                                    tooltip="載入上一頁"
                                    className="h-9 px-3"
                                    disabled={!currentCursor}
                                >
                                    上一頁
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
                                    label="下一頁"
                                    tooltip="載入下一頁"
                                    className="h-9 px-3"
                                    disabled={!hasNextPage || !nextCursor}
                                >
                                    下一頁
                                </IconTextActionButton>
                            </form>
                        }
                    />
                    <div className="grid h-[720px] gap-2 overflow-y-auto pr-1">
                        {receipts.map((receipt) => (
                        <details key={receipt.id} className="rounded-lg border border-[rgb(var(--border))]">
                            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm [&::-webkit-details-marker]:hidden">
                                <span className="font-semibold">{receipt.receiptNo || receipt.id}</span>
                                <span>{receipt.customerName || "過路客"}</span>
                                <span>{formatMoney(receipt.amount)}</span>
                                <span>{formatTime(receipt.checkoutAt)}</span>
                            </summary>
                            <div className="border-t border-[rgb(var(--border))] p-3 text-sm">
                                <div>客戶：{receipt.customerName || "過路客"}</div>
                                <div>電話：{receipt.customerPhone || "-"}</div>
                                <div>Email：{receipt.customerEmail || "-"}</div>
                                <div>
                                    促銷活動：
                                    {(receipt.appliedPromotions ?? []).length > 0
                                        ? (receipt.appliedPromotions ?? []).map((row) => `${row.promotionName}（${row.effectType}）`).join("、")
                                        : "無"}
                                </div>
                                <div>
                                    客戶權益：
                                    {(receipt.createdEntitlements ?? []).length > 0
                                        ? (receipt.createdEntitlements ?? [])
                                              .map((row) =>
                                                  row.scopeType === "product"
                                                      ? `${row.entitlementType} / 產品 ${row.productName || "-"} / 剩餘 ${row.remainingQty}`
                                                      : `${row.entitlementType} / 分類 ${row.categoryName || "-"} / 剩餘 ${row.remainingQty}`,
                                              )
                                              .join("、")
                                        : "無新增"}
                                </div>
                                <div>
                                    待取貨留貨：
                                    {(receipt.createdPickupReservations ?? []).length > 0
                                        ? (receipt.createdPickupReservations ?? [])
                                              .map((row) => `${row.reservationId} / ${row.status} / ${row.lineItemCount} 項`)
                                              .join("、")
                                        : "無新增"}
                                </div>
                                <div>
                                    案件：
                                    {(receipt.caseRefs ?? []).length > 0
                                        ? (receipt.caseRefs ?? []).map((row) => `${row.caseNo} / ${row.caseTitle || "-"}`).join("、")
                                        : "未綁定案件"}
                                </div>
                                <div>付款方式：{receipt.paymentMethod === "card" ? "刷卡" : "現金"}</div>
                                <div>付款狀態：{paymentStatusText(receipt.paymentStatus)}</div>
                                <div>建立時間：{formatTime(receipt.createdAt)}</div>
                                <div className="mt-2 text-xs font-semibold text-[rgb(var(--muted))]">商品明細</div>
                                <div className="mt-1 overflow-x-auto">
                                    <table className="min-w-full text-xs">
                                        <thead>
                                            <tr className="text-left text-[rgb(var(--muted))]">
                                                <th className="px-1 py-1">商品</th>
                                                <th className="px-1 py-1">數量</th>
                                                <th className="px-1 py-1">單價</th>
                                                <th className="px-1 py-1">小計</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(receipt.lineItems ?? []).map((item, index) => (
                                                <tr key={`${receipt.id}_${index}`}>
                                                    <td className="px-1 py-1">{item.productName}</td>
                                                    <td className="px-1 py-1">{item.qty}</td>
                                                    <td className="px-1 py-1">{formatMoney(item.unitPrice)}</td>
                                                    <td className="px-1 py-1">{formatMoney(item.subtotal)}</td>
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
            <MerchantSectionCard title="收據中心" description="集中保存結帳收據，支援營運分析與對帳追蹤。">
                <MerchantStatGrid items={stats} />
            </MerchantSectionCard>
            <MerchantListShell toolbar={toolbar} list={list} />
        </div>
    );
}
