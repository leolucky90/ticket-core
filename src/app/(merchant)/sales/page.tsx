import { cookies } from "next/headers";
import { ChatBall } from "@/components/ai/chat-ball";
import { MerchantPageShell } from "@/components/merchant/shell";
import { SalesWorkspace } from "@/components/sales/SalesWorkspace";
import { getPaymentMethodText, getSalesLabels } from "@/components/sales/sales-labels";
import { createSale, deleteSale, querySales, updateSale } from "@/lib/services/sales";
import type { PaymentMethod, Sale } from "@/lib/types/sale";

type SalesPageProps = {
    searchParams: Promise<{ q?: string; flash?: string; ts?: string; qt?: string }>;
};

export default async function SalesPage({ searchParams }: SalesPageProps) {
    const c = await cookies();
    const langCookie = c.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";

    const sp = await searchParams;
    const keyword = (sp.q ?? "").trim();
    const flash = (sp.flash ?? "").trim();
    const actionTs = (sp.ts ?? "").trim();
    const queryTs = (sp.qt ?? "").trim();
    const sales: Sale[] = await querySales(keyword);

    const labels = getSalesLabels(lang, sales.length);
    const paymentText: Record<PaymentMethod, string> = getPaymentMethodText(labels);
    const subtitle = lang === "zh" ? "交易索引頁，集中處理查詢、建立與維護。" : "Operational sales index for search, create, and maintenance flows.";

    return (
        <>
            <MerchantPageShell title={labels.pageTitle} subtitle={subtitle} width="index">
                <SalesWorkspace
                    labels={labels}
                    lang={lang}
                    keyword={keyword}
                    sales={sales}
                    paymentText={paymentText}
                    createAction={createSale}
                    updateAction={updateSale}
                    deleteAction={deleteSale}
                    flash={flash}
                    actionTs={actionTs}
                    queryTs={queryTs}
                />
            </MerchantPageShell>
            <ChatBall />
        </>
    );
}
