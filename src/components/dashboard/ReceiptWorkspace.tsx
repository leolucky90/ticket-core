import { ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MerchantListShell, MerchantSectionCard, MerchantStatGrid, MerchantToolbar } from "@/components/merchant/shell";
import type { MerchantStatItem } from "@/components/merchant/shell";
import type { Sale } from "@/lib/types/sale";

type ReceiptWorkspaceProps = {
    receipts: Sale[];
    keyword?: string;
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

export function ReceiptWorkspace({ receipts, keyword = "" }: ReceiptWorkspaceProps) {
    const totalAmount = receipts.reduce((sum, row) => sum + Math.max(0, row.amount), 0);
    const paidCount = receipts.filter((row) => row.paymentStatus === "paid").length;
    const stats: MerchantStatItem[] = [
        { id: "count", label: "收據總數", value: receipts.length },
        { id: "total", label: "總營收", value: formatMoney(totalAmount) },
        { id: "paid", label: "結清筆數", value: paidCount },
    ];

    const toolbar = (
        <MerchantToolbar
            searchSlot={
                <form action="/dashboard/receipts" method="get" className="flex w-full items-center gap-2">
                    <Input name="q" defaultValue={keyword} placeholder="查詢收據編號、客戶名稱、電話、Email" />
                    <Button type="submit">查詢</Button>
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
                <div className="grid gap-2">
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
