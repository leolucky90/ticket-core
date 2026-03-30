"use client";

import { ArrowLeft, Save, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { getUiText } from "@/lib/i18n/ui-text";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SpecificationEditor } from "@/components/used-products/specification-editor";
import type { RepairBrandModelGroup } from "@/lib/types/repair-brand";
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
    const ui = getUiText(lang).usedProductForm;
    const listUi = getUiText(lang).usedProductList;
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
        <>
        <form action={submitAction} className="grid gap-4">
            {product ? <input type="hidden" name="id" value={product.id} /> : null}
            <input type="hidden" name="name" value={derivedProductName} />

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">{ui.basicInfo}</div>
                <div className="grid gap-3 md:grid-cols-2">
                    <FormField label={ui.type} required>
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
                            <option value="">{ui.typePlaceholder}</option>
                            {typeSettings.map((row) => (
                                <option key={row.id} value={row.name}>
                                    {row.name}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField label={ui.brand} required hint={typeValue ? ui.brandHintTypeOnly : ui.brandHintSelectType}>
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
                            <option value="">{typeValue ? ui.brandPlaceholder : ui.brandHintSelectType}</option>
                            {effectiveBrandOptions.map((name) => (
                                <option key={`brand-opt-${name}`} value={name}>
                                    {name}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField label={ui.model} required hint={brandValue ? ui.modelHintBrandOnly : ui.modelHintSelectBrand}>
                        <Select
                            name="model"
                            value={modelValue}
                            onChange={(event) => setModelValue(event.currentTarget.value)}
                            required
                            disabled={!brandValue}
                        >
                            <option value="">{brandValue ? ui.modelPlaceholder : ui.modelHintSelectBrand}</option>
                            {effectiveModelOptions.map((name) => (
                                <option key={`model-opt-${name}`} value={name}>
                                    {name}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField label={ui.serialOrImei}>
                        <Input name="serialOrImei" defaultValue={serialOrImeiValue} />
                    </FormField>
                    <div className="md:col-span-2 grid gap-1">
                        <div className="text-xs font-medium text-[rgb(var(--text))]">{ui.specificationFields}</div>
                        <div className="text-xs text-[rgb(var(--muted))]">{ui.specificationHint}</div>
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
                <div className="text-sm font-semibold">{ui.statusAndCondition}</div>
                <div className="grid gap-3 md:grid-cols-2">
                    <FormField label={ui.grade} required>
                        <Select
                            name="grade"
                            value={grade}
                            onChange={(event) => setGrade(event.currentTarget.value as UsedProductGrade)}
                        >
                            <option value="GRADE_A">Grade A</option>
                            <option value="GRADE_B">Grade B</option>
                            <option value="GRADE_C">Grade C</option>
                            <option value="GRADE_D">Grade D</option>
                            <option value="CUSTOM">{ui.gradeCustom}</option>
                        </Select>
                    </FormField>
                    {grade === "CUSTOM" ? (
                        <FormField label={ui.customGrade}>
                            <Input name="gradeLabel" defaultValue={product?.gradeLabel ?? ""} placeholder={ui.customGradePlaceholder} />
                        </FormField>
                    ) : (
                        <input type="hidden" name="gradeLabel" value={product?.gradeLabel ?? ""} />
                    )}
                    <FormField label={ui.conditionNote} className="md:col-span-2">
                        <Textarea name="conditionNote" rows={2} defaultValue={product?.conditionNote ?? ""} />
                    </FormField>
                    <FormField label={ui.functionalNote} className="md:col-span-2">
                        <Textarea name="functionalNote" rows={2} defaultValue={product?.functionalNote ?? ""} />
                    </FormField>
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">{ui.refurbishment}</div>
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
                        {ui.needsRefurbishment}
                    </label>
                    <FormField label={ui.refurbishmentStatus} required>
                        <Select
                            name="refurbishmentStatus"
                            value={needsRefurbishment ? refurbishmentStatusValue : "no_need_refurbishment"}
                            onChange={(event) => setRefurbishmentStatusValue(event.currentTarget.value as UsedProduct["refurbishmentStatus"])}
                            disabled={!needsRefurbishment}
                        >
                            {needsRefurbishment ? (
                                <>
                                    <option value="waiting_refurbishment">{ui.waitingRefurbishment}</option>
                                    <option value="refurbishing">{ui.refurbishing}</option>
                                    <option value="refurbished">{ui.refurbished}</option>
                                </>
                            ) : (
                                <option value="no_need_refurbishment">{ui.noNeedRefurbishment}</option>
                            )}
                        </Select>
                    </FormField>
                    <FormField label={ui.refurbishmentNote} className="md:col-span-2">
                        <Textarea name="refurbishmentNote" rows={2} defaultValue={product?.refurbishmentNote ?? ""} />
                    </FormField>
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">{ui.purchaseInfo}</div>
                <div className="grid gap-3 md:grid-cols-2">
                    <FormField label={ui.purchaseDate} required>
                        <Input type="date" name="purchaseDate" defaultValue={(product?.purchaseDate ?? "").slice(0, 10)} required />
                    </FormField>
                    <FormField label={ui.purchasePrice} required>
                        <Input type="number" min={0} name="purchasePrice" defaultValue={String(product?.purchasePrice ?? 0)} required />
                    </FormField>
                    <FormField label={ui.sourceNote} className="md:col-span-2">
                        <Textarea name="sourceNote" rows={2} defaultValue={product?.sourceNote ?? ""} />
                    </FormField>
                    <FormField label={ui.inspectionResult} className="md:col-span-2">
                        <Textarea name="inspectionResult" rows={2} defaultValue={product?.inspectionResult ?? ""} />
                    </FormField>
                    <FormField label={ui.inspectedBy}>
                        <Input name="inspectedBy" defaultValue={product?.inspectedBy ?? ""} />
                    </FormField>
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">{ui.salesInfo}</div>
                <div className="grid gap-3 md:grid-cols-2">
                    <FormField label={ui.suggestedSalePrice}>
                        <Input type="number" min={0} name="suggestedSalePrice" defaultValue={String(product?.suggestedSalePrice ?? "")} />
                    </FormField>
                    <FormField label={ui.salePrice}>
                        <Input type="number" min={0} name="salePrice" defaultValue={String(product?.salePrice ?? "")} />
                    </FormField>
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" name="isSellable" defaultChecked={product?.isSellable ?? true} className="h-4 w-4 accent-[rgb(var(--accent))]" />
                        {ui.isSellable}
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" name="isPublished" defaultChecked={product?.isPublished ?? false} className="h-4 w-4 accent-[rgb(var(--accent))]" />
                        {ui.isPublished}
                    </label>
                    <FormField label={ui.saleStatus} className="md:col-span-2">
                        <Select name="saleStatus" defaultValue={product?.saleStatus ?? "draft"}>
                            <option value="draft">{listUi.saleStatus.draft}</option>
                            <option value="purchased">{listUi.saleStatus.purchased}</option>
                            <option value="inspecting">{listUi.saleStatus.inspecting}</option>
                            <option value="available">{listUi.saleStatus.available}</option>
                            <option value="reserved">{listUi.saleStatus.reserved}</option>
                            <option value="sold">{listUi.saleStatus.sold}</option>
                            <option value="returned">{listUi.saleStatus.returned}</option>
                            <option value="archived">{listUi.saleStatus.archived}</option>
                        </Select>
                    </FormField>
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">{ui.warrantyInfo}</div>
                <div className="grid gap-3 md:grid-cols-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" name="warrantyEnabled" defaultChecked={product?.warrantyEnabled ?? true} className="h-4 w-4 accent-[rgb(var(--accent))]" />
                        {ui.warrantyEnabled}
                    </label>
                    <FormField label={ui.warrantyDuration} required>
                        <Input type="number" min={0} name="warrantyDuration" defaultValue={String(product?.warrantyDuration ?? 3)} required />
                    </FormField>
                    <FormField label={ui.warrantyUnit} required>
                        <Select name="warrantyUnit" defaultValue={product?.warrantyUnit ?? "month"}>
                            <option value="day">{ui.warrantyUnitDay}</option>
                            <option value="month">{ui.warrantyUnitMonth}</option>
                        </Select>
                    </FormField>
                    <FormField label={ui.warrantyStartsOn}>
                        <Input value={ui.warrantyStartsOnSold} disabled />
                        <input type="hidden" name="warrantyStartsOn" value="receipt_issued_at" />
                    </FormField>
                    <FormField label={ui.warrantyNote} className="md:col-span-2">
                        <Textarea name="warrantyNote" rows={2} defaultValue={product?.warrantyNote ?? ""} />
                    </FormField>
                </div>
            </Card>

            <div className="flex flex-wrap gap-2">
                <IconTextActionButton icon={Save} type="submit" label={mode === "create" ? ui.saveCreate : ui.saveEdit} tooltip={mode === "create" ? ui.saveCreate : ui.saveEdit} />
                <IconTextActionButton icon={ArrowLeft} href={backHref} label={ui.back} tooltip={ui.backTooltip} />
            </div>
        </form>

        {mode === "edit" && product && createRefurbishmentCaseAction ? (
            <Card className="grid gap-2">
                <div className="text-sm font-semibold">{ui.refurbishment}</div>
                <form action={createRefurbishmentCaseAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="usedProductId" value={product.id} />
                    <IconTextActionButton icon={Wrench} type="submit" label={ui.createRefurbishmentCase} tooltip={ui.createRefurbishmentCaseTooltip} />
                </form>
            </Card>
        ) : null}
        </>
    );
}
