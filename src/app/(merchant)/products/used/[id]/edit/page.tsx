import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { UsedProductForm } from "@/components/used-products";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import type { UsedProductTypeSetting } from "@/lib/schema";
import { listRepairBrands } from "@/lib/services/merchant/inventory-read-model.service";
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

export default async function EditUsedProductPage({ params, searchParams }: EditUsedProductPageProps) {
    const cookieStore = await cookies();
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const ui = getUiText(lang).usedProductPages;
    const { id } = await params;
    const sp = await searchParams;

    const [product, loadedTypeSettings, marketingBrands] = await Promise.all([
        getUsedProductById(id),
        listUsedProductTypeSettings(),
        listRepairBrands(),
    ]);

    if (!product) {
        redirect(`/products/used?flash=${encodeURIComponent(ui.notFound)}`);
    }

    const typeSettings = loadedTypeSettings.length > 0 ? loadedTypeSettings.filter((row) => row.isActive) : fallbackTypeSettings(ui.fallbackTypes);

    async function updateAction(formData: FormData): Promise<void> {
        "use server";

        const payload = parseUsedProductFormData(formData);
        const updated = await updateUsedProduct({
            id,
            ...payload,
        });

        if (!updated) {
            redirect(`/products/used/${encodeURIComponent(id)}/edit?flash=${encodeURIComponent(ui.updateFailed)}`);
        }

        if (payload.isRefurbished && !updated.refurbishmentCaseId) {
            const caseCreated = await createRefurbishmentCaseForUsedProduct({
                usedProductId: updated.id,
                refurbishmentStatus: payload.refurbishmentStatus,
            });
            if (!caseCreated) {
                redirect(`/products/used/${encodeURIComponent(id)}?flash=${encodeURIComponent(ui.updatedCaseFailed)}&ts=${encodeURIComponent(updated.updatedAt)}`);
            }
            redirect(`/products/used/${encodeURIComponent(id)}?flash=${encodeURIComponent(ui.updatedCaseSuccess)}&ts=${encodeURIComponent(updated.updatedAt)}`);
        }

        redirect(`/products/used/${encodeURIComponent(id)}?flash=${encodeURIComponent(ui.updated)}`);
    }

    async function createRefurbishmentCaseAction(formData: FormData): Promise<void> {
        "use server";

        const usedProductId = String(formData.get("usedProductId") ?? id);
        const latest = await getUsedProductById(usedProductId);
        if (!latest) {
            redirect(`/products/used/${encodeURIComponent(id)}/edit?flash=${encodeURIComponent(ui.notFound)}`);
        }

        const created = await createRefurbishmentCaseForUsedProduct({
            usedProductId,
            refurbishmentStatus: latest.refurbishmentStatus,
        });

        if (!created) {
            redirect(`/products/used/${encodeURIComponent(id)}/edit?flash=${encodeURIComponent(ui.createCaseFailed)}&ts=${encodeURIComponent(latest.updatedAt)}`);
        }

        redirect(`/dashboard?tab=cases&caseQ=${encodeURIComponent(created.caseId)}&flash=${encodeURIComponent(ui.createdRefurbishmentCase)}&ts=${encodeURIComponent(created.caseId)}`);
    }

    return (
        <MerchantPageShell title={ui.editTitle} subtitle={ui.editSubtitle} width="default">
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
