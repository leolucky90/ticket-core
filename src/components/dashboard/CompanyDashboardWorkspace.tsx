"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ItemFormFields } from "@/components/dashboard/ItemFormFields";
import { MarketingSettingsWorkspace } from "@/components/dashboard/marketing-settings-workspace";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconOnlyButton } from "@/components/ui/icon-only-button";
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
import type { UiLanguage } from "@/lib/i18n/ui-text";
import { getUiText, uiLocale } from "@/lib/i18n/ui-text";
import { buildFinancialPeriodSummaryFromSales } from "@/lib/reporting/financial-summary";

export type DashboardTab = "dashboard" | "customers" | "cases" | "activities" | "inventory" | "marketing";
export type InventoryView = "stock" | "settings" | "stock-in" | "stock-out" | "product-management";
type DashboardCustomerCaseUi = ReturnType<typeof getUiText>["dashboardCustomerCaseWorkspace"];
type DeleteGuardUi = DashboardCustomerCaseUi["common"];

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
    lang: UiLanguage;
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

function formatMoney(value: number, lang: UiLanguage) {
    return new Intl.NumberFormat(uiLocale(lang)).format(value);
}

function formatTime(value: number, lang: UiLanguage) {
    if (!Number.isFinite(value) || value <= 0) return "-";
    return new Intl.DateTimeFormat(uiLocale(lang), {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(value);
}

function formatTimeShort(value: number, lang: UiLanguage) {
    if (!Number.isFinite(value) || value <= 0) return "-";
    return new Intl.DateTimeFormat(uiLocale(lang), {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(value);
}

function lookupLabel<T extends Record<string, string>>(table: T, key: string): string {
    return key in table ? table[key as keyof T] : key;
}

function statusText(status: string, ui: DashboardCustomerCaseUi): string {
    return lookupLabel(ui.ticketStatus, status);
}

function quoteStatusText(status: QuoteStatus, ui: DashboardCustomerCaseUi): string {
    return lookupLabel(ui.quoteStatus, status);
}

function caseTypeText(caseType: string | undefined, ui: DashboardCustomerCaseUi): string {
    if (!caseType) return ui.caseType.repair;
    return lookupLabel(ui.caseType, caseType);
}

function activityStatusText(status: Activity["status"], ui: DashboardCustomerCaseUi): string {
    return lookupLabel(ui.activityStatus, status);
}

function activityEffectText(effectType: Activity["effectType"], ui: DashboardCustomerCaseUi): string {
    return lookupLabel(ui.activityEffect, effectType);
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

function TrendChart({
    stats,
    range,
    ui,
    lang,
}: {
    stats: CompanyDashboardStats;
    range: "day" | "month";
    ui: DashboardCustomerCaseUi["dashboard"];
    lang: UiLanguage;
}) {
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
            <div className="mb-2 text-xs text-[rgb(var(--muted))]">
                {ui.trendTitle}（{range === "day" ? ui.trendRangeDay : ui.trendRangeMonth}）
            </div>
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
                        <div>{ui.trendRevenue} {formatMoney(point.revenue, lang)}</div>
                        <div>{ui.trendCount} {point.count}</div>
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

function guardDeleteWithPassword(event: FormEvent<HTMLFormElement>, ui: DeleteGuardUi) {
    const form = event.currentTarget;
    const targetText = (form.dataset.deleteTarget ?? ui.deleteTargetDefault).trim();
    const confirmed = window.confirm(ui.deleteConfirm.replace("{target}", targetText));
    if (!confirmed) {
        event.preventDefault();
        return;
    }
    const password = window.prompt(ui.deletePasswordPrompt);
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
    ui,
    caseStatusOptions,
    quoteStatusOptions,
    repairTechnicians,
    createWarrantyCaseAction,
    updateCaseAction,
}: {
    tickets: Ticket[];
    lang: UiLanguage;
    ui: DashboardCustomerCaseUi;
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
                title={ui.cases.emptyTitle}
                description={ui.cases.emptyDescription}
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
                            <div className="font-semibold">{ui.customers.name}：{ticket.customer.name}</div>
                            <div className="text-[rgb(var(--muted))]">{ui.customers.phone}：{ticket.customer.phone || "-"}</div>
                            <div className="text-[rgb(var(--muted))]">{ui.cases.deviceBrand}：{deviceText}</div>
                            <div className="text-[rgb(var(--muted))]">{ui.dashboard.status}：{statusText(ticket.status, ui)}</div>
                            <div className="text-[rgb(var(--muted))] text-right">{ui.common.tapToExpand}</div>
                        </summary>
                        <div className="border-t border-[rgb(var(--border))] p-3">
                            {!isEditing ? (
                                <>
                                    <div className="grid gap-1 text-sm">
                                        <div>{ui.cases.caseId}：{ticket.id}</div>
                                        <div>{ui.cases.caseType}：{caseTypeText(ticket.caseType, ui)}</div>
                                        <div>{ui.cases.deviceBrand}：{ticket.device.name || "-"}</div>
                                        <div>{ui.cases.deviceModel}：{ticket.device.model || "-"}</div>
                                        <div>{ui.cases.repairReason}：{ticket.repairReason || "-"}</div>
                                        <div>{ui.cases.repairSuggestion}：{ticket.repairSuggestion || "-"}</div>
                                        <div>{ui.cases.note}：{ticket.note || "-"}</div>
                                        <div>{ui.cases.technician}：{ticket.repairTechnicianName || "-"}</div>
                                        <div>{ui.cases.linkedUsedProduct}：{ticket.linkedUsedProductName || ticket.linkedUsedProductId || "-"}</div>
                                        <div>{ui.cases.sourceCase}：{ticket.parentCaseTitle || ticket.parentCaseId || "-"}</div>
                                        <div>{ui.cases.historySummary}：{ticket.historySummary || "-"}</div>
                                        <div>{ui.cases.quoteStatus}：{quoteStatusText(ticket.quoteStatus, ui)}</div>
                                        <div>{ui.cases.repairAmount}：{formatMoney(ticket.repairAmount, lang)}</div>
                                        <div>{ui.cases.inspectionFee}：{formatMoney(ticket.inspectionFee, lang)}</div>
                                        <div>{ui.cases.pendingFee}：{formatMoney(ticket.pendingFee, lang)}</div>
                                        <div>{ui.cases.createdAt}：{formatTime(ticket.createdAt, lang)}</div>
                                        <div>{ui.cases.updatedAt}：{formatTime(ticket.updatedAt, lang)}</div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Link
                                            href={`/dashboard?tab=cases&caseQ=${encodeURIComponent(ticket.id)}`}
                                            aria-label={ui.common.viewMessages}
                                            className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--border))] hover:border-[rgb(var(--accent))]"
                                        >
                                            <Search className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
                                            <span className="sr-only">{ui.common.viewMessages}</span>
                                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                {ui.common.viewMessages}
                                            </span>
                                        </Link>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            aria-label={ui.common.updateCase}
                                            className="group relative h-10 w-10 !p-0 flex items-center justify-center"
                                            onClick={() => setEditingCaseId(ticket.id)}
                                        >
                                            <Pencil className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                            <span className="sr-only">{ui.common.updateCase}</span>
                                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                {ui.common.updateCase}
                                            </span>
                                        </Button>
                                        <form action={createWarrantyCaseAction}>
                                            <input type="hidden" name="sourceCaseId" value={ticket.id} />
                                            <Button type="submit" variant="ghost" aria-label={ui.common.createWarrantyCase} className="group relative h-10 w-10 !p-0 flex items-center justify-center">
                                                <ShieldCheck className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
                                                <span className="sr-only">{ui.common.createWarrantyCase}</span>
                                                <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                    {ui.common.createWarranty}
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
                                    <Input name="deviceName" defaultValue={ticket.device.name} placeholder={ui.common.deviceBrandPlaceholder} required />
                                    <Input name="deviceModel" defaultValue={ticket.device.model} placeholder={ui.common.deviceModelPlaceholder} required />
                                    <Textarea name="repairReason" rows={2} defaultValue={ticket.repairReason} placeholder={ui.common.repairReasonPlaceholder} className="md:col-span-2" />
                                    <Textarea name="repairSuggestion" rows={2} defaultValue={ticket.repairSuggestion} placeholder={ui.common.repairSuggestionPlaceholder} className="md:col-span-2" />
                                    <Textarea name="note" rows={2} defaultValue={ticket.note} placeholder={ui.common.notePlaceholder} className="md:col-span-2" />
                                    <div className="md:col-span-2">
                                        <TechnicianAutocomplete
                                            technicians={repairTechnicians}
                                            defaultTechnicianId={ticket.repairTechnicianId}
                                            defaultTechnicianName={ticket.repairTechnicianName}
                                            technicianIdFieldName="repairTechnicianId"
                                            technicianNameFieldName="repairTechnicianName"
                                            placeholder={ui.common.technicianSearchPlaceholder}
                                        />
                                    </div>
                                    <Input name="linkedUsedProductId" defaultValue={ticket.linkedUsedProductId} placeholder={ui.common.linkedUsedProductIdPlaceholder} />
                                    <Input name="linkedUsedProductName" defaultValue={ticket.linkedUsedProductName} placeholder={ui.common.linkedUsedProductNamePlaceholder} />
                                    <Input name="parentCaseId" defaultValue={ticket.parentCaseId} placeholder={ui.common.parentCaseIdPlaceholder} />
                                    <Input name="parentCaseTitle" defaultValue={ticket.parentCaseTitle} placeholder={ui.common.parentCaseTitlePlaceholder} />
                                    <Textarea name="historySummary" rows={3} defaultValue={ticket.historySummary} placeholder={ui.common.historySummaryPlaceholder} className="md:col-span-2" />
                                    <Input type="number" min={0} name="repairAmount" defaultValue={ticket.repairAmount} placeholder={ui.common.repairAmountPlaceholder} />
                                    <Input type="number" min={0} name="inspectionFee" defaultValue={ticket.inspectionFee} placeholder={ui.common.inspectionFeePlaceholder} />
                                    <Select name="status" defaultValue={ticket.status}>
                                        {getCaseStatusTransitionOptions(ticket.status, caseStatusOptions).map((status) => (
                                            <option key={status} value={status}>
                                                {statusText(status, ui)}
                                            </option>
                                        ))}
                                    </Select>
                                    <Select name="quoteStatus" defaultValue={ticket.quoteStatus}>
                                        {quoteStatusOptions.map((status) => (
                                            <option key={status} value={status}>
                                                {quoteStatusText(status, ui)}
                                            </option>
                                        ))}
                                    </Select>
                                    <Select name="caseType" defaultValue={ticket.caseType || "repair"}>
                                        <option value="repair">{ui.caseType.repair}</option>
                                        <option value="refurbish">{ui.caseType.refurbish}</option>
                                        <option value="warranty">{ui.caseType.warranty}</option>
                                    </Select>
                                    <div className="md:col-span-2 flex flex-wrap gap-2">
                                        <Button type="submit" variant="ghost" aria-label={ui.common.save} className="group relative h-10 w-10 !p-0 flex items-center justify-center">
                                            <Save className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                            <span className="sr-only">{ui.common.save}</span>
                                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                {ui.common.save}
                                            </span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            aria-label={ui.common.cancel}
                                            className="group relative h-10 w-10 !p-0 flex items-center justify-center"
                                            onClick={() => setEditingCaseId(null)}
                                        >
                                            <X className="h-4 w-4" aria-hidden="true" />
                                            <span className="sr-only">{ui.common.cancel}</span>
                                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                {ui.common.cancel}
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
    sales,
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
    const inv = getUiText(lang).inventoryWorkspace;
    const nav = getUiText(lang).inventoryNav;
    const flashLabels = getUiText(lang).dashboardFlash;
    const customerCaseUi = getUiText(lang).dashboardCustomerCaseWorkspace;
    const dashboardUi = customerCaseUi.dashboard;
    const customerUi = customerCaseUi.customers;
    const caseUi = customerCaseUi.cases;
    const activityUi = customerCaseUi.activities;
    const commonUi = customerCaseUi.common;
    const handleDeleteWithPassword = (event: FormEvent<HTMLFormElement>) => guardDeleteWithPassword(event, commonUi);
    const [range, setRange] = useState<"day" | "month">("day");
    const [showCreateCustomerForm, setShowCreateCustomerForm] = useState(false);
    const [showCreateCaseForm, setShowCreateCaseForm] = useState(false);
    const [showCreateActivityForm, setShowCreateActivityForm] = useState(false);
    const [showCreateProductForm, setShowCreateProductForm] = useState(false);
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
    const currentFlashText = flashLabels[flash as keyof typeof flashLabels] ?? "";
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

    const activeActivities = useMemo(() => activities.filter((item) => item.status === "active"), [activities]);
    const upcomingActivities = useMemo(() => activities.filter((item) => item.status === "upcoming"), [activities]);
    const visibleCustomerRows = customerRows;
    const visibleCaseTickets = tickets;
    const visibleActivities = activities;
    const financialSummary = useMemo(() => buildFinancialPeriodSummaryFromSales(sales, products), [sales, products]);

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
    const dashboardStats: MerchantStatItem[] = (() => {
        const finance = getUiText(lang).dashboardFinance;
        return [
            { id: "today-count", label: dashboardUi.statsTodayCount, value: stats.todaySubscriptionCount },
            { id: "today-revenue", label: dashboardUi.statsTodayRevenue, value: formatMoney(stats.todayRevenue, lang) },
            { id: "month-count", label: dashboardUi.statsMonthCount, value: stats.monthSubscriptionCount },
            { id: "month-revenue", label: dashboardUi.statsMonthRevenue, value: formatMoney(stats.monthRevenue, lang) },
            { id: "today-cogs", label: finance.todayCogs, value: formatMoney(financialSummary.todayCogsEstimate, lang) },
            { id: "month-cogs", label: finance.monthCogs, value: formatMoney(financialSummary.monthCogsEstimate, lang) },
            { id: "today-gross", label: finance.todayGross, value: formatMoney(financialSummary.todayGrossProfit, lang) },
            { id: "month-gross", label: finance.monthGross, value: formatMoney(financialSummary.monthGrossProfit, lang) },
            { id: "customer-count", label: dashboardUi.statsCustomerCount, value: customers.length },
            { id: "open-case-count", label: dashboardUi.statsOpenCaseCount, value: tickets.filter((ticket) => ticket.status !== "closed").length },
            { id: "active-activities", label: dashboardUi.statsActiveActivities, value: activeActivities.length },
            {
                id: "average-order-value",
                label: dashboardUi.statsAverageOrderValue,
                value: formatMoney(
                    stats.monthSubscriptionCount > 0 ? Math.round(stats.monthRevenue / stats.monthSubscriptionCount) : 0,
                    lang,
                ),
            },
        ];
    })();
    const renderInventoryLogPanel = () => (
        <MerchantSectionCard title={inv.logPanelTitle.replace("{count}", String(stockLogs.length))} description={inv.logPanelDescription}>
            {stockLogs.length === 0 ? (
                <EmptyStateCard
                    icon={Search}
                    title={inv.logEmptyTitle}
                    description={inv.logEmptyDescription}
                    className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-[rgb(var(--muted))]">
                                <th className="px-2 py-2">{inv.logThTime}</th>
                                <th className="px-2 py-2">{inv.logThProduct}</th>
                                <th className="px-2 py-2">{inv.logThAction}</th>
                                <th className="px-2 py-2">{inv.logThQty}</th>
                                <th className="px-2 py-2">{inv.logThBefore}</th>
                                <th className="px-2 py-2">{inv.logThAfter}</th>
                                <th className="px-2 py-2">{inv.logThOperator}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stockLogs.map((log) => (
                                <tr key={log.id} className="border-t border-[rgb(var(--border))]">
                                    <td className="px-2 py-2">{formatTime(log.createdAt, lang)}</td>
                                    <td className="px-2 py-2">{log.productName}</td>
                                    <td className="px-2 py-2">{log.action === "stock_out" ? inv.logActionStockOut : inv.logActionStockIn}</td>
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
                <Button type="submit">{inv.createProduct}</Button>
            </div>
        </form>
    );
    const renderInventoryEditableProductList = (view: InventoryView) => (
        <MerchantSectionCard title={`${inv.productListHeading}（${products.length}）`}>
            {products.length === 0 ? (
                <EmptyStateCard
                    icon={Search}
                    title={inv.editableListEmptyTitle}
                    description={inv.editableListEmptyDescription}
                    className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                />
            ) : (
                <div className="grid gap-2">
                    {products.map((product) => (
                        <details key={product.id} className="rounded-lg border border-[rgb(var(--border))]">
                            <summary className="grid cursor-pointer list-none gap-1 px-3 py-2 text-sm sm:grid-cols-6 [&::-webkit-details-marker]:hidden">
                                <span>{product.name}</span>
                                <span>
                                    {inv.summaryOnHandReserved
                                        .replace("{onHand}", String(product.onHandQty ?? product.stock))
                                        .replace("{reserved}", String(product.reservedQty ?? 0))}
                                </span>
                                <span>{inv.summaryPrice.replace("{price}", formatMoney(product.price, lang))}</span>
                                <span>{inv.summaryCost.replace("{cost}", formatMoney(product.cost, lang))}</span>
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
                                        <Button type="submit">{inv.updateProduct}</Button>
                                    </div>
                                </form>
                                <form action={deleteProductAction} className="mt-2" onSubmit={handleDeleteWithPassword} data-delete-target={inv.deleteProductTarget.replace("{name}", product.name)}>
                                    <input type="hidden" name="tab" value="inventory" />
                                    <input type="hidden" name="inventoryView" value={view} />
                                    <input type="hidden" name="productId" value={product.id} />
                                    <Button type="submit" variant="ghost">
                                        {inv.deleteProduct}
                                    </Button>
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
                            label={dashboardUi.closeNotice}
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
                            <SectionTitle title={dashboardUi.title} hint={dashboardUi.hint} />
                            <MerchantStatGrid items={dashboardStats} />
                            <p className="mt-2 text-xs text-[rgb(var(--muted))]">{getUiText(lang).dashboardFinance.hint}</p>
                            <div className="mt-4 flex items-center gap-2">
                                <Button type="button" variant={range === "day" ? "solid" : "ghost"} onClick={() => setRange("day")}>
                                    {dashboardUi.day}
                                </Button>
                                <Button type="button" variant={range === "month" ? "solid" : "ghost"} onClick={() => setRange("month")}>
                                    {dashboardUi.month}
                                </Button>
                            </div>
                            <div className="mt-4">
                                <TrendChart stats={stats} range={range} ui={dashboardUi} lang={lang} />
                            </div>
                        </Card>

                        <Card>
                            <SectionTitle title={dashboardUi.activeTitle} hint={dashboardUi.activeHint} />
                            <div className="grid gap-2">
                                {activeActivities.length === 0 ? (
                                    <EmptyStateCard
                                        icon={Search}
                                        title={dashboardUi.activeEmptyTitle}
                                        description={dashboardUi.activeEmptyDescription}
                                        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                                    />
                                ) : (
                                    activeActivities.map((activity) => (
                                        <details key={activity.id} className="rounded-lg border border-[rgb(var(--border))]">
                                            <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
                                                {activity.name}
                                            </summary>
                                            <div className="border-t border-[rgb(var(--border))] p-3 text-sm">
                                                <div>{dashboardUi.status}：{activityStatusText(activity.status, customerCaseUi)}</div>
                                                <div>{dashboardUi.startAt}：{formatTime(activity.startAt, lang)}</div>
                                                <div>{dashboardUi.endAt}：{formatTime(activity.endAt, lang)}</div>
                                                <div className="mt-1 whitespace-pre-wrap text-[rgb(var(--muted))]">{activity.message || "-"}</div>
                                            </div>
                                        </details>
                                    ))
                                )}
                            </div>
                        </Card>

                        <Card>
                            <SectionTitle title={dashboardUi.upcomingTitle} hint={dashboardUi.upcomingHint} />
                            <div className="grid gap-2">
                                {upcomingActivities.length === 0 ? (
                                    <EmptyStateCard
                                        icon={Search}
                                        title={dashboardUi.upcomingEmptyTitle}
                                        description={dashboardUi.upcomingEmptyDescription}
                                        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                                    />
                                ) : (
                                    upcomingActivities.map((activity) => (
                                        <details key={activity.id} className="rounded-lg border border-[rgb(var(--border))]">
                                            <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
                                                {activity.name}
                                            </summary>
                                            <div className="border-t border-[rgb(var(--border))] p-3 text-sm">
                                                <div>{dashboardUi.status}：{activityStatusText(activity.status, customerCaseUi)}</div>
                                                <div>{dashboardUi.startAt}：{formatTime(activity.startAt, lang)}</div>
                                                <div>{dashboardUi.endAt}：{formatTime(activity.endAt, lang)}</div>
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
                            <SectionTitle title={customerUi.sectionTitle} hint={customerUi.sectionHint} />
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                                <form action="/dashboard" method="get" className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                                    <input type="hidden" name="tab" value="customers" />
                                    <div className="relative w-full">
                                        <MerchantPredictiveSearchInput
                                            name="customerQ"
                                            defaultValue={customerKeyword}
                                            placeholder={customerUi.searchPlaceholder}
                                            localSuggestions={customerSearchSuggestions}
                                            inputClassName="pr-10"
                                        />
                                        <Link
                                            href="/dashboard?tab=customers"
                                            aria-label={commonUi.clear}
                                            title={commonUi.clear}
                                            className="group absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel2))] hover:text-[rgb(var(--text))]"
                                        >
                                            <X className="h-4 w-4" aria-hidden="true" />
                                            <span className="sr-only">{commonUi.clear}</span>
                                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                {commonUi.clear}
                                            </span>
                                        </Link>
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="ghost"
                                        aria-label={commonUi.search}
                                        title={commonUi.search}
                                        className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center"
                                    >
                                        <Search className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                        <span className="sr-only">{commonUi.search}</span>
                                        <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                            {commonUi.search}
                                        </span>
                                    </Button>
                                </form>
                                <Button
                                    type="button"
                                    variant={showCreateCustomerForm ? "solid" : "ghost"}
                                    aria-label={commonUi.add}
                                    title={commonUi.add}
                                    className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center"
                                    onClick={() => {
                                        setShowCreateCustomerForm((prev) => !prev);
                                        setEditingCustomerId(null);
                                    }}
                                >
                                    <Plus className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                    <span className="sr-only">{commonUi.add}</span>
                                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                        {commonUi.add}
                                    </span>
                                </Button>
                            </div>
                            {showCreateCustomerForm ? (
                                <form action={createCustomerAction} className="mt-3 grid gap-2 md:grid-cols-2">
                                    <input type="hidden" name="tab" value="customers" />
                                    <Input name="customerName" placeholder={commonUi.customerNamePlaceholder} required />
                                    <Input name="customerPhone" placeholder={commonUi.customerPhonePlaceholder} required />
                                    <Input name="customerEmail" type="email" placeholder={commonUi.customerEmailPlaceholder} />
                                    <Input name="customerAddress" placeholder={commonUi.customerAddressPlaceholder} />
                                    <Button type="submit" className="md:col-span-2">{customerUi.createButton}</Button>
                                </form>
                            ) : null}
                        </Card>

                        <Card className="rounded-xl p-3">
                            <div className="overflow-x-auto">
                                <form action="/dashboard" method="get" className="flex min-w-max items-center gap-2 text-sm">
                                    <input type="hidden" name="tab" value="customers" />
                                    <input type="hidden" name="customerQ" value={customerKeyword} />
                                    <input type="hidden" name="customerPageSize" value={customerPageSize} />
                                    <span className="whitespace-nowrap text-sm font-semibold">{commonUi.filterFields}</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">{commonUi.lastUpdated}</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">{formatTimeShort(snapshotTs, lang)}</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">{commonUi.timeOrder}</span>
                                    <Select
                                        name="customerOrder"
                                        defaultValue={customerOrder}
                                        className="w-[4ch]"
                                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                                    >
                                        <option value="updated_latest">{customerUi.orderUpdatedLatest}</option>
                                        <option value="updated_earliest">{customerUi.orderUpdatedEarliest}</option>
                                        <option value="created_latest">{customerUi.orderCreatedLatest}</option>
                                        <option value="created_earliest">{customerUi.orderCreatedEarliest}</option>
                                        <option value="name_asc">{customerUi.orderNameAsc}</option>
                                        <option value="name_desc">{customerUi.orderNameDesc}</option>
                                    </Select>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">{commonUi.statusFilter}</span>
                                    <Select
                                        name="customerCaseFilter"
                                        defaultValue={customerCaseFilter}
                                        className="w-[4ch]"
                                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                                    >
                                        <option value="all">{customerUi.filterAll}</option>
                                        <option value="active_case">{customerUi.filterActiveCase}</option>
                                        <option value="closed_case">{customerUi.filterClosedCase}</option>
                                        <option value="no_case">{customerUi.filterNoCase}</option>
                                    </Select>
                                    <Link href="/dashboard?tab=customers" className="text-xs text-[rgb(var(--accent))] hover:underline">
                                        {commonUi.reset}
                                    </Link>
                                </form>
                            </div>
                        </Card>

                        <Card className="rounded-xl p-3">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <SectionTitle title={customerUi.listTitle} hint={customerUi.listHint.replace("{count}", String(visibleCustomerRows.length))} />
                                <form action="/dashboard" method="get" className="flex items-center gap-2">
                                    <input type="hidden" name="tab" value="customers" />
                                    {customerKeyword ? <input type="hidden" name="customerQ" value={customerKeyword} /> : null}
                                    <input type="hidden" name="customerCaseFilter" value={customerCaseFilter} />
                                    <input type="hidden" name="customerOrder" value={customerOrder} />
                                    <span className="text-xs text-[rgb(var(--muted))]">{commonUi.perPage}</span>
                                    <Select name="customerPageSize" defaultValue={customerPageSize} className="h-9 w-[96px]">
                                        {LIST_DISPLAY_OPTIONS.map((size) => (
                                            <option key={`customer-page-size-${size}`} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </Select>
                                    <IconOnlyButton label={customerUi.applyPageSize} type="submit" icon={<Search className="h-4 w-4" aria-hidden="true" />} />
                                </form>
                            </div>
                            {visibleCustomerRows.length === 0 ? (
                                <EmptyStateCard
                                    icon={Search}
                                    title={customerUi.emptyTitle}
                                    description={customerUi.emptyDescription}
                                    className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                                />
                            ) : (
                                <div className="max-h-[720px] overflow-y-auto pr-1">
                                <div className="grid gap-3">
                                    {visibleCustomerRows.map((row) => {
                                        const customer = row.customer;
                                        const isEditing = editingCustomerId === customer.id;
                                        const caseStateText = row.caseState === "active_case" ? customerUi.caseStateActive : customerUi.caseStateNone;

                                        return (
                                            <details key={customer.id} className="rounded-xl border border-[rgb(var(--border))]">
                                                <summary className="grid cursor-pointer list-none gap-1 p-3 text-sm sm:grid-cols-4 [&::-webkit-details-marker]:hidden">
                                                    <div className="font-semibold">{customerUi.name}：{customer.name}</div>
                                                    <div className="text-[rgb(var(--muted))]">{customerUi.phone}：{customer.phone || "-"}</div>
                                                    <div className="text-[rgb(var(--muted))]">{caseStateText}</div>
                                                    <div className="text-[rgb(var(--muted))] text-right">{commonUi.tapToExpand}</div>
                                                </summary>
                                                <div className="border-t border-[rgb(var(--border))] p-3">
                                                    {!isEditing ? (
                                                        <>
                                                            <div className="grid gap-1 text-sm">
                                                                <div>{customerUi.email}：{customer.email || "-"}</div>
                                                                <div>{customerUi.address}：{customer.address || "-"}</div>
                                                                <div>{customerUi.createdAt}：{formatTime(customer.createdAt, lang)}</div>
                                                                <div>{customerUi.updatedAt}：{formatTime(customer.updatedAt, lang)}</div>
                                                                <div>{customerUi.caseCountSummary.replace("{open}", String(row.openCaseCount)).replace("{closed}", String(row.closedCaseCount))}</div>
                                                                <div>{customerUi.totalSpend}：{formatMoney(row.activitySpend, lang)}</div>
                                                            </div>
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    aria-label={commonUi.edit}
                                                                    className="group relative h-10 w-10 !p-0 flex items-center justify-center"
                                                                    onClick={() => {
                                                                        setEditingCustomerId(customer.id);
                                                                    }}
                                                                >
                                                                    <Pencil className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                                                    <span className="sr-only">{commonUi.edit}</span>
                                                                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                                        {commonUi.edit}
                                                                    </span>
                                                                </Button>
                                                                <Link
                                                                    href={{
                                                                        pathname: "/dashboard/customers/detail",
                                                                        query: { id: customer.id },
                                                                    }}
                                                                    aria-label={commonUi.viewDetail}
                                                                    className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--border))] hover:border-[rgb(var(--accent))]"
                                                                >
                                                                    <Search className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
                                                                    <span className="sr-only">{commonUi.viewDetail}</span>
                                                                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                                        {commonUi.viewDetail}
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
                                                                    aria-label={commonUi.save}
                                                                    className="group relative h-10 w-10 !p-0 flex items-center justify-center"
                                                                >
                                                                    <Save className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                                                    <span className="sr-only">{commonUi.save}</span>
                                                                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                                        {commonUi.save}
                                                                    </span>
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    aria-label={commonUi.cancel}
                                                                    className="group relative h-10 w-10 !p-0 flex items-center justify-center"
                                                                    onClick={() => setEditingCustomerId(null)}
                                                                >
                                                                    <X className="h-4 w-4" aria-hidden="true" />
                                                                    <span className="sr-only">{commonUi.cancel}</span>
                                                                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                                        {commonUi.cancel}
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
                                    summary={customerUi.resultsSummary.replace("{count}", String(visibleCustomerRows.length))}
                                    previousAction={
                                        <form action="/dashboard" method="get">
                                            <input type="hidden" name="tab" value="customers" />
                                            {customerKeyword ? <input type="hidden" name="customerQ" value={customerKeyword} /> : null}
                                            <input type="hidden" name="customerCaseFilter" value={customerCaseFilter} />
                                            <input type="hidden" name="customerOrder" value={customerOrder} />
                                            <input type="hidden" name="customerPageSize" value={customerPageSize} />
                                            {customerPreviousCursor ? <input type="hidden" name="customerCursor" value={customerPreviousCursor} /> : null}
                                            {customerPreviousCursorStack ? <input type="hidden" name="customerCursorStack" value={customerPreviousCursorStack} /> : null}
                                            <IconOnlyButton label={customerUi.previousPage} type="submit" icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />} disabled={!customerCurrentCursor} />
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
                                                label={customerUi.nextPage}
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
                            <SectionTitle title={caseUi.sectionTitle} hint={caseUi.sectionHint} />
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                                <form action="/dashboard" method="get" className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                                    <input type="hidden" name="tab" value="cases" />
                                    <input type="hidden" name="caseStatus" value={caseStatus} />
                                    <input type="hidden" name="caseOrder" value={caseOrder} />
                                    <div className="relative w-full">
                                        <MerchantPredictiveSearchInput
                                            name="caseQ"
                                            defaultValue={caseKeyword}
                                            placeholder={caseUi.searchPlaceholder}
                                            localSuggestions={caseSearchSuggestions}
                                            inputClassName="pr-10"
                                        />
                                        <Link
                                            href="/dashboard?tab=cases"
                                            aria-label={commonUi.clear}
                                            title={commonUi.clear}
                                            className="group absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel2))] hover:text-[rgb(var(--text))]"
                                        >
                                            <X className="h-4 w-4" aria-hidden="true" />
                                            <span className="sr-only">{commonUi.clear}</span>
                                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                {commonUi.clear}
                                            </span>
                                        </Link>
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="ghost"
                                        aria-label={commonUi.search}
                                        title={commonUi.search}
                                        className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center"
                                    >
                                        <Search className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                        <span className="sr-only">{commonUi.search}</span>
                                        <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                            {commonUi.search}
                                        </span>
                                    </Button>
                                </form>
                                <Button
                                    type="button"
                                    variant={showCreateCaseForm ? "solid" : "ghost"}
                                    aria-label={commonUi.add}
                                    title={commonUi.add}
                                    className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center"
                                    onClick={() => setShowCreateCaseForm((prev) => !prev)}
                                >
                                    <Plus className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                    <span className="sr-only">{commonUi.add}</span>
                                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                        {commonUi.add}
                                    </span>
                                </Button>
                            </div>
                            {showCreateCaseForm ? (
                                <form action={createCaseAction} className="mt-3 grid gap-2 md:grid-cols-2">
                                    <input type="hidden" name="redirectPath" value="/dashboard" />
                                    <input type="hidden" name="redirectTab" value="cases" />
                                    <Input name="customerName" placeholder={commonUi.customerNamePlaceholder} required />
                                    <Input name="customerPhone" placeholder={commonUi.customerPhonePlaceholder} required />
                                    <Input name="customerEmail" type="email" placeholder={commonUi.customerEmailPlaceholder} />
                                    <Input name="customerAddress" placeholder={commonUi.customerAddressPlaceholder} />
                                    <Input name="deviceName" placeholder={commonUi.deviceBrandPlaceholder} required />
                                    <Input name="deviceModel" placeholder={commonUi.deviceModelPlaceholder} required />
                                    <Textarea name="repairReason" rows={2} placeholder={commonUi.repairReasonPlaceholder} className="md:col-span-2" />
                                    <Textarea name="repairSuggestion" rows={2} placeholder={commonUi.repairSuggestionPlaceholder} className="md:col-span-2" />
                                    <Textarea name="note" rows={2} placeholder={commonUi.notePlaceholder} className="md:col-span-2" />
                                    <div className="md:col-span-2">
                                        <TechnicianAutocomplete
                                            technicians={repairTechnicians}
                                            technicianIdFieldName="repairTechnicianId"
                                            technicianNameFieldName="repairTechnicianName"
                                            placeholder={commonUi.technicianSearchPlaceholder}
                                        />
                                    </div>
                                    <Input name="linkedUsedProductId" placeholder={commonUi.linkedUsedProductIdPlaceholder} />
                                    <Input name="linkedUsedProductName" placeholder={commonUi.linkedUsedProductNamePlaceholder} />
                                    <Input type="number" min={0} name="repairAmount" placeholder={commonUi.repairAmountPlaceholder} />
                                    <Input type="number" min={0} name="inspectionFee" placeholder={commonUi.inspectionFeePlaceholder} />
                                    <Select name="caseType" defaultValue="repair">
                                        <option value="repair">{customerCaseUi.caseType.repair}</option>
                                        <option value="refurbish">{customerCaseUi.caseType.refurbish}</option>
                                        <option value="warranty">{customerCaseUi.caseType.warranty}</option>
                                    </Select>
                                    <Select name="quoteStatus" defaultValue={defaultQuoteStatus} className="md:col-span-2">
                                        {normalizedQuoteStatusOptions.map((status) => (
                                            <option key={status} value={status}>
                                                {quoteStatusText(status, customerCaseUi)}
                                            </option>
                                        ))}
                                    </Select>
                                    <div className="md:col-span-2 flex justify-end">
                                        <IconOnlyButton label={caseUi.createButton} type="submit" variant="solid" icon={<Plus className="h-4 w-4" aria-hidden="true" />} />
                                    </div>
                                </form>
                            ) : null}
                        </Card>

                        <Card className="rounded-xl p-3">
                            <div className="overflow-x-auto">
                                <form action="/dashboard" method="get" className="flex min-w-max items-center gap-2 text-sm">
                                    <input type="hidden" name="tab" value="cases" />
                                    <input type="hidden" name="caseQ" value={caseKeyword} />
                                    <span className="whitespace-nowrap text-sm font-semibold">{commonUi.filterFields}</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">{commonUi.lastUpdated}</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">{formatTimeShort(snapshotTs, lang)}</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">{commonUi.timeOrder}</span>
                                    <Select
                                        name="caseOrder"
                                        className="w-[4ch]"
                                        defaultValue={caseOrder}
                                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                                    >
                                        <option value="latest">{caseUi.orderLatest}</option>
                                        <option value="earliest">{caseUi.orderEarliest}</option>
                                    </Select>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">{commonUi.statusFilter}</span>
                                    <Select
                                        name="caseStatus"
                                        className="w-[4ch]"
                                        defaultValue={caseStatus || "all"}
                                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                                    >
                                        <option value="all">{caseUi.filterAll}</option>
                                        {filterCaseStatusOptions.map((status) => (
                                            <option key={status} value={status}>
                                                {statusText(status, customerCaseUi)}
                                            </option>
                                        ))}
                                    </Select>
                                    <Link href="/dashboard?tab=cases" className="text-xs text-[rgb(var(--accent))] hover:underline">
                                        {commonUi.reset}
                                    </Link>
                                </form>
                            </div>
                        </Card>

                        <Card className="rounded-xl p-3">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <SectionTitle title={caseUi.listTitle} hint={caseUi.listHint.replace("{count}", String(visibleCaseTickets.length))} />
                                <form action="/dashboard" method="get" className="flex items-center gap-2">
                                    <input type="hidden" name="tab" value="cases" />
                                    {caseKeyword ? <input type="hidden" name="caseQ" value={caseKeyword} /> : null}
                                    <input type="hidden" name="caseStatus" value={caseStatus} />
                                    <input type="hidden" name="caseOrder" value={caseOrder} />
                                    <span className="text-xs text-[rgb(var(--muted))]">{commonUi.perPage}</span>
                                    <Select name="casePageSize" defaultValue={casePageSize} className="h-9 w-[96px]">
                                        {LIST_DISPLAY_OPTIONS.map((size) => (
                                            <option key={`case-page-size-${size}`} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </Select>
                                    <IconOnlyButton label={caseUi.applyPageSize} type="submit" icon={<Search className="h-4 w-4" aria-hidden="true" />} />
                                </form>
                            </div>
                            <div className="max-h-[720px] overflow-y-auto pr-1">
                                <CaseCardList
                                    tickets={visibleCaseTickets}
                                    lang={lang}
                                    ui={customerCaseUi}
                                    caseStatusOptions={normalizedCaseStatusOptions}
                                    quoteStatusOptions={normalizedQuoteStatusOptions}
                                    repairTechnicians={repairTechnicians}
                                    createWarrantyCaseAction={createWarrantyCaseAction}
                                    updateCaseAction={updateCaseAction}
                                />
                                <MerchantListPagination
                                    className="pt-2"
                                    summary={caseUi.resultsSummary.replace("{count}", String(visibleCaseTickets.length))}
                                    previousAction={
                                        <form action="/dashboard" method="get">
                                            <input type="hidden" name="tab" value="cases" />
                                            {caseKeyword ? <input type="hidden" name="caseQ" value={caseKeyword} /> : null}
                                            <input type="hidden" name="caseStatus" value={caseStatus} />
                                            <input type="hidden" name="caseOrder" value={caseOrder} />
                                            <input type="hidden" name="casePageSize" value={casePageSize} />
                                            {casePreviousCursor ? <input type="hidden" name="caseCursor" value={casePreviousCursor} /> : null}
                                            {casePreviousCursorStack ? <input type="hidden" name="caseCursorStack" value={casePreviousCursorStack} /> : null}
                                            <IconOnlyButton label={caseUi.previousPage} type="submit" icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />} disabled={!caseCurrentCursor} />
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
                                                label={caseUi.nextPage}
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
                            <SectionTitle title={activityUi.sectionTitle} hint={activityUi.sectionHint} />
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                                <form action="/dashboard" method="get" className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                                    <input type="hidden" name="tab" value="activities" />
                                    <MerchantPredictiveSearchInput
                                        name="activityQ"
                                        defaultValue={activityKeyword}
                                        placeholder={activityUi.searchPlaceholder}
                                        localSuggestions={activitySearchSuggestions}
                                        className="w-full"
                                    />
                                    <IconOnlyButton label={activityUi.searchButton} type="submit" variant="ghost" icon={<Search className="h-4 w-4" aria-hidden="true" />} />
                                    <IconOnlyButton
                                        label={activityUi.clearSearch}
                                        icon={<X className="h-4 w-4" aria-hidden="true" />}
                                        onClick={() => {
                                            window.location.href = "/dashboard?tab=activities";
                                        }}
                                    />
                                </form>
                                <Button
                                    type="button"
                                    variant={showCreateActivityForm ? "solid" : "ghost"}
                                    aria-label={commonUi.add}
                                    title={commonUi.add}
                                    className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center"
                                    onClick={() => setShowCreateActivityForm((prev) => !prev)}
                                >
                                    <Plus className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                    <span className="sr-only">{commonUi.add}</span>
                                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                        {commonUi.add}
                                    </span>
                                </Button>
                            </div>
                            {showCreateActivityForm ? (
                                <form action={createActivityAction} className="mt-3 grid gap-3">
                                    <input type="hidden" name="tab" value="activities" />
                                    <div className="grid gap-2 md:grid-cols-3">
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-name" label={activityUi.nameLabel} />
                                            <Input id="create-activity-name" name="activityName" placeholder={activityUi.namePlaceholder} required />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-start-at" label={activityUi.startDateLabel} />
                                            <Input
                                                id="create-activity-start-at"
                                                type="date"
                                                name="activityStartAt"
                                                onClick={(event) => openDatePicker(event.currentTarget)}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-end-at" label={activityUi.endDateLabel} />
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
                                            <FieldLabel htmlFor="create-activity-effect-type" label={activityUi.effectLabel} />
                                            <Select id="create-activity-effect-type" name="activityEffectType" defaultValue="discount">
                                                <option value="discount">{activityEffectText("discount", customerCaseUi)}</option>
                                                <option value="bundle_price">{activityEffectText("bundle_price", customerCaseUi)}</option>
                                                <option value="gift_item">{activityEffectText("gift_item", customerCaseUi)}</option>
                                                <option value="create_entitlement">{activityEffectText("create_entitlement", customerCaseUi)}</option>
                                                <option value="create_pickup_reservation">{activityEffectText("create_pickup_reservation", customerCaseUi)}</option>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-discount-amount" label={activityUi.discountAmountLabel} />
                                            <Input id="create-activity-discount-amount" type="number" min={0} name="activityDiscountAmount" defaultValue={0} />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-bundle-discount" label={activityUi.bundleDiscountLabel} />
                                            <Input id="create-activity-bundle-discount" type="number" min={0} name="activityBundlePriceDiscount" defaultValue={0} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-3">
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-gift-product-id" label={activityUi.giftProductIdLabel} />
                                            <Input id="create-activity-gift-product-id" name="activityGiftProductId" placeholder={activityUi.giftProductIdPlaceholder} />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-gift-product-name" label={activityUi.giftProductNameLabel} />
                                            <Input id="create-activity-gift-product-name" name="activityGiftProductName" placeholder={activityUi.giftProductNamePlaceholder} />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-gift-qty" label={activityUi.giftQtyLabel} />
                                            <Input id="create-activity-gift-qty" type="number" min={1} name="activityGiftQty" defaultValue={1} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-3">
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-entitlement-type" label={activityUi.entitlementTypeLabel} />
                                            <Select id="create-activity-entitlement-type" name="activityEntitlementType" defaultValue="replacement">
                                                <option value="replacement">replacement</option>
                                                <option value="gift">gift</option>
                                                <option value="discount">discount</option>
                                                <option value="service">service</option>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-scope-type" label={activityUi.scopeTypeLabel} />
                                            <Select id="create-activity-scope-type" name="activityScopeType" defaultValue="category">
                                                <option value="category">{activityUi.scopeCategory}</option>
                                                <option value="product">{activityUi.scopeProduct}</option>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-entitlement-qty" label={activityUi.entitlementQtyLabel} />
                                            <Input id="create-activity-entitlement-qty" type="number" min={1} name="activityEntitlementQty" defaultValue={1} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-4">
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-category-id" label={activityUi.categoryIdLabel} />
                                            <Input id="create-activity-category-id" name="activityCategoryId" placeholder={activityUi.categoryIdPlaceholder} />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-category-name" label={activityUi.categoryNameLabel} />
                                            <Input id="create-activity-category-name" name="activityCategoryName" placeholder={activityUi.categoryNamePlaceholder} />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-product-id" label={activityUi.productIdLabel} />
                                            <Input id="create-activity-product-id" name="activityProductId" placeholder={activityUi.productIdPlaceholder} />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-product-name" label={activityUi.productNameLabel} />
                                            <Input id="create-activity-product-name" name="activityProductName" placeholder={activityUi.productNamePlaceholder} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-4">
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-entitlement-expire" label={activityUi.entitlementExpireLabel} />
                                            <Input
                                                id="create-activity-entitlement-expire"
                                                type="date"
                                                name="activityEntitlementExpiresAt"
                                                onClick={(event) => openDatePicker(event.currentTarget)}
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-reservation-qty" label={activityUi.reservationQtyLabel} />
                                            <Input id="create-activity-reservation-qty" type="number" min={1} name="activityReservationQty" defaultValue={1} />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-reservation-expire" label={activityUi.reservationExpireLabel} />
                                            <Input
                                                id="create-activity-reservation-expire"
                                                type="date"
                                                name="activityReservationExpiresAt"
                                                onClick={(event) => openDatePicker(event.currentTarget)}
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <FieldLabel htmlFor="create-activity-default-store-qty" label={activityUi.defaultStoreQtyLabel} />
                                            <Input id="create-activity-default-store-qty" type="number" min={0} name="activityDefaultStoreQty" defaultValue={0} />
                                        </div>
                                    </div>
                                    <div className="grid gap-1">
                                        <FieldLabel htmlFor="create-activity-message" label={activityUi.messageLabel} />
                                        <Textarea id="create-activity-message" name="activityMessage" rows={3} placeholder={activityUi.messagePlaceholder} />
                                    </div>
                                    <div className="grid gap-2">
                                        {draftItems.map((item, index) => (
                                            <div key={item.id} className="grid gap-2 rounded-lg border border-[rgb(var(--border))] p-3 md:grid-cols-4">
                                                <div className="text-xs font-semibold text-[rgb(var(--muted))] md:col-span-4">{activityUi.itemCardTitle.replace("{index}", String(index + 1))}</div>
                                                <div className="grid gap-1">
                                                    <FieldLabel htmlFor={`create-item-name-${item.id}`} label={activityUi.itemNameLabel} />
                                                    <Input
                                                        id={`create-item-name-${item.id}`}
                                                        name="activityItemName[]"
                                                        value={item.itemName}
                                                        onChange={(event) => {
                                                            const value = event.target.value;
                                                            setDraftItems((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, itemName: value } : row)));
                                                        }}
                                                        placeholder={activityUi.itemNamePlaceholder}
                                                        required
                                                    />
                                                </div>
                                                <div className="grid gap-1">
                                                    <FieldLabel htmlFor={`create-item-qty-${item.id}`} label={activityUi.itemQtyLabel} />
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
                                                        placeholder={activityUi.itemQtyPlaceholder}
                                                        required
                                                    />
                                                </div>
                                                <div className="grid gap-1">
                                                    <FieldLabel htmlFor={`create-item-price-${item.id}`} label={activityUi.itemPriceLabel} />
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
                                                        placeholder={activityUi.itemPricePlaceholder}
                                                        required
                                                    />
                                                </div>
                                                <div className="grid gap-1">
                                                    <FieldLabel htmlFor={`create-item-cost-${item.id}`} label={activityUi.itemCostLabel} />
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
                                                        placeholder={activityUi.itemCostPlaceholder}
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
                                            {activityUi.addItemCard}
                                        </Button>
                                        <div className="text-sm text-[rgb(var(--muted))]">
                                            {activityUi.totalPrice}：
                                            {formatMoney(
                                                draftItems.reduce((sum, item) => sum + Math.max(0, item.qty) * Math.max(0, item.price), 0),
                                                lang,
                                            )}
                                        </div>
                                        <Button type="submit">{activityUi.createActivity}</Button>
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
                                    <span className="whitespace-nowrap text-sm font-semibold">{commonUi.filterFields}</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">{commonUi.lastUpdated}</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">{formatTimeShort(snapshotTs, lang)}</span>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">{commonUi.timeOrder}</span>
                                    <Select
                                        name="activityOrder"
                                        defaultValue={activityOrder}
                                        className="w-[4ch]"
                                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                                    >
                                        <option value="updated_latest">{activityUi.orderUpdatedLatest}</option>
                                        <option value="updated_earliest">{activityUi.orderUpdatedEarliest}</option>
                                        <option value="start_latest">{activityUi.orderStartLatest}</option>
                                        <option value="start_earliest">{activityUi.orderStartEarliest}</option>
                                    </Select>
                                    <span className="whitespace-nowrap text-xs text-[rgb(var(--muted))]">{commonUi.statusFilter}</span>
                                    <Select
                                        name="activityStatusFilter"
                                        defaultValue={activityStatusFilter}
                                        className="w-[4ch]"
                                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                                    >
                                        <option value="all">{activityUi.filterAll}</option>
                                        <option value="upcoming">{customerCaseUi.activityStatus.upcoming}</option>
                                        <option value="active">{customerCaseUi.activityStatus.active}</option>
                                        <option value="ended">{customerCaseUi.activityStatus.ended}</option>
                                        <option value="cancelled">{customerCaseUi.activityStatus.cancelled}</option>
                                    </Select>
                                    <Link href="/dashboard?tab=activities" className="text-xs text-[rgb(var(--accent))] hover:underline">
                                        {commonUi.reset}
                                    </Link>
                                </form>
                            </div>
                        </Card>

                        <Card className="rounded-xl p-3">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <SectionTitle title={activityUi.listTitle} hint={activityUi.listHint.replace("{count}", String(visibleActivities.length))} />
                                <form action="/dashboard" method="get" className="flex items-center gap-2">
                                    <input type="hidden" name="tab" value="activities" />
                                    {activityKeyword ? <input type="hidden" name="activityQ" value={activityKeyword} /> : null}
                                    <input type="hidden" name="activityOrder" value={activityOrder} />
                                    <input type="hidden" name="activityStatusFilter" value={activityStatusFilter} />
                                    <span className="text-xs text-[rgb(var(--muted))]">{commonUi.perPage}</span>
                                    <Select name="activityPageSize" defaultValue={activityPageSize} className="h-9 w-[96px]">
                                        {LIST_DISPLAY_OPTIONS.map((size) => (
                                            <option key={`activity-page-size-${size}`} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </Select>
                                    <IconOnlyButton label={activityUi.applyPageSize} type="submit" icon={<Search className="h-4 w-4" aria-hidden="true" />} />
                                </form>
                            </div>
                            <div className="mb-2 hidden grid-cols-7 gap-1 px-3 text-xs text-[rgb(var(--muted))] sm:grid">
                                <span>{activityUi.activityName}</span>
                                <span>{activityUi.itemName}</span>
                                <span>{activityUi.totalQty}</span>
                                <span>{activityUi.effectType}</span>
                                <span>{activityUi.startDate}</span>
                                <span>{activityUi.endDate}</span>
                                <span>{activityUi.status}</span>
                            </div>
                            <div className="max-h-[720px] overflow-y-auto pr-1">
                            {visibleActivities.length === 0 ? (
                                <EmptyStateCard
                                    icon={Search}
                                    title={activityUi.emptyTitle}
                                    description={activityUi.emptyDescription}
                                    className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                                />
                            ) : (
                            <div className="grid gap-2">
                                {visibleActivities.map((activity) => (
                                    <details key={activity.id} className="rounded-lg border border-[rgb(var(--border))]">
                                        <summary className="grid cursor-pointer list-none gap-1 px-3 py-2 text-sm sm:grid-cols-7 [&::-webkit-details-marker]:hidden">
                                            <span><span className="text-[rgb(var(--muted))] sm:hidden">{activityUi.activityName}：</span>{activity.name}</span>
                                            <span><span className="text-[rgb(var(--muted))] sm:hidden">{activityUi.itemName}：</span>{activity.items[0]?.itemName || "-"}</span>
                                            <span><span className="text-[rgb(var(--muted))] sm:hidden">{activityUi.totalQty}：</span>{activity.items.reduce((sum, item) => sum + item.totalQty, 0)}</span>
                                            <span><span className="text-[rgb(var(--muted))] sm:hidden">{activityUi.effectType}：</span>{activityEffectText(activity.effectType, customerCaseUi)}</span>
                                            <span><span className="text-[rgb(var(--muted))] sm:hidden">{activityUi.startDate}：</span>{formatTime(activity.startAt, lang)}</span>
                                            <span><span className="text-[rgb(var(--muted))] sm:hidden">{activityUi.endDate}：</span>{formatTime(activity.endAt, lang)}</span>
                                            <span><span className="text-[rgb(var(--muted))] sm:hidden">{activityUi.status}：</span>{activityStatusText(activity.status, customerCaseUi)}</span>
                                        </summary>
                                        <div className="border-t border-[rgb(var(--border))] p-3 text-sm">
                                            <div className="mb-2 whitespace-pre-wrap text-[rgb(var(--muted))]">{activity.message || "-"}</div>
                                            <div className="mb-2 text-xs text-[rgb(var(--muted))]">{activityUi.effectSummary}：{activityEffectText(activity.effectType, customerCaseUi)}</div>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full text-xs">
                                                    <thead>
                                                        <tr className="text-left text-[rgb(var(--muted))]">
                                                            <th className="px-1 py-1">{activityUi.itemName}</th>
                                                            <th className="px-1 py-1">{activityUi.totalQty}</th>
                                                            <th className="px-1 py-1">{activityUi.amount}</th>
                                                            <th className="px-1 py-1">{activityUi.cost}</th>
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
                                                            <FieldLabel htmlFor={`update-activity-name-${activity.id}`} label={activityUi.nameLabel} />
                                                            <Input id={`update-activity-name-${activity.id}`} name="activityName" defaultValue={activity.name} required />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-start-at-${activity.id}`} label={activityUi.startDateLabel} />
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
                                                            <FieldLabel htmlFor={`update-activity-end-at-${activity.id}`} label={activityUi.endDateLabel} />
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
                                                            <FieldLabel htmlFor={`update-activity-effect-type-${activity.id}`} label={activityUi.effectLabel} />
                                                            <Select id={`update-activity-effect-type-${activity.id}`} name="activityEffectType" defaultValue={activity.effectType}>
                                                                <option value="discount">{activityEffectText("discount", customerCaseUi)}</option>
                                                                <option value="bundle_price">{activityEffectText("bundle_price", customerCaseUi)}</option>
                                                                <option value="gift_item">{activityEffectText("gift_item", customerCaseUi)}</option>
                                                                <option value="create_entitlement">{activityEffectText("create_entitlement", customerCaseUi)}</option>
                                                                <option value="create_pickup_reservation">{activityEffectText("create_pickup_reservation", customerCaseUi)}</option>
                                                            </Select>
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-discount-${activity.id}`} label={activityUi.discountAmountLabel} />
                                                            <Input
                                                                id={`update-activity-discount-${activity.id}`}
                                                                type="number"
                                                                min={0}
                                                                name="activityDiscountAmount"
                                                                defaultValue={activity.discountAmount ?? 0}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-bundle-${activity.id}`} label={activityUi.bundleDiscountLabel} />
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
                                                            <FieldLabel htmlFor={`update-activity-gift-product-id-${activity.id}`} label={activityUi.giftProductIdLabel} />
                                                            <Input
                                                                id={`update-activity-gift-product-id-${activity.id}`}
                                                                name="activityGiftProductId"
                                                                defaultValue={activity.giftProductId ?? ""}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-gift-product-name-${activity.id}`} label={activityUi.giftProductNameLabel} />
                                                            <Input
                                                                id={`update-activity-gift-product-name-${activity.id}`}
                                                                name="activityGiftProductName"
                                                                defaultValue={activity.giftProductName ?? ""}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-gift-qty-${activity.id}`} label={activityUi.giftQtyLabel} />
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
                                                            <FieldLabel htmlFor={`update-activity-entitlement-type-${activity.id}`} label={activityUi.entitlementTypeLabel} />
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
                                                            <FieldLabel htmlFor={`update-activity-scope-${activity.id}`} label={activityUi.scopeTypeLabel} />
                                                            <Select
                                                                id={`update-activity-scope-${activity.id}`}
                                                                name="activityScopeType"
                                                                defaultValue={activity.scopeType === "product" ? "product" : "category"}
                                                            >
                                                                <option value="category">{activityUi.scopeCategory}</option>
                                                                <option value="product">{activityUi.scopeProduct}</option>
                                                            </Select>
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-entitlement-qty-${activity.id}`} label={activityUi.entitlementQtyLabel} />
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
                                                            <FieldLabel htmlFor={`update-activity-category-id-${activity.id}`} label={activityUi.categoryIdLabel} />
                                                            <Input id={`update-activity-category-id-${activity.id}`} name="activityCategoryId" defaultValue={activity.categoryId ?? ""} />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-category-name-${activity.id}`} label={activityUi.categoryNameLabel} />
                                                            <Input
                                                                id={`update-activity-category-name-${activity.id}`}
                                                                name="activityCategoryName"
                                                                defaultValue={activity.categoryName ?? ""}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-product-id-${activity.id}`} label={activityUi.productIdLabel} />
                                                            <Input id={`update-activity-product-id-${activity.id}`} name="activityProductId" defaultValue={activity.productId ?? ""} />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-product-name-${activity.id}`} label={activityUi.productNameLabel} />
                                                            <Input id={`update-activity-product-name-${activity.id}`} name="activityProductName" defaultValue={activity.productName ?? ""} />
                                                        </div>
                                                    </div>
                                                    <div className="grid gap-2 md:grid-cols-4">
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-entitlement-expire-${activity.id}`} label={activityUi.entitlementExpireLabel} />
                                                            <Input
                                                                id={`update-activity-entitlement-expire-${activity.id}`}
                                                                type="date"
                                                                name="activityEntitlementExpiresAt"
                                                                defaultValue={toDateInput(activity.entitlementExpiresAt ?? 0)}
                                                                onClick={(event) => openDatePicker(event.currentTarget)}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-reservation-qty-${activity.id}`} label={activityUi.reservationQtyLabel} />
                                                            <Input
                                                                id={`update-activity-reservation-qty-${activity.id}`}
                                                                type="number"
                                                                min={1}
                                                                name="activityReservationQty"
                                                                defaultValue={activity.reservationQty ?? 1}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-reservation-expire-${activity.id}`} label={activityUi.reservationExpireLabel} />
                                                            <Input
                                                                id={`update-activity-reservation-expire-${activity.id}`}
                                                                type="date"
                                                                name="activityReservationExpiresAt"
                                                                defaultValue={toDateInput(activity.reservationExpiresAt ?? 0)}
                                                                onClick={(event) => openDatePicker(event.currentTarget)}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <FieldLabel htmlFor={`update-activity-default-store-qty-${activity.id}`} label={activityUi.defaultStoreQtyLabel} />
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
                                                        <FieldLabel htmlFor={`update-activity-message-${activity.id}`} label={activityUi.messageLabel} />
                                                        <Textarea id={`update-activity-message-${activity.id}`} name="activityMessage" rows={2} defaultValue={activity.message} />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        {activity.items.map((item, itemIndex) => (
                                                            <div key={item.id} className="grid gap-2 md:grid-cols-4">
                                                                <div className="text-xs font-semibold text-[rgb(var(--muted))] md:col-span-4">{activityUi.itemCardTitle.replace("{index}", String(itemIndex + 1))}</div>
                                                                <div className="grid gap-1">
                                                                    <FieldLabel htmlFor={`update-item-name-${activity.id}-${item.id}`} label={activityUi.itemNameLabel} />
                                                                    <Input id={`update-item-name-${activity.id}-${item.id}`} name="activityItemName[]" defaultValue={item.itemName} required />
                                                                </div>
                                                                <div className="grid gap-1">
                                                                    <FieldLabel htmlFor={`update-item-qty-${activity.id}-${item.id}`} label={activityUi.itemQtyLabel} />
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
                                                                    <FieldLabel htmlFor={`update-item-price-${activity.id}-${item.id}`} label={activityUi.itemPriceLabel} />
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
                                                                    <FieldLabel htmlFor={`update-item-cost-${activity.id}-${item.id}`} label={activityUi.itemCostLabel} />
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
                                                        <Button type="submit">{activityUi.updateActivity}</Button>
                                                    </div>
                                                </form>

                                                <div className="flex flex-wrap gap-2">
                                                    <form action={cancelActivityAction}>
                                                        <input type="hidden" name="tab" value="activities" />
                                                        <input type="hidden" name="activityId" value={activity.id} />
                                                        <Button type="submit" variant="ghost">{activityUi.cancelActivity}</Button>
                                                    </form>
                                                    <form action={deleteActivityAction} onSubmit={handleDeleteWithPassword} data-delete-target={`${activityUi.activityName} ${activity.name}`}>
                                                        <input type="hidden" name="tab" value="activities" />
                                                        <input type="hidden" name="activityId" value={activity.id} />
                                                        <Button type="submit" variant="ghost">{activityUi.deleteActivity}</Button>
                                                    </form>
                                                </div>
                                                <div className="text-xs text-[rgb(var(--muted))]">{activityUi.trackingHint}</div>
                                            </div>
                                        </div>
                                    </details>
                                ))}
                            </div>
                            )}
                            <MerchantListPagination
                                className="pt-2"
                                summary={activityUi.resultsSummary.replace("{count}", String(visibleActivities.length))}
                                previousAction={
                                    <form action="/dashboard" method="get">
                                        <input type="hidden" name="tab" value="activities" />
                                        {activityKeyword ? <input type="hidden" name="activityQ" value={activityKeyword} /> : null}
                                        <input type="hidden" name="activityOrder" value={activityOrder} />
                                        <input type="hidden" name="activityStatusFilter" value={activityStatusFilter} />
                                        <input type="hidden" name="activityPageSize" value={activityPageSize} />
                                        {activityPreviousCursor ? <input type="hidden" name="activityCursor" value={activityPreviousCursor} /> : null}
                                        {activityPreviousCursorStack ? <input type="hidden" name="activityCursorStack" value={activityPreviousCursorStack} /> : null}
                                        <IconOnlyButton label={activityUi.previousPage} type="submit" icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />} disabled={!activityCurrentCursor} />
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
                                            label={activityUi.nextPage}
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
                        <Card>
                            <SectionTitle
                                title={inv.functionsSectionTitle}
                                hint={
                                    inventoryView === "stock"
                                        ? inv.currentViewStock
                                        : inventoryView === "settings"
                                          ? inv.currentViewSettings
                                          : inventoryView === "stock-in"
                                            ? inv.currentViewStockIn
                                            : inventoryView === "stock-out"
                                              ? inv.currentViewStockOut
                                              : inv.currentViewProductMgmt
                                }
                            />
                            <div className="mb-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                                {[
                                    { id: "stock" as const, title: nav.stock, hint: nav.descStock },
                                    { id: "settings" as const, title: nav.settings, hint: nav.descSettings },
                                    { id: "stock-in" as const, title: nav.stockIn, hint: nav.descStockIn },
                                    { id: "stock-out" as const, title: nav.stockOut, hint: nav.descStockOut },
                                    { id: "product-management" as const, title: nav.productManagement, hint: nav.descProductManagement },
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
                        <MerchantSectionCard title={inv.searchSectionTitle} description={inv.searchSectionDescription}>
                            <SearchToolbar
                                searchSlot={
                                    <form action="/dashboard" method="get" className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <input type="hidden" name="tab" value="inventory" />
                                        <input type="hidden" name="inventoryView" value={inventoryView} />
                                        <MerchantPredictiveSearchInput
                                            name="productQ"
                                            defaultValue={productKeyword}
                                            placeholder={inv.searchPlaceholder}
                                            targets={["inventory"]}
                                            className="w-full"
                                        />
                                        <Button type="submit">{inv.search}</Button>
                                        <Link
                                            href={`/dashboard?tab=inventory&inventoryView=${encodeURIComponent(inventoryView)}`}
                                            className="text-sm text-[rgb(var(--accent))] hover:underline"
                                        >
                                            {inv.clear}
                                        </Link>
                                    </form>
                                }
                            />
                        </MerchantSectionCard>

                        {inventoryView === "stock" ? (
                            <MerchantListShell
                                list={
                                    <>
                                        <MerchantSectionCard title={inv.summaryTitle} description={inv.summaryDescription}>
                                            <div className="grid gap-3 sm:grid-cols-4">
                                                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                                    <div className="text-xs text-[rgb(var(--muted))]">{inv.kpiOnHandTotal}</div>
                                                    <div className="mt-1 text-2xl font-semibold">{formatMoney(inventorySummary.totalOnHandUnits, lang)}</div>
                                                </div>
                                                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                                    <div className="text-xs text-[rgb(var(--muted))]">{inv.kpiReservedTotal}</div>
                                                    <div className="mt-1 text-2xl font-semibold">{formatMoney(inventorySummary.totalReservedUnits, lang)}</div>
                                                </div>
                                                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                                    <div className="text-xs text-[rgb(var(--muted))]">{inv.kpiAvailableTotal}</div>
                                                    <div className="mt-1 text-2xl font-semibold">{formatMoney(inventorySummary.totalAvailableUnits, lang)}</div>
                                                </div>
                                                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                                    <div className="text-xs text-[rgb(var(--muted))]">{inv.kpiCostTotal}</div>
                                                    <div className="mt-1 text-2xl font-semibold">{formatMoney(inventorySummary.totalValue, lang)}</div>
                                                </div>
                                            </div>
                                            <div className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                                <div className="text-xs text-[rgb(var(--muted))]">{inv.lowStockLine}</div>
                                                <div className="mt-1 text-2xl font-semibold">{inventorySummary.lowStockCount}</div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2 text-sm">
                                                <Link href="/dashboard?tab=inventory&inventoryView=stock-in" className="text-[rgb(var(--accent))] hover:underline">
                                                    {inv.goToStockIn}
                                                </Link>
                                                <Link href="/dashboard?tab=inventory&inventoryView=stock-out" className="text-[rgb(var(--accent))] hover:underline">
                                                    {inv.goToStockOut}
                                                </Link>
                                            </div>
                                        </MerchantSectionCard>

                                        <MerchantSectionCard title={inv.stockListTitle.replace("{count}", String(products.length))}>
                                            {products.length === 0 ? (
                                                <EmptyStateCard
                                                    icon={Search}
                                                    title={inv.emptyStockListTitle}
                                                    description={inv.emptyStockListDescription}
                                                    className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                                                />
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-sm">
                                                        <thead>
                                                            <tr className="text-left text-[rgb(var(--muted))]">
                                                                <th className="px-2 py-2">{inv.thName}</th>
                                                                <th className="px-2 py-2">{inv.thSku}</th>
                                                                <th className="px-2 py-2">{inv.thSupplier}</th>
                                                                <th className="px-2 py-2">{inv.thOnHand}</th>
                                                                <th className="px-2 py-2">{inv.thReserved}</th>
                                                                <th className="px-2 py-2">{inv.thAvailable}</th>
                                                                <th className="px-2 py-2">{inv.thPrice}</th>
                                                                <th className="px-2 py-2">{inv.thCost}</th>
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
                                    <MerchantSectionCard title={inv.settingsToolbarTitle} description={inv.settingsToolbarDescription}>
                                        {renderInventoryCreateProductForm("settings")}
                                    </MerchantSectionCard>
                                }
                                list={renderInventoryEditableProductList("settings")}
                                detailPanel={renderInventoryLogPanel()}
                            />
                        ) : null}

                        {inventoryView === "product-management" ? (
                            <MerchantListShell
                                toolbar={
                                    <MerchantSectionCard title={inv.pmToolbarTitle} description={inv.pmToolbarDescription} bodyClassName="space-y-3">
                                        <SearchToolbar
                                            searchSlot={
                                                <form action="/dashboard" method="get" className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                                                    <input type="hidden" name="tab" value="inventory" />
                                                    <input type="hidden" name="inventoryView" value="product-management" />
                                                    <div className="relative w-full">
                                                        <MerchantPredictiveSearchInput
                                                            name="productQ"
                                                            defaultValue={productKeyword}
                                                            placeholder={inv.pmSearchPlaceholder}
                                                            targets={["inventory"]}
                                                            inputClassName="pr-10"
                                                        />
                                                        <Link
                                                            href="/dashboard?tab=inventory&inventoryView=product-management"
                                                            aria-label={inv.clear}
                                                            title={inv.clear}
                                                            className="group absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel2))] hover:text-[rgb(var(--text))]"
                                                        >
                                                            <X className="h-4 w-4" aria-hidden="true" />
                                                            <span className="sr-only">{inv.clear}</span>
                                                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                                {inv.clear}
                                                            </span>
                                                        </Link>
                                                    </div>
                                                    <Button
                                                        type="submit"
                                                        variant="ghost"
                                                        aria-label={inv.search}
                                                        title={inv.search}
                                                        className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center"
                                                    >
                                                        <Search className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                                        <span className="sr-only">{inv.search}</span>
                                                        <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                            {inv.search}
                                                        </span>
                                                    </Button>
                                                </form>
                                            }
                                            primaryActionSlot={
                                                <Button
                                                    type="button"
                                                    variant={showCreateProductForm ? "solid" : "ghost"}
                                                    aria-label={inv.createProduct}
                                                    title={inv.createProduct}
                                                    className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center"
                                                    onClick={() => setShowCreateProductForm((prev) => !prev)}
                                                >
                                                    <Plus className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                                    <span className="sr-only">{inv.createProduct}</span>
                                                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                        {inv.createProduct}
                                                    </span>
                                                </Button>
                                            }
                                        />

                                        {showCreateProductForm ? (
                                            renderInventoryCreateProductForm("product-management")
                                        ) : null}
                                    </MerchantSectionCard>
                                }
                                list={renderInventoryEditableProductList("product-management")}
                                detailPanel={renderInventoryLogPanel()}
                            />
                        ) : null}

                        {inventoryView === "stock-in" ? (
                            <MerchantListShell
                                list={
                                    <MerchantSectionCard title={inv.stockInTitle.replace("{count}", String(products.length))} description={inv.stockInDescription}>
                                        {products.length === 0 ? (
                                            <EmptyStateCard
                                                icon={Search}
                                                title={inv.stockInEmptyTitle}
                                                description={inv.stockInEmptyDescription}
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
                                                                {inv.lineSkuOnHandReserved
                                                                    .replace("{sku}", product.sku || "-")
                                                                    .replace("{onHand}", String(product.onHandQty ?? product.stock))
                                                                    .replace("{reserved}", String(product.reservedQty ?? 0))}
                                                            </div>
                                                        </div>
                                                        <Input type="number" min={1} name="qty" defaultValue={1} />
                                                        <Button type="submit">{inv.confirmStockIn}</Button>
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
                                    <MerchantSectionCard title={inv.stockOutTitle.replace("{count}", String(products.length))} description={inv.stockOutDescription}>
                                        {products.length === 0 ? (
                                            <EmptyStateCard
                                                icon={Search}
                                                title={inv.stockOutEmptyTitle}
                                                description={inv.stockOutEmptyDescription}
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
                                                                {inv.lineSkuFull
                                                                    .replace("{sku}", product.sku || "-")
                                                                    .replace("{onHand}", String(product.onHandQty ?? product.stock))
                                                                    .replace("{reserved}", String(product.reservedQty ?? 0))
                                                                    .replace(
                                                                        "{available}",
                                                                        String(
                                                                            product.availableQty ??
                                                                                Math.max((product.onHandQty ?? product.stock) - (product.reservedQty ?? 0), 0),
                                                                        ),
                                                                    )}
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
                                                            {inv.confirmStockOut}
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
                        onDeleteGuard={handleDeleteWithPassword}
                    />
                ) : null}
            </div>
        </div>
    );
}
