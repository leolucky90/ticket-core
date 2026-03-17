import { ReceiptWorkspace } from "@/components/dashboard/ReceiptWorkspace";
import { Section } from "@/components/ui/section";
import { queryCheckoutSales } from "@/lib/services/sales";

type ReceiptsPageProps = {
    searchParams: Promise<{ q?: string }>;
};

export default async function DashboardReceiptsPage({ searchParams }: ReceiptsPageProps) {
    const sp = await searchParams;
    const keyword = (sp.q ?? "").trim();
    const receipts = await queryCheckoutSales(keyword);

    return (
        <Section title="收據">
            <ReceiptWorkspace receipts={receipts} />
        </Section>
    );
}
