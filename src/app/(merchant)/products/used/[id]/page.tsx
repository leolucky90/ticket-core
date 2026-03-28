import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { UsedProductDetailPanel } from "@/components/used-products";
import {
    createRefurbishmentCaseForUsedProduct,
    getUsedProductById,
    publishUsedProduct,
    unpublishUsedProduct,
} from "@/lib/services/used-products.service";

type UsedProductDetailPageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ flash?: string; ts?: string }>;
};

export default async function UsedProductDetailPage({ params, searchParams }: UsedProductDetailPageProps) {
    const { id } = await params;
    const sp = await searchParams;
    const product = await getUsedProductById(id);

    if (!product) {
        redirect(`/products/used?flash=${encodeURIComponent("找不到商品")}`);
    }

    async function publishAction(formData: FormData): Promise<void> {
        "use server";

        const targetId = String(formData.get("id") ?? id);
        const updated = await publishUsedProduct(targetId);
        if (!updated) {
            redirect(`/products/used/${encodeURIComponent(id)}?flash=${encodeURIComponent("上架失敗")}`);
        }
        redirect(`/products/used/${encodeURIComponent(id)}?flash=${encodeURIComponent("已上架")}&ts=${encodeURIComponent(updated.updatedAt)}`);
    }

    async function unpublishAction(formData: FormData): Promise<void> {
        "use server";

        const targetId = String(formData.get("id") ?? id);
        const updated = await unpublishUsedProduct(targetId);
        if (!updated) {
            redirect(`/products/used/${encodeURIComponent(id)}?flash=${encodeURIComponent("下架失敗")}`);
        }
        redirect(`/products/used/${encodeURIComponent(id)}?flash=${encodeURIComponent("已下架")}&ts=${encodeURIComponent(updated.updatedAt)}`);
    }

    async function createRefurbishmentCaseAction(formData: FormData): Promise<void> {
        "use server";

        const usedProductId = String(formData.get("usedProductId") ?? id);
        const latest = await getUsedProductById(usedProductId);
        if (!latest) {
            redirect(`/products/used/${encodeURIComponent(id)}?flash=${encodeURIComponent("找不到商品")}`);
        }

        const created = await createRefurbishmentCaseForUsedProduct({
            usedProductId,
            refurbishmentStatus: latest.refurbishmentStatus,
        });

        if (!created) {
            redirect(`/products/used/${encodeURIComponent(id)}?flash=${encodeURIComponent("建立翻新案件失敗")}&ts=${encodeURIComponent(latest.updatedAt)}`);
        }

        redirect(`/dashboard?tab=cases&caseQ=${encodeURIComponent(created.caseId)}&flash=${encodeURIComponent("翻新案件已建立")}&ts=${encodeURIComponent(created.caseId)}`);
    }

    return (
        <MerchantPageShell title="二手商品明細" subtitle="檢視商品資料、翻新資訊、保固與銷售狀態。" width="index">
            {sp.flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{sp.flash}</div> : null}
            <UsedProductDetailPanel
                product={product}
                publishAction={publishAction}
                unpublishAction={unpublishAction}
                createRefurbishmentCaseAction={createRefurbishmentCaseAction}
            />
        </MerchantPageShell>
    );
}
