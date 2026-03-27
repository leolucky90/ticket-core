import { ReceiptWorkspace } from "@/components/dashboard/ReceiptWorkspace";
import { MerchantPageShell } from "@/components/merchant/shell";
import { queryCheckoutSalesPage } from "@/lib/services/sales";

type ReceiptsPageProps = {
    searchParams: Promise<{ q?: string; pageSize?: string; cursor?: string; cursorStack?: string }>;
};

function parsePageSize(text: string): number {
    const value = Number.parseInt(text, 10);
    if (!Number.isFinite(value)) return 20;
    if (value <= 10) return 10;
    if (value <= 20) return 20;
    if (value <= 50) return 50;
    return 100;
}

function decodeCursorStack(text: string): string[] {
    if (!text) return [];
    try {
        const parsed = JSON.parse(Buffer.from(text, "base64url").toString("utf8"));
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    } catch {
        return [];
    }
}

function encodeCursorStack(items: string[]): string {
    if (items.length === 0) return "";
    return Buffer.from(JSON.stringify(items)).toString("base64url");
}

export default async function DashboardReceiptsPage({ searchParams }: ReceiptsPageProps) {
    const sp = await searchParams;
    const keyword = (sp.q ?? "").trim();
    const currentCursor = (sp.cursor ?? "").trim();
    const currentCursorStack = decodeCursorStack((sp.cursorStack ?? "").trim());
    const receiptPage = await queryCheckoutSalesPage({
        keyword,
        pageSize: parsePageSize((sp.pageSize ?? "").trim()),
        cursor: currentCursor || undefined,
    });
    const previousCursor = currentCursorStack.at(-1) ?? "";
    const previousCursorStack = encodeCursorStack(currentCursorStack.slice(0, -1));
    const nextCursorStack = encodeCursorStack(currentCursor ? [...currentCursorStack, currentCursor] : currentCursorStack);

    return (
        <MerchantPageShell title="收據" subtitle="收據索引頁，優先檢索、篩選與明細查閱。" width="index">
            <ReceiptWorkspace
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
