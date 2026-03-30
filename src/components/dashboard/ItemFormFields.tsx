"use client";

import { useMemo, useState } from "react";
import { useUiLanguage } from "@/components/layout/ui-language-provider";
import { DimensionPicker } from "@/components/merchant/catalog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getUiText } from "@/lib/i18n/ui-text";
import { appendStructuredProductNameSuffix, buildProductNameSuggestion } from "@/lib/services/productNaming";
import type { ItemNamingSettings } from "@/lib/schema/itemNamingSettings";
import type { DimensionPickerBundle, ProductNamingMode } from "@/lib/types/catalog";
import type { Product } from "@/lib/types/merchant-product";

type ItemFormFieldsProps = {
    bundle: DimensionPickerBundle;
    namingSettings: ItemNamingSettings;
    idPrefix: string;
    supplierListId: string;
    controlClass?: string;
    product?: Product;
};

function toRefValue(id: string | undefined, name: string | undefined): string {
    const idText = (id ?? "").trim();
    const nameText = (name ?? "").trim();
    if (!idText && !nameText) return "";
    return `${idText || nameText}::${nameText || idText}`;
}

function parseRefName(value: string): string {
    const text = value.trim();
    if (!text) return "";
    const [, name] = text.split("::");
    return (name ?? "").trim();
}

export function ItemFormFields({
    bundle,
    namingSettings,
    idPrefix,
    supplierListId,
    controlClass = "h-10 w-full min-w-0",
    product,
}: ItemFormFieldsProps) {
    const lang = useUiLanguage();
    const ui = getUiText(lang).itemFormFields;
    const namingUi = getUiText(lang).itemQuickNaming;
    const initialNamingMode: ProductNamingMode = product?.namingMode === "custom" ? "custom" : "structured";
    const [namingMode, setNamingMode] = useState<ProductNamingMode>(initialNamingMode);
    const [customName, setCustomName] = useState(
        initialNamingMode === "custom" ? (product?.customLabel || product?.name || "").trim() : "",
    );
    const [secondaryProductName, setSecondaryProductName] = useState(
        initialNamingMode !== "custom" ? (product?.customLabel ?? "").trim() : "",
    );
    const [dimensions, setDimensions] = useState({
        categoryRef: toRefValue(product?.categoryId, product?.categoryName),
        secondaryCategoryRef: toRefValue(product?.secondaryCategoryId, product?.secondaryCategoryName),
        brandRef: toRefValue(product?.brandId, product?.brandName),
        modelRef: toRefValue(product?.modelId, product?.modelName),
    });

    const previewName = useMemo(
        () =>
            buildProductNameSuggestion({
                namingMode: "structured",
                categoryName: parseRefName(dimensions.categoryRef),
                secondaryCategoryName: parseRefName(dimensions.secondaryCategoryRef),
                brandName: parseRefName(dimensions.brandRef),
                modelName: parseRefName(dimensions.modelRef),
                namingOrder: namingSettings.order,
            }),
        [dimensions, namingSettings.order],
    );

    const structuredDisplayName = useMemo(
        () => appendStructuredProductNameSuffix(previewName, secondaryProductName),
        [previewName, secondaryProductName],
    );

    const orderText = namingSettings.order
        .map((token) => {
            if (token === "brand") return namingUi.tokenBrand;
            if (token === "model") return namingUi.tokenModel;
            if (token === "category") return namingUi.tokenCategory;
            return namingUi.tokenSecondaryCategory;
        })
        .join(" + ");

    return (
        <>
            <DimensionPicker
                bundle={bundle}
                idPrefix={idPrefix}
                value={dimensions}
                onChange={(next) =>
                    setDimensions({
                        categoryRef: next.categoryRef ?? "",
                        secondaryCategoryRef: next.secondaryCategoryRef ?? "",
                        brandRef: next.brandRef ?? "",
                        modelRef: next.modelRef ?? "",
                    })
                }
            />

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <FormField label={ui.namingModeLabel} className="md:col-span-2 xl:col-span-3" hint={`${ui.namingModeHintPrefix}${orderText}`}>
                    <div className="flex flex-wrap gap-2">
                        <label className="inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">
                            <input
                                type="radio"
                                name="namingMode"
                                value="structured"
                                checked={namingMode !== "custom"}
                                onChange={() => {
                                    setNamingMode("structured");
                                    setSecondaryProductName((product?.customLabel ?? "").trim());
                                }}
                                className="h-4 w-4 accent-[rgb(var(--accent))]"
                            />
                            {ui.namingModeStructured}
                        </label>
                        <label className="inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">
                            <input
                                type="radio"
                                name="namingMode"
                                value="custom"
                                checked={namingMode === "custom"}
                                onChange={() => {
                                    setNamingMode("custom");
                                    setCustomName((product?.customLabel || product?.name || "").trim());
                                }}
                                className="h-4 w-4 accent-[rgb(var(--accent))]"
                            />
                            {ui.namingModeCustom}
                        </label>
                    </div>
                </FormField>

                {namingMode === "custom" ? (
                    <FormField label={ui.productName} htmlFor={`${idPrefix}-custom-name`} required hint={ui.productNameHint}>
                        <Input
                            id={`${idPrefix}-custom-name`}
                            name="customName"
                            value={customName}
                            onChange={(event) => setCustomName(event.currentTarget.value)}
                            placeholder={ui.productNamePlaceholder}
                            required
                            className={controlClass}
                        />
                    </FormField>
                ) : (
                    <div className="grid gap-3 md:col-span-2 xl:col-span-3 md:grid-cols-2 md:items-start">
                        <FormField
                            label={ui.autoProductName}
                            htmlFor={`${idPrefix}-auto-name`}
                            hint={ui.autoProductNameHint}
                        >
                            <Input
                                id={`${idPrefix}-auto-name`}
                                value={previewName}
                                readOnly
                                placeholder={ui.autoProductNamePlaceholder}
                                className={controlClass}
                            />
                        </FormField>
                        <FormField
                            label={ui.secondaryName}
                            htmlFor={`${idPrefix}-secondary-name`}
                            hint={
                                structuredDisplayName !== previewName
                                    ? `${ui.secondaryNamePreviewPrefix}${structuredDisplayName}`
                                    : ui.secondaryNameHint
                            }
                        >
                            <Input
                                id={`${idPrefix}-secondary-name`}
                                value={secondaryProductName}
                                onChange={(event) => setSecondaryProductName(event.currentTarget.value)}
                                placeholder={ui.secondaryNamePlaceholder}
                                className={controlClass}
                            />
                        </FormField>
                    </div>
                )}

                <input type="hidden" name="name" value={namingMode === "custom" ? customName : previewName} />
                <input type="hidden" name="secondaryProductName" value={namingMode === "custom" ? "" : secondaryProductName} />

                <FormField label={ui.sku} htmlFor={`${idPrefix}-sku`}>
                    <Input id={`${idPrefix}-sku`} name="sku" defaultValue={product?.sku} placeholder={ui.skuPlaceholder} className={controlClass} />
                </FormField>

                <FormField label={ui.supplier} htmlFor={`${idPrefix}-supplier`}>
                    <Input
                        id={`${idPrefix}-supplier`}
                        name="supplier"
                        list={supplierListId}
                        defaultValue={product?.supplier}
                        placeholder={ui.supplierPlaceholder}
                        className={controlClass}
                    />
                </FormField>

                <FormField label={ui.price} htmlFor={`${idPrefix}-price`} required>
                    <Input id={`${idPrefix}-price`} type="number" min={0} name="price" defaultValue={product?.price ?? 0} required className={controlClass} />
                </FormField>

                <FormField label={ui.cost} htmlFor={`${idPrefix}-cost`} required>
                    <Input id={`${idPrefix}-cost`} type="number" min={0} name="cost" defaultValue={product?.cost ?? 0} required className={controlClass} />
                </FormField>

                <FormField label={ui.stock} htmlFor={`${idPrefix}-stock`} required>
                    <Input
                        id={`${idPrefix}-stock`}
                        type="number"
                        min={0}
                        name="stock"
                        defaultValue={product?.onHandQty ?? product?.stock ?? 0}
                        required
                        className={controlClass}
                    />
                </FormField>

                <FormField label={ui.lowStockThreshold} htmlFor={`${idPrefix}-low-stock`} required>
                    <Input
                        id={`${idPrefix}-low-stock`}
                        type="number"
                        min={0}
                        name="lowStockThreshold"
                        defaultValue={product?.lowStockThreshold ?? 5}
                        required
                        className={controlClass}
                    />
                </FormField>

                <FormField label={ui.stockDeductionMode} htmlFor={`${idPrefix}-stock-mode`} required>
                    <Select
                        id={`${idPrefix}-stock-mode`}
                        name="stockDeductionMode"
                        defaultValue={product?.stockDeductionMode ?? "immediate"}
                        className={controlClass}
                    >
                        <option value="immediate">{ui.stockDeductionImmediate}</option>
                        <option value="redeem_only">{ui.stockDeductionRedeemOnly}</option>
                    </Select>
                </FormField>

                <FormField label={ui.status} htmlFor={`${idPrefix}-status`} required>
                    <Select id={`${idPrefix}-status`} name="status" defaultValue={product?.status ?? "active"} className={controlClass}>
                        <option value="active">{ui.statusActive}</option>
                        <option value="inactive">{ui.statusInactive}</option>
                    </Select>
                </FormField>
            </div>
        </>
    );
}
