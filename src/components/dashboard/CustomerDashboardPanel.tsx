import { Card } from "@/components/ui/card";
import { getUiText, type UiLanguage, uiLocale } from "@/lib/i18n/ui-text";
import type { Ticket } from "@/lib/types/ticket";

function formatDateTime(timestamp: number, lang: UiLanguage): string {
    if (!Number.isFinite(timestamp) || timestamp <= 0) return "-";
    return new Date(timestamp).toLocaleString(uiLocale(lang), {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function CustomerDashboardPanel({ tickets, lang = "zh" }: { tickets: Ticket[]; lang?: UiLanguage }) {
    const ui = getUiText(lang).customerDashboardPanel;
    const ticketStatus = getUiText(lang).dashboardCustomerCaseWorkspace.ticketStatus;
    const statusLabel = (status: Ticket["status"]) => (status in ticketStatus ? ticketStatus[status as keyof typeof ticketStatus] : status);
    const activeCount = tickets.filter((ticket) => ticket.status !== "closed").length;
    const totalSpent = tickets.reduce((sum, ticket) => sum + Math.max(0, ticket.repairAmount || 0), 0);

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
                <Card>
                    <div className="text-xs text-[rgb(var(--muted))]">{ui.myCases}</div>
                    <div className="mt-1 text-2xl font-semibold">{tickets.length}</div>
                </Card>
                <Card>
                    <div className="text-xs text-[rgb(var(--muted))]">{ui.openCases}</div>
                    <div className="mt-1 text-2xl font-semibold">{activeCount}</div>
                </Card>
                <Card>
                    <div className="text-xs text-[rgb(var(--muted))]">{ui.lastUpdated}</div>
                    <div className="mt-1 text-sm">{tickets[0] ? formatDateTime(tickets[0].updatedAt, lang) : "-"}</div>
                </Card>
                <Card>
                    <div className="text-xs text-[rgb(var(--muted))]">{ui.totalSpent}</div>
                    <div className="mt-1 text-2xl font-semibold">{new Intl.NumberFormat(uiLocale(lang)).format(totalSpent)}</div>
                </Card>
            </div>

            <Card>
                <div className="mb-3 text-sm font-semibold">{ui.caseListTitle}</div>
                {tickets.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">{ui.emptyCases}</div>
                ) : (
                    <div className="grid gap-2">
                        {tickets.map((ticket) => (
                            <details key={ticket.id} className="rounded-lg border border-[rgb(var(--border))]">
                                <summary className="cursor-pointer list-none px-3 py-2 text-sm [&::-webkit-details-marker]:hidden">
                                    <div className="font-medium">{ticket.title}</div>
                                    <div className="text-xs text-[rgb(var(--muted))]">
                                        {ticket.device.name} {ticket.device.model} · {statusLabel(ticket.status)}
                                    </div>
                                </summary>
                                <div className="border-t border-[rgb(var(--border))] p-3 text-sm">
                                    <div>{ui.customer}: {ticket.customer.name}</div>
                                    <div>{ui.phone}: {ticket.customer.phone || "-"}</div>
                                    <div>{ui.updatedAt}: {formatDateTime(ticket.updatedAt, lang)}</div>
                                    <div className="mt-1 text-[rgb(var(--muted))]">{ui.note}: {ticket.note || "-"}</div>
                                </div>
                            </details>
                        ))}
                    </div>
                )}
            </Card>

            <Card>
                <div className="mb-3 text-sm font-semibold">{ui.spendingTitle}</div>
                {tickets.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">{ui.emptySpending}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-[rgb(var(--border))] text-left text-xs text-[rgb(var(--muted))]">
                                    <th className="px-2 py-2">{ui.caseColumn}</th>
                                    <th className="px-2 py-2">{ui.deviceColumn}</th>
                                    <th className="px-2 py-2">{ui.statusColumn}</th>
                                    <th className="px-2 py-2">{ui.amountColumn}</th>
                                    <th className="px-2 py-2">{ui.updatedAtColumn}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map((ticket) => (
                                    <tr key={`consume-${ticket.id}`} className="border-b border-[rgb(var(--border))]">
                                        <td className="px-2 py-2">{ticket.title}</td>
                                        <td className="px-2 py-2">
                                            {ticket.device.name} {ticket.device.model}
                                        </td>
                                        <td className="px-2 py-2">{statusLabel(ticket.status)}</td>
                                        <td className="px-2 py-2">{new Intl.NumberFormat(uiLocale(lang)).format(ticket.repairAmount || 0)}</td>
                                        <td className="px-2 py-2">{formatDateTime(ticket.updatedAt, lang)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
