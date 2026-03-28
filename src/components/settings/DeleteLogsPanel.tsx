import { RotateCcw, RotateCcwSquare, Search, Trash2 } from "lucide-react";
import { MerchantListPagination, MerchantListShell, MerchantSectionCard, SearchToolbar } from "@/components/merchant/shell";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import type { DeleteLog } from "@/lib/schema";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import type { UiLanguage } from "@/lib/i18n/ui-text";
import { getUiText } from "@/lib/i18n/ui-text";
import { LIST_DISPLAY_OPTIONS } from "@/lib/ui/list-display";

type DeleteLogsPanelProps = {
    lang: UiLanguage;
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
    lang,
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
    const ui = getUiText(lang).deleteLogs;
    const isZh = lang === "zh";
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
    const listCountLabel = isZh ? `共 ${logs.length} 筆` : `${logs.length} record${logs.length === 1 ? "" : "s"}`;
    const summaryLabel = isZh
        ? `共 ${logs.length} 筆刪除紀錄，${ui.resultSummary}`
        : `${logs.length} delete log record${logs.length === 1 ? "" : "s"}. ${ui.resultSummary}`;

    function formatStatusLabel(status: DeleteLog["status"]) {
        if (status === "restored") return ui.statusRestored;
        if (status === "hard_deleted") return ui.statusHardDeleted;
        return ui.statusSoftDeleted;
    }

    const toolbar = (
        <div className="space-y-3">
            <SearchToolbar
                searchSlot={
                    <form method="get" className="grid gap-2 md:grid-cols-4">
                        <MerchantPredictiveSearchInput
                            name="module"
                            placeholder={ui.modulePlaceholder}
                            defaultValue={filters.module ?? ""}
                            localSuggestions={moduleSuggestions}
                        />
                        <MerchantPredictiveSearchInput
                            name="keyword"
                            placeholder={ui.keywordPlaceholder}
                            defaultValue={filters.keyword ?? ""}
                            localSuggestions={keywordSuggestions}
                        />
                        <MerchantPredictiveSearchInput
                            name="deletedBy"
                            placeholder={ui.deletedByPlaceholder}
                            defaultValue={filters.deletedBy ?? ""}
                            localSuggestions={deletedBySuggestions}
                        />
                        <MerchantPredictiveSearchInput
                            name="deleteReason"
                            placeholder={ui.deleteReasonPlaceholder}
                            defaultValue={filters.deleteReason ?? ""}
                            localSuggestions={reasonSuggestions}
                        />
                        <Input name="dateFrom" type="date" defaultValue={filters.dateFrom ?? ""} />
                        <Input name="dateTo" type="date" defaultValue={filters.dateTo ?? ""} />
                        <Select name="status" defaultValue={filters.status ?? ""}>
                            <option value="">{ui.allStatus}</option>
                            <option value="soft_deleted">{ui.statusSoftDeleted}</option>
                            <option value="restored">{ui.statusRestored}</option>
                            <option value="hard_deleted">{ui.statusHardDeleted}</option>
                        </Select>
                        <Select name="hardDeleted" defaultValue={filters.hardDeleted ?? ""}>
                            <option value="">{ui.hardDeleteState}</option>
                            <option value="yes">{ui.hardDeletedYes}</option>
                            <option value="no">{ui.hardDeletedNo}</option>
                        </Select>
                        <Select name="restored" defaultValue={filters.restored ?? ""}>
                            <option value="">{ui.restoredState}</option>
                            <option value="yes">{ui.restoredYes}</option>
                            <option value="no">{ui.restoredNo}</option>
                        </Select>
                        <div className="md:col-span-4 flex gap-2">
                            <IconActionButton type="submit" icon={Search} label={ui.searchLogs} tooltip={ui.searchLogs} />
                            <IconActionButton href="/settings/security/delete-logs" icon={RotateCcw} label={ui.clearFilters} tooltip={ui.clearFilterTooltip} />
                        </div>
                    </form>
                }
                toolsSlot={
                    <form method="get" className="flex flex-wrap items-center gap-2">
                        {Object.entries(filters).map(([name, value]) => (value ? <input key={`delete-log-filter-${name}`} type="hidden" name={name} value={value} /> : null))}
                        <span className="text-xs text-[rgb(var(--muted))]">{ui.perPage}</span>
                        <Select name="pageSize" defaultValue={pageSize} className="w-[96px]">
                            {LIST_DISPLAY_OPTIONS.map((size) => (
                                <option key={`delete-log-page-size-${size}`} value={size}>
                                    {size}
                                </option>
                            ))}
                        </Select>
                        <IconActionButton type="submit" icon={Search} label={ui.applyPageSize} tooltip={ui.applyPageSize} />
                    </form>
                }
            />
            {flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{flash}</div> : null}
        </div>
    );

    const list = (
        <MerchantSectionCard
            title={ui.pageTitle}
            description={listCountLabel}
            bodyClassName="space-y-3"
            emptyState={
                logs.length === 0
                    ? {
                          icon: Search,
                          title: ui.noResultsTitle,
                          description: ui.noResultsDescription,
                      }
                    : undefined
            }
        >
            {logs.length === 0 ? null : (
                <>
                    <MerchantListPagination
                        summary={<span>{summaryLabel}</span>}
                        previousAction={
                            <form method="get">
                                {Object.entries(filters).map(([name, value]) => (value ? <input key={`delete-log-prev-${name}`} type="hidden" name={name} value={value} /> : null))}
                                <input type="hidden" name="pageSize" value={pageSize} />
                                {previousCursor ? <input type="hidden" name="cursor" value={previousCursor} /> : null}
                                {previousCursorStack ? <input type="hidden" name="cursorStack" value={previousCursorStack} /> : null}
                                <IconTextActionButton type="submit" icon={RotateCcw} label={ui.previousLogs} tooltip={ui.loadPrevious} className="h-9 px-3" disabled={!currentCursor}>
                                    {ui.previousPage}
                                </IconTextActionButton>
                            </form>
                        }
                        nextAction={
                            <form method="get">
                                {Object.entries(filters).map(([name, value]) => (value ? <input key={`delete-log-next-${name}`} type="hidden" name={name} value={value} /> : null))}
                                <input type="hidden" name="pageSize" value={pageSize} />
                                {nextCursor ? <input type="hidden" name="cursor" value={nextCursor} /> : null}
                                {nextCursorStack ? <input type="hidden" name="cursorStack" value={nextCursorStack} /> : null}
                                <IconTextActionButton
                                    type="submit"
                                    icon={Search}
                                    label={ui.nextLogs}
                                    tooltip={ui.loadNext}
                                    className="h-9 px-3"
                                    disabled={!hasNextPage || !nextCursor}
                                >
                                    {ui.nextPage}
                                </IconTextActionButton>
                            </form>
                        }
                    />
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1240px] text-sm">
                            <thead className="bg-[rgb(var(--panel2))] text-[rgb(var(--muted))]">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium">{ui.moduleColumn}</th>
                                    <th className="px-3 py-2 text-left font-medium">{ui.targetLabelColumn}</th>
                                    <th className="px-3 py-2 text-left font-medium">{ui.targetIdColumn}</th>
                                    <th className="px-3 py-2 text-left font-medium">{ui.statusColumn}</th>
                                    <th className="px-3 py-2 text-left font-medium">{ui.deletedByColumn}</th>
                                    <th className="px-3 py-2 text-left font-medium">{ui.deleteReasonColumn}</th>
                                    <th className="px-3 py-2 text-left font-medium">{ui.deletedAtColumn}</th>
                                    <th className="px-3 py-2 text-left font-medium">{ui.restoredByColumn}</th>
                                    <th className="px-3 py-2 text-left font-medium">{ui.restoredAtColumn}</th>
                                    <th className="px-3 py-2 text-left font-medium">{ui.hardDeletedByColumn}</th>
                                    <th className="px-3 py-2 text-left font-medium">{ui.hardDeletedAtColumn}</th>
                                    <th className="px-3 py-2 text-left font-medium">{ui.actionsColumn}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="border-t border-[rgb(var(--border))] align-top">
                                        <td className="px-3 py-2">{log.module}</td>
                                        <td className="px-3 py-2">{log.targetLabel}</td>
                                        <td className="px-3 py-2">{log.targetId}</td>
                                        <td className="px-3 py-2">
                                            <StatusBadge label={formatStatusLabel(log.status)} tone={tone(log.status)} />
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
                                                    <summary className="cursor-pointer text-xs">{ui.viewDetail}</summary>
                                                    <Textarea
                                                        value={JSON.stringify(log.snapshot ?? {}, null, 2)}
                                                        readOnly
                                                        rows={8}
                                                        className="mt-2 text-xs"
                                                    />
                                                </details>
                                                <form action={restoreAction} className="grid gap-1">
                                                    <input type="hidden" name="deleteLogId" value={log.id} />
                                                    <Input name="restoreReason" placeholder={ui.restoreReason} required className="h-7 text-xs" />
                                                    <IconTextActionButton type="submit" icon={RotateCcwSquare} label={ui.restoreAction} tooltip={ui.restoreTooltip} className="h-8 px-3 text-xs">
                                                        {ui.restoreAction}
                                                    </IconTextActionButton>
                                                </form>
                                                <form action={hardDeleteAction} className="grid gap-1">
                                                    <input type="hidden" name="deleteLogId" value={log.id} />
                                                    <p className="text-[11px] text-[rgb(var(--muted))]">{ui.hardDeleteWarning}</p>
                                                    <Input name="reason" placeholder={ui.hardDeleteReason} required className="h-7 text-xs" />
                                                    <Input
                                                        name="authorizationPassword"
                                                        placeholder={ui.authorizationPassword}
                                                        type="password"
                                                        required
                                                        className="h-7 text-xs"
                                                    />
                                                    <IconTextActionButton
                                                        type="submit"
                                                        icon={Trash2}
                                                        label={ui.hardDeleteAction}
                                                        tooltip={ui.hardDeleteTooltip}
                                                        className="h-8 px-3 text-xs"
                                                    >
                                                        {ui.hardDeleteAction}
                                                    </IconTextActionButton>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </MerchantSectionCard>
    );

    return <MerchantListShell toolbar={toolbar} list={list} />;
}
