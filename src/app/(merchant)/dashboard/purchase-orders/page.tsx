import { cookies } from "next/headers";
import { MerchantPageShell } from "@/components/merchant/shell";
import { PurchaseOrdersWorkspace } from "@/components/purchase-orders/PurchaseOrdersWorkspace";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
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
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const poPageUi = getUiText(lang).purchaseOrdersPage;
    const sp = await searchParams;
    const flash = typeof sp.flash === "string" ? sp.flash : undefined;
    const draftId = typeof sp.draftId === "string" ? sp.draftId : undefined;

    const [drafts, reviewDraft, dimensionBundle] = await Promise.all([
        listPurchaseOrderDraftsForSession(),
        draftId ? getPurchaseOrderDraftForSession(draftId) : Promise.resolve(null),
        getCatalogDimensionBundle(),
    ]);

    return (
        <MerchantPageShell title={poPageUi.title} subtitle={poPageUi.subtitle} width="index">
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
