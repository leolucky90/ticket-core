import { RotateCcw, RotateCcwSquare, Search, Trash2 } from "lucide-react";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import type { DeleteLog } from "@/lib/schema";
import { Card } from "@/components/ui/card";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";

type DeleteLogsPanelProps = {
    logs: DeleteLog[];
    filters: Record<string, string>;
    pageSize: string;
    currentCursor: string;
    previousCursor: string;
    previousCursorStack: string;
    nextCursor: string;
    nextCursorStack: string;
    hasNextPage: boolean;
    flash?: string;
    restoreAction: (formData: FormData) => Promise<void>;
    hardDeleteAction: (formData: FormData) => Promise<void>;
};

function tone(status: DeleteLog["status"]) {
    if (status === "hard_deleted") return "danger";
    if (status === "restored") return "success";
    return "warning";
}

export function DeleteLogsPanel({
    logs,
    filters,
    pageSize,
    currentCursor,
    previousCursor,
    previousCursorStack,
    nextCursor,
    nextCursorStack,
    hasNextPage,
    flash,
    restoreAction,
    hardDeleteAction,
}: DeleteLogsPanelProps) {
    const moduleSuggestions = Array.from(new Set(logs.map((log) => log.module).filter(Boolean))).map((moduleName) => ({
        id: `module-${moduleName}`,
        value: moduleName,
        title: moduleName,
        keywords: [moduleName],
    }));
    const keywordSuggestions = logs.map((log) => ({
        id: log.id,
        value: log.targetLabel || log.targetId,
        title: log.targetLabel || log.targetId,
        subtitle: [log.module, log.status].filter(Boolean).join(" / ") || undefined,
        keywords: [log.targetLabel, log.targetId, log.module, log.deleteReason, log.deletedByName, log.deletedBy].filter((value): value is string => Boolean(value)),
    }));
    const deletedBySuggestions = Array.from(
        new Set(logs.map((log) => log.deletedByName || log.deletedBy).filter((value): value is string => typeof value === "string" && value.trim().length > 0)),
    ).map((value) => ({
        id: `deleted-by-${value}`,
        value,
        title: value,
        keywords: [value],
    }));
    const reasonSuggestions = Array.from(
        new Set(logs.map((log) => log.deleteReason).filter((value): value is string => typeof value === "string" && value.trim().length > 0)),
    ).map((value) => ({
        id: `reason-${value}`,
        value,
        title: value,
        keywords: [value],
    }));

    return (
        <div className="grid gap-4">
            <Card className="grid gap-3">
                <div className="text-sm font-medium">刪除紀錄查詢</div>
                <form method="get" className="grid gap-2 md:grid-cols-4">
                    <MerchantPredictiveSearchInput name="module" placeholder="module" defaultValue={filters.module ?? ""} localSuggestions={moduleSuggestions} />
                    <MerchantPredictiveSearchInput name="keyword" placeholder="keyword" defaultValue={filters.keyword ?? ""} localSuggestions={keywordSuggestions} />
                    <MerchantPredictiveSearchInput
                        name="deletedBy"
                        placeholder="deletedBy"
                        defaultValue={filters.deletedBy ?? ""}
                        localSuggestions={deletedBySuggestions}
                    />
                    <MerchantPredictiveSearchInput
                        name="deleteReason"
                        placeholder="deleteReason"
                        defaultValue={filters.deleteReason ?? ""}
                        localSuggestions={reasonSuggestions}
                    />
                    <Input name="dateFrom" type="date" defaultValue={filters.dateFrom ?? ""} />
                    <Input name="dateTo" type="date" defaultValue={filters.dateTo ?? ""} />
                    <Select name="status" defaultValue={filters.status ?? ""}>
                        <option value="">全部狀態</option>
                        <option value="soft_deleted">soft_deleted</option>
                        <option value="restored">restored</option>
                        <option value="hard_deleted">hard_deleted</option>
                    </Select>
                    <Select name="hardDeleted" defaultValue={filters.hardDeleted ?? ""}>
                        <option value="">hard delete state</option>
                        <option value="yes">已永久刪除</option>
                        <option value="no">未永久刪除</option>
                    </Select>
                    <Select name="restored" defaultValue={filters.restored ?? ""}>
                        <option value="">restored state</option>
                        <option value="yes">已回復</option>
                        <option value="no">未回復</option>
                    </Select>
                    <div className="md:col-span-4 flex gap-2">
                        <IconActionButton type="submit" icon={Search} label="搜尋刪除紀錄" tooltip="搜尋刪除紀錄" />
                        <IconActionButton href="/settings/security/delete-logs" icon={RotateCcw} label="清除篩選" tooltip="清除篩選條件" />
                    </div>
                </form>
                <form method="get" className="flex flex-wrap items-center gap-2">
                    {Object.entries(filters).map(([name, value]) => (value ? <input key={`delete-log-filter-${name}`} type="hidden" name={name} value={value} /> : null))}
                    <span className="text-xs text-[rgb(var(--muted))]">每頁</span>
                    <Select name="pageSize" defaultValue={pageSize} className="w-[96px]">
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                    </Select>
                    <IconActionButton type="submit" icon={Search} label="套用每頁筆數" tooltip="套用每頁筆數" />
                </form>
                {flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{flash}</div> : null}
            </Card>

            <Card className="overflow-x-auto p-0">
                <div className="flex flex-wrap items-center justify-end gap-2 border-b border-[rgb(var(--border))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
                    <form method="get">
                        {Object.entries(filters).map(([name, value]) => (value ? <input key={`delete-log-prev-${name}`} type="hidden" name={name} value={value} /> : null))}
                        <input type="hidden" name="pageSize" value={pageSize} />
                        {previousCursor ? <input type="hidden" name="cursor" value={previousCursor} /> : null}
                        {previousCursorStack ? <input type="hidden" name="cursorStack" value={previousCursorStack} /> : null}
                        <IconTextActionButton type="submit" icon={RotateCcw} label="上一頁刪除紀錄" tooltip="載入上一頁" className="h-9 px-3" disabled={!currentCursor}>
                            上一頁
                        </IconTextActionButton>
                    </form>
                    <form method="get">
                        {Object.entries(filters).map(([name, value]) => (value ? <input key={`delete-log-next-${name}`} type="hidden" name={name} value={value} /> : null))}
                        <input type="hidden" name="pageSize" value={pageSize} />
                        {nextCursor ? <input type="hidden" name="cursor" value={nextCursor} /> : null}
                        {nextCursorStack ? <input type="hidden" name="cursorStack" value={nextCursorStack} /> : null}
                        <IconTextActionButton
                            type="submit"
                            icon={Search}
                            label="下一頁刪除紀錄"
                            tooltip="載入下一頁"
                            className="h-9 px-3"
                            disabled={!hasNextPage || !nextCursor}
                        >
                            下一頁
                        </IconTextActionButton>
                    </form>
                </div>
                <table className="w-full min-w-[1240px] text-sm">
                    <thead className="bg-[rgb(var(--panel2))] text-[rgb(var(--muted))]">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium">module</th>
                            <th className="px-3 py-2 text-left font-medium">targetLabel</th>
                            <th className="px-3 py-2 text-left font-medium">targetId</th>
                            <th className="px-3 py-2 text-left font-medium">status</th>
                            <th className="px-3 py-2 text-left font-medium">deletedBy</th>
                            <th className="px-3 py-2 text-left font-medium">deleteReason</th>
                            <th className="px-3 py-2 text-left font-medium">deletedAt</th>
                            <th className="px-3 py-2 text-left font-medium">restoredBy</th>
                            <th className="px-3 py-2 text-left font-medium">restoredAt</th>
                            <th className="px-3 py-2 text-left font-medium">hardDeletedBy</th>
                            <th className="px-3 py-2 text-left font-medium">hardDeletedAt</th>
                            <th className="px-3 py-2 text-left font-medium">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id} className="border-t border-[rgb(var(--border))] align-top">
                                <td className="px-3 py-2">{log.module}</td>
                                <td className="px-3 py-2">{log.targetLabel}</td>
                                <td className="px-3 py-2">{log.targetId}</td>
                                <td className="px-3 py-2">
                                    <StatusBadge label={log.status} tone={tone(log.status)} />
                                </td>
                                <td className="px-3 py-2">{log.deletedByName || log.deletedBy || "-"}</td>
                                <td className="px-3 py-2">{log.deleteReason || "-"}</td>
                                <td className="px-3 py-2">{log.deletedAt || "-"}</td>
                                <td className="px-3 py-2">{log.restoredByName || log.restoredBy || "-"}</td>
                                <td className="px-3 py-2">{log.restoredAt || "-"}</td>
                                <td className="px-3 py-2">{log.hardDeletedByName || log.hardDeletedBy || "-"}</td>
                                <td className="px-3 py-2">{log.hardDeletedAt || "-"}</td>
                                <td className="px-3 py-2">
                                    <div className="grid gap-2">
                                        <details className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-2">
                                            <summary className="cursor-pointer text-xs">View detail / snapshot</summary>
                                            <Textarea
                                                value={JSON.stringify(log.snapshot ?? {}, null, 2)}
                                                readOnly
                                                rows={8}
                                                className="mt-2 text-xs"
                                            />
                                        </details>
                                        <form action={restoreAction} className="grid gap-1">
                                            <input type="hidden" name="deleteLogId" value={log.id} />
                                            <Input name="restoreReason" placeholder="回復原因" required className="h-7 text-xs" />
                                            <IconTextActionButton type="submit" icon={RotateCcwSquare} label="回復資料" tooltip="回復刪除資料" className="h-8 px-3 text-xs">
                                                回復資料
                                            </IconTextActionButton>
                                        </form>
                                        <form action={hardDeleteAction} className="grid gap-1">
                                            <input type="hidden" name="deleteLogId" value={log.id} />
                                            <p className="text-[11px] text-[rgb(var(--muted))]">
                                                將永久失去資料，確認後將從資料庫移除，且無法復原
                                            </p>
                                            <Input name="reason" placeholder="永久刪除原因" required className="h-7 text-xs" />
                                            <Input name="authorizationPassword" placeholder="授權密碼" type="password" required className="h-7 text-xs" />
                                            <IconTextActionButton type="submit" icon={Trash2} label="永久刪除" tooltip="永久刪除資料" className="h-8 px-3 text-xs">
                                                永久刪除
                                            </IconTextActionButton>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="px-3 py-8 text-center text-[rgb(var(--muted))]">
                                    查無刪除紀錄
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
