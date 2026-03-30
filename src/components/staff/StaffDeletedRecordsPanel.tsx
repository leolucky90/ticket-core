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
import type { UiLanguage } from "@/lib/i18n/ui-text";
import { getUiText } from "@/lib/i18n/ui-text";

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
    lang: UiLanguage;
};

function statusTone(status: DeleteLog["status"]) {
    if (status === "restored") return "success";
    if (status === "hard_deleted") return "danger";
    return "warning";
}

function logStatusLabel(status: DeleteLog["status"], lang: UiLanguage): string {
    const m = getUiText(lang).staffDeletedRecords;
    if (status === "restored") return m.logStatusRestored;
    if (status === "hard_deleted") return m.logStatusHardDeleted;
    return m.logStatusSoftPending;
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
    const t = getUiText(lang).staffDeletedRecords;
    const ui = {
        searchPlaceholder: t.searchPlaceholder,
        search: t.search,
        clearSearch: t.clearSearch,
        clearSearchTip: t.clearSearchTip,
        pendingTitle: t.pendingTitle,
        pendingDesc: (n: number) => t.pendingDesc.replace("{count}", String(n)),
        pendingEmptyTitle: t.pendingEmptyTitle,
        pendingEmptyDesc: t.pendingEmptyDesc,
        historyTitle: t.historyTitle,
        historyDesc: (n: number) => t.historyDesc.replace("{count}", String(n)),
        historyScrollHint: t.historyScrollHint,
        historyEmpty: t.historyEmpty,
        historyEmptyDescription: t.historyEmptyDescription,
        historyColStaff: t.historyColStaff,
        historyColStatus: t.historyColStatus,
        historyColReason: t.historyColReason,
        historyColOperationTime: t.historyColOperationTime,
        historyColRestored: t.historyColRestored,
        historyColHard: t.historyColHard,
        vaultTitle: t.vaultTitle,
        vaultDesc: (n: number) => t.vaultDesc.replace("{count}", String(n)),
        vaultEmpty: t.vaultEmpty,
        vaultPurgeNote: t.vaultPurgeNote,
        restoreReason: t.restoreReason,
        restoreModeActive: t.restoreModeActive,
        restoreModeInactive: t.restoreModeInactive,
        hardDeleteReason: t.hardDeleteReason,
        authPassword: t.authPassword,
        hardDeleteWarn: t.hardDeleteWarn,
        pendingScrollHint: t.pendingScrollHint,
        restoreTooltip: t.restoreTooltip,
        hardDeleteTooltip: t.hardDeleteTooltip,
        restoreModalTitle: t.restoreModalTitle,
        hardModalTitle: t.hardModalTitle,
        modalCancel: t.modalCancel,
        modalSubmitRestore: t.modalSubmitRestore,
        modalSubmitHard: t.modalSubmitHard,
        phone: t.phone,
        email: t.email,
        deletedBy: t.deletedBy,
        actions: t.actions,
        vaultScrollHint: t.vaultScrollHint,
        vaultRestoreTooltip: t.vaultRestoreTooltip,
        vaultPurgeTooltip: t.vaultPurgeTooltip,
        vaultRestoreModalTitle: t.vaultRestoreModalTitle,
        vaultPurgeModalTitle: t.vaultPurgeModalTitle,
        vaultPurgeModalBody: t.vaultPurgeModalBody,
        modalSubmitPurge: t.modalSubmitPurge,
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
        restoreStatusLabel: t.restoreStatusLabel,
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
        restoreStatusLabel: t.restoreStatusLabel,
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
                          description: ui.historyEmptyDescription,
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
