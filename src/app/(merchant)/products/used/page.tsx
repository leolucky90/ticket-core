import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { UsedProductsManagementPanel } from "@/components/used-products";
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
        saleStatus?: string;
        refurbishmentStatus?: string;
        flash?: string;
        ts?: string;
    }>;
};

function redirectWithFlash(flash: string): never {
    redirect(`/products/used?flash=${encodeURIComponent(flash)}&ts=${Date.now()}`);
}

export default async function UsedProductsPage({ searchParams }: UsedProductsPageProps) {
    const sp = await searchParams;
    const keyword = (sp.q ?? "").trim();
    const saleStatus = (sp.saleStatus ?? "").trim();
    const refurbishmentStatus = (sp.refurbishmentStatus ?? "").trim();

    const products = await listUsedProducts({
        keyword,
        saleStatus: saleStatus as never,
        refurbishmentStatus: refurbishmentStatus as never,
    });

    async function publishAction(formData: FormData): Promise<void> {
        "use server";

        const id = String(formData.get("id") ?? "");
        const updated = await publishUsedProduct(id);
        if (!updated) redirectWithFlash("上架失敗");
        redirectWithFlash("商品已上架");
    }

    async function unpublishAction(formData: FormData): Promise<void> {
        "use server";

        const id = String(formData.get("id") ?? "");
        const updated = await unpublishUsedProduct(id);
        if (!updated) redirectWithFlash("下架失敗");
        redirectWithFlash("商品已下架");
    }

    async function createRefurbishmentCaseAction(formData: FormData): Promise<void> {
        "use server";

        const usedProductId = String(formData.get("usedProductId") ?? "");
        const existing = await getUsedProductById(usedProductId);
        if (!existing) redirectWithFlash("找不到二手商品");

        if (existing.refurbishmentCaseId) {
            redirect(`/dashboard?tab=cases&caseQ=${encodeURIComponent(existing.refurbishmentCaseId)}&flash=${encodeURIComponent("已前往既有翻新案件")}&ts=${Date.now()}`);
        }

        const created = await createRefurbishmentCaseForUsedProduct({ usedProductId });
        if (!created) redirectWithFlash("建立翻新案件失敗");

        redirect(`/dashboard?tab=cases&caseQ=${encodeURIComponent(created.caseId)}&flash=${encodeURIComponent("翻新案件已建立")}&ts=${Date.now()}`);
    }

    return (
        <MerchantPageShell title="二手商品管理" subtitle="集中管理二手商品清單、狀態、翻新與銷售入口。" width="index">
            {sp.flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{sp.flash}</div> : null}
            <UsedProductsManagementPanel
                products={products}
                keyword={keyword}
                saleStatus={saleStatus}
                refurbishmentStatus={refurbishmentStatus}
                publishAction={publishAction}
                unpublishAction={unpublishAction}
                createRefurbishmentCaseAction={createRefurbishmentCaseAction}
            />
        </MerchantPageShell>
    );
}
