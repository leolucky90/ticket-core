import type { AuditLog } from "@/lib/schema";
import type { UiLanguage } from "@/lib/i18n/ui-text";
import { getUiText } from "@/lib/i18n/ui-text";
import { EmptyStateCard, MerchantSectionCard } from "@/components/merchant/shell";
import { Search } from "lucide-react";

function formatAuditTime(iso: string, lang: UiLanguage): string {
    const ts = Date.parse(iso);
    if (!Number.isFinite(ts)) return iso;
    return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "zh-TW", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(ts));
}

export type AuditLogsPanelProps = {
    logs: AuditLog[];
    lang: UiLanguage;
};

export function AuditLogsPanel({ logs, lang }: AuditLogsPanelProps) {
    const ui = getUiText(lang).auditLogs;
    return (
        <MerchantSectionCard title={ui.listTitle} description={ui.listHint}>
            {logs.length === 0 ? (
                <EmptyStateCard
                    icon={Search}
                    title={ui.emptyTitle}
                    description={ui.emptyDescription}
                    className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-[rgb(var(--muted))]">
                                <th className="px-2 py-2">{ui.timeCol}</th>
                                <th className="px-2 py-2">{ui.moduleCol}</th>
                                <th className="px-2 py-2">{ui.actionCol}</th>
                                <th className="px-2 py-2">{ui.targetCol}</th>
                                <th className="px-2 py-2">{ui.operatorCol}</th>
                                <th className="px-2 py-2">{ui.reasonCol}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="border-t border-[rgb(var(--border))]">
                                    <td className="px-2 py-2 whitespace-nowrap">{formatAuditTime(log.createdAt, lang)}</td>
                                    <td className="px-2 py-2">{log.module}</td>
                                    <td className="px-2 py-2">{log.action}</td>
                                    <td className="px-2 py-2">{log.targetId}</td>
                                    <td className="px-2 py-2">
                                        <div>{log.operatorName || "-"}</div>
                                        <div className="text-xs text-[rgb(var(--muted))]">{log.operatorId || "-"}</div>
                                    </td>
                                    <td className="px-2 py-2 max-w-[240px] truncate" title={log.reason ?? ""}>
                                        {log.reason ?? "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </MerchantSectionCard>
    );
}
