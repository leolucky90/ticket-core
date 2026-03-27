import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { UsedProductForm } from "@/components/used-products";
import type { UsedProductTypeSetting } from "@/lib/schema";
import { listRepairBrands } from "@/lib/services/commerce";
import {
    createRefurbishmentCaseForUsedProduct,
    getUsedProductById,
    updateUsedProduct,
} from "@/lib/services/used-products.service";
import { listUsedProductTypeSettings } from "@/lib/services/used-product-type-settings.service";
import { parseUsedProductFormData } from "@/lib/used-product-form";

type EditUsedProductPageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ flash?: string; ts?: string }>;
};

function fallbackTypeSettings(): UsedProductTypeSetting[] {
    const nowIso = new Date().toISOString();
    return [
        { id: "fallback_phone", name: "手機", isActive: true, specificationTemplates: [], createdAt: nowIso, updatedAt: nowIso, updatedBy: "system" },
        { id: "fallback_laptop", name: "筆電", isActive: true, specificationTemplates: [], createdAt: nowIso, updatedAt: nowIso, updatedBy: "system" },
        { id: "fallback_tablet", name: "平板", isActive: true, specificationTemplates: [], createdAt: nowIso, updatedAt: nowIso, updatedBy: "system" },
        { id: "fallback_watch", name: "手錶", isActive: true, specificationTemplates: [], createdAt: nowIso, updatedAt: nowIso, updatedBy: "system" },
        { id: "fallback_earbuds", name: "耳機", isActive: true, specificationTemplates: [], createdAt: nowIso, updatedAt: nowIso, updatedBy: "system" },
        { id: "fallback_console", name: "主機", isActive: true, specificationTemplates: [], createdAt: nowIso, updatedAt: nowIso, updatedBy: "system" },
        { id: "fallback_other", name: "其他", isActive: true, specificationTemplates: [], createdAt: nowIso, updatedAt: nowIso, updatedBy: "system" },
    ];
}

export default async function EditUsedProductPage({ params, searchParams }: EditUsedProductPageProps) {
    const cookieStore = await cookies();
    const lang: "zh" | "en" = cookieStore.get("lang")?.value === "en" ? "en" : "zh";
    const { id } = await params;
    const sp = await searchParams;

    const [product, loadedTypeSettings, marketingBrands] = await Promise.all([
        getUsedProductById(id),
        listUsedProductTypeSettings(),
        listRepairBrands(),
    ]);

    if (!product) {
        redirect(`/products/used?flash=${encodeURIComponent("找不到商品")}`);
    }

    const typeSettings = loadedTypeSettings.length > 0 ? loadedTypeSettings.filter((row) => row.isActive) : fallbackTypeSettings();

    async function updateAction(formData: FormData): Promise<void> {
        "use server";

        const payload = parseUsedProductFormData(formData);
        const updated = await updateUsedProduct({
            id,
            ...payload,
        });

        if (!updated) {
            redirect(`/products/used/${encodeURIComponent(id)}/edit?flash=${encodeURIComponent("更新失敗")}`);
        }

        redirect(`/products/used/${encodeURIComponent(id)}?flash=${encodeURIComponent("商品已更新")}`);
    }

    async function createRefurbishmentCaseAction(formData: FormData): Promise<void> {
        "use server";

        const usedProductId = String(formData.get("usedProductId") ?? id);
        const latest = await getUsedProductById(usedProductId);
        if (!latest) {
            redirect(`/products/used/${encodeURIComponent(id)}/edit?flash=${encodeURIComponent("找不到商品")}&ts=${Date.now()}`);
        }

        if (latest.refurbishmentCaseId) {
            redirect(`/dashboard?tab=cases&caseQ=${encodeURIComponent(latest.refurbishmentCaseId)}&flash=${encodeURIComponent("已前往既有翻新案件")}&ts=${Date.now()}`);
        }

        const created = await createRefurbishmentCaseForUsedProduct({
            usedProductId,
        });

        if (!created) {
            redirect(`/products/used/${encodeURIComponent(id)}/edit?flash=${encodeURIComponent("建立翻新案件失敗")}&ts=${Date.now()}`);
        }

        redirect(`/dashboard?tab=cases&caseQ=${encodeURIComponent(created.caseId)}&flash=${encodeURIComponent("翻新案件已建立")}&ts=${Date.now()}`);
    }

    return (
        <MerchantPageShell title="編輯二手商品" subtitle="調整二手商品資料、翻新與銷售狀態。" width="default">
            {sp.flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{sp.flash}</div> : null}
            <UsedProductForm
                lang={lang}
                mode="edit"
                product={product}
                typeSettings={typeSettings}
                brandOptions={marketingBrands.map((row) => ({
                    id: row.id,
                    name: row.name,
                    modelsByType: row.modelsByType,
                    models: row.models,
                    usedProductTypes: row.usedProductTypes ?? [],
                }))}
                submitAction={updateAction}
                createRefurbishmentCaseAction={createRefurbishmentCaseAction}
                backHref={`/products/used/${encodeURIComponent(id)}`}
            />
        </MerchantPageShell>
    );
}
