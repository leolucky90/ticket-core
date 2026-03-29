"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DeleteLog } from "@/lib/schema";
import { formatIsoForDisplay } from "@/lib/format/datetime-display";
import { primaryReasonForLog, snapshotName, snapshotPhone } from "@/components/staff/staff-deleted-helpers";
import { isRedirectError } from "next/dist/client/components/redirect-error";

type PendingUi = {
    historyColStaff: string;
    historyColReason: string;
    historyColOperationTime: string;
    phone: string;
    email: string;
    deletedBy: string;
    actions: string;
    pendingScrollHint: string;
    restoreTooltip: string;
    hardDeleteTooltip: string;
    restoreModalTitle: string;
    hardModalTitle: string;
    modalCancel: string;
    modalSubmitRestore: string;
    modalSubmitHard: string;
    restoreReason: string;
    restoreModeActive: string;
    restoreModeInactive: string;
    hardDeleteReason: string;
    authPassword: string;
    hardDeleteWarn: string;
};

type StaffDeletedPendingBlockProps = {
    queueLogs: DeleteLog[];
    restoreAction: (formData: FormData) => Promise<void>;
    hardDeleteAction: (formData: FormData) => Promise<void>;
    lang: "zh" | "en";
    ui: PendingUi;
};

export function StaffDeletedPendingBlock({ queueLogs, restoreAction, hardDeleteAction, lang, ui }: StaffDeletedPendingBlockProps) {
    const [restoreLog, setRestoreLog] = useState<DeleteLog | null>(null);
    const [hardLog, setHardLog] = useState<DeleteLog | null>(null);
    const zh = lang === "zh";

    useEffect(() => {
        if (!restoreLog && !hardLog) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setRestoreLog(null);
                setHardLog(null);
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [restoreLog, hardLog]);

    if (queueLogs.length === 0) return null;

    return (
        <>
            <p className="mb-2 text-xs text-[rgb(var(--muted))]">{ui.pendingScrollHint}</p>
            <div className="max-h-[min(60vh,520px)] overflow-x-auto overflow-y-auto rounded-xl border border-[rgb(var(--border))]">
                <table className="w-full min-w-[800px] text-sm">
                    <thead className="sticky top-0 z-10 border-b border-[rgb(var(--border))] bg-[rgb(var(--panel2))] text-[rgb(var(--muted))] shadow-[0_1px_0_rgb(var(--border))]">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium">{ui.historyColStaff}</th>
                            <th className="px-3 py-2 text-left font-medium">{ui.phone}</th>
                            <th className="px-3 py-2 text-left font-medium">{ui.email}</th>
                            <th className="px-3 py-2 text-left font-medium">{ui.historyColReason}</th>
                            <th className="px-3 py-2 text-left font-medium">{ui.historyColOperationTime}</th>
                            <th className="px-3 py-2 text-left font-medium">{ui.deletedBy}</th>
                            <th className="px-3 py-2 text-left font-medium">{ui.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {queueLogs.map((log) => (
                            <tr key={log.id} className="border-t border-[rgb(var(--border))] align-middle">
                                <td className="px-3 py-2 font-medium text-[rgb(var(--text))]">{snapshotName(log)}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{snapshotPhone(log)}</td>
                                <td className="max-w-[12rem] px-3 py-2 break-all">
                                    {typeof log.snapshot?.email === "string" ? log.snapshot.email : "-"}
                                </td>
                                <td className="max-w-[14rem] px-3 py-2 break-words">{primaryReasonForLog(log)}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{formatIsoForDisplay(log.deletedAt, lang)}</td>
                                <td className="px-3 py-2">{log.deletedByName || log.deletedBy || "-"}</td>
                                <td className="px-3 py-2">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <IconActionButton
                                            type="button"
                                            icon={RotateCcw}
                                            label={ui.restoreTooltip}
                                            tooltip={ui.restoreTooltip}
                                            className="h-9 w-9"
                                            onClick={() => {
                                                setHardLog(null);
                                                setRestoreLog(log);
                                            }}
                                        />
                                        <IconActionButton
                                            type="button"
                                            icon={Trash2}
                                            label={ui.hardDeleteTooltip}
                                            tooltip={ui.hardDeleteTooltip}
                                            className="h-9 w-9"
                                            onClick={() => {
                                                setRestoreLog(null);
                                                setHardLog(log);
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
                    <button
                        type="button"
                        className="absolute inset-0 bg-[rgb(var(--bg))]/70"
                        aria-label={ui.modalCancel}
                        onClick={() => setRestoreLog(null)}
                    />
                    <div
                        className="relative z-10 w-full max-w-md rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4 shadow-xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="restore-modal-title"
                    >
                        <div className="mb-3 flex items-start justify-between gap-2">
                            <div>
                                <div id="restore-modal-title" className="text-sm font-semibold text-[rgb(var(--text))]">
                                    {ui.restoreModalTitle}
                                </div>
                                <div className="mt-0.5 text-xs text-[rgb(var(--muted))]">{snapshotName(restoreLog)}</div>
                            </div>
                            <button
                                type="button"
                                className="rounded-md border border-[rgb(var(--border))] px-2 py-0.5 text-sm text-[rgb(var(--muted))] hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--text))]"
                                onClick={() => setRestoreLog(null)}
                            >
                                ×
                            </button>
                        </div>
                        <form
                            action={async (fd) => {
                                try {
                                    await restoreAction(fd);
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
                                <span className="text-[rgb(var(--muted))]">{zh ? "恢復狀態" : "Restore status"}</span>
                                <select
                                    name="restoreMode"
                                    defaultValue="active"
                                    className="h-10 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 text-[rgb(var(--text))]"
                                >
                                    <option value="active">{ui.restoreModeActive}</option>
                                    <option value="inactive">{ui.restoreModeInactive}</option>
                                </select>
                            </label>
                            <div className="mt-1 flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setRestoreLog(null)}>
                                    {ui.modalCancel}
                                </Button>
                                <Button type="submit">{ui.modalSubmitRestore}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {hardLog ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-[rgb(var(--bg))]/70"
                        aria-label={ui.modalCancel}
                        onClick={() => setHardLog(null)}
                    />
                    <div
                        className="relative z-10 w-full max-w-md rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4 shadow-xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="hard-modal-title"
                    >
                        <div className="mb-3 flex items-start justify-between gap-2">
                            <div>
                                <div id="hard-modal-title" className="text-sm font-semibold text-[rgb(var(--text))]">
                                    {ui.hardModalTitle}
                                </div>
                                <div className="mt-0.5 text-xs text-[rgb(var(--muted))]">{snapshotName(hardLog)}</div>
                            </div>
                            <button
                                type="button"
                                className="rounded-md border border-[rgb(var(--border))] px-2 py-0.5 text-sm text-[rgb(var(--muted))] hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--text))]"
                                onClick={() => setHardLog(null)}
                            >
                                ×
                            </button>
                        </div>
                        <p className="mb-3 text-xs text-[rgb(var(--muted))]">{ui.hardDeleteWarn}</p>
                        <form
                            action={async (fd) => {
                                try {
                                    await hardDeleteAction(fd);
                                } catch (e) {
                                    if (isRedirectError(e)) throw e;
                                    throw e;
                                }
                            }}
                            className="grid gap-3"
                        >
                            <input type="hidden" name="deleteLogId" value={hardLog.id} />
                            <label className="grid gap-1 text-sm">
                                <span className="text-[rgb(var(--muted))]">{ui.hardDeleteReason}</span>
                                <Input name="reason" required placeholder={ui.hardDeleteReason} className="h-10" />
                            </label>
                            <label className="grid gap-1 text-sm">
                                <span className="text-[rgb(var(--muted))]">{ui.authPassword}</span>
                                <Input name="authorizationPassword" type="password" required placeholder={ui.authPassword} className="h-10" autoComplete="current-password" />
                            </label>
                            <div className="mt-1 flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setHardLog(null)}>
                                    {ui.modalCancel}
                                </Button>
                                <Button type="submit">{ui.modalSubmitHard}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </>
    );
}
