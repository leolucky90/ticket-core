import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import type { Ticket } from "@/lib/types/ticket";

function formatDateTime(timestamp: number): string {
    if (!Number.isFinite(timestamp) || timestamp <= 0) return "-";
    return new Date(timestamp).toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function CustomerDashboardPanel({ tickets }: { tickets: Ticket[] }) {
    const activeCount = tickets.filter((ticket) => ticket.status !== "closed").length;
    const totalSpent = tickets.reduce((sum, ticket) => sum + Math.max(0, ticket.repairAmount || 0), 0);

    return (
        <Section title="客戶儀錶板">
            <div className="grid gap-3 md:grid-cols-4">
                <Card>
                    <div className="text-xs text-[rgb(var(--muted))]">我的案件數</div>
                    <div className="mt-1 text-2xl font-semibold">{tickets.length}</div>
                </Card>
                <Card>
                    <div className="text-xs text-[rgb(var(--muted))]">進行中案件</div>
                    <div className="mt-1 text-2xl font-semibold">{activeCount}</div>
                </Card>
                <Card>
                    <div className="text-xs text-[rgb(var(--muted))]">最後更新</div>
                    <div className="mt-1 text-sm">{tickets[0] ? formatDateTime(tickets[0].updatedAt) : "-"}</div>
                </Card>
                <Card>
                    <div className="text-xs text-[rgb(var(--muted))]">累計消費金額</div>
                    <div className="mt-1 text-2xl font-semibold">{new Intl.NumberFormat("zh-TW").format(totalSpent)}</div>
                </Card>
            </div>

            <Card>
                <div className="mb-3 text-sm font-semibold">我的案件列表</div>
                {tickets.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">目前沒有案件資料。</div>
                ) : (
                    <div className="grid gap-2">
                        {tickets.map((ticket) => (
                            <details key={ticket.id} className="rounded-lg border border-[rgb(var(--border))]">
                                <summary className="cursor-pointer list-none px-3 py-2 text-sm [&::-webkit-details-marker]:hidden">
                                    <div className="font-medium">{ticket.title}</div>
                                    <div className="text-xs text-[rgb(var(--muted))]">
                                        {ticket.device.name} {ticket.device.model} · {ticket.status}
                                    </div>
                                </summary>
                                <div className="border-t border-[rgb(var(--border))] p-3 text-sm">
                                    <div>客戶：{ticket.customer.name}</div>
                                    <div>電話：{ticket.customer.phone || "-"}</div>
                                    <div>更新時間：{formatDateTime(ticket.updatedAt)}</div>
                                    <div className="mt-1 text-[rgb(var(--muted))]">備註：{ticket.note || "-"}</div>
                                </div>
                            </details>
                        ))}
                    </div>
                )}
            </Card>

            <Card>
                <div className="mb-3 text-sm font-semibold">消費紀錄</div>
                {tickets.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">目前沒有消費紀錄。</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-[rgb(var(--border))] text-left text-xs text-[rgb(var(--muted))]">
                                    <th className="px-2 py-2">案件</th>
                                    <th className="px-2 py-2">設備</th>
                                    <th className="px-2 py-2">狀態</th>
                                    <th className="px-2 py-2">消費金額</th>
                                    <th className="px-2 py-2">更新時間</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map((ticket) => (
                                    <tr key={`consume-${ticket.id}`} className="border-b border-[rgb(var(--border))]">
                                        <td className="px-2 py-2">{ticket.title}</td>
                                        <td className="px-2 py-2">
                                            {ticket.device.name} {ticket.device.model}
                                        </td>
                                        <td className="px-2 py-2">{ticket.status}</td>
                                        <td className="px-2 py-2">{new Intl.NumberFormat("zh-TW").format(ticket.repairAmount || 0)}</td>
                                        <td className="px-2 py-2">{formatDateTime(ticket.updatedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </Section>
    );
}
