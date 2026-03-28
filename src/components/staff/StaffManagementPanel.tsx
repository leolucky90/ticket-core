import { KeyRound, Pencil, Plus, RotateCcw, Search, Trash2, UserX } from "lucide-react";
import { MerchantListShell, MerchantSectionCard, SearchToolbar } from "@/components/merchant/shell";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import type { StaffMember } from "@/lib/schema";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";

type StaffManagementPanelProps = {
    items: StaffMember[];
    keyword: string;
    flash?: string;
    deactivateAction: (formData: FormData) => Promise<void>;
    softDeleteAction: (formData: FormData) => Promise<void>;
    resetPasswordAction: (formData: FormData) => Promise<void>;
    lang: "zh" | "en";
};

function statusTone(status: StaffMember["status"]) {
    if (status === "active") return "success";
    if (status === "inactive") return "warning";
    if (status === "locked" || status === "deleted") return "danger";
    return "neutral";
}

export function StaffManagementPanel({
    items,
    keyword,
    flash,
    deactivateAction,
    softDeleteAction,
    resetPasswordAction,
    lang,
}: StaffManagementPanelProps) {
    const staffSuggestions = items.map((item) => ({
        id: item.id,
        value: item.name,
        title: item.name,
        subtitle: [item.email, item.phone].filter(Boolean).join(" / ") || undefined,
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
                  softDelete: "軟刪除",
                  deleteReason: "刪除原因",
                  resultSummary: `共 ${items.length} 位員工`,
                  emptyTitle: "目前沒有符合條件的員工",
                  emptyDescription: "可以先建立員工，或調整搜尋關鍵字後再試。",
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
                  softDelete: "Soft Delete",
                  deleteReason: "Delete Reason",
                  resultSummary: `${items.length} staff record(s)`,
                  emptyTitle: "No matching staff records",
                  emptyDescription: "Create a staff member or adjust the search keyword and try again.",
              };
    const staffCountText = ui.resultSummary;

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
            {flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{flash}</div> : null}
        </div>
    );

    const list = (
        <MerchantSectionCard
            title={ui.title}
            description={staffCountText}
            emptyState={
                items.length === 0
                    ? {
                          icon: Search,
                          title: ui.emptyTitle,
                          description: ui.emptyDescription,
                      }
                    : undefined
            }
        >
            {items.length === 0 ? null : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[rgb(var(--panel2))] text-[rgb(var(--muted))]">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium">姓名</th>
                                <th className="px-3 py-2 text-left font-medium">電話</th>
                                <th className="px-3 py-2 text-left font-medium">地址</th>
                                <th className="px-3 py-2 text-left font-medium">Email</th>
                                <th className="px-3 py-2 text-left font-medium">權限</th>
                                <th className="px-3 py-2 text-left font-medium">狀態</th>
                                <th className="px-3 py-2 text-left font-medium">Google</th>
                                <th className="px-3 py-2 text-left font-medium">維修人員</th>
                                <th className="px-3 py-2 text-left font-medium">最後登入</th>
                                <th className="px-3 py-2 text-left font-medium">建立時間</th>
                                <th className="px-3 py-2 text-left font-medium">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-t border-[rgb(var(--border))] align-top">
                                    <td className="px-3 py-2">{item.name}</td>
                                    <td className="px-3 py-2">{item.phone}</td>
                                    <td className="px-3 py-2">{item.address || "-"}</td>
                                    <td className="px-3 py-2">{item.email}</td>
                                    <td className="px-3 py-2">
                                        <div className="grid gap-1">
                                            <span>Lv{item.roleLevel}</span>
                                            <span className="text-xs text-[rgb(var(--muted))]">{item.roleNameSnapshot}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <StatusBadge label={item.status} tone={statusTone(item.status)} />
                                    </td>
                                    <td className="px-3 py-2">{item.googleLinked ? "已綁定" : "未綁定"}</td>
                                    <td className="px-3 py-2">{item.isRepairTechnician ? "是" : "否"}</td>
                                    <td className="px-3 py-2">{item.lastLoginAt ?? "-"}</td>
                                    <td className="px-3 py-2">{item.createdAt}</td>
                                    <td className="px-3 py-2">
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
                                            <form action={deactivateAction}>
                                                <input type="hidden" name="id" value={item.id} />
                                                <IconActionButton type="submit" icon={UserX} label={ui.deactivate} tooltip={ui.deactivate} className="h-9 w-9" />
                                            </form>
                                            <form action={softDeleteAction} className="flex items-center gap-1">
                                                <input type="hidden" name="id" value={item.id} />
                                                <Input name="reason" placeholder={ui.deleteReason} required className="h-7 w-28 text-xs" />
                                                <IconActionButton type="submit" icon={Trash2} label={ui.softDelete} tooltip={ui.softDelete} className="h-9 w-9" />
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </MerchantSectionCard>
    );

    return (
        <MerchantListShell toolbar={toolbar} list={list} />
    );
}
