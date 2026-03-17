"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Activity, CompanyCustomer, Product } from "@/lib/types/commerce";
import type { Ticket } from "@/lib/types/ticket";

type CheckoutWorkspaceProps = {
    customers: CompanyCustomer[];
    tickets: Ticket[];
    products: Product[];
    activeActivities: Activity[];
    createCheckoutAction: (formData: FormData) => Promise<void>;
    flash: string;
    actionTs: string;
    initialCustomerId?: string;
};

type LineDraft = {
    id: string;
    productId: string;
    qty: number;
};

type ActivitySelectionDraft = {
    activityId: string;
    activityName: string;
    activityContent: string;
    checkoutStatus: "stored" | "settled";
    storeQty: number;
};

function formatDateTimeLocal(ts: number): string {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${hh}:${mm}`;
}

function formatMoney(value: number) {
    return new Intl.NumberFormat("zh-TW").format(value);
}

function formatDateOnly(ts: number): string {
    if (!Number.isFinite(ts) || ts <= 0) return "-";
    const d = new Date(ts);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function normalizeComparable(value: string): string {
    return value.trim().toLowerCase();
}

function toCaseNo(ticket: Ticket): string {
    const d = new Date(ticket.createdAt > 0 ? ticket.createdAt : Date.now());
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const suffix = ticket.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "0000";
    return `CASE-${yyyy}${mm}${dd}-${suffix}`;
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

function statusText(status: string): string {
    if (status === "new") return "新建";
    if (status === "in_progress") return "處理中";
    if (status === "waiting_customer") return "等待客戶";
    if (status === "resolved") return "已解決";
    if (status === "closed") return "已結束";
    return status;
}

export function CheckoutWorkspace({
    customers,
    tickets,
    products,
    activeActivities,
    createCheckoutAction,
    flash,
    actionTs,
    initialCustomerId,
}: CheckoutWorkspaceProps) {
    const hasInitialCustomer = Boolean(initialCustomerId && customers.some((item) => item.id === initialCustomerId));
    const initialCustomerQuery = hasInitialCustomer
        ? (() => {
              const hit = customers.find((item) => item.id === initialCustomerId) ?? null;
              if (!hit) return "";
              return `${hit.name} / ${hit.phone || "-"} / ${hit.email || "-"}`;
          })()
        : "";
    const [customerMode, setCustomerMode] = useState<"walkin" | "customer">(hasInitialCustomer ? "customer" : "walkin");
    const [customerId, setCustomerId] = useState(hasInitialCustomer ? initialCustomerId ?? "" : "");
    const [customerQuery, setCustomerQuery] = useState(initialCustomerQuery);
    const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
    const [selectedActivities, setSelectedActivities] = useState<ActivitySelectionDraft[]>([]);
    const [closeCase, setCloseCase] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
    const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "paid" | "deposit" | "installment">("paid");
    const [checkoutAt, setCheckoutAt] = useState("");
    const [lines, setLines] = useState<LineDraft[]>([
        {
            id: "line_init_0",
            productId: products[0]?.id ?? "",
            qty: 1,
        },
    ]);

    useEffect(() => {
        if (!flash) return;
        const key = `checkout-flash:${flash}:${actionTs || "no-ts"}`;
        const seen = window.sessionStorage.getItem(key);
        if (seen === "1") return;
        window.sessionStorage.setItem(key, "1");
        if (flash === "created") window.alert("結帳完成，收據已建立。");
        if (flash === "invalid") window.alert("結帳資料不完整，請檢查後再試。");
    }, [flash, actionTs]);

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            setCheckoutAt((prev) => (prev ? prev : formatDateTimeLocal(Date.now())));
        });
        return () => window.cancelAnimationFrame(frame);
    }, []);

    const selectedCustomer = useMemo(() => customers.find((item) => item.id === customerId) ?? null, [customers, customerId]);

    const filteredCustomers = useMemo(() => {
        const q = normalizeComparable(customerQuery);
        if (!q) return customers.slice(0, 20);
        return customers
            .filter((customer) =>
                [customer.name, customer.phone, customer.email]
                    .filter((value) => !!value)
                    .some((value) => normalizeComparable(value).includes(q)),
            )
            .slice(0, 20);
    }, [customers, customerQuery]);

    const availableCases = useMemo(() => {
        if (!selectedCustomer) return [];
        return tickets
            .filter((ticket) => isTicketForCustomer(selectedCustomer, ticket))
            .filter((ticket) => ticket.status !== "closed")
            .sort((a, b) => b.updatedAt - a.updatedAt);
    }, [selectedCustomer, tickets]);
    const selectedCases = useMemo(
        () => availableCases.filter((ticket) => selectedCaseIds.includes(ticket.id)),
        [availableCases, selectedCaseIds],
    );
    const activityMap = useMemo(() => {
        const map = new Map<string, Activity>();
        for (const activity of activeActivities) map.set(activity.id, activity);
        return map;
    }, [activeActivities]);
    const selectedActivityIdSet = useMemo(
        () => new Set(selectedActivities.map((activity) => activity.activityId)),
        [selectedActivities],
    );

    const productMap = useMemo(() => {
        const map = new Map<string, Product>();
        for (const product of products) map.set(product.id, product);
        return map;
    }, [products]);

    const lineDetails = useMemo(
        () =>
            lines.map((line) => {
                const product = productMap.get(line.productId) ?? null;
                const unitPrice = product?.price ?? 0;
                const subtotal = Math.max(0, line.qty) * Math.max(0, unitPrice);
                return { line, product, unitPrice, subtotal };
            }),
        [lines, productMap],
    );

    const totalAmount = useMemo(() => lineDetails.reduce((sum, row) => sum + row.subtotal, 0), [lineDetails]);
    const hasValidLine = useMemo(() => lineDetails.some((row) => row.product && row.line.qty > 0), [lineDetails]);
    const toggleActivitySelection = (activity: Activity, checked: boolean) => {
        setSelectedActivities((prev) => {
            if (checked) {
                if (prev.some((row) => row.activityId === activity.id)) return prev;
                const defaultStoreQty = Math.max(0, Math.round(activity.defaultStoreQty));
                const checkoutStatus: "stored" | "settled" = defaultStoreQty > 0 ? "stored" : "settled";
                return [
                    ...prev,
                    {
                        activityId: activity.id,
                        activityName: activity.name,
                        activityContent: activity.message || "",
                        checkoutStatus,
                        storeQty: checkoutStatus === "stored" ? defaultStoreQty : 0,
                    },
                ];
            }

            return prev.filter((row) => row.activityId !== activity.id);
        });
    };
    const updateSelectedActivity = (activityId: string, updater: (row: ActivitySelectionDraft) => ActivitySelectionDraft) => {
        setSelectedActivities((prev) => prev.map((row) => (row.activityId === activityId ? updater(row) : row)));
    };

    return (
        <div className="space-y-4">
            <Card className="rounded-xl p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                        <div className="text-base font-semibold">結帳中心</div>
                        <div className="text-xs text-[rgb(var(--muted))]">建立可追蹤的收據明細，供客戶歷史與分析使用</div>
                    </div>
                    <Link href="/dashboard?tab=inventory" className="text-sm text-[rgb(var(--accent))] hover:underline">
                        前往庫存管理
                    </Link>
                </div>

                <form action={createCheckoutAction} className="grid gap-3">
                    <div className="grid gap-2 md:grid-cols-3">
                        <label className="grid gap-1 text-sm">
                            <span className="text-xs text-[rgb(var(--muted))]">結帳時間</span>
                            <Input
                                type="datetime-local"
                                name="checkoutAt"
                                value={checkoutAt}
                                onChange={(event) => setCheckoutAt(event.target.value)}
                                required
                            />
                        </label>
                        <label className="grid gap-1 text-sm">
                            <span className="text-xs text-[rgb(var(--muted))]">付款方式</span>
                            <Select
                                name="paymentMethod"
                                value={paymentMethod}
                                onChange={(event) => setPaymentMethod(event.target.value as "cash" | "card")}
                            >
                                <option value="cash">現金</option>
                                <option value="card">刷卡</option>
                            </Select>
                        </label>
                        <label className="grid gap-1 text-sm">
                            <span className="text-xs text-[rgb(var(--muted))]">付款狀態</span>
                            <Select
                                name="paymentStatus"
                                value={paymentStatus}
                                onChange={(event) => setPaymentStatus(event.target.value as "unpaid" | "paid" | "deposit" | "installment")}
                            >
                                <option value="unpaid">未付</option>
                                <option value="paid">結清</option>
                                <option value="deposit">訂金</option>
                                <option value="installment">分期</option>
                            </Select>
                        </label>
                    </div>

                    <Card className="rounded-xl p-3">
                        <div className="mb-2 text-sm font-semibold">客戶</div>
                        <div className="grid gap-2 md:grid-cols-3">
                            <label className="grid gap-1 text-sm">
                                <span className="text-xs text-[rgb(var(--muted))]">客戶類型</span>
                                <Select
                                    value={customerMode}
                                    onChange={(event) => {
                                        const nextMode = event.target.value === "customer" ? "customer" : "walkin";
                                        setCustomerMode(nextMode);
                                        if (nextMode === "walkin") {
                                            setCustomerId("");
                                            setCustomerQuery("");
                                            setSelectedCaseIds([]);
                                        }
                                    }}
                                >
                                    <option value="walkin">過路客</option>
                                    <option value="customer">選擇客戶</option>
                                </Select>
                            </label>

                            <label className="grid gap-1 text-sm md:col-span-2">
                                <span className="text-xs text-[rgb(var(--muted))]">打字搜尋客戶</span>
                                <Input
                                    value={customerQuery}
                                    onChange={(event) => {
                                        setCustomerQuery(event.target.value);
                                        if (customerMode === "customer") setCustomerId("");
                                    }}
                                    placeholder="輸入姓名、電話或 Email"
                                    disabled={customerMode !== "customer"}
                                />
                            </label>
                        </div>

                        {customerMode === "customer" ? (
                            <div className="mt-2 grid max-h-52 gap-2 overflow-y-auto">
                                {filteredCustomers.length === 0 ? (
                                    <div className="text-sm text-[rgb(var(--muted))]">找不到符合的客戶。</div>
                                ) : (
                                    filteredCustomers.map((customer) => (
                                        <button
                                            key={customer.id}
                                            type="button"
                                            onClick={() => {
                                                setCustomerId(customer.id);
                                                setCustomerQuery(`${customer.name} / ${customer.phone || "-"} / ${customer.email || "-"}`);
                                                setSelectedCaseIds([]);
                                            }}
                                            className={[
                                                "rounded-lg border px-3 py-2 text-left text-sm",
                                                customerId === customer.id
                                                    ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel2))]"
                                                    : "border-[rgb(var(--border))] hover:bg-[rgb(var(--panel2))]",
                                            ].join(" ")}
                                        >
                                            <div className="font-medium">{customer.name}</div>
                                            <div className="text-xs text-[rgb(var(--muted))]">{customer.phone || "-"} / {customer.email || "-"}</div>
                                        </button>
                                    ))
                                )}
                            </div>
                        ) : null}

                        <input type="hidden" name="customerMode" value={customerMode} />
                        <input type="hidden" name="customerId" value={customerMode === "customer" ? customerId : ""} />
                        <input type="hidden" name="customerName" value={customerMode === "customer" ? selectedCustomer?.name ?? "" : "過路客"} />
                        <input type="hidden" name="customerPhone" value={customerMode === "customer" ? selectedCustomer?.phone ?? "" : ""} />
                        <input type="hidden" name="customerEmail" value={customerMode === "customer" ? selectedCustomer?.email ?? "" : ""} />
                    </Card>

                    <Card className="rounded-xl p-3">
                        <div className="mb-2 text-sm font-semibold">活動消費（可多選）</div>
                        {activeActivities.length === 0 ? (
                            <div className="text-sm text-[rgb(var(--muted))]">目前沒有活動中的資料。</div>
                        ) : (
                            <div className="grid gap-2">
                                {activeActivities.map((activity) => {
                                    const checked = selectedActivityIdSet.has(activity.id);
                                    return (
                                        <label
                                            key={activity.id}
                                            className={[
                                                "flex items-start gap-2 rounded-lg border p-3 text-sm",
                                                checked
                                                    ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel2))]"
                                                    : "border-[rgb(var(--border))]",
                                            ].join(" ")}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(event) => {
                                                    toggleActivitySelection(activity, event.target.checked);
                                                }}
                                            />
                                            <div className="grid gap-1">
                                                <div className="font-medium">{activity.name}</div>
                                                <div className="text-xs text-[rgb(var(--muted))]">
                                                    活動期間：{formatDateOnly(activity.startAt)} ~ {formatDateOnly(activity.endAt)}
                                                </div>
                                                <div className="text-xs text-[rgb(var(--muted))]">
                                                    預設寄店數量：{Math.max(0, activity.defaultStoreQty)}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {selectedActivities.length > 0 ? (
                            <div className="mt-3 grid gap-2">
                                <div className="text-xs text-[rgb(var(--muted))]">點開後可編輯活動內容與寄店狀態</div>
                                {selectedActivities.map((activity) => (
                                    <details
                                        key={activity.activityId}
                                        open
                                        className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3"
                                    >
                                        <summary className="cursor-pointer text-sm font-medium">
                                            {activity.activityName} / {activity.checkoutStatus === "stored" ? "商品寄存" : "結清"}
                                        </summary>
                                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                                            <label className="grid gap-1 text-sm">
                                                <span className="text-xs text-[rgb(var(--muted))]">活動名稱</span>
                                                <Input
                                                    value={activity.activityName}
                                                    onChange={(event) =>
                                                        updateSelectedActivity(activity.activityId, (current) => ({
                                                            ...current,
                                                            activityName: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </label>
                                            <label className="grid gap-1 text-sm">
                                                <span className="text-xs text-[rgb(var(--muted))]">狀態</span>
                                                <Select
                                                    value={activity.checkoutStatus}
                                                    onChange={(event) => {
                                                        const nextStatus = event.target.value === "stored" ? "stored" : "settled";
                                                        updateSelectedActivity(activity.activityId, (current) => {
                                                            if (nextStatus === "settled") {
                                                                return {
                                                                    ...current,
                                                                    checkoutStatus: "settled",
                                                                    storeQty: 0,
                                                                };
                                                            }
                                                            const fallbackQty = Math.max(1, activityMap.get(activity.activityId)?.defaultStoreQty || 1);
                                                            return {
                                                                ...current,
                                                                checkoutStatus: "stored",
                                                                storeQty: current.storeQty > 0 ? current.storeQty : fallbackQty,
                                                            };
                                                        });
                                                    }}
                                                >
                                                    <option value="stored">商品寄存</option>
                                                    <option value="settled">結清</option>
                                                </Select>
                                            </label>
                                            <label className="grid gap-1 text-sm md:col-span-2">
                                                <span className="text-xs text-[rgb(var(--muted))]">活動內容</span>
                                                <Textarea
                                                    rows={3}
                                                    value={activity.activityContent}
                                                    placeholder="可編輯本次活動消費內容"
                                                    onChange={(event) =>
                                                        updateSelectedActivity(activity.activityId, (current) => ({
                                                            ...current,
                                                            activityContent: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </label>
                                            <label className="grid gap-1 text-sm">
                                                <span className="text-xs text-[rgb(var(--muted))]">寄店數量</span>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={activity.checkoutStatus === "settled" ? 0 : activity.storeQty}
                                                    disabled={activity.checkoutStatus === "settled"}
                                                    onChange={(event) => {
                                                        const value = Math.max(0, Number.parseInt(event.target.value || "0", 10));
                                                        updateSelectedActivity(activity.activityId, (current) => ({
                                                            ...current,
                                                            storeQty: current.checkoutStatus === "stored" ? value : 0,
                                                        }));
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        ) : null}

                        {selectedActivities.map((activity) => (
                            <input
                                key={`activitySelection_${activity.activityId}`}
                                type="hidden"
                                name="activitySelection[]"
                                value={JSON.stringify({
                                    id: activity.activityId,
                                    name: activity.activityName,
                                    content: activity.activityContent,
                                    status: activity.checkoutStatus,
                                    storeQty: activity.checkoutStatus === "stored" ? Math.max(1, activity.storeQty) : 0,
                                })}
                            />
                        ))}
                    </Card>

                    <Card className="rounded-xl p-3">
                        <div className="mb-2 text-sm font-semibold">案件（可多選）</div>
                        {customerMode !== "customer" || !selectedCustomer ? (
                            <div className="text-sm text-[rgb(var(--muted))]">選擇客戶後，若有進行中案件可在此勾選結帳案件。</div>
                        ) : availableCases.length === 0 ? (
                            <div className="text-sm text-[rgb(var(--muted))]">此客戶目前沒有進行中案件。</div>
                        ) : (
                            <div className="grid gap-2">
                                {availableCases.map((ticket) => {
                                    const checked = selectedCaseIds.includes(ticket.id);
                                    return (
                                        <label
                                            key={ticket.id}
                                            className={[
                                                "flex items-start gap-2 rounded-lg border p-3 text-sm",
                                                checked
                                                    ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel2))]"
                                                    : "border-[rgb(var(--border))]",
                                            ].join(" ")}
                                        >
                                            <input
                                                type="checkbox"
                                                name="caseId[]"
                                                value={ticket.id}
                                                checked={checked}
                                                onChange={(event) => {
                                                    setSelectedCaseIds((prev) =>
                                                        event.target.checked ? [...prev, ticket.id] : prev.filter((id) => id !== ticket.id),
                                                    );
                                                }}
                                            />
                                            <div className="grid gap-1">
                                                <div className="font-medium">{toCaseNo(ticket)}</div>
                                                <div className="text-xs text-[rgb(var(--muted))]">
                                                    設備：{ticket.device.name} {ticket.device.model}
                                                </div>
                                                <div className="text-xs text-[rgb(var(--muted))]">狀態：{statusText(ticket.status)}</div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {selectedCaseIds.length > 0 ? (
                            <label className="mt-2 inline-flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={closeCase}
                                    onChange={(event) => setCloseCase(event.target.checked)}
                                />
                                結帳後將此案件狀態更新為「已結束」
                            </label>
                        ) : null}
                        <input type="hidden" name="closeCase" value={closeCase ? "1" : "0"} />
                    </Card>

                    <Card className="rounded-xl p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold">商品明細</div>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                    setLines((prev) => [
                                        ...prev,
                                        {
                                            id: `line_${Date.now()}_${prev.length}`,
                                            productId: products[0]?.id ?? "",
                                            qty: 1,
                                        },
                                    ])
                                }
                            >
                                + 加入商品
                            </Button>
                        </div>

                        <div className="grid gap-2">
                            {lineDetails.map(({ line, product, unitPrice, subtotal }, index) => (
                                <div key={line.id} className="grid gap-2 rounded-lg border border-[rgb(var(--border))] p-3 md:grid-cols-5">
                                    <label className="grid gap-1 text-sm md:col-span-2">
                                        <span className="text-xs text-[rgb(var(--muted))]">產品名稱 #{index + 1}</span>
                                        <Select
                                            value={line.productId}
                                            onChange={(event) => {
                                                const value = event.target.value;
                                                setLines((prev) => prev.map((row) => (row.id === line.id ? { ...row, productId: value } : row)));
                                            }}
                                        >
                                            <option value="">請選擇商品</option>
                                            {products.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name} / 單價 {formatMoney(item.price)} / 庫存 {item.stock}
                                                </option>
                                            ))}
                                        </Select>
                                    </label>
                                    <label className="grid gap-1 text-sm">
                                        <span className="text-xs text-[rgb(var(--muted))]">數量</span>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={line.qty}
                                            onChange={(event) => {
                                                const value = Math.max(1, Number.parseInt(event.target.value || "1", 10));
                                                setLines((prev) => prev.map((row) => (row.id === line.id ? { ...row, qty: value } : row)));
                                            }}
                                        />
                                    </label>
                                    <div className="grid gap-1 text-sm">
                                        <span className="text-xs text-[rgb(var(--muted))]">單價</span>
                                        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2">
                                            {formatMoney(unitPrice)}
                                        </div>
                                    </div>
                                    <div className="grid gap-1 text-sm">
                                        <span className="text-xs text-[rgb(var(--muted))]">小計</span>
                                        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2">
                                            {formatMoney(subtotal)}
                                        </div>
                                    </div>

                                    <input type="hidden" name="lineProductId[]" value={product?.id ?? ""} />
                                    <input type="hidden" name="lineProductName[]" value={product?.name ?? ""} />
                                    <input type="hidden" name="lineQty[]" value={String(Math.max(1, line.qty))} />
                                    <input type="hidden" name="lineUnitPrice[]" value={String(unitPrice)} />
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="rounded-xl p-3">
                        <div className="mb-2 text-sm font-semibold">收據預覽</div>
                        <div className="grid gap-1 text-sm">
                            <div>客戶：{customerMode === "customer" ? selectedCustomer?.name || "未選擇" : "過路客"}</div>
                            <div>
                                活動：
                                {selectedActivities.length > 0
                                    ? selectedActivities
                                          .map((activity) =>
                                              activity.checkoutStatus === "stored"
                                                  ? `${activity.activityName}（商品寄存，寄店 ${Math.max(0, activity.storeQty)}）`
                                                  : `${activity.activityName}（結清）`,
                                          )
                                          .join("、")
                                    : "無活動綁定"}
                            </div>
                            <div>
                                案件：
                                {selectedCases.length > 0
                                    ? selectedCases.map((ticket) => toCaseNo(ticket)).join("、")
                                    : "未綁定案件"}
                            </div>
                            <div>付款方式：{paymentMethod === "card" ? "刷卡" : "現金"}</div>
                            <div>
                                付款狀態：
                                {paymentStatus === "unpaid"
                                    ? "未付"
                                    : paymentStatus === "deposit"
                                      ? "訂金"
                                      : paymentStatus === "installment"
                                        ? "分期"
                                        : "結清"}
                            </div>
                            <div className="text-base font-semibold">總金額：{formatMoney(totalAmount)}</div>
                        </div>
                    </Card>

                    <div className="flex flex-wrap gap-2">
                        <Button type="submit" disabled={!hasValidLine}>
                            完成結帳並建立收據
                        </Button>
                        <Link href="/dashboard/receipts">
                            <Button type="button" variant="ghost">
                                查看收據中心
                            </Button>
                        </Link>
                    </div>
                </form>
            </Card>
        </div>
    );
}
