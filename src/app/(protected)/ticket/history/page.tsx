import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { listTicketsByCustomerEmail } from "@/lib/services/ticket";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";

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

export default async function CustomerTicketHistoryPage() {
    const session = await getSessionUser();
    if (!session) {
        redirect("/login?next=/ticket/history");
    }

    const user = await getUserDoc(session.uid);
    const accountType = toAccountType(user?.role ?? null);
    if (accountType === "company") {
        redirect("/ticket");
    }

    const companyId = getShowcaseTenantId(user, session.uid);
    const tickets = await listTicketsByCustomerEmail(session.email, companyId);

    return (
        <Section title="Ticket 紀錄">
            <div className="grid gap-3">
                {tickets.length === 0 ? (
                    <Card>
                        <div className="text-sm text-[rgb(var(--muted))]">目前查無你的 ticket 紀錄。</div>
                    </Card>
                ) : (
                    tickets.map((ticket) => (
                        <Card key={ticket.id}>
                            <div className="grid gap-2">
                                <div className="text-sm font-semibold">{ticket.title}</div>
                                <div className="text-sm">
                                    <span className="text-[rgb(var(--muted))]">狀態：</span>
                                    <span>{ticket.status}</span>
                                </div>
                                <div className="text-sm">
                                    <span className="text-[rgb(var(--muted))]">設備：</span>
                                    <span>
                                        {ticket.device.name} / {ticket.device.model}
                                    </span>
                                </div>
                                <div className="text-sm">
                                    <span className="text-[rgb(var(--muted))]">更新時間：</span>
                                    <span>{formatDateTime(ticket.updatedAt)}</span>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </Section>
    );
}
