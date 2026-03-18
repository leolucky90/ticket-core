"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MerchantStatGrid } from "@/components/merchant/shell";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import type { MerchantStatItem } from "@/components/merchant/shell";
import { Pencil, Plus, Save, Search, X } from "lucide-react";
import type { Activity, CompanyCustomer, CompanyDashboardStats, InventoryStockLog, Product, RepairBrand } from "@/lib/types/commerce";
import type { Sale } from "@/lib/types/sale";
import type { KnownTicketStatus, QuoteStatus, Ticket } from "@/lib/types/ticket";
import { isActivityPurchaseLinkedToCustomer, isTicketLinkedToCustomer } from "@/lib/services/customerRelationships";

export type DashboardTab = "dashboard" | "customers" | "cases" | "activities" | "inventory" | "marketing";
export type InventoryView = "stock" | "settings" | "stock-in" | "stock-out" | "product-management";

type ActivityPurchaseRow = {
    id: string;
    activityName: string;
    itemName: string;
    totalQty: number;
    remainingQty: number;
    salesAmount: number;
    purchasedAt: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    status: "ongoing" | "ended";
};

type CompanyDashboardWorkspaceProps = {
    lang: "zh" | "en";
    tab: DashboardTab;
    inventoryView: InventoryView;
    flash: string;
    actionTs: string;
    snapshotTs: number;
    stats: CompanyDashboardStats;
    sales: Sale[];
    tickets: Ticket[];
    customers: CompanyCustomer[];
    activities: Activity[];
    purchases: ActivityPurchaseRow[];
    products: Product[];
    stockLogs: InventoryStockLog[];
    brands: RepairBrand[];
    caseKeyword: string;
    caseStatus: string;
    caseOrder: "latest" | "earliest";
    caseStatusOptions: string[];
    quoteStatusOptions: string[];
    customerKeyword: string;
    activityKeyword: string;
    productKeyword: string;
    brandKeyword: string;
    createCaseAction: (formData: FormData) => Promise<void>;
    updateCaseAction: (formData: FormData) => Promise<void>;
    createCustomerAction: (formData: FormData) => Promise<void>;
    updateCustomerAction: (formData: FormData) => Promise<void>;
    createActivityAction: (formData: FormData) => Promise<void>;
    updateActivityAction: (formData: FormData) => Promise<void>;
    cancelActivityAction: (formData: FormData) => Promise<void>;
    deleteActivityAction: (formData: FormData) => Promise<void>;
    createProductAction: (formData: FormData) => Promise<void>;
    updateProductAction: (formData: FormData) => Promise<void>;
    deleteProductAction: (formData: FormData) => Promise<void>;
    createStockInAction: (formData: FormData) => Promise<void>;
    createStockOutAction: (formData: FormData) => Promise<void>;
    createBrandAction: (formData: FormData) => Promise<void>;
    updateBrandAction: (formData: FormData) => Promise<void>;
    deleteBrandAction: (formData: FormData) => Promise<void>;
    createModelAction: (formData: FormData) => Promise<void>;
    updateModelAction: (formData: FormData) => Promise<void>;
    deleteModelAction: (formData: FormData) => Promise<void>;
};

type ActivityDraftItem = {
    id: string;
    itemName: string;
    qty: number;
    price: number;
    cost: number;
};

type CustomerCaseFilter = "all" | "active_case" | "closed_case" | "no_case";
type CustomerListOrder = "updated_latest" | "updated_earliest" | "created_latest" | "created_earliest" | "name_asc" | "name_desc";
type ActivityListOrder = "updated_latest" | "updated_earliest" | "start_latest" | "start_earliest";
type ActivityStatusFilter = "all" | Activity["status"];

type CustomerRowData = {
    customer: CompanyCustomer;
    openCaseCount: number;
    closedCaseCount: number;
    caseState: Exclude<CustomerCaseFilter, "all">;
    activitySpend: number;
};

const FLASH_LABELS: Record<string, string> = {
    invalid: "輸入資料不完整或格式錯誤",
    created: "案件已建立",
    case_updated: "案件已更新",
    activity_created: "活動已建立",
    activity_updated: "活動已更新",
    activity_cancelled: "活動已取消",
    activity_deleted: "活動已刪除",
    product_created: "產品已建立",
    product_updated: "產品已更新",
    product_deleted: "產品已刪除",
    product_stock_in: "入庫完成",
    product_stock_out: "出庫完成",
    brand_created: "品牌已建立",
    brand_updated: "品牌已更新",
    brand_deleted: "品牌已刪除",
    model_created: "型號已新增",
    model_updated: "型號已更新",
    model_deleted: "型號已移除",
    customer_created: "客戶已新增",
    customer_updated: "客戶資料已更新",
};

const CASE_STATUS_FLOW: Record<KnownTicketStatus, KnownTicketStatus[]> = {
    new: ["new", "in_progress", "closed"],
    in_progress: ["in_progress", "waiting_customer", "resolved", "closed"],
    waiting_customer: ["waiting_customer", "in_progress", "resolved", "closed"],
    resolved: ["resolved", "closed", "in_progress"],
    closed: ["closed", "in_progress"],
};
const DEFAULT_CASE_STATUS_OPTIONS: string[] = ["new", "in_progress", "waiting_customer", "resolved", "closed"];
const DEFAULT_QUOTE_STATUS_OPTIONS: string[] = ["inspection_estimate", "quoted", "rejected", "accepted"];

function isKnownTicketStatus(status: string): status is KnownTicketStatus {
    return (
        status === "new" ||
        status === "in_progress" ||
        status === "waiting_customer" ||
        status === "resolved" ||
        status === "closed"
    );
}

function dedupeStatuses(statuses: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const status of statuses) {
        const cleaned = status.trim();
        if (!cleaned) continue;
        if (seen.has(cleaned)) continue;
        seen.add(cleaned);
        result.push(cleaned);
    }
    return result;
}

function getCaseStatusTransitionOptions(currentStatus: string, caseStatusOptions: string[]): string[] {
    const knownFlow = isKnownTicketStatus(currentStatus) ? CASE_STATUS_FLOW[currentStatus] : [];
    return dedupeStatuses([currentStatus, ...knownFlow, ...caseStatusOptions]);
}

function formatMoney(value: number, lang: "zh" | "en") {
    const locale = lang === "zh" ? "zh-TW" : "en-US";
    return new Intl.NumberFormat(locale).format(value);
}

function formatTime(value: number, lang: "zh" | "en") {
    if (!Number.isFinite(value) || value <= 0) return "-";
    const locale = lang === "zh" ? "zh-TW" : "en-US";
    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(value);
}

function formatTimeShort(value: number, lang: "zh" | "en") {
    if (!Number.isFinite(value) || value <= 0) return "-";
    const locale = lang === "zh" ? "zh-TW" : "en-US";
    return new Intl.DateTimeFormat(locale, {
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

function quoteStatusText(status: QuoteStatus): string {
    if (status === "inspection_estimate") return "檢查估價";
    if (status === "quoted") return "已報價";
    if (status === "rejected") return "拒絕";
    if (status === "accepted") return "接受報價";
    return status;
}

function activityStatusText(status: Activity["status"]) {
    if (status === "upcoming") return "未開始";
    if (status === "active") return "活動中";
    if (status === "ended") return "結束";
    return "取消";
}

function activityEffectText(effectType: Activity["effectType"]) {
    if (effectType === "bundle_price") return "立即組合價";
    if (effectType === "gift_item") return "立即贈品";
    if (effectType === "create_entitlement") return "未來兌換權";
    if (effectType === "create_pickup_reservation") return "待取貨留貨";
    return "立即折扣";
}

function stockActionText(action: InventoryStockLog["action"]): string {
    return action === "stock_out" ? "出庫" : "入庫";
}

function toDateInput(ts: number): string {
    if (!Number.isFinite(ts) || ts <= 0) return "";
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function FieldLabel({ htmlFor, label }: { htmlFor: string; label: string }) {
    return (
        <label htmlFor={htmlFor} className="text-xs font-medium text-[rgb(var(--muted))]">
            {label}
        </label>
    );
}

function openDatePicker(input: HTMLInputElement) {
    if (typeof input.showPicker === "function") {
        input.showPicker();
    }
}

function getPointsByRange(stats: CompanyDashboardStats, range: "day" | "month") {
    return range === "day" ? stats.pointsByDay : stats.pointsByMonth;
}

function TrendChart({ stats, range }: { stats: CompanyDashboardStats; range: "day" | "month" }) {
    const points = getPointsByRange(stats, range);
    const values = points.map((point) => point.revenue);
    const max = Math.max(1, ...values);
    const width = 860;
    const height = 260;
    const step = points.length > 1 ? width / (points.length - 1) : width;

    const path = points
        .map((point, index) => {
            const x = index * step;
            const y = height - (point.revenue / max) * height;
            return `${index === 0 ? "M" : "L"}${x},${y}`;
        })
        .join(" ");

    return (
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
            <div className="mb-2 text-xs text-[rgb(var(--muted))]">數據曲線（{range === "day" ? "日" : "月"}）</div>
            <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="h-56 min-w-[760px] w-full">
                    <path d={path} fill="none" stroke="rgb(var(--accent))" strokeWidth="3" strokeLinecap="round" />
                    {points.map((point, index) => {
                        const x = index * step;
                        const y = height - (point.revenue / max) * height;
                        return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="4" fill="rgb(var(--accent))" />;
                    })}
                </svg>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {points.map((point, index) => (
                    <div key={`${point.label}-${index}`} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-2 text-xs">
                        <div className="text-[rgb(var(--muted))]">{point.label}</div>
                        <div>營收 {formatMoney(point.revenue, "zh")}</div>
                        <div>數量 {point.count}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
    return (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-base font-semibold">{title}</div>
            {hint ? <div className="text-xs text-[rgb(var(--muted))]">{hint}</div> : null}
        </div>
    );
}

function CaseCardList({
    tickets,
    lang,
    caseStatusOptions,
    quoteStatusOptions,
    updateCaseAction,
}: {
    tickets: Ticket[];
    lang: "zh" | "en";
    caseStatusOptions: string[];
    quoteStatusOptions: string[];
    updateCaseAction: (formData: FormData) => Promise<void>;
}) {
    const [editingCaseId, setEditingCaseId] = useState<string | null>(null);

    if (tickets.length === 0) {
        return <div className="text-sm text-[rgb(var(--muted))]">目前沒有符合條件的案件。</div>;
    }

    return (
        <div className="grid gap-3">
            {tickets.map((ticket) => {
                const isEditing = editingCaseId === ticket.id;
                const deviceText = `${ticket.device.name} ${ticket.device.model}`.trim() || "-";

                return (
                    <details key={ticket.id} className="rounded-xl border border-[rgb(var(--border))]">
                        <summary className="grid cursor-pointer list-none gap-1 p-3 text-sm sm:grid-cols-5 [&::-webkit-details-marker]:hidden">
                            <div className="font-semibold">姓名：{ticket.customer.name}</div>
                            <div className="text-[rgb(var(--muted))]">電話：{ticket.customer.phone || "-"}</div>
                            <div className="text-[rgb(var(--muted))]">設備：{deviceText}</div>
                            <div className="text-[rgb(var(--muted))]">狀態：{statusText(ticket.status)}</div>
                            <div className="text-[rgb(var(--muted))] text-right">點按看訊息</div>
                        </summary>
                        <div className="border-t border-[rgb(var(--border))] p-3">
                            {!isEditing ? (
                                <>
                                    <div className="grid gap-1 text-sm">
                                        <div>案件編號：{ticket.id}</div>
                                        <div>設備品牌：{ticket.device.name || "-"}</div>
                                        <div>設備型號：{ticket.device.model || "-"}</div>
                                        <div>送修原因：{ticket.repairReason || "-"}</div>
                                        <div>維修建議：{ticket.repairSuggestion || "-"}</div>
                                        <div>備註：{ticket.note || "-"}</div>
                                        <div>報價狀態：{quoteStatusText(ticket.quoteStatus)}</div>
                                        <div>維修金額：{formatMoney(ticket.repairAmount, lang)}</div>
                                        <div>檢修費用：{formatMoney(ticket.inspectionFee, lang)}</div>
                                        <div>待收費用：{formatMoney(ticket.pendingFee, lang)}</div>
                                        <div>建立時間：{formatTime(ticket.createdAt, lang)}</div>
                                        <div>更新時間：{formatTime(ticket.updatedAt, lang)}</div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Link
                                            href={`/dashboard?tab=cases&caseQ=${encodeURIComponent(ticket.id)}`}
                                            aria-label="看訊息"
                                            className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--border))] hover:border-[rgb(var(--accent))]"
                                        >
                                            <Search className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
                                            <span className="sr-only">看訊息</span>
                                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                看訊息
                                            </span>
                                        </Link>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            aria-label="更新案件"
                                            className="group relative h-10 w-10 !p-0 flex items-center justify-center"
                                            onClick={() => setEditingCaseId(ticket.id)}
                                        >
                                            <Pencil className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                            <span className="sr-only">更新案件</span>
                                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                更新案件
                                            </span>
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <form action={updateCaseAction} className="grid gap-2 md:grid-cols-2">
                                    <input type="hidden" name="id" value={ticket.id} />
                                    <input type="hidden" name="redirectPath" value="/dashboard" />
                                    <input type="hidden" name="redirectTab" value="cases" />
                                    <Input name="deviceName" defaultValue={ticket.device.name} placeholder="設備品牌" required />
                                    <Input name="deviceModel" defaultValue={ticket.device.model} placeholder="設備型號" required />
                                    <Textarea name="repairReason" rows={2} defaultValue={ticket.repairReason} placeholder="送修原因" className="md:col-span-2" />
                                    <Textarea name="repairSuggestion" rows={2} defaultValue={ticket.repairSuggestion} placeholder="維修建議" className="md:col-span-2" />
                                    <Textarea name="note" rows={2} defaultValue={ticket.note} placeholder="備註" className="md:col-span-2" />
                                    <Input type="number" min={0} name="repairAmount" defaultValue={ticket.repairAmount} placeholder="維修金額" />
                                    <Input type="number" min={0} name="inspectionFee" defaultValue={ticket.inspectionFee} placeholder="檢修費用" />
                                    <Select name="status" defaultValue={ticket.status}>
                                        {getCaseStatusTransitionOptions(ticket.status, caseStatusOptions).map((status) => (
                                            <option key={status} value={status}>
                                                {statusText(status)}
                                            </option>
                                        ))}
                                    </Select>
                                    <Select name="quoteStatus" defaultValue={ticket.quoteStatus}>
                                        {quoteStatusOptions.map((status) => (
                                            <option key={status} value={status}>
                                                {quoteStatusText(status)}
                                            </option>
                                        ))}
                                    </Select>
                                    <div className="md:col-span-2 flex flex-wrap gap-2">
                                        <Button type="submit" variant="ghost" aria-label="儲存更新" className="group relative h-10 w-10 !p-0 flex items-center justify-center">
                                            <Save className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                            <span className="sr-only">儲存更新</span>
                                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                儲存更新
                                            </span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            aria-label="取消更新"
                                            className="group relative h-10 w-10 !p-0 flex items-center justify-center"
                                            onClick={() => setEditingCaseId(null)}
                                        >
                                            <X className="h-4 w-4" aria-hidden="true" />
                                            <span className="sr-only">取消更新</span>
                                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                取消更新
                                            </span>
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </details>
                );
            })}
        </div>
    );
}

export function CompanyDashboardWorkspace({
    lang,
    tab,
    inventoryView,
    flash,
    actionTs,
    snapshotTs,
    stats,
    tickets,
    customers,
    activities,
    purchases,
    products,
    stockLogs,
    brands,
    caseKeyword,
    caseStatus,
    caseOrder,
    caseStatusOptions,
    quoteStatusOptions,
    customerKeyword,
    activityKeyword,
    productKeyword,
    brandKeyword,
    createCaseAction,
    updateCaseAction,
    createCustomerAction,
    updateCustomerAction,
    createActivityAction,
    updateActivityAction,
    cancelActivityAction,
    deleteActivityAction,
    createProductAction,
    updateProductAction,
    deleteProductAction,
    createStockInAction,
    createStockOutAction,
    createBrandAction,
    updateBrandAction,
    deleteBrandAction,
    createModelAction,
    updateModelAction,
    deleteModelAction,
}: CompanyDashboardWorkspaceProps) {
    const [range, setRange] = useState<"day" | "month">("day");
    const [showCreateCustomerForm, setShowCreateCustomerForm] = useState(false);
    const [showCreateCaseForm, setShowCreateCaseForm] = useState(false);
    const [showCreateActivityForm, setShowCreateActivityForm] = useState(false);
    const [showCreateProductForm, setShowCreateProductForm] = useState(false);
    const [inventoryHeaderElevated, setInventoryHeaderElevated] = useState(false);
    const [customerCaseFilter, setCustomerCaseFilter] = useState<CustomerCaseFilter>("all");
    const [customerOrder, setCustomerOrder] = useState<CustomerListOrder>("updated_latest");
    const [activityStatusFilter, setActivityStatusFilter] = useState<ActivityStatusFilter>("all");
    const [activityOrder, setActivityOrder] = useState<ActivityListOrder>("updated_latest");
    const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
    const [draftItems, setDraftItems] = useState<ActivityDraftItem[]>([
        { id: "draft-1", itemName: "", qty: 1, price: 0, cost: 0 },
    ]);
    const normalizedCaseStatusOptions = useMemo(
        () => dedupeStatuses(caseStatusOptions.length > 0 ? caseStatusOptions : DEFAULT_CASE_STATUS_OPTIONS),
        [caseStatusOptions],
    );
    const normalizedQuoteStatusOptions = useMemo(
        () => dedupeStatuses(quoteStatusOptions.length > 0 ? quoteStatusOptions : DEFAULT_QUOTE_STATUS_OPTIONS),
        [quoteStatusOptions],
    );
    const filterCaseStatusOptions = useMemo(() => {
        if (!caseStatus || caseStatus === "all") return normalizedCaseStatusOptions;
        if (normalizedCaseStatusOptions.includes(caseStatus)) return normalizedCaseStatusOptions;
        return dedupeStatuses([caseStatus, ...normalizedCaseStatusOptions]);
    }, [caseStatus, normalizedCaseStatusOptions]);
    const defaultQuoteStatus = normalizedQuoteStatusOptions[0] ?? DEFAULT_QUOTE_STATUS_OPTIONS[0];

    useEffect(() => {
        if (!flash) return;
        const key = `dashboard-flash:${flash}:${actionTs || "no-ts"}`;
        const seen = window.sessionStorage.getItem(key);
        if (seen === "1") return;
        window.sessionStorage.setItem(key, "1");

        const text = FLASH_LABELS[flash];
        if (text) window.alert(text);

        const url = new URL(window.location.href);
        url.searchParams.delete("flash");
        url.searchParams.delete("ts");
        window.history.replaceState({}, "", url.toString());
    }, [flash, actionTs]);

    useEffect(() => {
        if (tab !== "inventory") return;

        const onScroll = () => {
            setInventoryHeaderElevated(window.scrollY > 8);
        };
        const initRaf = window.requestAnimationFrame(onScroll);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.cancelAnimationFrame(initRaf);
            window.removeEventListener("scroll", onScroll);
        };
    }, [tab]);

    const activeActivities = useMemo(() => activities.filter((item) => item.status === "active"), [activities]);
    const upcomingActivities = useMemo(() => activities.filter((item) => item.status === "upcoming"), [activities]);
    const customerRows = useMemo(() => {
        const rows: CustomerRowData[] = customers.map((customer) => {
            const customerTickets = tickets
                .filter((ticket) => isTicketLinkedToCustomer(customer, ticket))
                .sort((a, b) => b.updatedAt - a.updatedAt);
            const customerPurchases = purchases
                .filter((purchase) => isActivityPurchaseLinkedToCustomer(customer, purchase))
                .sort((a, b) => b.purchasedAt - a.purchasedAt);
            const openCaseCount = customerTickets.filter((ticket) =>
                ticket.status === "new" || ticket.status === "in_progress" || ticket.status === "waiting_customer",
            ).length;
            const closedCaseCount = customerTickets.length - openCaseCount;
            const caseState: Exclude<CustomerCaseFilter, "all"> = customerTickets.length === 0 ? "no_case" : openCaseCount > 0 ? "active_case" : "closed_case";
            const activitySpend = customerPurchases.reduce((sum, row) => sum + row.salesAmount, 0);

            return {
                customer,
                openCaseCount,
                closedCaseCount,
                caseState,
                activitySpend,
            };
        });

        const filtered = rows.filter((row) => {
            if (customerCaseFilter === "all") return true;
            return row.caseState === customerCaseFilter;
        });

        return filtered.sort((a, b) => {
            if (customerOrder === "updated_latest") return b.customer.updatedAt - a.customer.updatedAt;
            if (customerOrder === "updated_earliest") return a.customer.updatedAt - b.customer.updatedAt;
            if (customerOrder === "created_latest") return b.customer.createdAt - a.customer.createdAt;
            if (customerOrder === "created_earliest") return a.customer.createdAt - b.customer.createdAt;
            if (customerOrder === "name_desc") return b.customer.name.localeCompare(a.customer.name);
            return a.customer.name.localeCompare(b.customer.name);
        });
    }, [customers, tickets, purchases, customerCaseFilter, customerOrder]);
    const filteredActivities = useMemo(() => {
        const list = activities.filter((item) => (activityStatusFilter === "all" ? true : item.status === activityStatusFilter));
        return [...list].sort((a, b) => {
            if (activityOrder === "updated_earliest") return a.updatedAt - b.updatedAt;
            if (activityOrder === "start_latest") return b.startAt - a.startAt;
            if (activityOrder === "start_earliest") return a.startAt - b.startAt;
            return b.updatedAt - a.updatedAt;
        });
    }, [activities, activityOrder, activityStatusFilter]);
    const inventorySummary = useMemo(() => {
        const totalOnHandUnits = products.reduce((sum, product) => sum + Math.max(0, product.onHandQty ?? product.stock), 0);
        const totalReservedUnits = products.reduce((sum, product) => sum + Math.max(0, product.reservedQty ?? 0), 0);
        const totalAvailableUnits = products.reduce(
            (sum, product) => sum + Math.max(0, product.availableQty ?? (product.onHandQty ?? product.stock) - (product.reservedQty ?? 0)),
            0,
        );
        const totalValue = products.reduce((sum, product) => sum + Math.max(0, product.onHandQty ?? product.stock) * Math.max(0, product.cost), 0);
        const lowStockCount = products.filter((product) => {
            const available = Math.max(0, product.availableQty ?? (product.onHandQty ?? product.stock) - (product.reservedQty ?? 0));
            const threshold = Math.max(0, product.lowStockThreshold ?? 5);
            return available <= threshold;
        }).length;
        return {
            totalOnHandUnits,
            totalReservedUnits,
            totalAvailableUnits,
            totalValue,
            lowStockCount,
        };
    }, [products]);
    const dashboardStats = useMemo<MerchantStatItem[]>(
        () => [
            { id: "today-count", label: "當日交易筆數", value: stats.todaySubscriptionCount },
            { id: "today-revenue", label: "當日營收金額", value: formatMoney(stats.todayRevenue, lang) },
            { id: "month-count", label: "當月交易筆數", value: stats.monthSubscriptionCount },
            { id: "month-revenue", label: "當月營收金額", value: formatMoney(stats.monthRevenue, lang) },
            { id: "customer-count", label: "客戶總數", value: customers.length },
            { id: "open-case-count", label: "進行中案件", value: tickets.filter((ticket) => ticket.status !== "closed").length },
            { id: "active-activities", label: "活動中", value: activeActivities.length },
            {
                id: "average-order-value",
                label: "平均客單價（當月）",
                value: formatMoney(
                    stats.monthSubscriptionCount > 0 ? Math.round(stats.monthRevenue / stats.monthSubscriptionCount) : 0,
                    lang,
                ),
            },
        ],
        [activeActivities.length, customers.length, lang, stats.monthRevenue, stats.monthSubscriptionCount, stats.todayRevenue, stats.todaySubscriptionCount, tickets],
    );

    return (
        <div className="space-y-4">
            <div className="space-y-4">
                {/* Operational tabs keep fixed list/table workflows; sortable behavior is intentionally limited to dashboard/storefront builder contexts. */}
                {tab === "dashboard" ? (
                    <>
                        <Card>
                            <SectionTitle title="企業營運儀錶板" hint="交易、客戶、案件與活動趨勢" />
                            <MerchantStatGrid items={dashboardStats} />
                            <div className="mt-4 flex items-center gap-2">
                                <Button type="button" variant={range === "day" ? "solid" : "ghost"} onClick={() => setRange("day")}>
                                    日
                                </Button>
                                <Button type="button" variant={range === "month" ? "solid" : "ghost"} onClick={() => setRange("month")}>
                                    月
                                </Button>
                            </div>
                            <div className="mt-4">
                                <TrendChart stats={stats} range={range} />
                            </div>
                        </Card>

                        <Card>
                            <SectionTitle title="當前活動" hint="抓取活動狀態為活動中" />
                            <div className="grid gap-2">
                                {activeActivities.length === 0 ? (
                                    <div className="text-sm text-[rgb(var(--muted))]">目前沒有活動中資料。</div>
                                ) : (
                                    activeActivities.map((activity) => (
                                        <details key={activity.id} className="rounded-lg border border-[rgb(var(--border))]">
                                            <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
                                                {activity.name}
                                            </summary>
                                            <div className="border-t border-[rgb(var(--border))] p-3 text-sm">
                                                <div>狀態：{activityStatusText(activity.status)}</div>
                                                <div>開始：{formatTime(activity.startAt, lang)}</div>
                                                <div>結束：{formatTime(activity.endAt, lang)}</div>
                                                <div className="mt-1 whitespace-pre-wrap text-[rgb(var(--muted))]">{activity.message || "-"}</div>
                                            </div>
                                        </details>
                                    ))
                                )}
                            </div>
                        </Card>

                        <Card>
                            <SectionTitle title="活動預告" hint="抓取活動狀態為未開始" />
                            <div className="grid gap-2">
                                {upcomingActivities.length === 0 ? (
                                    <div className="text-sm text-[rgb(var(--muted))]">目前沒有未開始活動。</div>
                                ) : (
                                    upcomingActivities.map((activity) => (
                                        <details key={activity.id} className="rounded-lg border border-[rgb(var(--border))]">
                                            <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
                                                {activity.name}
                                            </summary>
                                            <div className="border-t border-[rgb(var(--border))] p-3 text-sm">
                                                <div>狀態：{activityStatusText(activity.status)}</div>
                                                <div>開始：{formatTime(activity.startAt, lang)}</div>
                                                <div>結束：{formatTime(activity.endAt, lang)}</div>
                                                <div className="mt-1 whitespace-pre-wrap text-[rgb(var(--muted))]">{activity.message || "-"}</div>
                                            </div>
                                        </details>
                                    ))
                                )}
                            </div>
                        </Card>
                    </>
                ) : null}

                {tab === "customers" ? (
                    <>
                        <Card className="rounded-xl p-3">
                            <SectionTitle title="搜尋 / 新增" hint="搜尋欄位 + 查詢 + 新增" />
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                                <form action="/dashboard" method="get" className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                                    <input type="hidden" name="tab" value="customers" />
                                    <div className="relative w-full">
                                        <MerchantPredictiveSearchInput
                                            name="customerQ"
                                            defaultValue={customerKeyword}
                                            placeholder="查詢姓名、電話、Email"
                                            targets={["customers"]}
                                            inputClassName="pr-10"
                                        />
                                        <Link
                                            href="/dashboard?tab=customers"
                                            aria-label="清除"
                                            className="group absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel2))] hover:text-[rgb(var(--text))]"
                                        >
                                            <X className="h-4 w-4" aria-hidden="true" />
                                            <span className="sr-only">清除</span>
                                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                清除
                                            </span>
                                        </Link>
                                    </div>
                                    <Button type="submit" variant="ghost" aria-label="查詢" className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center">
                                        <Search className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                        <span className="sr-only">查詢</span>
                                        <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                            查詢
                                        </span>
                                    </Button>
                                </form>
                                <Button
                                    type="button"
                                    variant={showCreateCustomerForm ? "solid" : "ghost"}
                                    aria-label="新增"
                                    className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center"
                                    onClick={() => {
                                        setShowCreateCustomerForm((prev) => !prev);
                                        setEditingCustomerId(null);
                                    }}
                                >
                                    <Plus className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                    <span className="sr-only">新增</span>
                                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                        新增
                                    </span>
                                </Button>
                            </div>
                            {showCreateCustomerForm ? (
                                <form action={createCustomerAction} className="mt-3 grid gap-2 md:grid-cols-2">
                                    <input type="hidden" name="tab" value="customers" />
                                    <Input name="customerName" placeholder="客戶姓名" required />
                                    <Input name="customerPhone" placeholder="客戶電話" required />
                                    <Input name="customerEmail" type="email" placeholder="客戶 Email" />
                                    <Input name="customerAddress" placeholder="客戶地址" />
                                    <Button type="submit" className="md:col-span-2">建立客戶</Button>
                                </form>
                            ) : null}
                        </Card>

                        <Card className="rounded-xl p-3">
                            <div className="overflow-x-auto">
                                <div className="flex min-w-max items-center gap-2 text-sm">
                                    <span className="whitespace-nowrap text-sm font-semibold">過濾欄位</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">最後更新</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">{formatTimeShort(snapshotTs, lang)}</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">時間排序</span>
                                    <Select value={customerOrder} className="w-[4ch]" onChange={(event) => setCustomerOrder(event.target.value as CustomerListOrder)}>
                                        <option value="updated_latest">更新 新→舊</option>
                                        <option value="updated_earliest">更新 舊→新</option>
                                        <option value="created_latest">建立 新→舊</option>
                                        <option value="created_earliest">建立 舊→新</option>
                                        <option value="name_asc">姓名 A→Z</option>
                                        <option value="name_desc">姓名 Z→A</option>
                                    </Select>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">狀態過濾</span>
                                    <Select value={customerCaseFilter} className="w-[4ch]" onChange={(event) => setCustomerCaseFilter(event.target.value as CustomerCaseFilter)}>
                                        <option value="all">全部</option>
                                        <option value="active_case">進行中</option>
                                        <option value="closed_case">已結案</option>
                                        <option value="no_case">無案件</option>
                                    </Select>
                                </div>
                            </div>
                        </Card>

                        <Card className="rounded-xl p-3">
                            <SectionTitle title="客戶列表" hint={`共 ${customerRows.length} 筆`} />
                            {customerRows.length === 0 ? (
                                <div className="text-sm text-[rgb(var(--muted))]">目前沒有符合條件的客戶。</div>
                            ) : (
                                <div className="grid gap-3">
                                    {customerRows.map((row) => {
                                        const customer = row.customer;
                                        const isEditing = editingCustomerId === customer.id;
                                        const caseStateText = row.caseState === "active_case" ? "有案件進行中" : "無案件進行中";

                                        return (
                                            <details key={customer.id} className="rounded-xl border border-[rgb(var(--border))]">
                                                <summary className="grid cursor-pointer list-none gap-1 p-3 text-sm sm:grid-cols-4 [&::-webkit-details-marker]:hidden">
                                                    <div className="font-semibold">姓名：{customer.name}</div>
                                                    <div className="text-[rgb(var(--muted))]">電話：{customer.phone || "-"}</div>
                                                    <div className="text-[rgb(var(--muted))]">{caseStateText}</div>
                                                    <div className="text-[rgb(var(--muted))] text-right">點按展開</div>
                                                </summary>
                                                <div className="border-t border-[rgb(var(--border))] p-3">
                                                    {!isEditing ? (
                                                        <>
                                                            <div className="grid gap-1 text-sm">
                                                                <div>Email：{customer.email || "-"}</div>
                                                                <div>地址：{customer.address || "-"}</div>
                                                                <div>建立時間：{formatTime(customer.createdAt, lang)}</div>
                                                                <div>更新時間：{formatTime(customer.updatedAt, lang)}</div>
                                                                <div>案件：進行中 {row.openCaseCount} / 結案 {row.closedCaseCount}</div>
                                                                <div>總消費金額：{formatMoney(row.activitySpend, lang)}</div>
                                                            </div>
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    aria-label="修改"
                                                                    className="group relative h-10 w-10 !p-0 flex items-center justify-center"
                                                                    onClick={() => {
                                                                        setEditingCustomerId(customer.id);
                                                                    }}
                                                                >
                                                                    <Pencil className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                                                    <span className="sr-only">修改</span>
                                                                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                                        修改
                                                                    </span>
                                                                </Button>
                                                                <Link
                                                                    href={{
                                                                        pathname: "/dashboard/customers/detail",
                                                                        query: { id: customer.id },
                                                                    }}
                                                                    aria-label="查看更多訊息"
                                                                    className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--border))] hover:border-[rgb(var(--accent))]"
                                                                >
                                                                    <Search className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
                                                                    <span className="sr-only">查看更多訊息</span>
                                                                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                                        查看更多訊息
                                                                    </span>
                                                                </Link>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <form action={updateCustomerAction} className="grid gap-2 md:grid-cols-2">
                                                            <input type="hidden" name="tab" value="customers" />
                                                            <input type="hidden" name="customerId" value={customer.id} />
                                                            <Input name="customerName" defaultValue={customer.name} required />
                                                            <Input name="customerPhone" defaultValue={customer.phone} required />
                                                            <Input name="customerEmail" type="email" defaultValue={customer.email} />
                                                            <Input name="customerAddress" defaultValue={customer.address} />
                                                            <div className="flex gap-2 md:col-span-2">
                                                                <Button
                                                                    type="submit"
                                                                    variant="ghost"
                                                                    aria-label="修改"
                                                                    className="group relative h-10 w-10 !p-0 flex items-center justify-center"
                                                                >
                                                                    <Save className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                                                    <span className="sr-only">修改</span>
                                                                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                                        修改
                                                                    </span>
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    aria-label="取消"
                                                                    className="group relative h-10 w-10 !p-0 flex items-center justify-center"
                                                                    onClick={() => setEditingCustomerId(null)}
                                                                >
                                                                    <X className="h-4 w-4" aria-hidden="true" />
                                                                    <span className="sr-only">取消</span>
                                                                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                                        取消
                                                                    </span>
                                                                </Button>
                                                            </div>
                                                        </form>
                                                    )}
                                                </div>
                                            </details>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>

                    </>
                ) : null}

                {tab === "cases" ? (
                    <>
                        <Card className="rounded-xl p-3">
                            <SectionTitle title="搜尋 / 新增" hint="案件搜尋 + 新增" />
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                                <form action="/dashboard" method="get" className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                                    <input type="hidden" name="tab" value="cases" />
                                    <input type="hidden" name="caseStatus" value={caseStatus} />
                                    <input type="hidden" name="caseOrder" value={caseOrder} />
                                    <div className="relative w-full">
                                        <MerchantPredictiveSearchInput
                                            name="caseQ"
                                            defaultValue={caseKeyword}
                                            placeholder="查詢姓名、電話、設備名稱或案件編號"
                                            targets={["tickets"]}
                                            inputClassName="pr-10"
                                        />
                                        <Link
                                            href="/dashboard?tab=cases"
                                            aria-label="清除"
                                            className="group absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel2))] hover:text-[rgb(var(--text))]"
                                        >
                                            <X className="h-4 w-4" aria-hidden="true" />
                                            <span className="sr-only">清除</span>
                                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                清除
                                            </span>
                                        </Link>
                                    </div>
                                    <Button type="submit" variant="ghost" aria-label="查詢" className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center">
                                        <Search className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                        <span className="sr-only">查詢</span>
                                        <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                            查詢
                                        </span>
                                    </Button>
                                </form>
                                <Button
                                    type="button"
                                    variant={showCreateCaseForm ? "solid" : "ghost"}
                                    aria-label="新增"
                                    className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center"
                                    onClick={() => setShowCreateCaseForm((prev) => !prev)}
                                >
                                    <Plus className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                    <span className="sr-only">新增</span>
                                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                        新增
                                    </span>
                                </Button>
                            </div>
                            {showCreateCaseForm ? (
                                <form action={createCaseAction} className="mt-3 grid gap-2 md:grid-cols-2">
                                    <input type="hidden" name="redirectPath" value="/dashboard" />
                                    <input type="hidden" name="redirectTab" value="cases" />
                                    <Input name="customerName" placeholder="客戶姓名" required />
                                    <Input name="customerPhone" placeholder="客戶電話" required />
                                    <Input name="customerEmail" type="email" placeholder="客戶 Email" />
                                    <Input name="customerAddress" placeholder="客戶地址" />
                                    <Input name="deviceName" placeholder="設備品牌" required />
                                    <Input name="deviceModel" placeholder="設備型號" required />
                                    <Textarea name="repairReason" rows={2} placeholder="送修原因" className="md:col-span-2" />
                                    <Textarea name="repairSuggestion" rows={2} placeholder="維修建議" className="md:col-span-2" />
                                    <Textarea name="note" rows={2} placeholder="備註" className="md:col-span-2" />
                                    <Input type="number" min={0} name="repairAmount" placeholder="維修金額" />
                                    <Input type="number" min={0} name="inspectionFee" placeholder="檢修費用" />
                                    <Select name="quoteStatus" defaultValue={defaultQuoteStatus} className="md:col-span-2">
                                        {normalizedQuoteStatusOptions.map((status) => (
                                            <option key={status} value={status}>
                                                {quoteStatusText(status)}
                                            </option>
                                        ))}
                                    </Select>
                                    <Button type="submit" className="md:col-span-2">建立案件</Button>
                                </form>
                            ) : null}
                        </Card>

                        <Card className="rounded-xl p-3">
                            <div className="overflow-x-auto">
                                <form action="/dashboard" method="get" className="flex min-w-max items-center gap-2 text-sm">
                                    <input type="hidden" name="tab" value="cases" />
                                    <input type="hidden" name="caseQ" value={caseKeyword} />
                                    <span className="whitespace-nowrap text-sm font-semibold">過濾欄位</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">最後更新</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">{formatTimeShort(snapshotTs, lang)}</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">時間排序</span>
                                    <Select
                                        name="caseOrder"
                                        className="w-[4ch]"
                                        defaultValue={caseOrder}
                                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                                    >
                                        <option value="latest">新→舊</option>
                                        <option value="earliest">舊→新</option>
                                    </Select>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">狀態過濾</span>
                                    <Select
                                        name="caseStatus"
                                        className="w-[4ch]"
                                        defaultValue={caseStatus || "all"}
                                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                                    >
                                        <option value="all">全部</option>
                                        {filterCaseStatusOptions.map((status) => (
                                            <option key={status} value={status}>
                                                {statusText(status)}
                                            </option>
                                        ))}
                                    </Select>
                                    <Link href="/dashboard?tab=cases" className="text-xs text-[rgb(var(--accent))] hover:underline">
                                        重設
                                    </Link>
                                </form>
                            </div>
                        </Card>

                        <Card className="rounded-xl p-3">
                            <SectionTitle title="案件列表" hint={`共 ${tickets.length} 筆`} />
                            <CaseCardList
                                tickets={tickets}
                                lang={lang}
                                caseStatusOptions={normalizedCaseStatusOptions}
                                quoteStatusOptions={normalizedQuoteStatusOptions}
                                updateCaseAction={updateCaseAction}
                            />
                        </Card>
                    </>
                ) : null}

                {tab === "activities" ? (
                    <>
                        <Card className="rounded-xl p-3">
                            <SectionTitle title="搜尋 / 新增" hint="活動搜尋 + 新增" />
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                                <form action="/dashboard" method="get" className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                                    <input type="hidden" name="tab" value="activities" />
                                    <div className="relative w-full">
                                        <Input name="activityQ" defaultValue={activityKeyword} placeholder="查詢品名 或活動名稱" className="pr-10" />
                                        <Link
                                            href="/dashboard?tab=activities"
                                            aria-label="清除"
                                            className="group absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel2))] hover:text-[rgb(var(--text))]"
                                        >
                                            <X className="h-4 w-4" aria-hidden="true" />
                                            <span className="sr-only">清除</span>
                                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                清除
                                            </span>
                                        </Link>
                                    </div>
                                    <Button type="submit" variant="ghost" aria-label="查詢" className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center">
                                        <Search className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                        <span className="sr-only">查詢</span>
                                        <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                            查詢
                                        </span>
                                    </Button>
                                </form>
                                <Button
                                    type="button"
                                    variant={showCreateActivityForm ? "solid" : "ghost"}
                                    aria-label="新增"
                                    className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center"
                                    onClick={() => setShowCreateActivityForm((prev) => !prev)}
                                >
                                    <Plus className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                    <span className="sr-only">新增</span>
                                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                        新增
                                    </span>
                                </Button>
                            </div>
                            {showCreateActivityForm ? (
                                <form action={createActivityAction} className="mt-3 grid gap-3">
                                    <input type="hidden" name="tab" value="activities" />
                                    <div className="grid gap-2 md:grid-cols-3">
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-name" label="活動名稱" />
                                            <Input id="create-activity-name" name="activityName" placeholder="活動名稱" required />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-start-at" label="開始日期" />
                                            <Input
                                                id="create-activity-start-at"
                                                type="date"
                                                name="activityStartAt"
                                                onClick={(event) => openDatePicker(event.currentTarget)}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-end-at" label="結束日期" />
                                            <Input
                                                id="create-activity-end-at"
                                                type="date"
                                                name="activityEndAt"
                                                onClick={(event) => openDatePicker(event.currentTarget)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-3">
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-effect-type" label="活動效果" />
                                            <Select id="create-activity-effect-type" name="activityEffectType" defaultValue="discount">
                                                <option value="discount">立即折扣型</option>
                                                <option value="bundle_price">立即組合價型</option>
                                                <option value="gift_item">立即贈品型</option>
                                                <option value="create_entitlement">未來兌換權型</option>
                                                <option value="create_pickup_reservation">留貨待取型（預備）</option>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-discount-amount" label="折扣金額" />
                                            <Input id="create-activity-discount-amount" type="number" min={0} name="activityDiscountAmount" defaultValue={0} />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-bundle-discount" label="組合價折抵" />
                                            <Input id="create-activity-bundle-discount" type="number" min={0} name="activityBundlePriceDiscount" defaultValue={0} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-3">
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-gift-product-id" label="贈品產品 ID" />
                                            <Input id="create-activity-gift-product-id" name="activityGiftProductId" placeholder="gift_item 使用" />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-gift-product-name" label="贈品名稱" />
                                            <Input id="create-activity-gift-product-name" name="activityGiftProductName" placeholder="gift_item 使用" />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-gift-qty" label="贈品數量" />
                                            <Input id="create-activity-gift-qty" type="number" min={1} name="activityGiftQty" defaultValue={1} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-3">
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-entitlement-type" label="權益類型" />
                                            <Select id="create-activity-entitlement-type" name="activityEntitlementType" defaultValue="replacement">
                                                <option value="replacement">replacement</option>
                                                <option value="gift">gift</option>
                                                <option value="discount">discount</option>
                                                <option value="service">service</option>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-scope-type" label="權益範圍" />
                                            <Select id="create-activity-scope-type" name="activityScopeType" defaultValue="category">
                                                <option value="category">分類</option>
                                                <option value="product">產品</option>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-entitlement-qty" label="權益次數" />
                                            <Input id="create-activity-entitlement-qty" type="number" min={1} name="activityEntitlementQty" defaultValue={1} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-4">
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-category-id" label="分類 ID" />
                                            <Input id="create-activity-category-id" name="activityCategoryId" placeholder="分類 ID（分類型權益）" />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-category-name" label="分類名稱" />
                                            <Input id="create-activity-category-name" name="activityCategoryName" placeholder="分類名稱（分類型權益）" />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-product-id" label="產品 ID" />
                                            <Input id="create-activity-product-id" name="activityProductId" placeholder="產品 ID（產品型權益/留貨）" />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-product-name" label="產品名稱" />
                                            <Input id="create-activity-product-name" name="activityProductName" placeholder="產品名稱（產品型權益/留貨）" />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-4">
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-entitlement-expire" label="權益到期日" />
                                            <Input
                                                id="create-activity-entitlement-expire"
                                                type="date"
                                                name="activityEntitlementExpiresAt"
                                                onClick={(event) => openDatePicker(event.currentTarget)}
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-reservation-qty" label="待取貨數量" />
                                            <Input id="create-activity-reservation-qty" type="number" min={1} name="activityReservationQty" defaultValue={1} />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-reservation-expire" label="留貨到期日" />
                                            <Input
                                                id="create-activity-reservation-expire"
                                                type="date"
                                                name="activityReservationExpiresAt"
                                                onClick={(event) => openDatePicker(event.currentTarget)}
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-default-store-qty" label="Legacy 保留欄位（相容）" />
                                            <Input id="create-activity-default-store-qty" type="number" min={0} name="activityDefaultStoreQty" defaultValue={0} />
                                        </div>
                                    </div>
                                    <div className="grid gap-1">
                                        <FieldLabel htmlFor="create-activity-message" label="活動說明" />
                                        <Textarea id="create-activity-message" name="activityMessage" rows={3} placeholder="活動說明（點擊展開可看全部）" />
                                    </div>
                                    <div className="grid gap-2">
                                        {draftItems.map((item, index) => (
                                            <div key={item.id} className="grid gap-2 rounded-lg border border-[rgb(var(--border))] p-3 md:grid-cols-4">
                                                <div className="text-xs font-semibold text-[rgb(var(--muted))] md:col-span-4">品項 {index + 1}</div>
                                                <div className="grid gap-1">
                                                    <FieldLabel htmlFor={`create-item-name-${item.id}`} label="品名" />
                                                    <Input
                                                        id={`create-item-name-${item.id}`}
                                                        name="activityItemName[]"
                                                        value={item.itemName}
                                                        onChange={(event) => {
                                                            const value = event.target.value;
                                                            setDraftItems((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, itemName: value } : row)));
                                                        }}
                                                        placeholder="品名"
                                                        required
                                                    />
                                                </div>
                                                <div className="grid gap-1">
                                                    <FieldLabel htmlFor={`create-item-qty-${item.id}`} label="總數" />
                                                    <Input
                                                        id={`create-item-qty-${item.id}`}
                                                        type="number"
                                                        min={0}
                                                        name="activityItemQty[]"
                                                        value={item.qty}
                                                        onChange={(event) => {
                                                            const value = Number(event.target.value || "0");
                                                            setDraftItems((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, qty: value } : row)));
                                                        }}
                                                        placeholder="總數"
                                                        required
                                                    />
                                                </div>
                                                <div className="grid gap-1">
                                                    <FieldLabel htmlFor={`create-item-price-${item.id}`} label="售價" />
                                                    <Input
                                                        id={`create-item-price-${item.id}`}
                                                        type="number"
                                                        min={0}
                                                        name="activityItemPrice[]"
                                                        value={item.price}
                                                        onChange={(event) => {
                                                            const value = Number(event.target.value || "0");
                                                            setDraftItems((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, price: value } : row)));
                                                        }}
                                                        placeholder="售價"
                                                        required
                                                    />
                                                </div>
                                                <div className="grid gap-1">
                                                    <FieldLabel htmlFor={`create-item-cost-${item.id}`} label="成本" />
                                                    <Input
                                                        id={`create-item-cost-${item.id}`}
                                                        type="number"
                                                        min={0}
                                                        name="activityItemCost[]"
                                                        value={item.cost}
                                                        onChange={(event) => {
                                                            const value = Number(event.target.value || "0");
                                                            setDraftItems((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, cost: value } : row)));
                                                        }}
                                                        placeholder="成本"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                setDraftItems((prev) => [...prev, { id: `draft-${Date.now()}`, itemName: "", qty: 1, price: 0, cost: 0 }])
                                            }
                                        >
                                            + 新增卡片
                                        </Button>
                                        <div className="text-sm text-[rgb(var(--muted))]">
                                            活動總價：
                                            {formatMoney(
                                                draftItems.reduce((sum, item) => sum + Math.max(0, item.qty) * Math.max(0, item.price), 0),
                                                lang,
                                            )}
                                        </div>
                                        <Button type="submit">活動建立</Button>
                                    </div>
                                </form>
                            ) : null}
                        </Card>

                        <Card className="rounded-xl p-3">
                            <div className="overflow-x-auto">
                                <div className="flex min-w-max items-center gap-2 text-sm">
                                    <span className="whitespace-nowrap text-sm font-semibold">過濾欄位</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">最後更新</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">{formatTimeShort(snapshotTs, lang)}</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">時間排序</span>
                                    <Select value={activityOrder} className="w-[4ch]" onChange={(event) => setActivityOrder(event.target.value as ActivityListOrder)}>
                                        <option value="updated_latest">更新 新→舊</option>
                                        <option value="updated_earliest">更新 舊→新</option>
                                        <option value="start_latest">開始 新→舊</option>
                                        <option value="start_earliest">開始 舊→新</option>
                                    </Select>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">狀態過濾</span>
                                    <Select value={activityStatusFilter} className="w-[4ch]" onChange={(event) => setActivityStatusFilter(event.target.value as ActivityStatusFilter)}>
                                        <option value="all">全部</option>
                                        <option value="upcoming">未開始</option>
                                        <option value="active">活動中</option>
                                        <option value="ended">結束</option>
                                        <option value="cancelled">取消</option>
                                    </Select>
                                </div>
                            </div>
                        </Card>

                        <Card className="rounded-xl p-3">
                            <SectionTitle title="活動列表" hint={`共 ${filteredActivities.length} 筆`} />
                            <div className="mb-2 hidden grid-cols-7 gap-1 px-3 text-xs text-[rgb(var(--muted))] sm:grid">
                                <span>活動名稱</span>
                                <span>品名</span>
                                <span>總數</span>
                                <span>效果類型</span>
                                <span>開始日期</span>
                                <span>結束日期</span>
                                <span>狀態</span>
                            </div>
                            <div className="grid gap-2">
                                {filteredActivities.map((activity) => (
                                    <details key={activity.id} className="rounded-lg border border-[rgb(var(--border))]">
                                        <summary className="grid cursor-pointer list-none gap-1 px-3 py-2 text-sm sm:grid-cols-7 [&::-webkit-details-marker]:hidden">
                                            <span><span className="text-[rgb(var(--muted))] sm:hidden">活動名稱：</span>{activity.name}</span>
                                            <span><span className="text-[rgb(var(--muted))] sm:hidden">品名：</span>{activity.items[0]?.itemName || "-"}</span>
                                            <span><span className="text-[rgb(var(--muted))] sm:hidden">總數：</span>{activity.items.reduce((sum, item) => sum + item.totalQty, 0)}</span>
                                            <span><span className="text-[rgb(var(--muted))] sm:hidden">效果類型：</span>{activityEffectText(activity.effectType)}</span>
                                            <span><span className="text-[rgb(var(--muted))] sm:hidden">開始日期：</span>{formatTime(activity.startAt, lang)}</span>
                                            <span><span className="text-[rgb(var(--muted))] sm:hidden">結束日期：</span>{formatTime(activity.endAt, lang)}</span>
                                            <span><span className="text-[rgb(var(--muted))] sm:hidden">狀態：</span>{activityStatusText(activity.status)}</span>
                                        </summary>
                                        <div className="border-t border-[rgb(var(--border))] p-3 text-sm">
                                            <div className="mb-2 whitespace-pre-wrap text-[rgb(var(--muted))]">{activity.message || "-"}</div>
                                            <div className="mb-2 text-xs text-[rgb(var(--muted))]">活動效果：{activityEffectText(activity.effectType)}</div>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full text-xs">
                                                    <thead>
                                                        <tr className="text-left text-[rgb(var(--muted))]">
                                                            <th className="px-1 py-1">品名</th>
                                                            <th className="px-1 py-1">總數</th>
                                                            <th className="px-1 py-1">金額</th>
                                                            <th className="px-1 py-1">成本</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {activity.items.map((item) => (
                                                            <tr key={item.id}>
                                                                <td className="px-1 py-1">{item.itemName}</td>
                                                                <td className="px-1 py-1">{item.totalQty}</td>
                                                                <td className="px-1 py-1">{formatMoney(item.amount, lang)}</td>
                                                                <td className="px-1 py-1">{formatMoney(item.cost, lang)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="mt-3 grid gap-2">
                                                <form action={updateActivityAction} className="grid gap-2 rounded-lg border border-[rgb(var(--border))] p-3">
                                                    <input type="hidden" name="tab" value="activities" />
                                                    <input type="hidden" name="activityId" value={activity.id} />
                                                    <div className="grid gap-2 md:grid-cols-3">
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-name-${activity.id}`} label="活動名稱" />
                                                            <Input id={`update-activity-name-${activity.id}`} name="activityName" defaultValue={activity.name} required />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-start-at-${activity.id}`} label="開始日期" />
                                                            <Input
                                                                id={`update-activity-start-at-${activity.id}`}
                                                                type="date"
                                                                name="activityStartAt"
                                                                defaultValue={toDateInput(activity.startAt)}
                                                                onClick={(event) => openDatePicker(event.currentTarget)}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-end-at-${activity.id}`} label="結束日期" />
                                                            <Input
                                                                id={`update-activity-end-at-${activity.id}`}
                                                                type="date"
                                                                name="activityEndAt"
                                                                defaultValue={toDateInput(activity.endAt)}
                                                                onClick={(event) => openDatePicker(event.currentTarget)}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid gap-2 md:grid-cols-3">
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-effect-type-${activity.id}`} label="活動效果" />
                                                            <Select id={`update-activity-effect-type-${activity.id}`} name="activityEffectType" defaultValue={activity.effectType}>
                                                                <option value="discount">立即折扣型</option>
                                                                <option value="bundle_price">立即組合價型</option>
                                                                <option value="gift_item">立即贈品型</option>
                                                                <option value="create_entitlement">未來兌換權型</option>
                                                                <option value="create_pickup_reservation">留貨待取型（預備）</option>
                                                            </Select>
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-discount-${activity.id}`} label="折扣金額" />
                                                            <Input
                                                                id={`update-activity-discount-${activity.id}`}
                                                                type="number"
                                                                min={0}
                                                                name="activityDiscountAmount"
                                                                defaultValue={activity.discountAmount ?? 0}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-bundle-${activity.id}`} label="組合價折抵" />
                                                            <Input
                                                                id={`update-activity-bundle-${activity.id}`}
                                                                type="number"
                                                                min={0}
                                                                name="activityBundlePriceDiscount"
                                                                defaultValue={activity.bundlePriceDiscount ?? 0}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid gap-2 md:grid-cols-3">
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-gift-product-id-${activity.id}`} label="贈品產品 ID" />
                                                            <Input
                                                                id={`update-activity-gift-product-id-${activity.id}`}
                                                                name="activityGiftProductId"
                                                                defaultValue={activity.giftProductId ?? ""}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-gift-product-name-${activity.id}`} label="贈品名稱" />
                                                            <Input
                                                                id={`update-activity-gift-product-name-${activity.id}`}
                                                                name="activityGiftProductName"
                                                                defaultValue={activity.giftProductName ?? ""}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-gift-qty-${activity.id}`} label="贈品數量" />
                                                            <Input
                                                                id={`update-activity-gift-qty-${activity.id}`}
                                                                type="number"
                                                                min={1}
                                                                name="activityGiftQty"
                                                                defaultValue={activity.giftQty ?? 1}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid gap-2 md:grid-cols-3">
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-entitlement-type-${activity.id}`} label="權益類型" />
                                                            <Select
                                                                id={`update-activity-entitlement-type-${activity.id}`}
                                                                name="activityEntitlementType"
                                                                defaultValue={activity.entitlementType ?? "replacement"}
                                                            >
                                                                <option value="replacement">replacement</option>
                                                                <option value="gift">gift</option>
                                                                <option value="discount">discount</option>
                                                                <option value="service">service</option>
                                                            </Select>
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-scope-${activity.id}`} label="權益範圍" />
                                                            <Select
                                                                id={`update-activity-scope-${activity.id}`}
                                                                name="activityScopeType"
                                                                defaultValue={activity.scopeType === "product" ? "product" : "category"}
                                                            >
                                                                <option value="category">分類</option>
                                                                <option value="product">產品</option>
                                                            </Select>
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-entitlement-qty-${activity.id}`} label="權益次數" />
                                                            <Input
                                                                id={`update-activity-entitlement-qty-${activity.id}`}
                                                                type="number"
                                                                min={1}
                                                                name="activityEntitlementQty"
                                                                defaultValue={activity.entitlementQty ?? 1}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid gap-2 md:grid-cols-4">
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-category-id-${activity.id}`} label="分類 ID" />
                                                            <Input id={`update-activity-category-id-${activity.id}`} name="activityCategoryId" defaultValue={activity.categoryId ?? ""} />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-category-name-${activity.id}`} label="分類名稱" />
                                                            <Input
                                                                id={`update-activity-category-name-${activity.id}`}
                                                                name="activityCategoryName"
                                                                defaultValue={activity.categoryName ?? ""}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-product-id-${activity.id}`} label="產品 ID" />
                                                            <Input id={`update-activity-product-id-${activity.id}`} name="activityProductId" defaultValue={activity.productId ?? ""} />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-product-name-${activity.id}`} label="產品名稱" />
                                                            <Input id={`update-activity-product-name-${activity.id}`} name="activityProductName" defaultValue={activity.productName ?? ""} />
                                                        </div>
                                                    </div>
                                                    <div className="grid gap-2 md:grid-cols-4">
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-entitlement-expire-${activity.id}`} label="權益到期日" />
                                                            <Input
                                                                id={`update-activity-entitlement-expire-${activity.id}`}
                                                                type="date"
                                                                name="activityEntitlementExpiresAt"
                                                                defaultValue={toDateInput(activity.entitlementExpiresAt ?? 0)}
                                                                onClick={(event) => openDatePicker(event.currentTarget)}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-reservation-qty-${activity.id}`} label="待取貨數量" />
                                                            <Input
                                                                id={`update-activity-reservation-qty-${activity.id}`}
                                                                type="number"
                                                                min={1}
                                                                name="activityReservationQty"
                                                                defaultValue={activity.reservationQty ?? 1}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-reservation-expire-${activity.id}`} label="留貨到期日" />
                                                            <Input
                                                                id={`update-activity-reservation-expire-${activity.id}`}
                                                                type="date"
                                                                name="activityReservationExpiresAt"
                                                                defaultValue={toDateInput(activity.reservationExpiresAt ?? 0)}
                                                                onClick={(event) => openDatePicker(event.currentTarget)}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-default-store-qty-${activity.id}`} label="Legacy 保留欄位（相容）" />
                                                            <Input
                                                                id={`update-activity-default-store-qty-${activity.id}`}
                                                                type="number"
                                                                min={0}
                                                                name="activityDefaultStoreQty"
                                                                defaultValue={activity.defaultStoreQty}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid gap-1">
                                                        <FieldLabel htmlFor={`update-activity-message-${activity.id}`} label="活動說明" />
                                                        <Textarea id={`update-activity-message-${activity.id}`} name="activityMessage" rows={2} defaultValue={activity.message} />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        {activity.items.map((item, itemIndex) => (
                                                            <div key={item.id} className="grid gap-2 md:grid-cols-4">
                                                                <div className="text-xs font-semibold text-[rgb(var(--muted))] md:col-span-4">品項 {itemIndex + 1}</div>
                                                                <div className="grid gap-1">
                                                                    <FieldLabel htmlFor={`update-item-name-${activity.id}-${item.id}`} label="品名" />
                                                                    <Input id={`update-item-name-${activity.id}-${item.id}`} name="activityItemName[]" defaultValue={item.itemName} required />
                                                                </div>
                                                                <div className="grid gap-1">
                                                                    <FieldLabel htmlFor={`update-item-qty-${activity.id}-${item.id}`} label="總數" />
                                                                    <Input
                                                                        id={`update-item-qty-${activity.id}-${item.id}`}
                                                                        type="number"
                                                                        min={0}
                                                                        name="activityItemQty[]"
                                                                        defaultValue={item.totalQty}
                                                                        required
                                                                    />
                                                                </div>
                                                                <div className="grid gap-1">
                                                                    <FieldLabel htmlFor={`update-item-price-${activity.id}-${item.id}`} label="售價" />
                                                                    <Input
                                                                        id={`update-item-price-${activity.id}-${item.id}`}
                                                                        type="number"
                                                                        min={0}
                                                                        name="activityItemPrice[]"
                                                                        defaultValue={item.unitPrice}
                                                                        required
                                                                    />
                                                                </div>
                                                                <div className="grid gap-1">
                                                                    <FieldLabel htmlFor={`update-item-cost-${activity.id}-${item.id}`} label="成本" />
                                                                    <Input
                                                                        id={`update-item-cost-${activity.id}-${item.id}`}
                                                                        type="number"
                                                                        min={0}
                                                                        name="activityItemCost[]"
                                                                        defaultValue={item.unitCost}
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button type="submit">更改活動（調整全部）</Button>
                                                    </div>
                                                </form>

                                                <div className="flex flex-wrap gap-2">
                                                    <form action={cancelActivityAction}>
                                                        <input type="hidden" name="tab" value="activities" />
                                                        <input type="hidden" name="activityId" value={activity.id} />
                                                        <Button type="submit" variant="ghost">取消</Button>
                                                    </form>
                                                    <form action={deleteActivityAction}>
                                                        <input type="hidden" name="tab" value="activities" />
                                                        <input type="hidden" name="activityId" value={activity.id} />
                                                        <Button type="submit" variant="ghost">刪除</Button>
                                                    </form>
                                                </div>
                                                <div className="text-xs text-[rgb(var(--muted))]">店內銷售 / 線上銷售 可透過活動購買清單追蹤。</div>
                                            </div>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </Card>
                    </>
                ) : null}

                {tab === "inventory" ? (
                    <>
                        <Card
                            className={[
                                "sticky top-2 z-20 transition-all duration-200 supports-[backdrop-filter]:backdrop-blur-sm",
                                tab === "inventory" && inventoryHeaderElevated
                                    ? "shadow-[0_10px_24px_rgba(15,23,42,0.14)] ring-1 ring-[rgb(var(--border))]"
                                    : "shadow-none ring-0",
                            ].join(" ")}
                        >
                            <SectionTitle
                                title="庫存功能"
                                hint={
                                    inventoryView === "stock"
                                        ? "目前檢視：庫存總覽"
                                        : inventoryView === "settings"
                                          ? "目前檢視：庫存設置"
                                          : inventoryView === "stock-in"
                                            ? "目前檢視：入庫作業"
                                            : inventoryView === "stock-out"
                                              ? "目前檢視：出庫作業"
                                              : "目前檢視：產品管理"
                                }
                            />
                            <div className="mb-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                                {[
                                    { id: "stock", title: "庫存", hint: "庫存摘要與列表" },
                                    { id: "settings", title: "庫存設置", hint: "庫存參數與資料" },
                                    { id: "stock-in", title: "入庫", hint: "增加商品數量" },
                                    { id: "stock-out", title: "出庫", hint: "扣減商品數量" },
                                    { id: "product-management", title: "產品管理", hint: "完整 CRUD" },
                                ].map((entry) => {
                                    const active = inventoryView === entry.id;
                                    return (
                                        <Link
                                            key={entry.id}
                                            href={`/dashboard?tab=inventory&inventoryView=${encodeURIComponent(entry.id)}&productQ=${encodeURIComponent(productKeyword)}`}
                                            className={[
                                                "rounded-xl border px-3 py-2 transition",
                                                active
                                                    ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel))]"
                                                    : "border-[rgb(var(--border))] bg-[rgb(var(--panel2))] hover:border-[rgb(var(--accent))]",
                                            ].join(" ")}
                                        >
                                            <div className="text-sm font-semibold">{entry.title}</div>
                                            <div className="text-xs text-[rgb(var(--muted))]">{entry.hint}</div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </Card>
                        <Card>
                            <SectionTitle title="搜尋與篩選" hint="功能切換與搜尋區分離，避免操作混淆。" />
                            <form action="/dashboard" method="get" className="flex flex-wrap items-center gap-2">
                                <input type="hidden" name="tab" value="inventory" />
                                <input type="hidden" name="inventoryView" value={inventoryView} />
                                <MerchantPredictiveSearchInput
                                    name="productQ"
                                    defaultValue={productKeyword}
                                    placeholder="搜尋品名、SKU、分類、品牌、型號"
                                    targets={["inventory"]}
                                    className="w-full sm:w-80"
                                />
                                <Button type="submit">查詢</Button>
                                <Link
                                    href={`/dashboard?tab=inventory&inventoryView=${encodeURIComponent(inventoryView)}`}
                                    className="text-sm text-[rgb(var(--accent))] hover:underline"
                                >
                                    清除
                                </Link>
                            </form>
                        </Card>

                        {inventoryView === "stock" ? (
                            <>
                                <Card>
                                    <SectionTitle title="庫存摘要" hint="只統計實體庫存與真實 reserved，不含客戶權益。"/>
                                    <div className="grid gap-3 sm:grid-cols-4">
                                        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                            <div className="text-xs text-[rgb(var(--muted))]">On hand 總數</div>
                                            <div className="mt-1 text-2xl font-semibold">{formatMoney(inventorySummary.totalOnHandUnits, lang)}</div>
                                        </div>
                                        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                            <div className="text-xs text-[rgb(var(--muted))]">Reserved 總數</div>
                                            <div className="mt-1 text-2xl font-semibold">{formatMoney(inventorySummary.totalReservedUnits, lang)}</div>
                                        </div>
                                        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                            <div className="text-xs text-[rgb(var(--muted))]">Available 總數</div>
                                            <div className="mt-1 text-2xl font-semibold">{formatMoney(inventorySummary.totalAvailableUnits, lang)}</div>
                                        </div>
                                        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                            <div className="text-xs text-[rgb(var(--muted))]">庫存成本總值</div>
                                            <div className="mt-1 text-2xl font-semibold">{formatMoney(inventorySummary.totalValue, lang)}</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                        <div className="text-xs text-[rgb(var(--muted))]">低庫存（依各商品 lowStockThreshold）</div>
                                        <div className="mt-1 text-2xl font-semibold">{inventorySummary.lowStockCount}</div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                                        <Link href="/dashboard?tab=inventory&inventoryView=stock-in" className="text-[rgb(var(--accent))] hover:underline">
                                            前往入庫
                                        </Link>
                                        <Link href="/dashboard?tab=inventory&inventoryView=stock-out" className="text-[rgb(var(--accent))] hover:underline">
                                            前往出庫
                                        </Link>
                                    </div>
                                </Card>

                                <Card>
                                    <SectionTitle title={`庫存列表（${products.length}）`} />
                                    {products.length === 0 ? (
                                        <div className="text-sm text-[rgb(var(--muted))]">目前沒有產品。</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                    <tr className="text-left text-[rgb(var(--muted))]">
                                                        <th className="px-2 py-2">品名</th>
                                                        <th className="px-2 py-2">SKU</th>
                                                        <th className="px-2 py-2">供應商</th>
                                                        <th className="px-2 py-2">On hand</th>
                                                        <th className="px-2 py-2">Reserved</th>
                                                        <th className="px-2 py-2">Available</th>
                                                        <th className="px-2 py-2">售價</th>
                                                        <th className="px-2 py-2">成本</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {products.map((product) => (
                                                        <tr key={product.id} className="border-t border-[rgb(var(--border))]">
                                                            <td className="px-2 py-2 font-medium">{product.name}</td>
                                                            <td className="px-2 py-2">{product.sku || "-"}</td>
                                                            <td className="px-2 py-2">{product.supplier || "-"}</td>
                                                            <td className="px-2 py-2">{product.onHandQty ?? product.stock}</td>
                                                            <td className="px-2 py-2">{product.reservedQty ?? 0}</td>
                                                            <td className="px-2 py-2">{product.availableQty ?? Math.max((product.onHandQty ?? product.stock) - (product.reservedQty ?? 0), 0)}</td>
                                                            <td className="px-2 py-2">{formatMoney(product.price, lang)}</td>
                                                            <td className="px-2 py-2">{formatMoney(product.cost, lang)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </Card>
                            </>
                        ) : null}

                        {inventoryView === "settings" ? (
                            <>
                                <Card>
                                    <SectionTitle title="庫存設置" hint="新增產品與初始庫存" />
                                    <form action={createProductAction} className="grid gap-2 md:grid-cols-5">
                                        <input type="hidden" name="tab" value="inventory" />
                                        <input type="hidden" name="inventoryView" value={inventoryView} />
                                        <Input name="name" placeholder="品名" required />
                                        <Input type="number" min={0} name="price" placeholder="售價" required />
                                        <Input type="number" min={0} name="cost" placeholder="成本" required />
                                        <Input name="supplier" placeholder="供應商" />
                                        <Input name="sku" placeholder="SKU" />
                                        <Input type="number" min={0} name="stock" placeholder="庫存" defaultValue={0} className="md:col-span-1" />
                                        <Button type="submit" className="md:col-span-4">新增產品</Button>
                                    </form>
                                </Card>

                                <Card>
                                    <SectionTitle title={`產品列表（${products.length}）`} />
                                    <div className="grid gap-2">
                                        {products.map((product) => (
                                            <details key={product.id} className="rounded-lg border border-[rgb(var(--border))]">
                                                <summary className="grid cursor-pointer list-none gap-1 px-3 py-2 text-sm sm:grid-cols-6 [&::-webkit-details-marker]:hidden">
                                                    <span>{product.name}</span>
                                                    <span>On hand {product.onHandQty ?? product.stock} / Reserved {product.reservedQty ?? 0}</span>
                                                    <span>售價 {formatMoney(product.price, lang)}</span>
                                                    <span>成本 {formatMoney(product.cost, lang)}</span>
                                                    <span>{product.supplier || "-"}</span>
                                                    <span>{product.sku || "-"}</span>
                                                </summary>
                                                <div className="border-t border-[rgb(var(--border))] p-3">
                                                    <form action={updateProductAction} className="grid gap-2 md:grid-cols-5">
                                                        <input type="hidden" name="tab" value="inventory" />
                                                        <input type="hidden" name="inventoryView" value={inventoryView} />
                                                        <input type="hidden" name="productId" value={product.id} />
                                                        <Input name="name" defaultValue={product.name} required />
                                                        <Input type="number" min={0} name="price" defaultValue={product.price} required />
                                                        <Input type="number" min={0} name="cost" defaultValue={product.cost} required />
                                                        <Input name="supplier" defaultValue={product.supplier} />
                                                        <Input name="sku" defaultValue={product.sku} />
                                                        <Input type="number" min={0} name="stock" defaultValue={product.onHandQty ?? product.stock} />
                                                        <Button type="submit" className="md:col-span-3">更新產品</Button>
                                                    </form>
                                                    <form action={deleteProductAction} className="mt-2">
                                                        <input type="hidden" name="tab" value="inventory" />
                                                        <input type="hidden" name="inventoryView" value={inventoryView} />
                                                        <input type="hidden" name="productId" value={product.id} />
                                                        <Button type="submit" variant="ghost">刪除產品</Button>
                                                    </form>
                                                </div>
                                            </details>
                                        ))}
                                    </div>
                                </Card>
                            </>
                        ) : null}

                        {inventoryView === "product-management" ? (
                            <>
                                <Card className="rounded-xl p-3">
                                    <SectionTitle title="搜尋 / 新增" hint="產品管理 CRUD" />
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                                        <form action="/dashboard" method="get" className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                                            <input type="hidden" name="tab" value="inventory" />
                                            <input type="hidden" name="inventoryView" value="product-management" />
                                            <div className="relative w-full">
                                                <MerchantPredictiveSearchInput
                                                    name="productQ"
                                                    defaultValue={productKeyword}
                                                    placeholder="查詢品名、SKU、供應商、分類、品牌、型號"
                                                    targets={["inventory"]}
                                                    inputClassName="pr-10"
                                                />
                                                <Link
                                                    href="/dashboard?tab=inventory&inventoryView=product-management"
                                                    aria-label="清除"
                                                    className="group absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel2))] hover:text-[rgb(var(--text))]"
                                                >
                                                    <X className="h-4 w-4" aria-hidden="true" />
                                                </Link>
                                            </div>
                                            <Button type="submit" variant="ghost" aria-label="查詢" className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center">
                                                <Search className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                            </Button>
                                        </form>
                                        <Button
                                            type="button"
                                            variant={showCreateProductForm ? "solid" : "ghost"}
                                            aria-label="新增"
                                            className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center"
                                            onClick={() => setShowCreateProductForm((prev) => !prev)}
                                        >
                                            <Plus className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                        </Button>
                                    </div>

                                    {showCreateProductForm ? (
                                        <form action={createProductAction} className="mt-3 grid gap-2 md:grid-cols-5">
                                            <input type="hidden" name="tab" value="inventory" />
                                            <input type="hidden" name="inventoryView" value="product-management" />
                                            <Input name="name" placeholder="品名" required />
                                            <Input type="number" min={0} name="price" placeholder="售價" required />
                                            <Input type="number" min={0} name="cost" placeholder="成本" required />
                                            <Input name="supplier" placeholder="供應商" />
                                            <Input name="sku" placeholder="SKU" />
                                            <Input type="number" min={0} name="stock" placeholder="庫存" defaultValue={0} className="md:col-span-1" />
                                            <Button type="submit" className="md:col-span-4">新增產品</Button>
                                        </form>
                                    ) : null}
                                </Card>

                                <Card className="rounded-xl p-3">
                                    <SectionTitle title={`產品列表（${products.length}）`} />
                                    {products.length === 0 ? (
                                        <div className="text-sm text-[rgb(var(--muted))]">目前沒有產品資料。</div>
                                    ) : (
                                        <div className="grid gap-2">
                                            {products.map((product) => (
                                                <details key={product.id} className="rounded-lg border border-[rgb(var(--border))]">
                                                    <summary className="grid cursor-pointer list-none gap-1 px-3 py-2 text-sm sm:grid-cols-6 [&::-webkit-details-marker]:hidden">
                                                        <span>{product.name}</span>
                                                        <span>On hand {product.onHandQty ?? product.stock} / Reserved {product.reservedQty ?? 0}</span>
                                                        <span>售價 {formatMoney(product.price, lang)}</span>
                                                        <span>成本 {formatMoney(product.cost, lang)}</span>
                                                        <span>{product.supplier || "-"}</span>
                                                        <span>{product.sku || "-"}</span>
                                                    </summary>
                                                    <div className="border-t border-[rgb(var(--border))] p-3">
                                                        <form action={updateProductAction} className="grid gap-2 md:grid-cols-5">
                                                            <input type="hidden" name="tab" value="inventory" />
                                                            <input type="hidden" name="inventoryView" value="product-management" />
                                                            <input type="hidden" name="productId" value={product.id} />
                                                            <Input name="name" defaultValue={product.name} required />
                                                            <Input type="number" min={0} name="price" defaultValue={product.price} required />
                                                            <Input type="number" min={0} name="cost" defaultValue={product.cost} required />
                                                            <Input name="supplier" defaultValue={product.supplier} />
                                                            <Input name="sku" defaultValue={product.sku} />
                                                            <Input type="number" min={0} name="stock" defaultValue={product.onHandQty ?? product.stock} />
                                                            <Button type="submit" className="md:col-span-3">更新產品</Button>
                                                        </form>
                                                        <form action={deleteProductAction} className="mt-2">
                                                            <input type="hidden" name="tab" value="inventory" />
                                                            <input type="hidden" name="inventoryView" value="product-management" />
                                                            <input type="hidden" name="productId" value={product.id} />
                                                            <Button type="submit" variant="ghost">刪除產品</Button>
                                                        </form>
                                                    </div>
                                                </details>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            </>
                        ) : null}

                        {inventoryView === "stock-in" ? (
                            <Card>
                                <SectionTitle title={`入庫（${products.length}）`} hint="每次操作只更新一項商品庫存" />
                                {products.length === 0 ? (
                                    <div className="text-sm text-[rgb(var(--muted))]">目前沒有產品可入庫。</div>
                                ) : (
                                    <div className="grid gap-2">
                                        {products.map((product) => (
                                            <form
                                                key={`stock_in_${product.id}`}
                                                action={createStockInAction}
                                                className="grid gap-2 rounded-lg border border-[rgb(var(--border))] p-3 md:grid-cols-[minmax(0,2fr)_120px_140px]"
                                            >
                                                <input type="hidden" name="tab" value="inventory" />
                                                <input type="hidden" name="inventoryView" value={inventoryView} />
                                                <input type="hidden" name="productId" value={product.id} />
                                                <div className="text-sm">
                                                    <div className="font-medium">{product.name}</div>
                                                    <div className="text-xs text-[rgb(var(--muted))]">
                                                        SKU: {product.sku || "-"} / On hand: {product.onHandQty ?? product.stock} / Reserved: {product.reservedQty ?? 0}
                                                    </div>
                                                </div>
                                                <Input type="number" min={1} name="qty" defaultValue={1} />
                                                <Button type="submit">確認入庫</Button>
                                            </form>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        ) : null}

                        {inventoryView === "stock-out" ? (
                            <Card>
                                <SectionTitle title={`出庫（${products.length}）`} hint="出庫數量不可超過 available 庫存" />
                                {products.length === 0 ? (
                                    <div className="text-sm text-[rgb(var(--muted))]">目前沒有產品可出庫。</div>
                                ) : (
                                    <div className="grid gap-2">
                                        {products.map((product) => (
                                            <form
                                                key={`stock_out_${product.id}`}
                                                action={createStockOutAction}
                                                className="grid gap-2 rounded-lg border border-[rgb(var(--border))] p-3 md:grid-cols-[minmax(0,2fr)_120px_140px]"
                                            >
                                                <input type="hidden" name="tab" value="inventory" />
                                                <input type="hidden" name="inventoryView" value={inventoryView} />
                                                <input type="hidden" name="productId" value={product.id} />
                                                <div className="text-sm">
                                                    <div className="font-medium">{product.name}</div>
                                                    <div className="text-xs text-[rgb(var(--muted))]">
                                                        SKU: {product.sku || "-"} / On hand: {product.onHandQty ?? product.stock} / Reserved: {product.reservedQty ?? 0} / Available: {product.availableQty ?? Math.max((product.onHandQty ?? product.stock) - (product.reservedQty ?? 0), 0)}
                                                    </div>
                                                </div>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={Math.max(1, product.availableQty ?? Math.max((product.onHandQty ?? product.stock) - (product.reservedQty ?? 0), 0))}
                                                    name="qty"
                                                    defaultValue={1}
                                                />
                                                <Button
                                                    type="submit"
                                                    disabled={(product.availableQty ?? Math.max((product.onHandQty ?? product.stock) - (product.reservedQty ?? 0), 0)) <= 0}
                                                >
                                                    確認出庫
                                                </Button>
                                            </form>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        ) : null}

                        <Card>
                            <SectionTitle title={`操作紀錄（${stockLogs.length}）`} hint="時間、商品、數量、操作者" />
                            {stockLogs.length === 0 ? (
                                <div className="text-sm text-[rgb(var(--muted))]">目前還沒有庫存異動紀錄。</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-[rgb(var(--muted))]">
                                                <th className="px-2 py-2">時間</th>
                                                <th className="px-2 py-2">商品</th>
                                                <th className="px-2 py-2">動作</th>
                                                <th className="px-2 py-2">數量</th>
                                                <th className="px-2 py-2">前庫存</th>
                                                <th className="px-2 py-2">後庫存</th>
                                                <th className="px-2 py-2">操作者</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stockLogs.map((log) => (
                                                <tr key={log.id} className="border-t border-[rgb(var(--border))]">
                                                    <td className="px-2 py-2">{formatTime(log.createdAt, lang)}</td>
                                                    <td className="px-2 py-2">{log.productName}</td>
                                                    <td className="px-2 py-2">{stockActionText(log.action)}</td>
                                                    <td className="px-2 py-2">{log.qty}</td>
                                                    <td className="px-2 py-2">{log.beforeStock}</td>
                                                    <td className="px-2 py-2">{log.afterStock}</td>
                                                    <td className="px-2 py-2">
                                                        <div>{log.operatorName || "-"}</div>
                                                        <div className="text-xs text-[rgb(var(--muted))]">{log.operatorEmail || "-"}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </>
                ) : null}

                {tab === "marketing" ? (
                    <>
                        <Card>
                            <SectionTitle title="商店營銷設置" hint="維修品牌型號" />
                            <form action="/dashboard" method="get" className="flex flex-wrap items-center gap-2">
                                <input type="hidden" name="tab" value="marketing" />
                                <Input name="brandQ" defaultValue={brandKeyword} placeholder="品牌 / 型號搜尋" className="w-full sm:w-80" />
                                <Button type="submit">查詢</Button>
                            </form>
                        </Card>

                        <Card>
                            <SectionTitle title="品牌" hint="新增 / 修改 / 移除品牌" />
                            <form action={createBrandAction} className="flex flex-wrap items-center gap-2">
                                <input type="hidden" name="tab" value="marketing" />
                                <Input name="brandName" placeholder="品牌名稱" required className="w-full sm:w-80" />
                                <Button type="submit">新增品牌</Button>
                            </form>
                        </Card>

                        <Card>
                            <SectionTitle title={`型號（${brands.length} 個品牌）`} />
                            <div className="grid gap-2">
                                {brands.map((brand) => (
                                    <details key={brand.id} className="rounded-lg border border-[rgb(var(--border))]">
                                        <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
                                            {brand.name}
                                        </summary>
                                        <div className="border-t border-[rgb(var(--border))] p-3">
                                            <form action={updateBrandAction} className="mb-2 flex flex-wrap items-center gap-2">
                                                <input type="hidden" name="tab" value="marketing" />
                                                <input type="hidden" name="brandId" value={brand.id} />
                                                <Input name="brandName" defaultValue={brand.name} required className="w-full sm:w-80" />
                                                <Button type="submit">修改品牌</Button>
                                            </form>
                                            <form action={deleteBrandAction} className="mb-3">
                                                <input type="hidden" name="tab" value="marketing" />
                                                <input type="hidden" name="brandId" value={brand.id} />
                                                <Button type="submit" variant="ghost">移除品牌</Button>
                                            </form>

                                            <div className="grid gap-2 rounded-lg border border-[rgb(var(--border))] p-3">
                                                <div className="text-xs text-[rgb(var(--muted))]">目前型號</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {brand.models.map((model) => (
                                                        <details key={`${brand.id}-${model}`} className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-2 py-1 text-xs">
                                                            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">{model}</summary>
                                                            <div className="mt-2 space-y-2">
                                                                <form action={updateModelAction} className="grid gap-1">
                                                                    <input type="hidden" name="tab" value="marketing" />
                                                                    <input type="hidden" name="brandId" value={brand.id} />
                                                                    <input type="hidden" name="oldModel" value={model} />
                                                                    <Input name="modelName" defaultValue={model} required />
                                                                    <Button type="submit" variant="ghost">修改型號</Button>
                                                                </form>
                                                                <form action={deleteModelAction}>
                                                                    <input type="hidden" name="tab" value="marketing" />
                                                                    <input type="hidden" name="brandId" value={brand.id} />
                                                                    <input type="hidden" name="modelName" value={model} />
                                                                    <Button type="submit" variant="ghost">移除型號</Button>
                                                                </form>
                                                            </div>
                                                        </details>
                                                    ))}
                                                </div>

                                                <form action={createModelAction} className="flex flex-wrap items-center gap-2">
                                                    <input type="hidden" name="tab" value="marketing" />
                                                    <input type="hidden" name="brandId" value={brand.id} />
                                                    <Input name="modelName" placeholder="新增型號" required className="w-full sm:w-80" />
                                                    <Button type="submit">新增型號</Button>
                                                </form>
                                            </div>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </Card>

                        <Card>
                            <SectionTitle title="產品" hint="品名 / 售價 / 成本 / 供應商 / SKU" />
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[rgb(var(--border))] text-left text-xs text-[rgb(var(--muted))]">
                                            <th className="px-2 py-2">品名</th>
                                            <th className="px-2 py-2">售價</th>
                                            <th className="px-2 py-2">成本</th>
                                            <th className="px-2 py-2">供應商</th>
                                            <th className="px-2 py-2">SKU</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product) => (
                                            <tr key={product.id} className="border-b border-[rgb(var(--border))]">
                                                <td className="px-2 py-2">{product.name}</td>
                                                <td className="px-2 py-2">{formatMoney(product.price, lang)}</td>
                                                <td className="px-2 py-2">{formatMoney(product.cost, lang)}</td>
                                                <td className="px-2 py-2">{product.supplier || "-"}</td>
                                                <td className="px-2 py-2">{product.sku || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </>
                ) : null}
            </div>
        </div>
    );
}
