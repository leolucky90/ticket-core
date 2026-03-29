import { cookies } from "next/headers";
import { MerchantPageShell } from "@/components/merchant/shell";
import { PurchaseOrdersWorkspace } from "@/components/purchase-orders/PurchaseOrdersWorkspace";
import { getCatalogDimensionBundle } from "@/lib/services/merchant/catalog-service";
import {
    getPurchaseOrderDraftForSession,
    listPurchaseOrderDraftsForSession,
} from "@/lib/services/merchant/purchase-order-draft.service";

type PurchaseOrdersPageProps = {
    searchParams: Promise<{ flash?: string; draftId?: string }>;
};

export default async function PurchaseOrdersPage({ searchParams }: PurchaseOrdersPageProps) {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";
    const sp = await searchParams;
    const flash = typeof sp.flash === "string" ? sp.flash : undefined;
    const draftId = typeof sp.draftId === "string" ? sp.draftId : undefined;

    const [drafts, reviewDraft, dimensionBundle] = await Promise.all([
        listPurchaseOrderDraftsForSession(),
        draftId ? getPurchaseOrderDraftForSession(draftId) : Promise.resolve(null),
        getCatalogDimensionBundle(),
    ]);

    const title = lang === "zh" ? "採購／訂購單" : "Purchase orders";
    const subtitle =
        lang === "zh"
            ? "收據影像 OCR → AI 結構化草稿 → 人工確認後建立採購單（Firestore）；物流追蹤與入庫將於後續接通。"
            : "Receipt OCR → AI draft → human confirm to create a PO in Firestore; tracking and inbound later.";

    return (
        <MerchantPageShell title={title} subtitle={subtitle} width="index">
            <PurchaseOrdersWorkspace
                drafts={drafts}
                lang={lang}
                flash={flash}
                reviewDraft={reviewDraft}
                dimensionBundle={dimensionBundle}
            />
        </MerchantPageShell>
    );
}
