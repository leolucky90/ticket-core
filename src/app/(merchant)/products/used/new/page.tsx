import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { UsedProductForm } from "@/components/used-products";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import type { UsedProductTypeSetting } from "@/lib/schema";
import { listRepairBrands } from "@/lib/services/merchant/inventory-read-model.service";
import { createRefurbishmentCaseForUsedProduct, createUsedProduct } from "@/lib/services/used-products.service";
import { listUsedProductTypeSettings } from "@/lib/services/used-product-type-settings.service";
import { parseUsedProductFormData } from "@/lib/used-product-form";

function fallbackTypeSettings(labels: ReturnType<typeof getUiText>["usedProductPages"]["fallbackTypes"]): UsedProductTypeSetting[] {
    const nowIso = new Date().toISOString();
    return [
        { id: "fallback_phone", name: labels.phone, isActive: true, specificationTemplates: [], createdAt: nowIso, updatedAt: nowIso, updatedBy: "system" },
        { id: "fallback_laptop", name: labels.laptop, isActive: true, specificationTemplates: [], createdAt: nowIso, updatedAt: nowIso, updatedBy: "system" },
        { id: "fallback_tablet", name: labels.tablet, isActive: true, specificationTemplates: [], createdAt: nowIso, updatedAt: nowIso, updatedBy: "system" },
        { id: "fallback_watch", name: labels.watch, isActive: true, specificationTemplates: [], createdAt: nowIso, updatedAt: nowIso, updatedBy: "system" },
        { id: "fallback_earbuds", name: labels.earbuds, isActive: true, specificationTemplates: [], createdAt: nowIso, updatedAt: nowIso, updatedBy: "system" },
        { id: "fallback_console", name: labels.console, isActive: true, specificationTemplates: [], createdAt: nowIso, updatedAt: nowIso, updatedBy: "system" },
        { id: "fallback_other", name: labels.other, isActive: true, specificationTemplates: [], createdAt: nowIso, updatedAt: nowIso, updatedBy: "system" },
    ];
}

export default async function NewUsedProductPage() {
    const cookieStore = await cookies();
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const ui = getUiText(lang).usedProductPages;
    const [loadedTypeSettings, marketingBrands] = await Promise.all([listUsedProductTypeSettings(), listRepairBrands()]);
    const typeSettings = loadedTypeSettings.length > 0 ? loadedTypeSettings.filter((row) => row.isActive) : fallbackTypeSettings(ui.fallbackTypes);

    async function createAction(formData: FormData): Promise<void> {
        "use server";

        const payload = parseUsedProductFormData(formData);
        const created = await createUsedProduct(payload);
        if (!created) {
            redirect(`/products/used/new?flash=${encodeURIComponent(ui.createFailed)}&ts=${Date.now()}`);
        }

        if (payload.isRefurbished && !created.refurbishmentCaseId) {
            const caseCreated = await createRefurbishmentCaseForUsedProduct({
                usedProductId: created.id,
                refurbishmentStatus: payload.refurbishmentStatus,
            });
            if (!caseCreated) {
                redirect(`/products/used/${encodeURIComponent(created.id)}?flash=${encodeURIComponent(ui.createdCaseFailed)}&ts=${Date.now()}`);
            }
            redirect(`/products/used/${encodeURIComponent(created.id)}?flash=${encodeURIComponent(ui.createdCaseSuccess)}&ts=${Date.now()}`);
        }

        redirect(`/products/used/${encodeURIComponent(created.id)}?flash=${encodeURIComponent(ui.created)}&ts=${Date.now()}`);
    }

    return (
        <MerchantPageShell title={ui.createTitle} subtitle={ui.createSubtitle} width="default">
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
