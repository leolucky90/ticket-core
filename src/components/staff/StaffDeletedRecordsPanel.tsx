import { RotateCcw, Search } from "lucide-react";
import { MerchantListShell, MerchantSectionCard, SearchToolbar } from "@/components/merchant/shell";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import type { DeleteLog } from "@/lib/schema";
import { formatIsoForDisplay } from "@/lib/format/datetime-display";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { StaffDeletedPendingBlock } from "@/components/staff/StaffDeletedPendingBlock";
import { StaffDeletedVaultBlock } from "@/components/staff/StaffDeletedVaultBlock";
import { primaryReasonForLog, snapshotName } from "@/components/staff/staff-deleted-helpers";

type StaffDeletedRecordsPanelProps = {
    queueLogs: DeleteLog[];
    historyLogs: DeleteLog[];
    vaultLogs: DeleteLog[];
    canViewVault: boolean;
    keyword: string;
    restoreAction: (formData: FormData) => Promise<void>;
    hardDeleteAction: (formData: FormData) => Promise<void>;
    restoreHardDeleteAction: (formData: FormData) => Promise<void>;
    purgeDeleteLogAction: (formData: FormData) => Promise<void>;
    flash?: string;
    lang: "zh" | "en";
};

function statusTone(status: DeleteLog["status"]) {
    if (status === "restored") return "success";
    if (status === "hard_deleted") return "danger";
    return "warning";
}

function logStatusLabel(status: DeleteLog["status"], lang: "zh" | "en"): string {
    if (lang === "en") {
        if (status === "restored") return "Restored";
        if (status === "hard_deleted") return "Hard deleted";
        return "Soft deleted (pending)";
    }
    if (status === "restored") return "已復原";
    if (status === "hard_deleted") return "已永久刪除";
    return "軟刪除（待處理）";
}

export function StaffDeletedRecordsPanel({
    queueLogs,
    historyLogs,
    vaultLogs,
    canViewVault,
    keyword,
    restoreAction,
    hardDeleteAction,
    restoreHardDeleteAction,
    purgeDeleteLogAction,
    flash,
    lang,
}: StaffDeletedRecordsPanelProps) {
    const zh = lang === "zh";
    const ui = zh
        ? {
              searchPlaceholder: "搜尋姓名 / 信箱 / 電話",
              search: "搜尋",
              clearSearch: "清除搜尋",
              clearSearchTip: "清除搜尋條件",
              pendingTitle: "待處理（軟刪除）",
              pendingDesc: (n: number) => `共 ${n} 筆待恢復或永久刪除`,
              pendingEmptyTitle: "沒有待處理的軟刪除員工",
              pendingEmptyDesc: "軟刪除後尚未恢復或永久刪除的紀錄會出現在此；操作完成後會從此清單移除。",
              historyTitle: "操作歷史",
              historyDesc: (n: number) => `共 ${n} 筆紀錄（僅供查閱）`,
              historyScrollHint: "資料多時可於下方區域捲動瀏覽。",
              historyEmpty: "尚無紀錄",
              historyColStaff: "員工",
              historyColStatus: "紀錄狀態",
              historyColReason: "原因",
              historyColOperationTime: "操作時間",
              historyColRestored: "恢復時間",
              historyColHard: "永久刪除時間",
              vaultTitle: "Lv9 · 永久刪除存檔",
              vaultDesc: (n: number) => `共 ${n} 筆（可復原員工資料或移除紀錄）`,
              vaultEmpty: "沒有永久刪除存檔",
              vaultPurgeNote: "僅移除刪除紀錄文件，不影響已不存在的員工資料檔。",
              restoreReason: "恢復原因",
              restoreModeActive: "恢復為啟用 (active)",
              restoreModeInactive: "恢復為停用 (inactive)",
              hardDeleteReason: "永久刪除原因",
              authPassword: "授權密碼",
              hardDeleteWarn: "此操作將永久移除員工資料，僅限授權人員。請於視窗內填寫原因與授權密碼。",
              pendingScrollHint: "資料多時可於下方區域捲動瀏覽；操作請點圖示並於彈出視窗填寫。",
              restoreTooltip: "恢復員工",
              hardDeleteTooltip: "永久刪除員工",
              restoreModalTitle: "恢復員工",
              hardModalTitle: "永久刪除員工",
              modalCancel: "取消",
              modalSubmitRestore: "確認恢復",
              modalSubmitHard: "確認永久刪除",
              phone: "電話",
              email: "Email",
              deletedBy: "刪除者",
              actions: "操作",
              vaultScrollHint: "可於區域內捲動；操作請點圖示並於視窗確認。",
              vaultRestoreTooltip: "復原員工資料",
              vaultPurgeTooltip: "移除刪除紀錄",
              vaultRestoreModalTitle: "從存檔復原員工",
              vaultPurgeModalTitle: "移除刪除紀錄",
              vaultPurgeModalBody: "將從資料庫刪除此筆刪除紀錄文件，無法還原此紀錄本身。確定要繼續嗎？",
              modalSubmitPurge: "確認移除",
          }
        : {
              searchPlaceholder: "Search name / email / phone",
              search: "Search",
              clearSearch: "Clear",
              clearSearchTip: "Clear search",
              pendingTitle: "Pending (soft-deleted)",
              pendingDesc: (n: number) => `${n} pending — restore or hard-delete`,
              pendingEmptyTitle: "No pending soft-deleted staff",
              pendingEmptyDesc: "Records appear here until restored or hard-deleted; then they leave this list.",
              historyTitle: "History",
              historyDesc: (n: number) => `${n} record(s) (read-only)`,
              historyScrollHint: "Scroll the area below when there are many rows.",
              historyEmpty: "No history yet",
              historyColStaff: "Staff",
              historyColStatus: "Log status",
              historyColReason: "Reason",
              historyColOperationTime: "Operation time",
              historyColRestored: "Restored at",
              historyColHard: "Hard-deleted at",
              vaultTitle: "Lv9 · Hard-delete archive",
              vaultDesc: (n: number) => `${n} in archive — restore data or purge log`,
              vaultEmpty: "No hard-delete archive entries",
              vaultPurgeNote: "Removes only the delete-log document.",
              restoreReason: "Restore reason",
              restoreModeActive: "Restore as active",
              restoreModeInactive: "Restore as inactive",
              hardDeleteReason: "Hard delete reason",
              authPassword: "Authorization password",
              hardDeleteWarn: "This permanently removes the staff document. Enter reason and authorization password below.",
              pendingScrollHint: "Scroll the list below when needed. Use icons — a dialog will ask for details.",
              restoreTooltip: "Restore staff",
              hardDeleteTooltip: "Hard-delete staff",
              restoreModalTitle: "Restore staff",
              hardModalTitle: "Hard-delete staff",
              modalCancel: "Cancel",
              modalSubmitRestore: "Confirm restore",
              modalSubmitHard: "Confirm hard delete",
              phone: "Phone",
              email: "Email",
              deletedBy: "Deleted by",
              actions: "Actions",
              vaultScrollHint: "Scroll inside the frame. Use icons to open confirmation dialogs.",
              vaultRestoreTooltip: "Restore staff data",
              vaultPurgeTooltip: "Remove log entry",
              vaultRestoreModalTitle: "Restore from archive",
              vaultPurgeModalTitle: "Remove delete log",
              vaultPurgeModalBody: "This deletes the delete-log document from the database. This cannot be undone. Continue?",
              modalSubmitPurge: "Remove log",
          };

    const pendingUi = {
        historyColStaff: ui.historyColStaff,
        historyColReason: ui.historyColReason,
        historyColOperationTime: ui.historyColOperationTime,
        phone: ui.phone,
        email: ui.email,
        deletedBy: ui.deletedBy,
        actions: ui.actions,
        pendingScrollHint: ui.pendingScrollHint,
        restoreTooltip: ui.restoreTooltip,
        hardDeleteTooltip: ui.hardDeleteTooltip,
        restoreModalTitle: ui.restoreModalTitle,
        hardModalTitle: ui.hardModalTitle,
        modalCancel: ui.modalCancel,
        modalSubmitRestore: ui.modalSubmitRestore,
        modalSubmitHard: ui.modalSubmitHard,
        restoreReason: ui.restoreReason,
        restoreModeActive: ui.restoreModeActive,
        restoreModeInactive: ui.restoreModeInactive,
        hardDeleteReason: ui.hardDeleteReason,
        authPassword: ui.authPassword,
        hardDeleteWarn: ui.hardDeleteWarn,
    };

    const vaultUi = {
        historyColStaff: ui.historyColStaff,
        historyColReason: ui.historyColReason,
        historyColOperationTime: ui.historyColOperationTime,
        historyColHard: ui.historyColHard,
        actions: ui.actions,
        vaultScrollHint: ui.vaultScrollHint,
        restoreTooltip: ui.vaultRestoreTooltip,
        purgeTooltip: ui.vaultPurgeTooltip,
        restoreModalTitle: ui.vaultRestoreModalTitle,
        purgeModalTitle: ui.vaultPurgeModalTitle,
        purgeModalBody: ui.vaultPurgeModalBody,
        modalCancel: ui.modalCancel,
        modalSubmitRestore: ui.modalSubmitRestore,
        modalSubmitPurge: ui.modalSubmitPurge,
        restoreReason: ui.restoreReason,
        restoreModeActive: ui.restoreModeActive,
        restoreModeInactive: ui.restoreModeInactive,
        vaultPurgeNote: ui.vaultPurgeNote,
    };

    const allForSearch = historyLogs;
    const deletedStaffSuggestions = allForSearch.map((log) => {
        const snapshot = log.snapshot ?? {};
        const name = typeof snapshot.name === "string" ? snapshot.name : log.targetLabel;
        const phone = typeof snapshot.phone === "string" ? snapshot.phone : "";
        const email = typeof snapshot.email === "string" ? snapshot.email : "";
        return {
            id: log.id,
            value: name,
            title: name,
            subtitle: [email, formatIsoForDisplay(log.deletedAt, lang)].filter(Boolean).join(" / ") || undefined,
            keywords: [
                name,
                phone,
                email,
                log.targetLabel,
                log.deletedByName,
                log.deletedBy,
                log.deleteReason,
                log.restoreReason,
                log.hardDeleteReason,
            ].filter((value): value is string => Boolean(value)),
        };
    });

    const toolbar = (
        <div className="space-y-3">
            <SearchToolbar
                searchSlot={
                    <form method="get" className="flex flex-wrap gap-2">
                        <MerchantPredictiveSearchInput
                            name="keyword"
                            defaultValue={keyword}
                            placeholder={ui.searchPlaceholder}
                            localSuggestions={deletedStaffSuggestions}
                            className="max-w-sm flex-1"
                        />
                        <IconActionButton type="submit" icon={Search} label={ui.search} tooltip={ui.search} className="h-10 w-10" />
                        <IconActionButton href="/staff/deleted" icon={RotateCcw} label={ui.clearSearch} tooltip={ui.clearSearchTip} className="h-10 w-10" />
                    </form>
                }
            />
            {flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{flash}</div> : null}
        </div>
    );

    const pendingList = (
        <MerchantSectionCard
            title={ui.pendingTitle}
            description={ui.pendingDesc(queueLogs.length)}
            emptyState={
                queueLogs.length === 0
                    ? {
                          icon: Search,
                          title: ui.pendingEmptyTitle,
                          description: ui.pendingEmptyDesc,
                      }
                    : undefined
            }
        >
            {queueLogs.length === 0 ? null : (
                <StaffDeletedPendingBlock
                    queueLogs={queueLogs}
                    restoreAction={restoreAction}
                    hardDeleteAction={hardDeleteAction}
                    lang={lang}
                    ui={pendingUi}
                />
            )}
        </MerchantSectionCard>
    );

    const historyList = (
        <MerchantSectionCard
            title={ui.historyTitle}
            description={
                historyLogs.length > 0 ? `${ui.historyDesc(historyLogs.length)} ${ui.historyScrollHint}` : ui.historyDesc(historyLogs.length)
            }
            emptyState={
                historyLogs.length === 0
                    ? {
                          icon: Search,
                          title: ui.historyEmpty,
                          description: zh ? "符合搜尋條件的紀錄會顯示於此。" : "Matching records appear here.",
                      }
                    : undefined
            }
        >
            {historyLogs.length === 0 ? null : (
                <div className="max-h-[min(60vh,520px)] overflow-x-auto overflow-y-auto rounded-xl border border-[rgb(var(--border))]">
                    <table className={`w-full text-sm ${canViewVault ? "min-w-[900px]" : "min-w-[760px]"}`}>
                        <thead className="sticky top-0 z-10 border-b border-[rgb(var(--border))] bg-[rgb(var(--panel2))] text-[rgb(var(--muted))] shadow-[0_1px_0_rgb(var(--border))]">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium">{ui.historyColStaff}</th>
                                <th className="px-3 py-2 text-left font-medium">{ui.historyColStatus}</th>
                                <th className="px-3 py-2 text-left font-medium">{ui.historyColReason}</th>
                                <th className="px-3 py-2 text-left font-medium">{ui.historyColOperationTime}</th>
                                <th className="px-3 py-2 text-left font-medium">{ui.historyColRestored}</th>
                                {canViewVault ? <th className="px-3 py-2 text-left font-medium">{ui.historyColHard}</th> : null}
                            </tr>
                        </thead>
                        <tbody>
                            {historyLogs.map((log) => (
                                <tr key={log.id} className="border-t border-[rgb(var(--border))] align-top">
                                    <td className="px-3 py-2">{snapshotName(log)}</td>
                                    <td className="px-3 py-2">
                                        <StatusBadge label={logStatusLabel(log.status, lang)} tone={statusTone(log.status)} />
                                    </td>
                                    <td className="max-w-[18rem] px-3 py-2 break-words">{primaryReasonForLog(log)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{formatIsoForDisplay(log.deletedAt, lang)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{formatIsoForDisplay(log.restoredAt, lang)}</td>
                                    {canViewVault ? <td className="px-3 py-2 whitespace-nowrap">{formatIsoForDisplay(log.hardDeletedAt, lang)}</td> : null}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </MerchantSectionCard>
    );

    const vaultList =
        canViewVault && vaultLogs.length > 0 ? (
            <MerchantSectionCard title={ui.vaultTitle} description={ui.vaultDesc(vaultLogs.length)}>
                <StaffDeletedVaultBlock
                    vaultLogs={vaultLogs}
                    restoreHardDeleteAction={restoreHardDeleteAction}
                    purgeDeleteLogAction={purgeDeleteLogAction}
                    lang={lang}
                    ui={vaultUi}
                />
            </MerchantSectionCard>
        ) : canViewVault ? (
            <MerchantSectionCard title={ui.vaultTitle} description={ui.vaultDesc(0)}>
                <p className="text-sm text-[rgb(var(--muted))]">{ui.vaultEmpty}</p>
            </MerchantSectionCard>
        ) : null;

    const list = (
        <div className="space-y-6">
            {pendingList}
            {historyList}
            {vaultList}
        </div>
    );

    return <MerchantListShell toolbar={toolbar} list={list} />;
}
