import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { UsedProductDetailPanel } from "@/components/used-products";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
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
    const lang = getUiLanguage((await cookies()).get("lang")?.value);
    const ui = getUiText(lang).usedProductPages;
    const { id } = await params;
    const sp = await searchParams;
    const product = await getUsedProductById(id);

    if (!product) {
        redirect(`/products/used?flash=${encodeURIComponent(ui.notFound)}`);
    }

    async function publishAction(formData: FormData): Promise<void> {
        "use server";

        const targetId = String(formData.get("id") ?? id);
        const updated = await publishUsedProduct(targetId);
        if (!updated) {
            redirect(`/products/used/${encodeURIComponent(id)}?flash=${encodeURIComponent(ui.publishFailed)}`);
        }
        redirect(`/products/used/${encodeURIComponent(id)}?flash=${encodeURIComponent(ui.published)}&ts=${encodeURIComponent(updated.updatedAt)}`);
    }

    async function unpublishAction(formData: FormData): Promise<void> {
        "use server";

        const targetId = String(formData.get("id") ?? id);
        const updated = await unpublishUsedProduct(targetId);
        if (!updated) {
            redirect(`/products/used/${encodeURIComponent(id)}?flash=${encodeURIComponent(ui.unpublishFailed)}`);
        }
        redirect(`/products/used/${encodeURIComponent(id)}?flash=${encodeURIComponent(ui.unpublished)}&ts=${encodeURIComponent(updated.updatedAt)}`);
    }

    async function createRefurbishmentCaseAction(formData: FormData): Promise<void> {
        "use server";

        const usedProductId = String(formData.get("usedProductId") ?? id);
        const latest = await getUsedProductById(usedProductId);
        if (!latest) {
            redirect(`/products/used/${encodeURIComponent(id)}?flash=${encodeURIComponent(ui.notFound)}`);
        }

        const created = await createRefurbishmentCaseForUsedProduct({
            usedProductId,
            refurbishmentStatus: latest.refurbishmentStatus,
        });

        if (!created) {
            redirect(`/products/used/${encodeURIComponent(id)}?flash=${encodeURIComponent(ui.createCaseFailed)}&ts=${encodeURIComponent(latest.updatedAt)}`);
        }

        redirect(`/dashboard?tab=cases&caseQ=${encodeURIComponent(created.caseId)}&flash=${encodeURIComponent(ui.createdRefurbishmentCase)}&ts=${encodeURIComponent(created.caseId)}`);
    }

    return (
        <MerchantPageShell title={ui.detailTitle} subtitle={ui.detailSubtitle} width="index">
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
