import { ReceiptWorkspace } from "@/components/dashboard/ReceiptWorkspace";
import { MerchantPageShell } from "@/components/merchant/shell";
import { queryCheckoutSales } from "@/lib/services/sales";

type ReceiptsPageProps = {
    searchParams: Promise<{ q?: string }>;
};

export default async function DashboardReceiptsPage({ searchParams }: ReceiptsPageProps) {
    const sp = await searchParams;
    const keyword = (sp.q ?? "").trim();
    const receipts = await queryCheckoutSales(keyword);

    return (
        <MerchantPageShell title="收據" subtitle="收據索引頁，優先檢索、篩選與明細查閱。" width="index">
            <ReceiptWorkspace receipts={receipts} keyword={keyword} />
        </MerchantPageShell>
    );
}
