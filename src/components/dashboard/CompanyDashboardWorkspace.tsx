"use client";

import { type FormEvent, type MouseEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ItemFormFields } from "@/components/dashboard/ItemFormFields";
import { MarketingSettingsWorkspace } from "@/components/dashboard/marketing-settings-workspace";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyStateCard, MerchantListPagination, MerchantListShell, MerchantSectionCard, MerchantStatGrid, SearchToolbar } from "@/components/merchant/shell";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import { TechnicianAutocomplete } from "@/components/used-products";
import type { MerchantStatItem } from "@/components/merchant/shell";
import { ArrowLeft, ArrowRight, Pencil, Plus, Save, Search, ShieldCheck, X } from "lucide-react";
import type { DimensionPickerBundle } from "@/lib/types/catalog";
import type { CustomerProfile, CustomerProfileListRow } from "@/lib/types/customer";
import type { InventoryStockLog } from "@/lib/types/inventory";
import type { Product } from "@/lib/types/merchant-product";
import type { Activity } from "@/lib/types/promotion";
import type { RepairBrand } from "@/lib/types/repair-brand";
import type { CompanyDashboardStats } from "@/lib/types/reporting";
import type { Sale } from "@/lib/types/sale";
import type { KnownTicketStatus, QuoteStatus, Ticket } from "@/lib/types/ticket";
import type { UsedProductTypeSetting } from "@/lib/schema";
import type { ItemNamingSettings } from "@/lib/schema/itemNamingSettings";
import { LIST_DISPLAY_OPTIONS } from "@/lib/ui/list-display";

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
    customers: CustomerProfile[];
    activities: Activity[];
    purchases: ActivityPurchaseRow[];
    products: Product[];
    stockLogs: InventoryStockLog[];
    brands: RepairBrand[];
    dimensionBundle: DimensionPickerBundle;
    itemNamingSettings: ItemNamingSettings;
    supplierItems: { id: string; name: string; status?: string }[];
    caseKeyword: string;
    caseStatus: string;
    caseOrder: "latest" | "earliest";
    caseStatusOptions: string[];
    quoteStatusOptions: string[];
    repairTechnicians: Array<{
        id: string;
        name: string;
        email: string;
        phone: string;
    }>;
    customerKeyword: string;
    activityKeyword: string;
    productKeyword: string;
    createCaseAction: (formData: FormData) => Promise<void>;
    createWarrantyCaseAction: (formData: FormData) => Promise<void>;
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
    renameBrandTypeAction: (formData: FormData) => Promise<void>;
    deleteBrandTypeAction: (formData: FormData) => Promise<void>;
    createModelAction: (formData: FormData) => Promise<void>;
    updateModelAction: (formData: FormData) => Promise<void>;
    deleteModelAction: (formData: FormData) => Promise<void>;
    createCategoryAction: (formData: FormData) => Promise<void>;
    createSupplierAction: (formData: FormData) => Promise<void>;
    updateCategoryAction: (formData: FormData) => Promise<void>;
    deleteCategoryAction: (formData: FormData) => Promise<void>;
    updateSupplierAction: (formData: FormData) => Promise<void>;
    deleteSupplierAction: (formData: FormData) => Promise<void>;
    customerRows: CustomerProfileListRow[];
    customerCaseFilter: CustomerCaseFilter;
    customerOrder: CustomerListOrder;
    customerPageSize: string;
    customerCurrentCursor: string;
    customerPreviousCursor: string;
    customerPreviousCursorStack: string;
    customerNextCursor: string;
    customerNextCursorStack: string;
    customerHasNextPage: boolean;
    casePageSize: string;
    caseCurrentCursor: string;
    casePreviousCursor: string;
    casePreviousCursorStack: string;
    caseNextCursor: string;
    caseNextCursorStack: string;
    caseHasNextPage: boolean;
    activityStatusFilter: ActivityStatusFilter;
    activityOrder: ActivityListOrder;
    activityPageSize: string;
    activityCurrentCursor: string;
    activityPreviousCursor: string;
    activityPreviousCursorStack: string;
    activityNextCursor: string;
    activityNextCursorStack: string;
    activityHasNextPage: boolean;
    usedProductTypeSettings: UsedProductTypeSetting[];
    updateUsedProductTypeSettingAction: (formData: FormData) => Promise<void>;
    updateItemNamingSettingsAction: (formData: FormData) => Promise<void>;
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

const FLASH_LABELS: Record<string, string> = {
    invalid: "輸入資料不完整或格式錯誤",
    error: "操作失敗，請稍後再試",
    delete_auth_required: "請先輸入帳戶密碼才能刪除",
    delete_auth_failed: "密碼驗證失敗，刪除已取消",
    created: "案件已建立",
    case_updated: "案件已更新",
    activity_created: "活動已建立",
    activity_updated: "活動已更新",
    activity_cancelled: "活動已取消",
    activity_deleted: "活動已刪除",
    product_created: "品項已建立",
    product_updated: "品項已更新",
    product_deleted: "品項已刪除",
    product_stock_in: "入庫完成",
    product_stock_out: "出庫完成",
    brand_created: "品牌已建立",
    brand_updated: "品牌已更新",
    brand_deleted: "品牌已刪除",
    brand_type_updated: "品牌類型已更新",
    brand_type_deleted: "品牌類型已移除",
    model_created: "型號已新增",
    model_updated: "型號已更新",
    model_deleted: "型號已移除",
    category_created: "分類已新增",
    category_updated: "分類已更新",
    category_deleted: "分類已移除",
    category_invalid_parent: "第二分類只能掛在主分類底下，請重新選擇。",
    category_has_children: "此主分類底下仍有第二分類，請先處理下層分類。",
    supplier_created: "供應商已新增",
    supplier_updated: "供應商已更新",
    supplier_deleted: "供應商已移除",
    item_naming_saved: "品項快速命名設定已儲存",
    customer_created: "客戶已新增",
    customer_updated: "客戶資料已更新",
};

function flashTone(flash: string): "success" | "error" {
    if (flash === "invalid" || flash === "error" || flash === "delete_auth_required" || flash === "delete_auth_failed") return "error";
    return "success";
}

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

function caseTypeText(caseType?: string): string {
    if (caseType === "refurbish") return "翻新";
    if (caseType === "warranty") return "保固";
    return "維修";
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

function IconOnlyButton({
    label,
    icon,
    form,
    formAction,
    type = "button",
    variant = "ghost",
    className,
    disabled,
    onClick,
}: {
    label: string;
    icon: ReactNode;
    form?: string;
    formAction?: string | ((formData: FormData) => void | Promise<void>);
    type?: "button" | "submit" | "reset";
    variant?: "solid" | "ghost";
    className?: string;
    disabled?: boolean;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
    return (
        <Button
            form={form}
            formAction={formAction}
            type={type}
            variant={variant}
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
            className={`group relative h-10 w-10 !p-0 ${className ?? ""}`.trim()}
        >
            {icon}
            <span className="sr-only">{label}</span>
            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {label}
            </span>
        </Button>
    );
}

function guardDeleteWithPassword(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const targetText = (form.dataset.deleteTarget ?? "此資料").trim();
    const confirmed = window.confirm(`確定要刪除「${targetText}」嗎？此操作無法復原。`);
    if (!confirmed) {
        event.preventDefault();
        return;
    }
    const password = window.prompt("請輸入帳戶密碼以確認刪除：");
    if (!password) {
        event.preventDefault();
        return;
    }
    let input = form.querySelector('input[name="confirmPassword"]') as HTMLInputElement | null;
    if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = "confirmPassword";
        form.appendChild(input);
    }
    input.value = password;
}

function CaseCardList({
    tickets,
    lang,
    caseStatusOptions,
    quoteStatusOptions,
    repairTechnicians,
    createWarrantyCaseAction,
    updateCaseAction,
}: {
    tickets: Ticket[];
    lang: "zh" | "en";
    caseStatusOptions: string[];
    quoteStatusOptions: string[];
    repairTechnicians: Array<{
        id: string;
        name: string;
        email: string;
        phone: string;
    }>;
    createWarrantyCaseAction: (formData: FormData) => Promise<void>;
    updateCaseAction: (formData: FormData) => Promise<void>;
}) {
    const [editingCaseId, setEditingCaseId] = useState<string | null>(null);

    if (tickets.length === 0) {
        return (
            <EmptyStateCard
                icon={Search}
                title="沒有符合條件的案件"
                description="可以調整查詢條件，或先建立第一筆案件資料。"
                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
            />
        );
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
                                        <div>案件類型：{caseTypeText(ticket.caseType)}</div>
                                        <div>設備品牌：{ticket.device.name || "-"}</div>
                                        <div>設備型號：{ticket.device.model || "-"}</div>
                                        <div>送修原因：{ticket.repairReason || "-"}</div>
                                        <div>維修建議：{ticket.repairSuggestion || "-"}</div>
                                        <div>備註：{ticket.note || "-"}</div>
                                        <div>維修人員：{ticket.repairTechnicianName || "-"}</div>
                                        <div>關聯二手商品：{ticket.linkedUsedProductName || ticket.linkedUsedProductId || "-"}</div>
                                        <div>來源案件：{ticket.parentCaseTitle || ticket.parentCaseId || "-"}</div>
                                        <div>歷史摘要：{ticket.historySummary || "-"}</div>
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
                                        <form action={createWarrantyCaseAction}>
                                            <input type="hidden" name="sourceCaseId" value={ticket.id} />
                                            <Button type="submit" variant="ghost" aria-label="建立保固案件" className="group relative h-10 w-10 !p-0 flex items-center justify-center">
                                                <ShieldCheck className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
                                                <span className="sr-only">建立保固案件</span>
                                                <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                    建立保固
                                                </span>
                                            </Button>
                                        </form>
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
                                    <div className="md:col-span-2">
                                        <TechnicianAutocomplete
                                            technicians={repairTechnicians}
                                            defaultTechnicianId={ticket.repairTechnicianId}
                                            defaultTechnicianName={ticket.repairTechnicianName}
                                            technicianIdFieldName="repairTechnicianId"
                                            technicianNameFieldName="repairTechnicianName"
                                            placeholder="搜尋維修人員（僅顯示已勾選維修人員）"
                                        />
                                    </div>
                                    <Input name="linkedUsedProductId" defaultValue={ticket.linkedUsedProductId} placeholder="關聯二手商品 ID（可選）" />
                                    <Input name="linkedUsedProductName" defaultValue={ticket.linkedUsedProductName} placeholder="關聯二手商品名稱（可選）" />
                                    <Input name="parentCaseId" defaultValue={ticket.parentCaseId} placeholder="來源案件 ID（可選）" />
                                    <Input name="parentCaseTitle" defaultValue={ticket.parentCaseTitle} placeholder="來源案件標題（可選）" />
                                    <Textarea name="historySummary" rows={3} defaultValue={ticket.historySummary} placeholder="歷史維修 / 保固摘要" className="md:col-span-2" />
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
                                    <Select name="caseType" defaultValue={ticket.caseType || "repair"}>
                                        <option value="repair">repair</option>
                                        <option value="refurbish">refurbish</option>
                                        <option value="warranty">warranty</option>
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
    products,
    stockLogs,
    brands,
    dimensionBundle,
    itemNamingSettings,
    supplierItems,
    caseKeyword,
    caseStatus,
    caseOrder,
    caseStatusOptions,
    quoteStatusOptions,
    repairTechnicians,
    customerKeyword,
    activityKeyword,
    productKeyword,
    createCaseAction,
    createWarrantyCaseAction,
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
    renameBrandTypeAction,
    deleteBrandTypeAction,
    createModelAction,
    updateModelAction,
    deleteModelAction,
    createCategoryAction,
    createSupplierAction,
    updateCategoryAction,
    deleteCategoryAction,
    updateSupplierAction,
    deleteSupplierAction,
    customerRows,
    customerCaseFilter,
    customerOrder,
    customerPageSize,
    customerCurrentCursor,
    customerPreviousCursor,
    customerPreviousCursorStack,
    customerNextCursor,
    customerNextCursorStack,
    customerHasNextPage,
    casePageSize,
    caseCurrentCursor,
    casePreviousCursor,
    casePreviousCursorStack,
    caseNextCursor,
    caseNextCursorStack,
    caseHasNextPage,
    activityStatusFilter,
    activityOrder,
    activityPageSize,
    activityCurrentCursor,
    activityPreviousCursor,
    activityPreviousCursorStack,
    activityNextCursor,
    activityNextCursorStack,
    activityHasNextPage,
    usedProductTypeSettings,
    updateUsedProductTypeSettingAction,
    updateItemNamingSettingsAction,
}: CompanyDashboardWorkspaceProps) {
    const [range, setRange] = useState<"day" | "month">("day");
    const [showCreateCustomerForm, setShowCreateCustomerForm] = useState(false);
    const [showCreateCaseForm, setShowCreateCaseForm] = useState(false);
    const [showCreateActivityForm, setShowCreateActivityForm] = useState(false);
    const [showCreateProductForm, setShowCreateProductForm] = useState(false);
    const [inventoryHeaderElevated, setInventoryHeaderElevated] = useState(false);
    const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
    const [draftItems, setDraftItems] = useState<ActivityDraftItem[]>([
        { id: "draft-1", itemName: "", qty: 1, price: 0, cost: 0 },
    ]);
    const [dismissedFlashKey, setDismissedFlashKey] = useState<string | null>(null);
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
    const currentFlashKey = `${flash}:${actionTs || "no-ts"}`;
    const currentFlashText = FLASH_LABELS[flash] ?? "";
    const showFlashNotice = Boolean(currentFlashText) && dismissedFlashKey !== currentFlashKey;
    const supplierNames = useMemo(
        () =>
            Array.from(new Set([...supplierItems.map((item) => item.name.trim()), ...products.map((product) => product.supplier.trim())]))
                .filter((item) => item.length > 0)
                .sort((a, b) => a.localeCompare(b, "zh-Hant")),
        [products, supplierItems],
    );
    const customerSearchSuggestions = useMemo(
        () =>
            customerRows.map((row) => ({
                id: row.customer.id,
                value: row.customer.name,
                title: row.customer.name,
                subtitle: [row.customer.phone, row.customer.email].filter(Boolean).join(" / ") || undefined,
                keywords: [row.customer.name, row.customer.phone, row.customer.email, row.customer.address].filter(
                    (value): value is string => Boolean(value),
                ),
            })),
        [customerRows],
    );
    const caseSearchSuggestions = useMemo(
        () =>
            tickets.map((ticket) => ({
                id: ticket.id,
                value: ticket.id,
                title: ticket.id,
                subtitle: [ticket.customer.name, ticket.device.name, ticket.device.model].filter(Boolean).join(" / ") || undefined,
                keywords: [
                    ticket.id,
                    ticket.title,
                    ticket.customer.name,
                    ticket.customer.phone,
                    ticket.customer.email,
                    ticket.device.name,
                    ticket.device.model,
                    ticket.repairReason,
                    ticket.repairSuggestion,
                ].filter((value): value is string => Boolean(value)),
            })),
        [tickets],
    );
    const activitySearchSuggestions = useMemo(
        () =>
            activities.map((activity) => {
                const itemSummary = activity.items.map((item) => item.itemName).filter(Boolean).join(" / ");
                return {
                    id: activity.id,
                    value: activity.name,
                    title: activity.name,
                    subtitle: itemSummary || undefined,
                    keywords: [activity.name, activity.message, activity.productName, ...activity.items.map((item) => item.itemName)].filter(
                        (value): value is string => Boolean(value),
                    ),
                };
            }),
        [activities],
    );
    useEffect(() => {
        if (!flash) return;
        const url = new URL(window.location.href);
        url.searchParams.delete("flash");
        url.searchParams.delete("ts");
        window.history.replaceState({}, "", url.toString());
    }, [flash]);

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
    const visibleCustomerRows = customerRows;
    const visibleCaseTickets = tickets;
    const visibleActivities = activities;
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
    const renderInventoryLogPanel = () => (
        <MerchantSectionCard title={`操作紀錄（${stockLogs.length}）`} description="時間、商品、數量、操作者">
            {stockLogs.length === 0 ? (
                <EmptyStateCard
                    icon={Search}
                    title="目前還沒有庫存異動紀錄"
                    description="完成第一次入庫或出庫後，這裡會顯示完整的庫存操作歷程。"
                    className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                />
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
        </MerchantSectionCard>
    );
    const renderInventoryCreateProductForm = (view: InventoryView) => (
        <form action={createProductAction} className="space-y-3">
            <input type="hidden" name="tab" value="inventory" />
            <input type="hidden" name="inventoryView" value={view} />
            <ItemFormFields
                bundle={dimensionBundle}
                namingSettings={itemNamingSettings}
                idPrefix={`inventory-create-${view}`}
                supplierListId="dashboard-supplier-options"
            />
            <div className="flex justify-end">
                <Button type="submit">新增品項</Button>
            </div>
        </form>
    );
    const renderInventoryEditableProductList = (view: InventoryView, title: string) => (
        <MerchantSectionCard title={`${title}（${products.length}）`}>
            {products.length === 0 ? (
                <EmptyStateCard
                    icon={Search}
                    title="目前沒有品項資料"
                    description="可以先新增品項，或切回庫存設置建立基本品項清單。"
                    className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                />
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
                                <form action={updateProductAction} className="space-y-3">
                                    <input type="hidden" name="tab" value="inventory" />
                                    <input type="hidden" name="inventoryView" value={view} />
                                    <input type="hidden" name="productId" value={product.id} />
                                    <ItemFormFields
                                        bundle={dimensionBundle}
                                        namingSettings={itemNamingSettings}
                                        idPrefix={`inventory-update-${view}-${product.id}`}
                                        supplierListId="dashboard-supplier-options"
                                        product={product}
                                    />
                                    <div className="flex justify-end">
                                        <Button type="submit">更新品項</Button>
                                    </div>
                                </form>
                                <form action={deleteProductAction} className="mt-2" onSubmit={guardDeleteWithPassword} data-delete-target={`品項 ${product.name}`}>
                                    <input type="hidden" name="tab" value="inventory" />
                                    <input type="hidden" name="inventoryView" value={view} />
                                    <input type="hidden" name="productId" value={product.id} />
                                    <Button type="submit" variant="ghost">刪除品項</Button>
                                </form>
                            </div>
                        </details>
                    ))}
                </div>
            )}
        </MerchantSectionCard>
    );

    return (
        <div className="space-y-4">
            <div className="space-y-4">
                {showFlashNotice ? (
                    <div
                        className={
                            flashTone(flash) === "error"
                                ? "flex items-start justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
                                : "flex items-start justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                        }
                        role="status"
                        aria-live="polite"
                    >
                        <span>{currentFlashText}</span>
                        <IconOnlyButton
                            label="關閉提示"
                            icon={<X className="h-4 w-4" aria-hidden="true" />}
                            onClick={() => setDismissedFlashKey(currentFlashKey)}
                        />
                    </div>
                ) : null}
                <datalist id="dashboard-supplier-options">
                    {supplierNames.map((supplier) => (
                        <option key={`supplier-option-${supplier}`} value={supplier} />
                    ))}
                </datalist>
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
                                    <EmptyStateCard
                                        icon={Search}
                                        title="目前沒有活動中資料"
                                        description="可以切到活動頁建立新活動，或稍後再查看最新 campaign 狀態。"
                                        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                                    />
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
                                    <EmptyStateCard
                                        icon={Search}
                                        title="目前沒有未開始活動"
                                        description="目前沒有排程中的活動預告；建立新活動後會在這裡顯示。"
                                        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                                    />
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
                                            localSuggestions={customerSearchSuggestions}
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
                                <form action="/dashboard" method="get" className="flex min-w-max items-center gap-2 text-sm">
                                    <input type="hidden" name="tab" value="customers" />
                                    <input type="hidden" name="customerQ" value={customerKeyword} />
                                    <input type="hidden" name="customerPageSize" value={customerPageSize} />
                                    <span className="whitespace-nowrap text-sm font-semibold">過濾欄位</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">最後更新</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">{formatTimeShort(snapshotTs, lang)}</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">時間排序</span>
                                    <Select
                                        name="customerOrder"
                                        defaultValue={customerOrder}
                                        className="w-[4ch]"
                                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                                    >
                                        <option value="updated_latest">更新 新→舊</option>
                                        <option value="updated_earliest">更新 舊→新</option>
                                        <option value="created_latest">建立 新→舊</option>
                                        <option value="created_earliest">建立 舊→新</option>
                                        <option value="name_asc">姓名 A→Z</option>
                                        <option value="name_desc">姓名 Z→A</option>
                                    </Select>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">狀態過濾</span>
                                    <Select
                                        name="customerCaseFilter"
                                        defaultValue={customerCaseFilter}
                                        className="w-[4ch]"
                                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                                    >
                                        <option value="all">全部</option>
                                        <option value="active_case">進行中</option>
                                        <option value="closed_case">已結案</option>
                                        <option value="no_case">無案件</option>
                                    </Select>
                                    <Link href="/dashboard?tab=customers" className="text-xs text-[rgb(var(--accent))] hover:underline">
                                        重設
                                    </Link>
                                </form>
                            </div>
                        </Card>

                        <Card className="rounded-xl p-3">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <SectionTitle title="客戶列表" hint={`本頁 ${visibleCustomerRows.length} 筆`} />
                                <form action="/dashboard" method="get" className="flex items-center gap-2">
                                    <input type="hidden" name="tab" value="customers" />
                                    {customerKeyword ? <input type="hidden" name="customerQ" value={customerKeyword} /> : null}
                                    <input type="hidden" name="customerCaseFilter" value={customerCaseFilter} />
                                    <input type="hidden" name="customerOrder" value={customerOrder} />
                                    <span className="text-xs text-[rgb(var(--muted))]">每頁</span>
                                    <Select name="customerPageSize" defaultValue={customerPageSize} className="h-9 w-[96px]">
                                        {LIST_DISPLAY_OPTIONS.map((size) => (
                                            <option key={`customer-page-size-${size}`} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </Select>
                                    <IconOnlyButton label="套用客戶每頁筆數" type="submit" icon={<Search className="h-4 w-4" aria-hidden="true" />} />
                                </form>
                            </div>
                            {visibleCustomerRows.length === 0 ? (
                                <EmptyStateCard
                                    icon={Search}
                                    title="沒有符合條件的客戶"
                                    description="可以調整搜尋或過濾條件，或先建立第一筆客戶資料。"
                                    className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                                />
                            ) : (
                                <div className="max-h-[720px] overflow-y-auto pr-1">
                                <div className="grid gap-3">
                                    {visibleCustomerRows.map((row) => {
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
                                <MerchantListPagination
                                    className="mt-3"
                                    summary={`共 ${visibleCustomerRows.length} 筆客戶結果，支援 server 分頁與條件查詢。`}
                                    previousAction={
                                        <form action="/dashboard" method="get">
                                            <input type="hidden" name="tab" value="customers" />
                                            {customerKeyword ? <input type="hidden" name="customerQ" value={customerKeyword} /> : null}
                                            <input type="hidden" name="customerCaseFilter" value={customerCaseFilter} />
                                            <input type="hidden" name="customerOrder" value={customerOrder} />
                                            <input type="hidden" name="customerPageSize" value={customerPageSize} />
                                            {customerPreviousCursor ? <input type="hidden" name="customerCursor" value={customerPreviousCursor} /> : null}
                                            {customerPreviousCursorStack ? <input type="hidden" name="customerCursorStack" value={customerPreviousCursorStack} /> : null}
                                            <IconOnlyButton label="上一頁客戶" type="submit" icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />} disabled={!customerCurrentCursor} />
                                        </form>
                                    }
                                    nextAction={
                                        <form action="/dashboard" method="get">
                                            <input type="hidden" name="tab" value="customers" />
                                            {customerKeyword ? <input type="hidden" name="customerQ" value={customerKeyword} /> : null}
                                            <input type="hidden" name="customerCaseFilter" value={customerCaseFilter} />
                                            <input type="hidden" name="customerOrder" value={customerOrder} />
                                            <input type="hidden" name="customerPageSize" value={customerPageSize} />
                                            {customerNextCursor ? <input type="hidden" name="customerCursor" value={customerNextCursor} /> : null}
                                            {customerNextCursorStack ? <input type="hidden" name="customerCursorStack" value={customerNextCursorStack} /> : null}
                                            <IconOnlyButton
                                                label="下一頁客戶"
                                                type="submit"
                                                icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                                                disabled={!customerHasNextPage || !customerNextCursor}
                                            />
                                        </form>
                                    }
                                />
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
                                            localSuggestions={caseSearchSuggestions}
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
                                    <div className="md:col-span-2">
                                        <TechnicianAutocomplete
                                            technicians={repairTechnicians}
                                            technicianIdFieldName="repairTechnicianId"
                                            technicianNameFieldName="repairTechnicianName"
                                            placeholder="搜尋維修人員（僅顯示已勾選維修人員）"
                                        />
                                    </div>
                                    <Input name="linkedUsedProductId" placeholder="關聯二手商品 ID（可選）" />
                                    <Input name="linkedUsedProductName" placeholder="關聯二手商品名稱（可選）" />
                                    <Input type="number" min={0} name="repairAmount" placeholder="維修金額" />
                                    <Input type="number" min={0} name="inspectionFee" placeholder="檢修費用" />
                                    <Select name="caseType" defaultValue="repair">
                                        <option value="repair">repair</option>
                                        <option value="refurbish">refurbish</option>
                                        <option value="warranty">warranty</option>
                                    </Select>
                                    <Select name="quoteStatus" defaultValue={defaultQuoteStatus} className="md:col-span-2">
                                        {normalizedQuoteStatusOptions.map((status) => (
                                            <option key={status} value={status}>
                                                {quoteStatusText(status)}
                                            </option>
                                        ))}
                                    </Select>
                                    <div className="md:col-span-2 flex justify-end">
                                        <IconOnlyButton label="建立案件" type="submit" variant="solid" icon={<Plus className="h-4 w-4" aria-hidden="true" />} />
                                    </div>
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
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <SectionTitle title="案件列表" hint={`本頁 ${visibleCaseTickets.length} 筆`} />
                                <form action="/dashboard" method="get" className="flex items-center gap-2">
                                    <input type="hidden" name="tab" value="cases" />
                                    {caseKeyword ? <input type="hidden" name="caseQ" value={caseKeyword} /> : null}
                                    <input type="hidden" name="caseStatus" value={caseStatus} />
                                    <input type="hidden" name="caseOrder" value={caseOrder} />
                                    <span className="text-xs text-[rgb(var(--muted))]">每頁</span>
                                    <Select name="casePageSize" defaultValue={casePageSize} className="h-9 w-[96px]">
                                        {LIST_DISPLAY_OPTIONS.map((size) => (
                                            <option key={`case-page-size-${size}`} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </Select>
                                    <IconOnlyButton label="套用案件每頁筆數" type="submit" icon={<Search className="h-4 w-4" aria-hidden="true" />} />
                                </form>
                            </div>
                            <div className="max-h-[720px] overflow-y-auto pr-1">
                                <CaseCardList
                                    tickets={visibleCaseTickets}
                                    lang={lang}
                                    caseStatusOptions={normalizedCaseStatusOptions}
                                    quoteStatusOptions={normalizedQuoteStatusOptions}
                                    repairTechnicians={repairTechnicians}
                                    createWarrantyCaseAction={createWarrantyCaseAction}
                                    updateCaseAction={updateCaseAction}
                                />
                                <MerchantListPagination
                                    className="pt-2"
                                    summary={`共 ${visibleCaseTickets.length} 筆案件結果，支援 server 分頁與狀態查詢。`}
                                    previousAction={
                                        <form action="/dashboard" method="get">
                                            <input type="hidden" name="tab" value="cases" />
                                            {caseKeyword ? <input type="hidden" name="caseQ" value={caseKeyword} /> : null}
                                            <input type="hidden" name="caseStatus" value={caseStatus} />
                                            <input type="hidden" name="caseOrder" value={caseOrder} />
                                            <input type="hidden" name="casePageSize" value={casePageSize} />
                                            {casePreviousCursor ? <input type="hidden" name="caseCursor" value={casePreviousCursor} /> : null}
                                            {casePreviousCursorStack ? <input type="hidden" name="caseCursorStack" value={casePreviousCursorStack} /> : null}
                                            <IconOnlyButton label="上一頁案件" type="submit" icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />} disabled={!caseCurrentCursor} />
                                        </form>
                                    }
                                    nextAction={
                                        <form action="/dashboard" method="get">
                                            <input type="hidden" name="tab" value="cases" />
                                            {caseKeyword ? <input type="hidden" name="caseQ" value={caseKeyword} /> : null}
                                            <input type="hidden" name="caseStatus" value={caseStatus} />
                                            <input type="hidden" name="caseOrder" value={caseOrder} />
                                            <input type="hidden" name="casePageSize" value={casePageSize} />
                                            {caseNextCursor ? <input type="hidden" name="caseCursor" value={caseNextCursor} /> : null}
                                            {caseNextCursorStack ? <input type="hidden" name="caseCursorStack" value={caseNextCursorStack} /> : null}
                                            <IconOnlyButton
                                                label="下一頁案件"
                                                type="submit"
                                                icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                                                disabled={!caseHasNextPage || !caseNextCursor}
                                            />
                                        </form>
                                    }
                                />
                            </div>
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
                                    <MerchantPredictiveSearchInput
                                        name="activityQ"
                                        defaultValue={activityKeyword}
                                        placeholder="查詢品名 或活動名稱"
                                        localSuggestions={activitySearchSuggestions}
                                        className="w-full"
                                    />
                                    <IconOnlyButton label="查詢活動" type="submit" variant="ghost" icon={<Search className="h-4 w-4" aria-hidden="true" />} />
                                    <IconOnlyButton
                                        label="清除活動搜尋"
                                        icon={<X className="h-4 w-4" aria-hidden="true" />}
                                        onClick={() => {
                                            window.location.href = "/dashboard?tab=activities";
                                        }}
                                    />
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
                                            <FieldLabel htmlFor="create-activity-gift-product-id" label="贈品品項 ID" />
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
                                                <option value="product">品項</option>
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
                                            <FieldLabel htmlFor="create-activity-product-id" label="品項 ID" />
                                            <Input id="create-activity-product-id" name="activityProductId" placeholder="品項 ID（品項型權益/留貨）" />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-product-name" label="品項名稱" />
                                            <Input id="create-activity-product-name" name="activityProductName" placeholder="品項名稱（品項型權益/留貨）" />
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
                                <form action="/dashboard" method="get" className="flex min-w-max items-center gap-2 text-sm">
                                    <input type="hidden" name="tab" value="activities" />
                                    <input type="hidden" name="activityQ" value={activityKeyword} />
                                    <input type="hidden" name="activityPageSize" value={activityPageSize} />
                                    <span className="whitespace-nowrap text-sm font-semibold">過濾欄位</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">最後更新</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">{formatTimeShort(snapshotTs, lang)}</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">時間排序</span>
                                    <Select
                                        name="activityOrder"
                                        defaultValue={activityOrder}
                                        className="w-[4ch]"
                                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                                    >
                                        <option value="updated_latest">更新 新→舊</option>
                                        <option value="updated_earliest">更新 舊→新</option>
                                        <option value="start_latest">開始 新→舊</option>
                                        <option value="start_earliest">開始 舊→新</option>
                                    </Select>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">狀態過濾</span>
                                    <Select
                                        name="activityStatusFilter"
                                        defaultValue={activityStatusFilter}
                                        className="w-[4ch]"
                                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                                    >
                                        <option value="all">全部</option>
                                        <option value="upcoming">未開始</option>
                                        <option value="active">活動中</option>
                                        <option value="ended">結束</option>
                                        <option value="cancelled">取消</option>
                                    </Select>
                                    <Link href="/dashboard?tab=activities" className="text-xs text-[rgb(var(--accent))] hover:underline">
                                        重設
                                    </Link>
                                </form>
                            </div>
                        </Card>

                        <Card className="rounded-xl p-3">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <SectionTitle title="活動列表" hint={`本頁 ${visibleActivities.length} 筆`} />
                                <form action="/dashboard" method="get" className="flex items-center gap-2">
                                    <input type="hidden" name="tab" value="activities" />
                                    {activityKeyword ? <input type="hidden" name="activityQ" value={activityKeyword} /> : null}
                                    <input type="hidden" name="activityOrder" value={activityOrder} />
                                    <input type="hidden" name="activityStatusFilter" value={activityStatusFilter} />
                                    <span className="text-xs text-[rgb(var(--muted))]">每頁</span>
                                    <Select name="activityPageSize" defaultValue={activityPageSize} className="h-9 w-[96px]">
                                        {LIST_DISPLAY_OPTIONS.map((size) => (
                                            <option key={`activity-page-size-${size}`} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </Select>
                                    <IconOnlyButton label="套用活動每頁筆數" type="submit" icon={<Search className="h-4 w-4" aria-hidden="true" />} />
                                </form>
                            </div>
                            <div className="mb-2 hidden grid-cols-7 gap-1 px-3 text-xs text-[rgb(var(--muted))] sm:grid">
                                <span>活動名稱</span>
                                <span>品名</span>
                                <span>總數</span>
                                <span>效果類型</span>
                                <span>開始日期</span>
                                <span>結束日期</span>
                                <span>狀態</span>
                            </div>
                            <div className="max-h-[720px] overflow-y-auto pr-1">
                            {visibleActivities.length === 0 ? (
                                <EmptyStateCard
                                    icon={Search}
                                    title="沒有符合條件的活動"
                                    description="可以調整搜尋或狀態條件，或先建立第一檔活動資料。"
                                    className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                                />
                            ) : (
                            <div className="grid gap-2">
                                {visibleActivities.map((activity) => (
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
                                                            <FieldLabel htmlFor={`update-activity-gift-product-id-${activity.id}`} label="贈品品項 ID" />
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
                                                                <option value="product">品項</option>
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
                                                            <FieldLabel htmlFor={`update-activity-product-id-${activity.id}`} label="品項 ID" />
                                                            <Input id={`update-activity-product-id-${activity.id}`} name="activityProductId" defaultValue={activity.productId ?? ""} />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-product-name-${activity.id}`} label="品項名稱" />
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
                                                    <form action={deleteActivityAction} onSubmit={guardDeleteWithPassword} data-delete-target={`活動 ${activity.name}`}>
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
                            )}
                            <MerchantListPagination
                                className="pt-2"
                                summary={`共 ${visibleActivities.length} 筆活動結果，支援 server 分頁與狀態查詢。`}
                                previousAction={
                                    <form action="/dashboard" method="get">
                                        <input type="hidden" name="tab" value="activities" />
                                        {activityKeyword ? <input type="hidden" name="activityQ" value={activityKeyword} /> : null}
                                        <input type="hidden" name="activityOrder" value={activityOrder} />
                                        <input type="hidden" name="activityStatusFilter" value={activityStatusFilter} />
                                        <input type="hidden" name="activityPageSize" value={activityPageSize} />
                                        {activityPreviousCursor ? <input type="hidden" name="activityCursor" value={activityPreviousCursor} /> : null}
                                        {activityPreviousCursorStack ? <input type="hidden" name="activityCursorStack" value={activityPreviousCursorStack} /> : null}
                                        <IconOnlyButton label="上一頁活動" type="submit" icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />} disabled={!activityCurrentCursor} />
                                    </form>
                                }
                                nextAction={
                                    <form action="/dashboard" method="get">
                                        <input type="hidden" name="tab" value="activities" />
                                        {activityKeyword ? <input type="hidden" name="activityQ" value={activityKeyword} /> : null}
                                        <input type="hidden" name="activityOrder" value={activityOrder} />
                                        <input type="hidden" name="activityStatusFilter" value={activityStatusFilter} />
                                        <input type="hidden" name="activityPageSize" value={activityPageSize} />
                                        {activityNextCursor ? <input type="hidden" name="activityCursor" value={activityNextCursor} /> : null}
                                        {activityNextCursorStack ? <input type="hidden" name="activityCursorStack" value={activityNextCursorStack} /> : null}
                                        <IconOnlyButton
                                            label="下一頁活動"
                                            type="submit"
                                            icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                                            disabled={!activityHasNextPage || !activityNextCursor}
                                        />
                                    </form>
                                }
                            />
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
                                              : "目前檢視：品項管理"
                                }
                            />
                            <div className="mb-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                                {[
                                    { id: "stock", title: "庫存", hint: "庫存摘要與列表" },
                                    { id: "settings", title: "庫存設置", hint: "庫存參數與資料" },
                                    { id: "stock-in", title: "入庫", hint: "增加商品數量" },
                                    { id: "stock-out", title: "出庫", hint: "扣減商品數量" },
                                    { id: "product-management", title: "品項管理", hint: "完整 CRUD" },
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
                        <MerchantSectionCard title="搜尋與篩選" description="功能切換與搜尋區分離，避免操作混淆。">
                            <SearchToolbar
                                searchSlot={
                                    <form action="/dashboard" method="get" className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <input type="hidden" name="tab" value="inventory" />
                                        <input type="hidden" name="inventoryView" value={inventoryView} />
                                        <MerchantPredictiveSearchInput
                                            name="productQ"
                                            defaultValue={productKeyword}
                                            placeholder="搜尋品名、SKU、分類、品牌、型號"
                                            targets={["inventory"]}
                                            className="w-full"
                                        />
                                        <Button type="submit">查詢</Button>
                                        <Link
                                            href={`/dashboard?tab=inventory&inventoryView=${encodeURIComponent(inventoryView)}`}
                                            className="text-sm text-[rgb(var(--accent))] hover:underline"
                                        >
                                            清除
                                        </Link>
                                    </form>
                                }
                            />
                        </MerchantSectionCard>

                        {inventoryView === "stock" ? (
                            <MerchantListShell
                                list={
                                    <>
                                        <MerchantSectionCard title="庫存摘要" description="只統計實體庫存與真實 reserved，不含客戶權益。">
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
                                        </MerchantSectionCard>

                                        <MerchantSectionCard title={`庫存列表（${products.length}）`}>
                                            {products.length === 0 ? (
                                                <EmptyStateCard
                                                    icon={Search}
                                                    title="目前沒有品項"
                                                    description="可以先到庫存設置或品項管理建立第一筆品項資料。"
                                                    className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                                                />
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
                                        </MerchantSectionCard>
                                    </>
                                }
                                detailPanel={renderInventoryLogPanel()}
                            />
                        ) : null}

                        {inventoryView === "settings" ? (
                            <MerchantListShell
                                toolbar={
                                    <MerchantSectionCard title="庫存設置" description="新增品項與初始庫存">
                                        {renderInventoryCreateProductForm("settings")}
                                    </MerchantSectionCard>
                                }
                                list={renderInventoryEditableProductList("settings", "品項列表")}
                                detailPanel={renderInventoryLogPanel()}
                            />
                        ) : null}

                        {inventoryView === "product-management" ? (
                            <MerchantListShell
                                toolbar={
                                    <MerchantSectionCard title="搜尋 / 新增" description="品項管理 CRUD" bodyClassName="space-y-3">
                                        <SearchToolbar
                                            searchSlot={
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
                                            }
                                            primaryActionSlot={
                                                <Button
                                                    type="button"
                                                    variant={showCreateProductForm ? "solid" : "ghost"}
                                                    aria-label="新增"
                                                    className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center"
                                                    onClick={() => setShowCreateProductForm((prev) => !prev)}
                                                >
                                                    <Plus className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                                </Button>
                                            }
                                        />

                                        {showCreateProductForm ? (
                                            renderInventoryCreateProductForm("product-management")
                                        ) : null}
                                    </MerchantSectionCard>
                                }
                                list={renderInventoryEditableProductList("product-management", "品項列表")}
                                detailPanel={renderInventoryLogPanel()}
                            />
                        ) : null}

                        {inventoryView === "stock-in" ? (
                            <MerchantListShell
                                list={
                                    <MerchantSectionCard title={`入庫（${products.length}）`} description="每次操作只更新一項商品庫存">
                                        {products.length === 0 ? (
                                            <EmptyStateCard
                                                icon={Search}
                                                title="目前沒有品項可入庫"
                                                description="先建立品項資料後，這裡才會出現可操作的入庫清單。"
                                                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                                            />
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
                                    </MerchantSectionCard>
                                }
                                detailPanel={renderInventoryLogPanel()}
                            />
                        ) : null}

                        {inventoryView === "stock-out" ? (
                            <MerchantListShell
                                list={
                                    <MerchantSectionCard title={`出庫（${products.length}）`} description="出庫數量不可超過 available 庫存">
                                        {products.length === 0 ? (
                                            <EmptyStateCard
                                                icon={Search}
                                                title="目前沒有品項可出庫"
                                                description="先建立或入庫品項後，這裡才會出現可操作的出庫清單。"
                                                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                                            />
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
                                    </MerchantSectionCard>
                                }
                                detailPanel={renderInventoryLogPanel()}
                            />
                        ) : null}
                    </>
                ) : null}

                {tab === "marketing" ? (
                    <MarketingSettingsWorkspace
                        lang={lang}
                        dimensionBundle={dimensionBundle}
                        itemNamingSettings={itemNamingSettings}
                        supplierItems={supplierItems}
                        brands={brands}
                        usedProductTypeSettings={usedProductTypeSettings}
                        updateItemNamingSettingsAction={updateItemNamingSettingsAction}
                        createCategoryAction={createCategoryAction}
                        updateCategoryAction={updateCategoryAction}
                        deleteCategoryAction={deleteCategoryAction}
                        createSupplierAction={createSupplierAction}
                        updateSupplierAction={updateSupplierAction}
                        deleteSupplierAction={deleteSupplierAction}
                        createBrandAction={createBrandAction}
                        updateBrandAction={updateBrandAction}
                        deleteBrandAction={deleteBrandAction}
                        renameBrandTypeAction={renameBrandTypeAction}
                        deleteBrandTypeAction={deleteBrandTypeAction}
                        createModelAction={createModelAction}
                        updateModelAction={updateModelAction}
                        deleteModelAction={deleteModelAction}
                        updateUsedProductTypeSettingAction={updateUsedProductTypeSettingAction}
                        onDeleteGuard={guardDeleteWithPassword}
                    />
                ) : null}
            </div>
        </div>
    );
}
