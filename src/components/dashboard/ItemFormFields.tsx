"use client";

import { useMemo, useState } from "react";
import { DimensionPicker } from "@/components/merchant/catalog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
            if (token === "brand") return "品牌";
            if (token === "model") return "型號";
            if (token === "category") return "主分類";
            return "第二分類";
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
                <FormField label="品項命名方式" className="md:col-span-2 xl:col-span-3" hint={`目前自動命名排序：${orderText}`}>
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
                            自動命名
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
                            自訂名稱
                        </label>
                    </div>
                </FormField>

                {namingMode === "custom" ? (
                    <FormField label="品項名稱" htmlFor={`${idPrefix}-custom-name`} required hint="自訂名稱會直接作為此品項顯示名稱。">
                        <Input
                            id={`${idPrefix}-custom-name`}
                            name="customName"
                            value={customName}
                            onChange={(event) => setCustomName(event.currentTarget.value)}
                            placeholder="例如：Apple iPhone 16 Pro 原廠螢幕總成"
                            required
                            className={controlClass}
                        />
                    </FormField>
                ) : (
                    <div className="grid gap-3 md:col-span-2 xl:col-span-3 md:grid-cols-2 md:items-start">
                        <FormField
                            label="品項名稱（自動帶入）"
                            htmlFor={`${idPrefix}-auto-name`}
                            hint="系統會依品牌 / 型號 / 分類排序自動產生，若缺少欄位會自動略過。"
                        >
                            <Input
                                id={`${idPrefix}-auto-name`}
                                value={previewName}
                                readOnly
                                placeholder="選擇分類、品牌與型號後自動帶入"
                                className={controlClass}
                            />
                        </FormField>
                        <FormField
                            label="副品名（選填）"
                            htmlFor={`${idPrefix}-secondary-name`}
                            hint={
                                structuredDisplayName !== previewName
                                    ? `完整顯示名稱預覽：${structuredDisplayName}`
                                    : "可補充規格、顏色、版本等，會接在自動命名後方。"
                            }
                        >
                            <Input
                                id={`${idPrefix}-secondary-name`}
                                value={secondaryProductName}
                                onChange={(event) => setSecondaryProductName(event.currentTarget.value)}
                                placeholder="例如：黑色 / 原廠料 / 副廠"
                                className={controlClass}
                            />
                        </FormField>
                    </div>
                )}

                <input type="hidden" name="name" value={namingMode === "custom" ? customName : previewName} />
                <input type="hidden" name="secondaryProductName" value={namingMode === "custom" ? "" : secondaryProductName} />

                <FormField label="SKU" htmlFor={`${idPrefix}-sku`}>
                    <Input id={`${idPrefix}-sku`} name="sku" defaultValue={product?.sku} placeholder="例如：IP16P-256-BLK" className={controlClass} />
                </FormField>

                <FormField label="供應商" htmlFor={`${idPrefix}-supplier`}>
                    <Input
                        id={`${idPrefix}-supplier`}
                        name="supplier"
                        list={supplierListId}
                        defaultValue={product?.supplier}
                        placeholder="例如：Apple 授權供應商"
                        className={controlClass}
                    />
                </FormField>

                <FormField label="售價" htmlFor={`${idPrefix}-price`} required>
                    <Input id={`${idPrefix}-price`} type="number" min={0} name="price" defaultValue={product?.price ?? 0} required className={controlClass} />
                </FormField>

                <FormField label="成本" htmlFor={`${idPrefix}-cost`} required>
                    <Input id={`${idPrefix}-cost`} type="number" min={0} name="cost" defaultValue={product?.cost ?? 0} required className={controlClass} />
                </FormField>

                <FormField label="庫存數量" htmlFor={`${idPrefix}-stock`} required>
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

                <FormField label="最小庫存警戒" htmlFor={`${idPrefix}-low-stock`} required>
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

                <FormField label="扣庫存模式" htmlFor={`${idPrefix}-stock-mode`} required>
                    <Select
                        id={`${idPrefix}-stock-mode`}
                        name="stockDeductionMode"
                        defaultValue={product?.stockDeductionMode ?? "immediate"}
                        className={controlClass}
                    >
                        <option value="immediate">即時扣庫存（一般銷售）</option>
                        <option value="redeem_only">兌換才扣庫存（客戶權益/活動）</option>
                    </Select>
                </FormField>

                <FormField label="狀態" htmlFor={`${idPrefix}-status`} required>
                    <Select id={`${idPrefix}-status`} name="status" defaultValue={product?.status ?? "active"} className={controlClass}>
                        <option value="active">啟用</option>
                        <option value="inactive">停用</option>
                    </Select>
                </FormField>
            </div>
        </>
    );
}
