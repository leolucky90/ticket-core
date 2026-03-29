"use client";

import { Fragment, useMemo, useState } from "react";
import { KeyRound, Pencil, Plus, RotateCcw, Search, Trash2, UserCheck, UserX } from "lucide-react";
import { MerchantListShell, MerchantSectionCard, SearchToolbar } from "@/components/merchant/shell";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import type { StaffMember, StaffMemberStatus } from "@/lib/schema";
import { formatDisplayPhone } from "@/lib/format/phone-display";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";

type StaffManagementPanelProps = {
    items: StaffMember[];
    keyword: string;
    flash?: string;
    activateAction: (formData: FormData) => Promise<void>;
    deactivateAction: (formData: FormData) => Promise<void>;
    softDeleteAction: (formData: FormData) => Promise<void>;
    resetPasswordAction: (formData: FormData) => Promise<void>;
    lang: "zh" | "en";
};

/** 與篩選一致：僅「激活 / 停用」兩種營運狀態（其餘狀態僅在「全部」下列出） */
type StatusFilterValue = "all" | "active" | "inactive";
type RepairFilterValue = "all" | "yes" | "no";

function statusTone(status: StaffMember["status"]) {
    if (status === "active") return "success";
    if (status === "inactive") return "warning";
    if (status === "locked" || status === "deleted") return "danger";
    return "neutral";
}

function formatListDateTime(iso: string | undefined, lang: "zh" | "en"): string {
    if (!iso || iso === "-") return "-";
    const d = Date.parse(iso);
    if (!Number.isFinite(d)) return iso;
    return new Date(d).toLocaleString(lang === "zh" ? "zh-TW" : "en-US", { dateStyle: "short", timeStyle: "short" });
}

function staffStatusLabel(status: StaffMemberStatus, lang: "zh" | "en"): string {
    const map: Record<StaffMemberStatus, { zh: string; en: string }> = {
        active: { zh: "激活", en: "Active" },
        inactive: { zh: "停用", en: "Inactive" },
        pending_activation: { zh: "待啟用", en: "Pending" },
        locked: { zh: "鎖定", en: "Locked" },
        deleted: { zh: "已刪除", en: "Deleted" },
    };
    return map[status][lang];
}

export function StaffManagementPanel({
    items,
    keyword,
    flash,
    activateAction,
    deactivateAction,
    softDeleteAction,
    resetPasswordAction,
    lang,
}: StaffManagementPanelProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
    const [repairFilter, setRepairFilter] = useState<RepairFilterValue>("all");

    const staffSuggestions = items.map((item) => ({
        id: item.id,
        value: item.name,
        title: item.name,
        subtitle: [item.email, formatDisplayPhone(item.phone)].filter((s) => s && s !== "-").join(" / ") || undefined,
        keywords: [item.name, item.email, item.phone, item.address, item.roleNameSnapshot].filter((value): value is string => Boolean(value)),
    }));

    const ui =
        lang === "zh"
            ? {
                  title: "員工管理",
                  newStaff: "新增員工",
                  deletedRecords: "員工刪除紀錄",
                  search: "搜尋",
                  clear: "清除",
                  searchPlaceholder: "搜尋姓名/信箱/電話",
                  edit: "編輯",
                  resetPassword: "重置密碼",
                  deactivate: "停用",
                  activate: "激活",
                  softDelete: "軟刪除",
                  deleteReason: "刪除原因",
                  resultSummary: `共 ${items.length} 位員工`,
                  emptyTitle: "目前沒有符合條件的員工",
                  emptyDescription: "可以先建立員工，或調整搜尋關鍵字後再試。",
                  filteredEmptyTitle: "沒有符合篩選條件的員工",
                  filteredEmptyDescription: "請調整狀態或維修人員篩選。",
                  colName: "姓名",
                  colPhone: "電話",
                  colRole: "權限",
                  colStatus: "狀態",
                  filterStatus: "狀態",
                  filterActive: "激活",
                  filterInactive: "停用",
                  filterRepair: "維修人員",
                  filterAll: "全部",
                  repairYes: "是",
                  repairNo: "否",
                  detailHint: "點列可展開詳細資訊與操作",
                  detailAddress: "地址",
                  detailEmail: "Email",
                  detailGoogle: "Google",
                  detailRepair: "維修人員",
                  detailLastLogin: "最後登入",
                  detailCreated: "建立時間",
                  detailActions: "操作",
                  googleLinked: "已綁定",
                  googleNotLinked: "未綁定",
              }
            : {
                  title: "Staff Management",
                  newStaff: "Create Staff",
                  deletedRecords: "Deleted Staff Records",
                  search: "Search",
                  clear: "Clear",
                  searchPlaceholder: "Search name/email/phone",
                  edit: "Edit",
                  resetPassword: "Reset Password",
                  deactivate: "Deactivate",
                  activate: "Activate",
                  softDelete: "Soft Delete",
                  deleteReason: "Delete Reason",
                  resultSummary: `${items.length} staff record(s)`,
                  emptyTitle: "No matching staff records",
                  emptyDescription: "Create a staff member or adjust the search keyword and try again.",
                  filteredEmptyTitle: "No staff match the filters",
                  filteredEmptyDescription: "Adjust status or maintenance-personnel filters.",
                  colName: "Name",
                  colPhone: "Phone",
                  colRole: "Role",
                  colStatus: "Status",
                  filterStatus: "Status",
                  filterActive: "Active",
                  filterInactive: "Inactive",
                  filterRepair: "Technician",
                  filterAll: "All",
                  repairYes: "Yes",
                  repairNo: "No",
                  detailHint: "Click a row for details and actions",
                  detailAddress: "Address",
                  detailEmail: "Email",
                  detailGoogle: "Google",
                  detailRepair: "Repair technician",
                  detailLastLogin: "Last login",
                  detailCreated: "Created",
                  detailActions: "Actions",
                  googleLinked: "Linked",
                  googleNotLinked: "Not linked",
              };

    const staffCountText = ui.resultSummary;

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            if (statusFilter === "active" && item.status !== "active") return false;
            if (statusFilter === "inactive" && item.status !== "inactive") return false;
            if (repairFilter === "yes" && !item.isRepairTechnician) return false;
            if (repairFilter === "no" && item.isRepairTechnician) return false;
            return true;
        });
    }, [items, statusFilter, repairFilter]);

    const toolbar = (
        <div className="space-y-3">
            <SearchToolbar
                searchSlot={
                    <form method="get" className="flex flex-wrap gap-2">
                        <MerchantPredictiveSearchInput
                            name="keyword"
                            defaultValue={keyword}
                            placeholder={ui.searchPlaceholder}
                            localSuggestions={staffSuggestions}
                            className="max-w-sm flex-1"
                        />
                        <IconActionButton type="submit" icon={Search} label={ui.search} tooltip={ui.search} className="h-10 w-10" />
                        <IconActionButton href="/staff" icon={RotateCcw} label={ui.clear} tooltip={ui.clear} className="h-10 w-10" />
                    </form>
                }
                primaryActionSlot={
                    <div className="flex flex-wrap gap-2">
                        <IconActionButton href="/staff/new" icon={Plus} label={ui.newStaff} tooltip={ui.newStaff} className="h-10 w-10" />
                        <IconActionButton href="/staff/deleted" icon={Trash2} label={ui.deletedRecords} tooltip={ui.deletedRecords} className="h-10 w-10" />
                    </div>
                }
            />
            {items.length > 0 ? (
                <div className="flex flex-wrap items-end gap-3">
                    <label className="grid gap-1 text-sm">
                        <span className="text-[rgb(var(--muted))]">{ui.filterStatus}</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilterValue)}
                            className="h-10 min-w-[10rem] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 text-[rgb(var(--text))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))]"
                        >
                            <option value="all">{ui.filterAll}</option>
                            <option value="active">{ui.filterActive}</option>
                            <option value="inactive">{ui.filterInactive}</option>
                        </select>
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="text-[rgb(var(--muted))]">{ui.filterRepair}</span>
                        <select
                            value={repairFilter}
                            onChange={(e) => setRepairFilter(e.target.value as RepairFilterValue)}
                            className="h-10 min-w-[10rem] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 text-[rgb(var(--text))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))]"
                        >
                            <option value="all">{ui.filterAll}</option>
                            <option value="yes">{ui.repairYes}</option>
                            <option value="no">{ui.repairNo}</option>
                        </select>
                    </label>
                </div>
            ) : null}
            {flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{flash}</div> : null}
        </div>
    );

    const listEmpty =
        items.length === 0
            ? {
                  icon: Search,
                  title: ui.emptyTitle,
                  description: ui.emptyDescription,
              }
            : filteredItems.length === 0
              ? {
                    icon: Search,
                    title: ui.filteredEmptyTitle,
                    description: ui.filteredEmptyDescription,
                }
              : undefined;

    const list = (
        <MerchantSectionCard title={ui.title} description={staffCountText} emptyState={listEmpty}>
            {items.length === 0 || filteredItems.length === 0 ? null : (
                <div className="space-y-2">
                    <p className="text-xs text-[rgb(var(--muted))]">{ui.detailHint}</p>
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[rgb(var(--panel2))] text-[rgb(var(--muted))]">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium">{ui.colName}</th>
                                <th className="px-3 py-2 text-left font-medium">{ui.colPhone}</th>
                                <th className="px-3 py-2 text-left font-medium">{ui.colRole}</th>
                                <th className="px-3 py-2 text-left font-medium">{ui.colStatus}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => {
                                const open = expandedId === item.id;
                                return (
                                    <Fragment key={item.id}>
                                        <tr
                                            role="button"
                                            tabIndex={0}
                                            aria-expanded={open}
                                            onClick={() => setExpandedId((id) => (id === item.id ? null : item.id))}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    setExpandedId((id) => (id === item.id ? null : item.id));
                                                }
                                            }}
                                            className="cursor-pointer border-t border-[rgb(var(--border))] align-top transition hover:bg-[rgb(var(--panel2))]"
                                        >
                                            <td className="px-3 py-2 font-medium text-[rgb(var(--text))]">{item.name}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{formatDisplayPhone(item.phone)}</td>
                                            <td className="px-3 py-2">
                                                <div className="grid gap-1">
                                                    <span>Lv{item.roleLevel}</span>
                                                    <span className="text-xs text-[rgb(var(--muted))]">{item.roleNameSnapshot}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <StatusBadge label={staffStatusLabel(item.status, lang)} tone={statusTone(item.status)} />
                                            </td>
                                        </tr>
                                        {open ? (
                                            <tr className="border-t border-[rgb(var(--border))] bg-[rgb(var(--panel2))]">
                                                <td colSpan={4} className="px-3 py-4">
                                                    <div className="grid gap-4 text-[rgb(var(--text))] md:grid-cols-2">
                                                        <dl className="grid gap-2 text-sm">
                                                            <div className="flex flex-wrap gap-x-2 gap-y-1">
                                                                <dt className="text-[rgb(var(--muted))]">{ui.detailAddress}</dt>
                                                                <dd>{item.address?.trim() || "-"}</dd>
                                                            </div>
                                                            <div className="flex flex-wrap gap-x-2 gap-y-1">
                                                                <dt className="text-[rgb(var(--muted))]">{ui.detailEmail}</dt>
                                                                <dd className="break-all">{item.email}</dd>
                                                            </div>
                                                            <div className="flex flex-wrap gap-x-2 gap-y-1">
                                                                <dt className="text-[rgb(var(--muted))]">{ui.detailGoogle}</dt>
                                                                <dd>{item.googleLinked ? ui.googleLinked : ui.googleNotLinked}</dd>
                                                            </div>
                                                            <div className="flex flex-wrap gap-x-2 gap-y-1">
                                                                <dt className="text-[rgb(var(--muted))]">{ui.detailRepair}</dt>
                                                                <dd>{item.isRepairTechnician ? ui.repairYes : ui.repairNo}</dd>
                                                            </div>
                                                            <div className="flex flex-wrap gap-x-2 gap-y-1">
                                                                <dt className="text-[rgb(var(--muted))]">{ui.detailLastLogin}</dt>
                                                                <dd>{formatListDateTime(item.lastLoginAt, lang)}</dd>
                                                            </div>
                                                            <div className="flex flex-wrap gap-x-2 gap-y-1">
                                                                <dt className="text-[rgb(var(--muted))]">{ui.detailCreated}</dt>
                                                                <dd>{formatListDateTime(item.createdAt, lang)}</dd>
                                                            </div>
                                                        </dl>
                                                        <div className="flex flex-col gap-2">
                                                            <p className="text-xs font-medium text-[rgb(var(--muted))]">{ui.detailActions}</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                <IconActionButton
                                                                    href={`/staff/${encodeURIComponent(item.id)}/edit`}
                                                                    icon={Pencil}
                                                                    label={ui.edit}
                                                                    tooltip={ui.edit}
                                                                    className="h-9 w-9"
                                                                />
                                                                <form action={resetPasswordAction}>
                                                                    <input type="hidden" name="id" value={item.id} />
                                                                    <input type="hidden" name="newPassword" value="Temp1234A" />
                                                                    <IconActionButton type="submit" icon={KeyRound} label={ui.resetPassword} tooltip={ui.resetPassword} className="h-9 w-9" />
                                                                </form>
                                                                {item.status === "active" ? (
                                                                    <form action={deactivateAction}>
                                                                        <input type="hidden" name="id" value={item.id} />
                                                                        <IconActionButton type="submit" icon={UserX} label={ui.deactivate} tooltip={ui.deactivate} className="h-9 w-9" />
                                                                    </form>
                                                                ) : item.status === "inactive" ? (
                                                                    <form action={activateAction}>
                                                                        <input type="hidden" name="id" value={item.id} />
                                                                        <IconActionButton type="submit" icon={UserCheck} label={ui.activate} tooltip={ui.activate} className="h-9 w-9" />
                                                                    </form>
                                                                ) : null}
                                                                <form action={softDeleteAction} className="flex flex-wrap items-center gap-1">
                                                                    <input type="hidden" name="id" value={item.id} />
                                                                    <Input name="reason" placeholder={ui.deleteReason} required className="h-7 min-w-[7rem] max-w-[12rem] text-xs" />
                                                                    <IconActionButton type="submit" icon={Trash2} label={ui.softDelete} tooltip={ui.softDelete} className="h-9 w-9" />
                                                                </form>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : null}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}
        </MerchantSectionCard>
    );

    return <MerchantListShell toolbar={toolbar} list={list} />;
}
