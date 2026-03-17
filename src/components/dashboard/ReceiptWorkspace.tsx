import { Card } from "@/components/ui/card";
import type { Sale } from "@/lib/types/sale";

type ReceiptWorkspaceProps = {
    receipts: Sale[];
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

export function ReceiptWorkspace({ receipts }: ReceiptWorkspaceProps) {
    const totalAmount = receipts.reduce((sum, row) => sum + Math.max(0, row.amount), 0);
    const paidCount = receipts.filter((row) => row.paymentStatus === "paid").length;

    return (
        <div className="space-y-4">
            <Card className="rounded-xl p-3">
                <div className="text-base font-semibold">收據中心</div>
                <div className="mt-1 text-xs text-[rgb(var(--muted))]">集中保存結帳收據，提供營運分析使用</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                        <div className="text-xs text-[rgb(var(--muted))]">收據總數</div>
                        <div className="mt-1 text-xl font-semibold">{receipts.length}</div>
                    </div>
                    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                        <div className="text-xs text-[rgb(var(--muted))]">總營收</div>
                        <div className="mt-1 text-xl font-semibold">{formatMoney(totalAmount)}</div>
                    </div>
                    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                        <div className="text-xs text-[rgb(var(--muted))]">結清筆數</div>
                        <div className="mt-1 text-xl font-semibold">{paidCount}</div>
                    </div>
                </div>
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">收據明細（{receipts.length}）</div>
                {receipts.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">目前還沒有收據資料。</div>
                ) : (
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
                                        活動：
                                        {(receipt.activityRefs ?? []).length > 0
                                            ? (receipt.activityRefs ?? []).map((row) => row.activityName).join("、")
                                            : "無活動綁定"}
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
            </Card>
        </div>
    );
}
