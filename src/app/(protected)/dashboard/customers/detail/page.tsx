import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listActivityPurchases, listCompanyCustomers } from "@/lib/services/commerce";
import { listTickets } from "@/lib/services/ticket";
import type { CompanyCustomer } from "@/lib/types/commerce";
import type { Ticket } from "@/lib/types/ticket";

type CustomerDetailSearchParams = {
    id?: string;
};

type ActivityPurchaseRow = Awaited<ReturnType<typeof listActivityPurchases>>[number];

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

function statusText(status: string): string {
    if (status === "new") return "新建";
    if (status === "in_progress") return "處理中";
    if (status === "waiting_customer") return "等待客戶";
    if (status === "resolved") return "已解決";
    if (status === "closed") return "已結束";
    return status;
}

function activityCheckoutStatusText(status: ActivityPurchaseRow["checkoutStatus"]): string {
    return status === "stored" ? "商品寄存" : "結清";
}

function normalizeComparable(value: string): string {
    return value.trim().toLowerCase();
}

function isTicketForCustomer(customer: CompanyCustomer, ticket: Ticket): boolean {
    if (ticket.customerId && customer.id && ticket.customerId === customer.id) return true;

    const customerEmail = normalizeComparable(customer.email);
    const ticketEmail = normalizeComparable(ticket.customer.email);
    if (customerEmail && ticketEmail && customerEmail === ticketEmail) return true;

    const customerPhone = normalizeComparable(customer.phone);
    const ticketPhone = normalizeComparable(ticket.customer.phone);
    if (customerPhone && ticketPhone && customerPhone === ticketPhone) return true;

    const customerName = normalizeComparable(customer.name);
    const ticketName = normalizeComparable(ticket.customer.name);
    if (customerName && ticketName && customerName === ticketName) return true;

    return false;
}

function isPurchaseForCustomer(customer: CompanyCustomer, purchase: ActivityPurchaseRow): boolean {
    const customerEmail = normalizeComparable(customer.email);
    const purchaseEmail = normalizeComparable(purchase.customerEmail);
    if (customerEmail && purchaseEmail && customerEmail === purchaseEmail) return true;

    const customerPhone = normalizeComparable(customer.phone);
    const purchasePhone = normalizeComparable(purchase.customerPhone);
    if (customerPhone && purchasePhone && customerPhone === purchasePhone) return true;

    const customerName = normalizeComparable(customer.name);
    const purchaseName = normalizeComparable(purchase.customerName);
    if (customerName && purchaseName && customerName === purchaseName) return true;

    return false;
}

export default async function CustomerDetailPage({ searchParams }: { searchParams: Promise<CustomerDetailSearchParams> }) {
    const sp = await searchParams;
    const customerId = (sp.id ?? "").trim();
    if (!customerId) redirect("/dashboard?tab=customers");

    const [customers, tickets, purchases] = await Promise.all([
        listCompanyCustomers(),
        listTickets(),
        listActivityPurchases(),
    ]);

    const customer = customers.find((item) => item.id === customerId);
    if (!customer) redirect("/dashboard?tab=customers");

    const repairRecords = tickets.filter((ticket) => isTicketForCustomer(customer, ticket)).sort((a, b) => b.updatedAt - a.updatedAt);
    const purchaseRecords = purchases.filter((purchase) => isPurchaseForCustomer(customer, purchase)).sort((a, b) => b.purchasedAt - a.purchasedAt);
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
                        <div className="text-xs text-[rgb(var(--muted))]">查看客戶資料、維修紀錄、購買紀錄、活動消費</div>
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
                    <div>維修案件總數：{repairRecords.length}</div>
                    <div>進行中案件：{activeRepairCount}</div>
                    <div>購買總金額：{formatMoney(totalPurchaseAmount)}</div>
                </div>
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">維修紀錄（{repairRecords.length}）</div>
                {repairRecords.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">目前沒有維修紀錄。</div>
                ) : (
                    <div className="grid gap-2">
                        {repairRecords.map((ticket) => (
                            <div key={ticket.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                <div>案件編號：{ticket.id}</div>
                                <div>設備：{ticket.device.name} {ticket.device.model}</div>
                                <div>狀態：{statusText(ticket.status)}</div>
                                <div>送修原因：{ticket.repairReason || "-"}</div>
                                <div>最後更新：{formatTime(ticket.updatedAt)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">購買紀錄（{purchaseRecords.length}）</div>
                {purchaseRecords.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">目前沒有購買紀錄。</div>
                ) : (
                    <div className="grid gap-2">
                        {purchaseRecords.map((purchase) => (
                            <div key={purchase.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                <div>活動：{purchase.activityName || "-"}</div>
                                <div>品項：{purchase.itemName || "-"}</div>
                                <div>數量：{purchase.totalQty}</div>
                                <div>金額：{formatMoney(purchase.salesAmount)}</div>
                                <div>狀態：{purchase.status === "ended" ? "結束" : "未結束"}</div>
                                <div>購買時間：{formatTime(purchase.purchasedAt)}</div>
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
                                <div>活動內容：{purchase.activityContent || "-"}</div>
                                <div>品項：{purchase.itemName || "-"}</div>
                                <div>數量：{purchase.totalQty}</div>
                                <div>金額：{formatMoney(purchase.salesAmount)}</div>
                                <div>狀態：{activityCheckoutStatusText(purchase.checkoutStatus)}</div>
                                <div>寄店數量：{purchase.remainingQty}</div>
                                <div>消費時間：{formatTime(purchase.purchasedAt)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
