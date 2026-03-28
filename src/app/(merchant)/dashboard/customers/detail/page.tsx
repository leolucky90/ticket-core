import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMerchantCustomerDetail } from "@/lib/services/merchant/customer-detail-read-model.service";

type CustomerDetailSearchParams = {
    id?: string;
};

function formatMoney(value: number) {
    return new Intl.NumberFormat("zh-TW").format(value);
}

function formatTime(value: number | string | null | undefined) {
    const timestamp =
        typeof value === "number"
            ? value
            : typeof value === "string"
              ? Date.parse(value)
              : Number.NaN;
    if (!Number.isFinite(timestamp) || timestamp <= 0) return "-";
    return new Intl.DateTimeFormat("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(timestamp);
}

function ticketStatusText(status: string): string {
    if (status === "new") return "新建";
    if (status === "in_progress") return "處理中";
    if (status === "waiting_customer") return "等待客戶";
    if (status === "resolved") return "已解決";
    if (status === "closed") return "已結束";
    return status;
}

function caseTypeText(caseType?: string): string {
    if (caseType === "refurbish") return "翻新";
    if (caseType === "warranty") return "保固";
    return "維修";
}

function orderStatusText(status: string): string {
    if (status === "draft") return "草稿";
    if (status === "placed") return "已下單";
    if (status === "accepted") return "已接受";
    if (status === "processing") return "處理中";
    if (status === "ready_for_pickup") return "可取貨";
    if (status === "shipped") return "已出貨";
    if (status === "completed") return "已完成";
    if (status === "cancelled") return "已取消";
    if (status === "returned") return "已退貨";
    if (status === "out_of_stock_pending_change") return "缺貨待調整";
    return status;
}

function entitlementStatusText(status: string): string {
    if (status === "active") return "可使用";
    if (status === "partially_used") return "部分使用";
    if (status === "used_up") return "已用完";
    if (status === "expired") return "已過期";
    if (status === "cancelled") return "已取消";
    return status;
}

function reservationStatusText(status: string): string {
    if (status === "pending") return "待建立";
    if (status === "reserved") return "已留貨";
    if (status === "packed") return "已包裝";
    if (status === "ready_for_pickup") return "可取貨";
    if (status === "picked_up") return "已取貨";
    if (status === "cancelled") return "已取消";
    if (status === "expired") return "已逾期";
    return status;
}

export default async function CustomerDetailPage({ searchParams }: { searchParams: Promise<CustomerDetailSearchParams> }) {
    const sp = await searchParams;
    const customerId = (sp.id ?? "").trim();
    if (!customerId) redirect("/dashboard?tab=customers");

    const detail = await getMerchantCustomerDetail(customerId);
    if (!detail) redirect("/dashboard?tab=customers");

    const { relationshipRecord, entitlements, redemptions, pickupReservations } = detail;
    const { customer, repairRecords, purchaseRecords, snapshot: customerSnapshot } = relationshipRecord;
    const warrantyRecords = repairRecords.filter((ticket) => ticket.caseType === "warranty");
    const activityConsumptionRecords = purchaseRecords.filter((purchase) => (purchase.activityName || "") !== "一般銷售");

    const totalPurchaseAmount = purchaseRecords.reduce((sum, row) => sum + row.salesAmount, 0);
    const activeRepairCount = repairRecords.filter(
        (ticket) => ticket.status === "new" || ticket.status === "in_progress" || ticket.status === "waiting_customer",
    ).length;

    return (
        <div className="space-y-4">
            <Card className="rounded-xl p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <div className="text-base font-semibold">客戶完整資訊</div>
                        <div className="text-xs text-[rgb(var(--muted))]">查看客戶資料、維修、訂單、收據、保固、診斷、客戶權益與待取貨記錄</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={`/dashboard/checkout?customerId=${encodeURIComponent(customer.id)}`}>
                            <Button type="button" variant="ghost">建立此客戶結帳</Button>
                        </Link>
                        <Link href="/dashboard?tab=customers">
                            <Button type="button" variant="ghost">返回客戶列表</Button>
                        </Link>
                    </div>
                </div>
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">客戶資料</div>
                <div className="grid gap-1 text-sm">
                    <div>姓名：{customer.name}</div>
                    <div>電話：{customer.phone || "-"}</div>
                    <div>Email：{customer.email || "-"}</div>
                    <div>地址：{customer.address || "-"}</div>
                    <div>建立時間：{formatTime(customer.createdAt)}</div>
                    <div>最後更新：{formatTime(customer.updatedAt)}</div>
                    <div>案件總數：{repairRecords.length}</div>
                    <div>進行中案件：{activeRepairCount}</div>
                    <div>購買總金額：{formatMoney(totalPurchaseAmount)}</div>
                </div>
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">案件紀錄（{repairRecords.length}）</div>
                {repairRecords.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">目前沒有案件紀錄。</div>
                ) : (
                    <div className="grid gap-2">
                        {repairRecords.map((ticket) => (
                            <div key={ticket.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                <div>案件編號：{ticket.id}</div>
                                <div>案件類型：{caseTypeText(ticket.caseType)}</div>
                                <div>設備：{ticket.device.name} {ticket.device.model}</div>
                                <div>狀態：{ticketStatusText(ticket.status)}</div>
                                <div>送修原因：{ticket.repairReason || "-"}</div>
                                <div>最後更新：{formatTime(ticket.updatedAt)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">訂單與收據</div>
                {!customerSnapshot || customerSnapshot.orders.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">目前沒有訂單資料。</div>
                ) : (
                    <div className="grid gap-2">
                        {customerSnapshot.orders.map((order) => {
                            const receipt = customerSnapshot.receipts.find((item) => item.orderId === order.id);
                            const orderItems = customerSnapshot.orderItems.filter((item) => item.orderId === order.id);
                            return (
                                <div key={order.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                    <div>訂單編號：{order.orderNo}</div>
                                    <div>狀態：{orderStatusText(order.status)}</div>
                                    <div>金額：{formatMoney(order.totalAmount)}</div>
                                    <div>收據：{receipt ? receipt.receiptNo : "-"}</div>
                                    <div>品項：{orderItems.length > 0 ? orderItems.map((item) => item.productName).join("、") : "-"}</div>
                                    <div>更新：{formatTime(order.updatedAt)}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">保固與診斷</div>
                {!customerSnapshot || (customerSnapshot.warranties.length === 0 && customerSnapshot.diagnosticReports.length === 0) ? (
                    <div className="text-sm text-[rgb(var(--muted))]">目前沒有保固或診斷資料。</div>
                ) : (
                    <div className="grid gap-2">
                        {warrantyRecords.map((ticket) => {
                            const warranty = customerSnapshot.warranties.find((item) => item.ticketId === ticket.id);
                            return (
                                <div key={ticket.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                    <div>保固案件：{ticket.id}</div>
                                    <div>保固項目：{warranty?.productName || `${ticket.device.name} ${ticket.device.model}`.trim() || "-"}</div>
                                    <div>狀態：{warranty ? (warranty.status === "active" ? "有效" : warranty.status === "expired" ? "過期" : "失效") : ticketStatusText(ticket.status)}</div>
                                    <div>保固原因：{ticket.repairReason || "-"}</div>
                                    <div>來源案件：{ticket.parentCaseTitle || ticket.parentCaseId || "-"}</div>
                                    <div>歷史摘要：{ticket.historySummary || "-"}</div>
                                    <div>到期日：{warranty ? formatTime(warranty.expiresAt) : "-"}</div>
                                </div>
                            );
                        })}
                        {customerSnapshot.diagnosticReports.map((report) => (
                            <div key={report.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                <div>診斷單號：{report.reportNo}</div>
                                <div>狀態：{report.status === "published" ? "已發布" : report.status === "draft" ? "草稿" : "已封存"}</div>
                                <div>摘要：{report.summary || "-"}</div>
                                <div>更新時間：{formatTime(report.updatedAt)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">活動消費（{activityConsumptionRecords.length}）</div>
                {activityConsumptionRecords.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">目前沒有活動消費紀錄。</div>
                ) : (
                    <div className="grid gap-2">
                        {activityConsumptionRecords.map((purchase) => (
                            <div key={purchase.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                <div>活動名稱：{purchase.activityName || "-"}</div>
                                <div>品項：{purchase.itemName || "-"}</div>
                                <div>金額：{formatMoney(purchase.salesAmount)}</div>
                                <div>狀態：{purchase.checkoutStatus === "stored" ? "產生客戶權益" : "即時結帳"}</div>
                                <div>權益剩餘次數：{purchase.remainingQty}</div>
                                <div>消費時間：{formatTime(purchase.purchasedAt)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">客戶權益 / 可兌換記錄</div>
                {entitlements.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">目前沒有客戶權益紀錄。</div>
                ) : (
                    <div className="grid gap-2">
                        {entitlements.map((entitlement) => (
                            <div key={entitlement.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                <div>來源：{entitlement.sourceType}</div>
                                <div>類型：{entitlement.entitlementType}</div>
                                <div>
                                    範圍：
                                    {entitlement.scopeType === "product"
                                        ? `產品 ${entitlement.productName || entitlement.productId || "-"}`
                                        : `分類 ${entitlement.categoryName || entitlement.categoryId || "-"}`}
                                </div>
                                <div>剩餘次數：{entitlement.remainingQty} / {entitlement.totalQty}</div>
                                <div>狀態：{entitlementStatusText(entitlement.status)}</div>
                                <div>到期日：{formatTime(entitlement.expiresAt ?? 0)}</div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-3 border-t border-[rgb(var(--border))] pt-3">
                    <div className="mb-2 text-sm font-semibold">權益兌換紀錄</div>
                    {redemptions.length === 0 ? (
                        <div className="text-sm text-[rgb(var(--muted))]">目前沒有兌換紀錄。</div>
                    ) : (
                        <div className="grid gap-2">
                            {redemptions.map((row) => (
                                <div key={row.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                    <div>商品：{row.productName}</div>
                                    <div>SKU：{row.sku || "-"}</div>
                                    <div>數量：{row.qty}</div>
                                    <div>兌換時間：{formatTime(row.redeemedAt)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">待取貨 / 已留貨記錄</div>
                {pickupReservations.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">目前沒有待取貨留貨記錄。</div>
                ) : (
                    <div className="grid gap-2">
                        {pickupReservations.map((reservation) => (
                            <div key={reservation.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                <div>單號：{reservation.id}</div>
                                <div>狀態：{reservationStatusText(reservation.status)}</div>
                                <div>項目數：{reservation.lineItems.length}</div>
                                <div>留貨時間：{formatTime(reservation.reservedAt ?? 0)}</div>
                                <div>可取貨時間：{formatTime(reservation.readyAt ?? 0)}</div>
                                <div>到期時間：{formatTime(reservation.expiresAt ?? 0)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
