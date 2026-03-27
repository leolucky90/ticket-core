import { RotateCcw, Search, Trash2 } from "lucide-react";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import type { DeleteLog } from "@/lib/schema";
import { Card } from "@/components/ui/card";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";

type StaffDeletedRecordsPanelProps = {
    logs: DeleteLog[];
    keyword: string;
    restoreAction: (formData: FormData) => Promise<void>;
    hardDeleteAction: (formData: FormData) => Promise<void>;
    flash?: string;
    lang: "zh" | "en";
};

function statusTone(status: DeleteLog["status"]) {
    if (status === "restored") return "success";
    if (status === "hard_deleted") return "danger";
    return "warning";
}

function statusLabel(status: DeleteLog["status"], lang: "zh" | "en"): string {
    if (lang === "en") {
        if (status === "restored") return "Restored";
        if (status === "hard_deleted") return "Hard Deleted";
        return "Soft Deleted";
    }
    if (status === "restored") return "已回復";
    if (status === "hard_deleted") return "已永久刪除";
    return "已軟刪除";
}

export function StaffDeletedRecordsPanel({ logs, keyword, restoreAction, hardDeleteAction, flash, lang }: StaffDeletedRecordsPanelProps) {
    const deletedStaffSuggestions = logs.map((log) => {
        const snapshot = log.snapshot ?? {};
        const name = typeof snapshot.name === "string" ? snapshot.name : log.targetLabel;
        const phone = typeof snapshot.phone === "string" ? snapshot.phone : "";
        const email = typeof snapshot.email === "string" ? snapshot.email : "";
        return {
            id: log.id,
            value: name,
            title: name,
            subtitle: [email, phone, log.deletedAt].filter(Boolean).join(" / ") || undefined,
            keywords: [name, phone, email, log.targetLabel, log.deletedByName, log.deletedBy, log.deleteReason].filter((value): value is string => Boolean(value)),
        };
    });

    return (
        <div className="grid gap-4">
            <Card className="grid gap-3">
                <div className="text-sm font-medium">員工刪除紀錄</div>
                <form method="get" className="flex flex-wrap gap-2">
                    <MerchantPredictiveSearchInput
                        name="keyword"
                        defaultValue={keyword}
                        placeholder="搜尋姓名 / 信箱 / 電話"
                        localSuggestions={deletedStaffSuggestions}
                        className="max-w-sm flex-1"
                    />
                    <IconActionButton type="submit" icon={Search} label="搜尋刪除紀錄" tooltip="搜尋刪除紀錄" />
                    <IconActionButton href="/staff/deleted" icon={RotateCcw} label="清除搜尋" tooltip="清除搜尋條件" />
                </form>
                {flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{flash}</div> : null}
            </Card>

            <Card className="overflow-x-auto p-0">
                <table className="w-full min-w-[980px] text-sm">
                    <thead className="bg-[rgb(var(--panel2))] text-[rgb(var(--muted))]">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium">姓名</th>
                            <th className="px-3 py-2 text-left font-medium">電話</th>
                            <th className="px-3 py-2 text-left font-medium">Email</th>
                            <th className="px-3 py-2 text-left font-medium">地址</th>
                            <th className="px-3 py-2 text-left font-medium">權限</th>
                            <th className="px-3 py-2 text-left font-medium">刪除者</th>
                            <th className="px-3 py-2 text-left font-medium">刪除原因</th>
                            <th className="px-3 py-2 text-left font-medium">刪除時間</th>
                            <th className="px-3 py-2 text-left font-medium">狀態</th>
                            <th className="px-3 py-2 text-left font-medium">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => {
                            const snapshot = log.snapshot ?? {};
                            const name = typeof snapshot.name === "string" ? snapshot.name : log.targetLabel;
                            const phone = typeof snapshot.phone === "string" ? snapshot.phone : "-";
                            const email = typeof snapshot.email === "string" ? snapshot.email : "-";
                            const address = typeof snapshot.address === "string" ? snapshot.address : "-";
                            const roleLevel = typeof snapshot.roleLevel === "number" ? snapshot.roleLevel : "-";
                            const roleName = typeof snapshot.roleNameSnapshot === "string" ? snapshot.roleNameSnapshot : "-";
                            return (
                                <tr key={log.id} className="border-t border-[rgb(var(--border))] align-top">
                                    <td className="px-3 py-2">{name}</td>
                                    <td className="px-3 py-2">{phone}</td>
                                    <td className="px-3 py-2">{email}</td>
                                    <td className="px-3 py-2">{address}</td>
                                    <td className="px-3 py-2">
                                        <div className="grid gap-1">
                                            <span>Lv{roleLevel}</span>
                                            <span className="text-xs text-[rgb(var(--muted))]">{roleName}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">{log.deletedByName || log.deletedBy || "-"}</td>
                                    <td className="px-3 py-2">{log.deleteReason || "-"}</td>
                                    <td className="px-3 py-2">{log.deletedAt || "-"}</td>
                                    <td className="px-3 py-2">
                                        <StatusBadge label={statusLabel(log.status, lang)} tone={statusTone(log.status)} />
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="grid gap-2">
                                        <form action={restoreAction} className="grid gap-1">
                                            <input type="hidden" name="deleteLogId" value={log.id} />
                                            <Input name="restoreReason" placeholder="恢復原因" required className="h-7 text-xs" />
                                            <select name="restoreMode" defaultValue="active" className="h-7 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 text-xs">
                                                <option value="active">恢復為 active</option>
                                                <option value="inactive">恢復為 inactive</option>
                                            </select>
                                            <label className="flex items-center gap-1 text-xs">
                                                <input name="resetPassword" type="checkbox" className="h-3.5 w-3.5 accent-[rgb(var(--accent))]" />
                                                重置密碼
                                            </label>
                                            <label className="flex items-center gap-1 text-xs">
                                                <input name="requirePasswordChange" type="checkbox" className="h-3.5 w-3.5 accent-[rgb(var(--accent))]" />
                                                下次登入要求改密碼
                                            </label>
                                            <div className="flex flex-wrap gap-1">
                                                <IconTextActionButton type="submit" icon={RotateCcw} label="恢復員工" tooltip="恢復員工資料" className="h-8 px-3 text-xs">
                                                    恢復員工
                                                </IconTextActionButton>
                                            </div>
                                            </form>
                                            <form action={hardDeleteAction} className="grid gap-1">
                                                <input type="hidden" name="deleteLogId" value={log.id} />
                                                <p className="text-[11px] text-[rgb(var(--muted))]">
                                                    此操作將永久移除員工資料，完成後無法復原，僅限最高權限或授權人員操作
                                                </p>
                                                <Input name="reason" placeholder="永久刪除原因" required className="h-7 text-xs" />
                                                <Input name="authorizationPassword" placeholder="授權密碼" type="password" required className="h-7 text-xs" />
                                                <IconTextActionButton type="submit" icon={Trash2} label="永久刪除員工" tooltip="永久刪除員工資料" className="h-8 px-3 text-xs">
                                                    永久刪除員工
                                                </IconTextActionButton>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-3 py-8 text-center text-[rgb(var(--muted))]">
                                    沒有員工刪除紀錄
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
