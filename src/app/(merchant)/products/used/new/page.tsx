import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { UsedProductForm } from "@/components/used-products";
import type { UsedProductTypeSetting } from "@/lib/schema";
import { listRepairBrands } from "@/lib/services/commerce";
import { createUsedProduct } from "@/lib/services/used-products.service";
import { listUsedProductTypeSettings } from "@/lib/services/used-product-type-settings.service";
import { parseUsedProductFormData } from "@/lib/used-product-form";

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

export default async function NewUsedProductPage() {
    const cookieStore = await cookies();
    const lang: "zh" | "en" = cookieStore.get("lang")?.value === "en" ? "en" : "zh";
    const [loadedTypeSettings, marketingBrands] = await Promise.all([listUsedProductTypeSettings(), listRepairBrands()]);
    const typeSettings = loadedTypeSettings.length > 0 ? loadedTypeSettings.filter((row) => row.isActive) : fallbackTypeSettings();

    async function createAction(formData: FormData): Promise<void> {
        "use server";

        const payload = parseUsedProductFormData(formData);
        const created = await createUsedProduct(payload);
        if (!created) {
            redirect(`/products/used/new?flash=${encodeURIComponent("建立失敗")}&ts=${Date.now()}`);
        }

        redirect(`/products/used/${encodeURIComponent(created.id)}?flash=${encodeURIComponent("二手商品已建立")}&ts=${Date.now()}`);
    }

    return (
        <MerchantPageShell title="新增二手商品" subtitle="建立二手商品資料與翻新/銷售前置設定。" width="default">
            <UsedProductForm
                lang={lang}
                mode="create"
                typeSettings={typeSettings}
                brandOptions={marketingBrands.map((row) => ({
                    id: row.id,
                    name: row.name,
                    modelsByType: row.modelsByType,
                    models: row.models,
                    usedProductTypes: row.usedProductTypes ?? [],
                }))}
                submitAction={createAction}
                backHref="/products/used"
            />
        </MerchantPageShell>
    );
}
