import { cookies } from "next/headers";
import { ReceiptWorkspace } from "@/components/dashboard/ReceiptWorkspace";
import { MerchantPageShell } from "@/components/merchant/shell";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { decodeCursorStack, encodeCursorStack, parseListPageSize } from "@/lib/pagination/query-controls";
import { queryCheckoutSalesPage } from "@/lib/services/sales";

type ReceiptsPageProps = {
    searchParams: Promise<{ q?: string; pageSize?: string; cursor?: string; cursorStack?: string }>;
};

export default async function DashboardReceiptsPage({ searchParams }: ReceiptsPageProps) {
    const sp = await searchParams;
    const lang = getUiLanguage((await cookies()).get("lang")?.value);
    const p = getUiText(lang).merchantStandalonePages.receipts;
    const keyword = (sp.q ?? "").trim();
    const currentCursor = (sp.cursor ?? "").trim();
    const currentCursorStack = decodeCursorStack((sp.cursorStack ?? "").trim());
    const receiptPage = await queryCheckoutSalesPage({
        keyword,
        pageSize: parseListPageSize((sp.pageSize ?? "").trim(), "20"),
        cursor: currentCursor || undefined,
    });
    const previousCursor = currentCursorStack.at(-1) ?? "";
    const previousCursorStack = encodeCursorStack(currentCursorStack.slice(0, -1));
    const nextCursorStack = encodeCursorStack(currentCursor ? [...currentCursorStack, currentCursor] : currentCursorStack);

    return (
        <MerchantPageShell title={p.title} subtitle={p.subtitle} width="index">
            <ReceiptWorkspace
                lang={lang}
                receipts={receiptPage.items}
                keyword={keyword}
                pageSize={String(receiptPage.pageSize)}
                currentCursor={currentCursor}
                previousCursor={previousCursor}
                previousCursorStack={previousCursorStack}
                nextCursor={receiptPage.nextCursor}
                nextCursorStack={nextCursorStack}
                hasNextPage={receiptPage.hasNextPage}
            />
        </MerchantPageShell>
    );
}
