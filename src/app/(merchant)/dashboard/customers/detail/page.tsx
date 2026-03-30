import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getUiLanguage, getUiText, uiLocale } from "@/lib/i18n/ui-text";
import { getMerchantCustomerDetail } from "@/lib/services/merchant/customer-detail-read-model.service";
import { isGeneralActivityPurchase } from "@/lib/services/merchant/customer-relationship-read-model.service";

type CustomerDetailSearchParams = {
    id?: string;
};

function formatMoney(value: number, locale: string) {
    return new Intl.NumberFormat(locale).format(value);
}

function formatTime(value: number | string | null | undefined, locale: string) {
    const timestamp =
        typeof value === "number"
            ? value
            : typeof value === "string"
              ? Date.parse(value)
              : Number.NaN;
    if (!Number.isFinite(timestamp) || timestamp <= 0) return "-";
    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(timestamp);
}

function lookupLabel<T extends Record<string, string>>(table: T, key: string): string {
    return key in table ? table[key as keyof T] : key;
}

export default async function CustomerDetailPage({ searchParams }: { searchParams: Promise<CustomerDetailSearchParams> }) {
    const sp = await searchParams;
    const customerId = (sp.id ?? "").trim();
    if (!customerId) redirect("/dashboard?tab=customers");

    const lang = getUiLanguage((await cookies()).get("lang")?.value);
    const ui = getUiText(lang).customerDetailPage;
    const locale = uiLocale(lang);

    const detail = await getMerchantCustomerDetail(customerId);
    if (!detail) redirect("/dashboard?tab=customers");

    const { relationshipRecord, entitlements, redemptions, pickupReservations } = detail;
    const { customer, repairRecords, purchaseRecords, snapshot: customerSnapshot } = relationshipRecord;
    const warrantyRecords = repairRecords.filter((ticket) => ticket.caseType === "warranty");
    const activityConsumptionRecords = purchaseRecords.filter((purchase) => !isGeneralActivityPurchase(purchase));
    const totalPurchaseAmount = purchaseRecords.reduce((sum, row) => sum + row.salesAmount, 0);
    const activeRepairCount = repairRecords.filter(
        (ticket) => ticket.status === "new" || ticket.status === "in_progress" || ticket.status === "waiting_customer",
    ).length;

    return (
        <div className="space-y-4">
            <Card className="rounded-xl p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <div className="text-base font-semibold">{ui.title}</div>
                        <div className="text-xs text-[rgb(var(--muted))]">{ui.description}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={`/dashboard/checkout?customerId=${encodeURIComponent(customer.id)}`}>
                            <Button type="button" variant="ghost">{ui.createCheckout}</Button>
                        </Link>
                        <Link href="/dashboard?tab=customers">
                            <Button type="button" variant="ghost">{ui.backToList}</Button>
                        </Link>
                    </div>
                </div>
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">{ui.customerInfo}</div>
                <div className="grid gap-1 text-sm">
                    <div>{ui.labels.name}：{customer.name}</div>
                    <div>{ui.labels.phone}：{customer.phone || "-"}</div>
                    <div>{ui.labels.email}：{customer.email || "-"}</div>
                    <div>{ui.labels.address}：{customer.address || "-"}</div>
                    <div>{ui.labels.createdAt}：{formatTime(customer.createdAt, locale)}</div>
                    <div>{ui.labels.updatedAt}：{formatTime(customer.updatedAt, locale)}</div>
                    <div>{ui.labels.totalCases}：{repairRecords.length}</div>
                    <div>{ui.labels.activeCases}：{activeRepairCount}</div>
                    <div>{ui.labels.totalPurchaseAmount}：{formatMoney(totalPurchaseAmount, locale)}</div>
                </div>
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">{ui.repairRecords.replace("{count}", String(repairRecords.length))}</div>
                {repairRecords.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">{ui.noRepairRecords}</div>
                ) : (
                    <div className="grid gap-2">
                        {repairRecords.map((ticket) => (
                            <div key={ticket.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                <div>{ui.labels.ticketId}：{ticket.id}</div>
                                <div>{ui.labels.caseType}：{ticket.caseType === "refurbish" ? ui.caseTypeRefurbish : ticket.caseType === "warranty" ? ui.caseTypeWarranty : ui.caseTypeRepair}</div>
                                <div>{ui.labels.device}：{ticket.device.name} {ticket.device.model}</div>
                                <div>{ui.labels.status}：{lookupLabel(ui.ticketStatus, ticket.status)}</div>
                                <div>{ui.labels.repairReason}：{ticket.repairReason || "-"}</div>
                                <div>{ui.labels.updatedAt}：{formatTime(ticket.updatedAt, locale)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">{ui.orderAndReceipts}</div>
                {!customerSnapshot || customerSnapshot.orders.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">{ui.noOrders}</div>
                ) : (
                    <div className="grid gap-2">
                        {customerSnapshot.orders.map((order) => {
                            const receipt = customerSnapshot.receipts.find((item) => item.orderId === order.id);
                            const orderItems = customerSnapshot.orderItems.filter((item) => item.orderId === order.id);
                            return (
                                <div key={order.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                    <div>{ui.labels.orderNo}：{order.orderNo}</div>
                                    <div>{ui.labels.status}：{ui.orderStatus[order.status] ?? order.status}</div>
                                    <div>{ui.labels.amount}：{formatMoney(order.totalAmount, locale)}</div>
                                    <div>{ui.labels.receipt}：{receipt ? receipt.receiptNo : "-"}</div>
                                    <div>{ui.labels.items}：{orderItems.length > 0 ? orderItems.map((item) => item.productName).join("、") : "-"}</div>
                                    <div>{ui.labels.updatedAt}：{formatTime(order.updatedAt, locale)}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">{ui.warrantyAndDiagnostics}</div>
                {!customerSnapshot || (customerSnapshot.warranties.length === 0 && customerSnapshot.diagnosticReports.length === 0) ? (
                    <div className="text-sm text-[rgb(var(--muted))]">{ui.noWarrantyOrDiagnostics}</div>
                ) : (
                    <div className="grid gap-2">
                        {warrantyRecords.map((ticket) => {
                            const warranty = customerSnapshot.warranties.find((item) => item.ticketId === ticket.id);
                            return (
                                <div key={ticket.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                    <div>{ui.labels.warrantyTicket}：{ticket.id}</div>
                                    <div>{ui.labels.warrantyItem}：{warranty?.productName || `${ticket.device.name} ${ticket.device.model}`.trim() || "-"}</div>
                                    <div>
                                        {ui.labels.status}：
                                        {warranty
                                            ? warranty.status === "active"
                                                ? ui.warrantyActive
                                                : warranty.status === "expired"
                                                  ? ui.warrantyExpired
                                                  : ui.warrantyInvalid
                                            : lookupLabel(ui.ticketStatus, ticket.status)}
                                    </div>
                                    <div>{ui.labels.repairReason}：{ticket.repairReason || "-"}</div>
                                    <div>{ui.labels.sourceCase}：{ticket.parentCaseTitle || ticket.parentCaseId || "-"}</div>
                                    <div>{ui.labels.historySummary}：{ticket.historySummary || "-"}</div>
                                    <div>{ui.labels.expiresAt}：{warranty ? formatTime(warranty.expiresAt, locale) : "-"}</div>
                                </div>
                            );
                        })}
                        {customerSnapshot.diagnosticReports.map((report) => (
                            <div key={report.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                <div>{ui.labels.diagnosticNo}：{report.reportNo}</div>
                                <div>{ui.labels.status}：{report.status === "published" ? ui.reportPublished : report.status === "draft" ? ui.reportDraft : ui.reportArchived}</div>
                                <div>{ui.labels.summary}：{report.summary || "-"}</div>
                                <div>{ui.labels.updatedAt}：{formatTime(report.updatedAt, locale)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">{ui.activityConsumption.replace("{count}", String(activityConsumptionRecords.length))}</div>
                {activityConsumptionRecords.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">{ui.noActivityConsumption}</div>
                ) : (
                    <div className="grid gap-2">
                        {activityConsumptionRecords.map((purchase) => (
                            <div key={purchase.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                <div>{ui.labels.activityName}：{purchase.activityName || "-"}</div>
                                <div>{ui.labels.itemName}：{purchase.itemName || "-"}</div>
                                <div>{ui.labels.amount}：{formatMoney(purchase.salesAmount, locale)}</div>
                                <div>{ui.labels.status}：{purchase.checkoutStatus === "stored" ? ui.activityStored : ui.activitySettled}</div>
                                <div>{ui.labels.remainingQty}：{purchase.remainingQty}</div>
                                <div>{ui.labels.purchasedAt}：{formatTime(purchase.purchasedAt, locale)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">{ui.entitlements}</div>
                {entitlements.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">{ui.noEntitlements}</div>
                ) : (
                    <div className="grid gap-2">
                        {entitlements.map((entitlement) => (
                            <div key={entitlement.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                <div>{ui.labels.source}：{entitlement.sourceType}</div>
                                <div>{ui.labels.type}：{entitlement.entitlementType}</div>
                                <div>
                                    {ui.labels.scope}：
                                    {entitlement.scopeType === "product"
                                        ? `${ui.scopeProductPrefix}${entitlement.productName || entitlement.productId || "-"}`
                                        : `${ui.scopeCategoryPrefix}${entitlement.categoryName || entitlement.categoryId || "-"}`}
                                </div>
                                <div>{ui.labels.remainingQty}：{entitlement.remainingQty} / {entitlement.totalQty}</div>
                                <div>{ui.labels.status}：{ui.entitlementStatus[entitlement.status] ?? entitlement.status}</div>
                                <div>{ui.labels.expiresAt}：{formatTime(entitlement.expiresAt ?? 0, locale)}</div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-3 border-t border-[rgb(var(--border))] pt-3">
                    <div className="mb-2 text-sm font-semibold">{ui.redemptions}</div>
                    {redemptions.length === 0 ? (
                        <div className="text-sm text-[rgb(var(--muted))]">{ui.noRedemptions}</div>
                    ) : (
                        <div className="grid gap-2">
                            {redemptions.map((row) => (
                                <div key={row.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                    <div>{ui.labels.product}：{row.productName}</div>
                                    <div>SKU：{row.sku || "-"}</div>
                                    <div>{ui.labels.quantity}：{row.qty}</div>
                                    <div>{ui.labels.redeemedAt}：{formatTime(row.redeemedAt, locale)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">{ui.pickupReservations}</div>
                {pickupReservations.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">{ui.noPickupReservations}</div>
                ) : (
                    <div className="grid gap-2">
                        {pickupReservations.map((reservation) => (
                            <div key={reservation.id} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                <div>{ui.labels.orderReservationId}：{reservation.id}</div>
                                <div>{ui.labels.status}：{ui.reservationStatus[reservation.status] ?? reservation.status}</div>
                                <div>{ui.labels.lineItemCount}：{reservation.lineItems.length}</div>
                                <div>{ui.labels.reservedAt}：{formatTime(reservation.reservedAt ?? 0, locale)}</div>
                                <div>{ui.labels.readyAt}：{formatTime(reservation.readyAt ?? 0, locale)}</div>
                                <div>{ui.labels.expiryAt}：{formatTime(reservation.expiresAt ?? 0, locale)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
