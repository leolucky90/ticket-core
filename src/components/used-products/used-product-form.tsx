"use client";

import { ArrowLeft, Save, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SpecificationEditor } from "@/components/used-products/specification-editor";
import type { RepairBrandModelGroup } from "@/lib/types/commerce";
import type { UsedProduct, UsedProductGrade, UsedProductTypeSetting } from "@/lib/schema";

type UsedProductBrandOption = {
    id: string;
    name: string;
    modelsByType: RepairBrandModelGroup[];
    models: string[];
    usedProductTypes: string[];
};

function getBrandModelsForType(brand: UsedProductBrandOption, typeName: string): string[] {
    const requestedTypeName = typeName.trim().toLowerCase();
    if (!requestedTypeName) return brand.models;

    const matchedGroup = (brand.modelsByType ?? []).find((group) => group.typeName.trim().toLowerCase() === requestedTypeName) ?? null;
    if (matchedGroup) return matchedGroup.models;
    if ((brand.modelsByType ?? []).length === 0) return brand.models;
    if ((brand.usedProductTypes ?? []).length <= 1) return brand.models;
    return [];
}

type UsedProductFormProps = {
    lang?: "zh" | "en";
    mode: "create" | "edit";
    product?: UsedProduct | null;
    typeSettings: UsedProductTypeSetting[];
    brandOptions: UsedProductBrandOption[];
    submitAction: (formData: FormData) => Promise<void>;
    createRefurbishmentCaseAction?: (formData: FormData) => Promise<void>;
    backHref: string;
};

export function UsedProductForm({
    lang = "zh",
    mode,
    product,
    typeSettings,
    brandOptions,
    submitAction,
    createRefurbishmentCaseAction,
    backHref,
}: UsedProductFormProps) {
    const [typeValue, setTypeValue] = useState(product?.type ?? typeSettings[0]?.name ?? "");
    const [grade, setGrade] = useState<UsedProductGrade>(product?.grade ?? "GRADE_B");
    const [brandValue, setBrandValue] = useState(product?.brand ?? "");
    const [modelValue, setModelValue] = useState(product?.model ?? "");
    const [needsRefurbishment, setNeedsRefurbishment] = useState(
        product ? product.refurbishmentStatus !== "no_need_refurbishment" : false,
    );
    const [refurbishmentStatusValue, setRefurbishmentStatusValue] = useState<UsedProduct["refurbishmentStatus"]>(
        product?.refurbishmentStatus ?? "waiting_refurbishment",
    );

    const activeTypeSetting = useMemo(
        () => typeSettings.find((row) => row.name === typeValue) ?? null,
        [typeSettings, typeValue],
    );
    const specificationEditorKey = `spec-editor-${product?.id ?? "new"}-${typeValue || "empty"}`;
    const specificationInitialItems = useMemo(() => {
        if (product && typeValue === product.type) return product.specificationItems ?? [];
        return [];
    }, [product, typeValue]);
    const brandNameOptions = useMemo(
        () => {
            if (!typeValue.trim()) return [];
            return brandOptions
                .filter((row) =>
                    (row.usedProductTypes ?? []).some((typeName) => typeName.trim().toLowerCase() === typeValue.trim().toLowerCase()),
                )
                .map((row) => row.name.trim())
                .filter((row, index, arr) => row.length > 0 && arr.indexOf(row) === index)
                .sort((a, b) => a.localeCompare(b, "zh-Hant"));
        },
        [brandOptions, typeValue],
    );
    const selectedBrandModels = useMemo(() => {
        const selectedBrand = brandOptions.find((row) => row.name.trim().toLowerCase() === brandValue.trim().toLowerCase()) ?? null;
        if (!selectedBrand) return [];
        return getBrandModelsForType(selectedBrand, typeValue)
            .map((row) => row.trim())
            .filter((row, index, arr) => row.length > 0 && arr.indexOf(row) === index)
            .sort((a, b) => a.localeCompare(b, "zh-Hant"));
    }, [brandOptions, brandValue, typeValue]);
    const modelNameOptions = selectedBrandModels;
    const effectiveBrandOptions = useMemo(() => {
        const exists = brandNameOptions.some((name) => name.toLowerCase() === brandValue.trim().toLowerCase());
        if (exists || !brandValue.trim()) return brandNameOptions;
        return [brandValue.trim(), ...brandNameOptions];
    }, [brandNameOptions, brandValue]);
    const effectiveModelOptions = useMemo(() => {
        const exists = modelNameOptions.some((name) => name.toLowerCase() === modelValue.trim().toLowerCase());
        if (exists || !modelValue.trim()) return modelNameOptions;
        return [modelValue.trim(), ...modelNameOptions];
    }, [modelNameOptions, modelValue]);
    const serialOrImeiValue = useMemo(() => product?.serialNumber || product?.imeiNumber || "", [product?.imeiNumber, product?.serialNumber]);
    const derivedProductName = useMemo(() => {
        const primaryName = [brandValue.trim(), typeValue.trim(), modelValue.trim()].filter((value) => value.length > 0).join(" ");
        if (primaryName) return primaryName;
        return [brandValue.trim(), typeValue.trim()].filter((value) => value.length > 0).join(" ");
    }, [brandValue, modelValue, typeValue]);

    return (
        <form action={submitAction} className="grid gap-4">
            {product ? <input type="hidden" name="id" value={product.id} /> : null}
            <input type="hidden" name="name" value={derivedProductName} />

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">基本資訊</div>
                <div className="grid gap-3 md:grid-cols-2">
                    <FormField label="類型" required>
                        <Select
                            name="type"
                            value={typeValue}
                            onChange={(event) => {
                                const nextType = event.currentTarget.value;
                                setTypeValue(nextType);

                                const nextBrandNames = brandOptions
                                    .filter((row) =>
                                        (row.usedProductTypes ?? []).some((typeName) => typeName.trim().toLowerCase() === nextType.trim().toLowerCase()),
                                    )
                                    .map((row) => row.name.trim().toLowerCase());

                                if (!nextBrandNames.includes(brandValue.trim().toLowerCase())) {
                                    setBrandValue("");
                                    setModelValue("");
                                }
                            }}
                            required
                        >
                            <option value="">請選擇類型</option>
                            {typeSettings.map((row) => (
                                <option key={row.id} value={row.name}>
                                    {row.name}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField label="品牌" required hint={typeValue ? "只顯示該類型可用品牌" : "請先選擇類型"}>
                        <Select
                            name="brand"
                            value={brandValue}
                            onChange={(event) => {
                                const nextBrand = event.currentTarget.value;
                                setBrandValue(nextBrand);
                                if (!nextBrand) {
                                    setModelValue("");
                                    return;
                                }
                                const owner = brandOptions.find((row) => row.name.trim().toLowerCase() === nextBrand.trim().toLowerCase()) ?? null;
                                if (!owner) {
                                    setModelValue("");
                                    return;
                                }
                                const modelExists = getBrandModelsForType(owner, typeValue).some(
                                    (row) => row.trim().toLowerCase() === modelValue.trim().toLowerCase(),
                                );
                                if (!modelExists) setModelValue("");
                            }}
                            required
                            disabled={!typeValue}
                        >
                            <option value="">{typeValue ? "請選擇品牌" : "請先選擇類型"}</option>
                            {effectiveBrandOptions.map((name) => (
                                <option key={`brand-opt-${name}`} value={name}>
                                    {name}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField label="型號" required hint={brandValue ? "先選品牌再選型號" : "請先選擇品牌"}>
                        <Select
                            name="model"
                            value={modelValue}
                            onChange={(event) => setModelValue(event.currentTarget.value)}
                            required
                            disabled={!brandValue}
                        >
                            <option value="">{brandValue ? "請選擇型號" : "請先選擇品牌"}</option>
                            {effectiveModelOptions.map((name) => (
                                <option key={`model-opt-${name}`} value={name}>
                                    {name}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField label="序列號/IMEI No">
                        <Input name="serialOrImei" defaultValue={serialOrImeiValue} />
                    </FormField>
                    <div className="md:col-span-2 grid gap-1">
                        <div className="text-xs font-medium text-[rgb(var(--text))]">規格欄位</div>
                        <div className="text-xs text-[rgb(var(--muted))]">規格欄位會依商品類型模板自動帶入；如需調整欄位結構，請到商店營銷設定修改。</div>
                        <SpecificationEditor
                            key={specificationEditorKey}
                            templates={activeTypeSetting?.specificationTemplates ?? []}
                            initialItems={specificationInitialItems}
                            hiddenName="specificationItemsJson"
                            lang={lang}
                        />
                    </div>
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">商品狀態 / 評價</div>
                <div className="grid gap-3 md:grid-cols-2">
                    <FormField label="商品評級" required>
                        <Select
                            name="grade"
                            value={grade}
                            onChange={(event) => setGrade(event.currentTarget.value as UsedProductGrade)}
                        >
                            <option value="GRADE_A">Grade A</option>
                            <option value="GRADE_B">Grade B</option>
                            <option value="GRADE_C">Grade C</option>
                            <option value="GRADE_D">Grade D</option>
                            <option value="CUSTOM">自訂</option>
                        </Select>
                    </FormField>
                    {grade === "CUSTOM" ? (
                        <FormField label="自訂評級">
                            <Input name="gradeLabel" defaultValue={product?.gradeLabel ?? ""} placeholder="例如：99 新" />
                        </FormField>
                    ) : (
                        <input type="hidden" name="gradeLabel" value={product?.gradeLabel ?? ""} />
                    )}
                    <FormField label="外觀描述" className="md:col-span-2">
                        <Textarea name="conditionNote" rows={2} defaultValue={product?.conditionNote ?? ""} />
                    </FormField>
                    <FormField label="功能描述" className="md:col-span-2">
                        <Textarea name="functionalNote" rows={2} defaultValue={product?.functionalNote ?? ""} />
                    </FormField>
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">翻新資訊</div>
                <div className="grid gap-3 md:grid-cols-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            name="isRefurbished"
                            checked={needsRefurbishment}
                            onChange={(event) => {
                                const nextChecked = event.currentTarget.checked;
                                setNeedsRefurbishment(nextChecked);
                                setRefurbishmentStatusValue((current) => {
                                    if (!nextChecked) return "no_need_refurbishment";
                                    return current === "no_need_refurbishment" ? "waiting_refurbishment" : current;
                                });
                            }}
                            className="h-4 w-4 accent-[rgb(var(--accent))]"
                        />
                        需翻新才能販賣
                    </label>
                    <FormField label="翻新狀態" required>
                        <Select
                            name="refurbishmentStatus"
                            value={needsRefurbishment ? refurbishmentStatusValue : "no_need_refurbishment"}
                            onChange={(event) => setRefurbishmentStatusValue(event.currentTarget.value as UsedProduct["refurbishmentStatus"])}
                            disabled={!needsRefurbishment}
                        >
                            {needsRefurbishment ? (
                                <>
                                    <option value="waiting_refurbishment">等待翻新</option>
                                    <option value="refurbishing">翻新中</option>
                                    <option value="refurbished">已翻新</option>
                                </>
                            ) : (
                                <option value="no_need_refurbishment">不須翻新</option>
                            )}
                        </Select>
                    </FormField>
                    <FormField label="翻新說明" className="md:col-span-2">
                        <Textarea name="refurbishmentNote" rows={2} defaultValue={product?.refurbishmentNote ?? ""} />
                    </FormField>
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">收購資訊</div>
                <div className="grid gap-3 md:grid-cols-2">
                    <FormField label="收購日期" required>
                        <Input type="date" name="purchaseDate" defaultValue={(product?.purchaseDate ?? "").slice(0, 10)} required />
                    </FormField>
                    <FormField label="收購價格" required>
                        <Input type="number" min={0} name="purchasePrice" defaultValue={String(product?.purchasePrice ?? 0)} required />
                    </FormField>
                    <FormField label="收購來源說明" className="md:col-span-2">
                        <Textarea name="sourceNote" rows={2} defaultValue={product?.sourceNote ?? ""} />
                    </FormField>
                    <FormField label="驗機結果" className="md:col-span-2">
                        <Textarea name="inspectionResult" rows={2} defaultValue={product?.inspectionResult ?? ""} />
                    </FormField>
                    <FormField label="經手人員">
                        <Input name="inspectedBy" defaultValue={product?.inspectedBy ?? ""} />
                    </FormField>
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">銷售資訊</div>
                <div className="grid gap-3 md:grid-cols-2">
                    <FormField label="建議售價">
                        <Input type="number" min={0} name="suggestedSalePrice" defaultValue={String(product?.suggestedSalePrice ?? "")} />
                    </FormField>
                    <FormField label="實際售價">
                        <Input type="number" min={0} name="salePrice" defaultValue={String(product?.salePrice ?? "")} />
                    </FormField>
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" name="isSellable" defaultChecked={product?.isSellable ?? true} className="h-4 w-4 accent-[rgb(var(--accent))]" />
                        是否可販售
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" name="isPublished" defaultChecked={product?.isPublished ?? false} className="h-4 w-4 accent-[rgb(var(--accent))]" />
                        上架狀態
                    </label>
                    <FormField label="銷售狀態" className="md:col-span-2">
                        <Select name="saleStatus" defaultValue={product?.saleStatus ?? "draft"}>
                            <option value="draft">draft</option>
                            <option value="purchased">purchased</option>
                            <option value="inspecting">inspecting</option>
                            <option value="available">available</option>
                            <option value="reserved">reserved</option>
                            <option value="sold">sold</option>
                            <option value="returned">returned</option>
                            <option value="archived">archived</option>
                        </Select>
                    </FormField>
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">保固資訊</div>
                <div className="grid gap-3 md:grid-cols-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" name="warrantyEnabled" defaultChecked={product?.warrantyEnabled ?? true} className="h-4 w-4 accent-[rgb(var(--accent))]" />
                        啟用保固
                    </label>
                    <FormField label="預設保固時限" required>
                        <Input type="number" min={0} name="warrantyDuration" defaultValue={String(product?.warrantyDuration ?? 3)} required />
                    </FormField>
                    <FormField label="保固單位" required>
                        <Select name="warrantyUnit" defaultValue={product?.warrantyUnit ?? "month"}>
                            <option value="day">day</option>
                            <option value="month">month</option>
                        </Select>
                    </FormField>
                    <FormField label="保固起算方式">
                        <Input value="receipt_issued_at" disabled />
                        <input type="hidden" name="warrantyStartsOn" value="receipt_issued_at" />
                    </FormField>
                    <FormField label="保固說明" className="md:col-span-2">
                        <Textarea name="warrantyNote" rows={2} defaultValue={product?.warrantyNote ?? ""} />
                    </FormField>
                </div>
            </Card>

            <div className="flex flex-wrap gap-2">
                <IconTextActionButton icon={Save} type="submit" label={mode === "create" ? "儲存新增" : "儲存修改"} tooltip="儲存二手商品資料" />
                <IconTextActionButton icon={ArrowLeft} href={backHref} label="返回" tooltip="返回上一頁" />
            </div>

            {mode === "edit" && product && createRefurbishmentCaseAction ? (
                <Card className="grid gap-2">
                    <div className="text-sm font-semibold">翻新案件</div>
                    <form action={createRefurbishmentCaseAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="usedProductId" value={product.id} />
                        <IconTextActionButton
                            icon={Wrench}
                            type="submit"
                            label="建立翻新案件"
                            tooltip="建立或連結翻新案件"
                        />
                    </form>
                </Card>
            ) : null}
        </form>
    );
}
