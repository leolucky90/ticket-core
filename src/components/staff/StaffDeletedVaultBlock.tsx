"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DeleteLog } from "@/lib/schema";
import { formatIsoForDisplay } from "@/lib/format/datetime-display";
import { primaryReasonForLog, snapshotName } from "@/components/staff/staff-deleted-helpers";
import { isRedirectError } from "next/dist/client/components/redirect-error";

type VaultUi = {
    historyColStaff: string;
    historyColReason: string;
    historyColOperationTime: string;
    historyColHard: string;
    actions: string;
    vaultScrollHint: string;
    restoreTooltip: string;
    purgeTooltip: string;
    restoreModalTitle: string;
    purgeModalTitle: string;
    purgeModalBody: string;
    modalCancel: string;
    modalSubmitRestore: string;
    modalSubmitPurge: string;
    restoreReason: string;
    restoreModeActive: string;
    restoreModeInactive: string;
    vaultPurgeNote: string;
};

type StaffDeletedVaultBlockProps = {
    vaultLogs: DeleteLog[];
    restoreHardDeleteAction: (formData: FormData) => Promise<void>;
    purgeDeleteLogAction: (formData: FormData) => Promise<void>;
    lang: "zh" | "en";
    ui: VaultUi;
};

export function StaffDeletedVaultBlock({ vaultLogs, restoreHardDeleteAction, purgeDeleteLogAction, lang, ui }: StaffDeletedVaultBlockProps) {
    const [restoreLog, setRestoreLog] = useState<DeleteLog | null>(null);
    const [purgeLog, setPurgeLog] = useState<DeleteLog | null>(null);

    useEffect(() => {
        if (!restoreLog && !purgeLog) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setRestoreLog(null);
                setPurgeLog(null);
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [restoreLog, purgeLog]);

    return (
        <>
            <p className="mb-1 text-xs text-[rgb(var(--muted))]">{ui.vaultPurgeNote}</p>
            <p className="mb-2 text-xs text-[rgb(var(--muted))]">{ui.vaultScrollHint}</p>
            <div className="max-h-[min(50vh,440px)] overflow-x-auto overflow-y-auto rounded-xl border border-[rgb(var(--border))]">
                <table className="w-full min-w-[680px] text-sm">
                    <thead className="sticky top-0 z-10 border-b border-[rgb(var(--border))] bg-[rgb(var(--panel2))] text-[rgb(var(--muted))] shadow-[0_1px_0_rgb(var(--border))]">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium">{ui.historyColStaff}</th>
                            <th className="px-3 py-2 text-left font-medium">{ui.historyColReason}</th>
                            <th className="px-3 py-2 text-left font-medium">{ui.historyColOperationTime}</th>
                            <th className="px-3 py-2 text-left font-medium">{ui.historyColHard}</th>
                            <th className="px-3 py-2 text-left font-medium">{ui.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vaultLogs.map((log) => (
                            <tr key={log.id} className="border-t border-[rgb(var(--border))] align-middle">
                                <td className="px-3 py-2 font-medium">{snapshotName(log)}</td>
                                <td className="max-w-[16rem] px-3 py-2 break-words">{primaryReasonForLog(log)}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{formatIsoForDisplay(log.deletedAt, lang)}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{formatIsoForDisplay(log.hardDeletedAt, lang)}</td>
                                <td className="px-3 py-2">
                                    <div className="flex flex-wrap gap-1.5">
                                        <IconActionButton
                                            type="button"
                                            icon={RotateCcw}
                                            label={ui.restoreTooltip}
                                            tooltip={ui.restoreTooltip}
                                            className="h-9 w-9"
                                            onClick={() => {
                                                setPurgeLog(null);
                                                setRestoreLog(log);
                                            }}
                                        />
                                        <IconActionButton
                                            type="button"
                                            icon={Trash2}
                                            label={ui.purgeTooltip}
                                            tooltip={ui.purgeTooltip}
                                            className="h-9 w-9"
                                            onClick={() => {
                                                setRestoreLog(null);
                                                setPurgeLog(log);
                                            }}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {restoreLog ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button type="button" className="absolute inset-0 bg-[rgb(var(--bg))]/70" aria-label={ui.modalCancel} onClick={() => setRestoreLog(null)} />
                    <div className="relative z-10 w-full max-w-md rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4 shadow-xl" role="dialog" aria-modal="true">
                        <div className="mb-3 flex items-start justify-between gap-2">
                            <div>
                                <div className="text-sm font-semibold text-[rgb(var(--text))]">{ui.restoreModalTitle}</div>
                                <div className="mt-0.5 text-xs text-[rgb(var(--muted))]">{snapshotName(restoreLog)}</div>
                            </div>
                            <button type="button" className="rounded-md border border-[rgb(var(--border))] px-2 py-0.5 text-sm" onClick={() => setRestoreLog(null)}>
                                ×
                            </button>
                        </div>
                        <form
                            action={async (fd) => {
                                try {
                                    await restoreHardDeleteAction(fd);
                                } catch (e) {
                                    if (isRedirectError(e)) throw e;
                                    throw e;
                                }
                            }}
                            className="grid gap-3"
                        >
                            <input type="hidden" name="deleteLogId" value={restoreLog.id} />
                            <label className="grid gap-1 text-sm">
                                <span className="text-[rgb(var(--muted))]">{ui.restoreReason}</span>
                                <Input name="restoreReason" required placeholder={ui.restoreReason} className="h-10" />
                            </label>
                            <label className="grid gap-1 text-sm">
                                <span className="text-[rgb(var(--muted))]">{lang === "zh" ? "恢復狀態" : "Restore status"}</span>
                                <select
                                    name="restoreMode"
                                    defaultValue="active"
                                    className="h-10 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 text-[rgb(var(--text))]"
                                >
                                    <option value="active">{ui.restoreModeActive}</option>
                                    <option value="inactive">{ui.restoreModeInactive}</option>
                                </select>
                            </label>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setRestoreLog(null)}>
                                    {ui.modalCancel}
                                </Button>
                                <Button type="submit">{ui.modalSubmitRestore}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {purgeLog ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button type="button" className="absolute inset-0 bg-[rgb(var(--bg))]/70" aria-label={ui.modalCancel} onClick={() => setPurgeLog(null)} />
                    <div className="relative z-10 w-full max-w-md rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4 shadow-xl" role="dialog" aria-modal="true">
                        <div className="mb-3 flex items-start justify-between gap-2">
                            <div>
                                <div className="text-sm font-semibold text-[rgb(var(--text))]">{ui.purgeModalTitle}</div>
                                <div className="mt-0.5 text-xs text-[rgb(var(--muted))]">{snapshotName(purgeLog)}</div>
                            </div>
                            <button type="button" className="rounded-md border border-[rgb(var(--border))] px-2 py-0.5 text-sm" onClick={() => setPurgeLog(null)}>
                                ×
                            </button>
                        </div>
                        <p className="mb-4 text-sm text-[rgb(var(--text))]">{ui.purgeModalBody}</p>
                        <form
                            action={async (fd) => {
                                try {
                                    await purgeDeleteLogAction(fd);
                                } catch (e) {
                                    if (isRedirectError(e)) throw e;
                                    throw e;
                                }
                            }}
                            className="flex justify-end gap-2"
                        >
                            <input type="hidden" name="deleteLogId" value={purgeLog.id} />
                            <Button type="button" variant="ghost" onClick={() => setPurgeLog(null)}>
                                {ui.modalCancel}
                            </Button>
                            <Button type="submit">{ui.modalSubmitPurge}</Button>
                        </form>
                    </div>
                </div>
            ) : null}
        </>
    );
}
