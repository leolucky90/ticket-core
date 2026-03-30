import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { UsedProductsManagementPanel } from "@/components/used-products";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { listUsedProductTypeSettings } from "@/lib/services/used-product-type-settings.service";
import {
    createRefurbishmentCaseForUsedProduct,
    getUsedProductById,
    listUsedProducts,
    publishUsedProduct,
    unpublishUsedProduct,
} from "@/lib/services/used-products.service";

type UsedProductsPageProps = {
    searchParams: Promise<{
        q?: string;
        usedType?: string;
        saleStatus?: string;
        refurbishmentStatus?: string;
        flash?: string;
        ts?: string;
    }>;
};

function redirectWithFlash(flash: string): never {
    redirect(`/products/used?flash=${encodeURIComponent(flash)}`);
}

export default async function UsedProductsPage({ searchParams }: UsedProductsPageProps) {
    const cookieStore = await cookies();
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const ui = getUiText(lang);
    const pageUi = ui.usedProductPages;

    const sp = await searchParams;
    const keyword = (sp.q ?? "").trim();
    const usedType = (sp.usedType ?? "").trim();
    const saleStatus = (sp.saleStatus ?? "").trim();
    const refurbishmentStatus = (sp.refurbishmentStatus ?? "").trim();

    const [products, usedProductTypeSettings] = await Promise.all([
        listUsedProducts({
            keyword,
            usedType,
            saleStatus: saleStatus as never,
            refurbishmentStatus: refurbishmentStatus as never,
        }),
        listUsedProductTypeSettings(),
    ]);

    const typeFilterOptions = usedProductTypeSettings
        .filter((row) => row.isActive)
        .map((row) => ({ id: row.id, name: row.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));

    async function publishAction(formData: FormData): Promise<void> {
        "use server";

        const id = String(formData.get("id") ?? "");
        const updated = await publishUsedProduct(id);
        if (!updated) redirectWithFlash(pageUi.publishFailed);
        redirectWithFlash(pageUi.published);
    }

    async function unpublishAction(formData: FormData): Promise<void> {
        "use server";

        const id = String(formData.get("id") ?? "");
        const updated = await unpublishUsedProduct(id);
        if (!updated) redirectWithFlash(pageUi.unpublishFailed);
        redirectWithFlash(pageUi.unpublished);
    }

    async function createRefurbishmentCaseAction(formData: FormData): Promise<void> {
        "use server";

        const usedProductId = String(formData.get("usedProductId") ?? "");
        const existing = await getUsedProductById(usedProductId);
        if (!existing) redirectWithFlash(pageUi.notFound);

        const created = await createRefurbishmentCaseForUsedProduct({ usedProductId });
        if (!created) redirectWithFlash(pageUi.createCaseFailed);

        redirect(`/dashboard?tab=cases&caseQ=${encodeURIComponent(created.caseId)}&flash=${encodeURIComponent(pageUi.createdRefurbishmentCase)}&ts=${encodeURIComponent(created.caseId)}`);
    }

    return (
        <MerchantPageShell title={ui.usedProductList.pageTitle} subtitle={ui.usedProductList.pageSubtitle} width="index">
            {sp.flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{sp.flash}</div> : null}
            <UsedProductsManagementPanel
                products={products}
                keyword={keyword}
                usedType={usedType}
                typeFilterOptions={typeFilterOptions}
                saleStatus={saleStatus}
                refurbishmentStatus={refurbishmentStatus}
                publishAction={publishAction}
                unpublishAction={unpublishAction}
                createRefurbishmentCaseAction={createRefurbishmentCaseAction}
            />
        </MerchantPageShell>
    );
}
