import { cookies } from "next/headers";
import { Section } from "@/components/ui/section";
import { queryTickets, createTicket, deleteTicket, updateTicket } from "@/lib/services/ticket";
import type { QuoteStatus, Ticket, TicketStatus } from "@/lib/types/ticket";
import { ChatBall } from "@/components/ai/chat-ball";
import { TicketWorkspace } from "@/components/ticket/TicketWorkspace";
import { getFlowMap, getQuoteStatusText, getStatusText, getTicketLabels } from "@/components/ticket/ticket-labels";

type TicketPageProps = {
    searchParams: Promise<{ q?: string; flash?: string; ts?: string; qt?: string }>;
};

export default async function TicketPage({ searchParams }: TicketPageProps) {
    const c = await cookies();
    const langCookie = c.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";

    const sp = await searchParams;
    const keyword = (sp.q ?? "").trim();
    const flash = (sp.flash ?? "").trim();
    const actionTs = (sp.ts ?? "").trim();
    const queryTs = (sp.qt ?? "").trim();
    const tickets: Ticket[] = await queryTickets(keyword);

    const labels = getTicketLabels(lang, tickets.length);
    const statusText: Record<TicketStatus, string> = getStatusText(labels);
    const quoteStatusText: Record<QuoteStatus, string> = getQuoteStatusText(labels);
    const flowMap: Record<TicketStatus, TicketStatus[]> = getFlowMap();

    return (
        <>
            <Section title={labels.pageTitle}>
                <TicketWorkspace
                    labels={labels}
                    lang={lang}
                    keyword={keyword}
                    tickets={tickets}
                    statusText={statusText}
                    quoteStatusText={quoteStatusText}
                    flowMap={flowMap}
                    createAction={createTicket}
                    updateAction={updateTicket}
                    deleteAction={deleteTicket}
                    flash={flash}
                    actionTs={actionTs}
                    queryTs={queryTs}
                />
            </Section>
            <ChatBall />
        </>
    );
}
