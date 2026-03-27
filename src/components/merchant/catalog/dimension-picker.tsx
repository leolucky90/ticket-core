"use client";

import { useMemo, useState, type FocusEvent, type MouseEvent } from "react";
import { Select } from "@/components/ui/select";
import { cn } from "@/components/ui/cn";
import { FormField } from "@/components/ui/form-field";
import type { DimensionPickerBundle } from "@/lib/types/catalog";

type DimensionPickerValue = {
    categoryRef?: string;
    brandRef?: string;
    modelRef?: string;
};

type DimensionPickerProps = {
    bundle: DimensionPickerBundle;
    value?: DimensionPickerValue;
    className?: string;
    idPrefix?: string;
    categoryRefName?: string;
    brandRefName?: string;
    modelRefName?: string;
};

function encodeRef(id: string, name: string): string {
    return `${id}::${name}`;
}

function parseRef(rawValue: string): { id: string; name: string } {
    const value = rawValue.trim();
    if (!value) return { id: "", name: "" };
    const [id, name] = value.split("::");
    return {
        id: (id ?? "").trim(),
        name: (name ?? "").trim(),
    };
}

function matchesModelWithBrand(
    model: DimensionPickerBundle["models"][number],
    brand: { id: string; name: string },
): boolean {
    if (!brand.id && !brand.name) return false;
    const modelBrandId = (model.brandId ?? "").trim();
    const modelBrandName = (model.brandName ?? "").trim().toLowerCase();
    const brandName = brand.name.toLowerCase();

    if (modelBrandId && brand.id) return modelBrandId === brand.id;
    if (modelBrandName && brandName) return modelBrandName === brandName;
    return false;
}

export function DimensionPicker({
    bundle,
    value,
    className,
    idPrefix = "dimension-picker",
    categoryRefName = "categoryRef",
    brandRefName = "brandRef",
    modelRefName = "modelRef",
}: DimensionPickerProps) {
    const categoryId = `${idPrefix}-${categoryRefName}`;
    const brandId = `${idPrefix}-${brandRefName}`;
    const modelId = `${idPrefix}-${modelRefName}`;
    const controlClass = "h-10 min-w-0 w-full";
    const [selectedCategoryRef, setSelectedCategoryRef] = useState(value?.categoryRef ?? "");
    const [selectedBrandRef, setSelectedBrandRef] = useState(value?.brandRef ?? "");
    const [selectedModelRef, setSelectedModelRef] = useState(value?.modelRef ?? "");

    const selectedCategory = useMemo(() => parseRef(selectedCategoryRef), [selectedCategoryRef]);
    const selectedBrand = useMemo(() => parseRef(selectedBrandRef), [selectedBrandRef]);
    const hasSelectedCategory = Boolean(selectedCategory.id || selectedCategory.name);
    const hasSelectedBrand = Boolean(selectedBrand.id || selectedBrand.name);
    const brandOptions = useMemo(() => {
        if (!hasSelectedCategory) return bundle.brands;
        const normalizedCategoryName = selectedCategory.name.trim().toLowerCase();
        const matched = bundle.brands.filter((brand) => (brand.categoryNames ?? []).some((name) => name.trim().toLowerCase() === normalizedCategoryName));
        return matched.length > 0 ? matched : bundle.brands;
    }, [bundle.brands, hasSelectedCategory, selectedCategory.name]);
    const modelOptions = useMemo(
        () => bundle.models.filter((model) => matchesModelWithBrand(model, selectedBrand)),
        [bundle.models, selectedBrand],
    );
    const effectiveModelRef = useMemo(() => {
        if (!hasSelectedBrand) return "";
        if (!selectedModelRef) return "";
        const exists = modelOptions.some((item) => encodeRef(item.id, item.name) === selectedModelRef);
        return exists ? selectedModelRef : "";
    }, [hasSelectedBrand, modelOptions, selectedModelRef]);

    const promptSelectBrandFirst = () => {
        window.alert("請先選擇品牌");
    };

    const handleCategoryChange = (nextRef: string) => {
        setSelectedCategoryRef(nextRef);
        if (!nextRef) return;
        const nextCategory = parseRef(nextRef);
        const nextBrandOptions = bundle.brands.filter((brand) => (brand.categoryNames ?? []).some((name) => name.trim().toLowerCase() === nextCategory.name.toLowerCase()));
        if (nextBrandOptions.length === 0) return;
        const selectedBrandExists = nextBrandOptions.some((brand) => encodeRef(brand.id, brand.name) === selectedBrandRef);
        if (!selectedBrandExists) {
            setSelectedBrandRef("");
            setSelectedModelRef("");
        }
    };

    const handleBrandChange = (nextRef: string) => {
        setSelectedBrandRef(nextRef);
        if (!nextRef) {
            setSelectedModelRef("");
            return;
        }
        const nextBrand = parseRef(nextRef);
        const nextModelOptions = bundle.models.filter((model) => matchesModelWithBrand(model, nextBrand));
        const exists = nextModelOptions.some((item) => encodeRef(item.id, item.name) === selectedModelRef);
        if (!exists) setSelectedModelRef("");
    };

    const handleModelMouseDown = (event: MouseEvent<HTMLSelectElement>) => {
        if (hasSelectedBrand) return;
        event.preventDefault();
        promptSelectBrandFirst();
    };

    const handleModelFocus = (event: FocusEvent<HTMLSelectElement>) => {
        if (hasSelectedBrand) return;
        event.currentTarget.blur();
        promptSelectBrandFirst();
    };

    const handleModelChange = (nextRef: string) => {
        if (!hasSelectedBrand) {
            setSelectedModelRef("");
            promptSelectBrandFirst();
            return;
        }
        setSelectedModelRef(nextRef);
    };

    return (
        <div className={cn("grid gap-3 md:grid-cols-2 xl:grid-cols-3", className)}>
            <FormField label="分類" htmlFor={categoryId}>
                <Select id={categoryId} name={categoryRefName} value={selectedCategoryRef} onChange={(event) => handleCategoryChange(event.currentTarget.value)} className={controlClass}>
                    <option value="">未指定</option>
                    {bundle.categories.map((item) => (
                        <option key={`cat-${item.id}`} value={encodeRef(item.id, item.name)}>
                            {item.name}
                        </option>
                    ))}
                </Select>
            </FormField>
            <FormField label="品牌" htmlFor={brandId}>
                <Select
                    id={brandId}
                    name={brandRefName}
                    value={selectedBrandRef}
                    onChange={(event) => handleBrandChange(event.currentTarget.value)}
                    className={controlClass}
                >
                    <option value="">未指定</option>
                    {brandOptions.map((item) => (
                        <option key={`brand-${item.id}`} value={encodeRef(item.id, item.name)}>
                            {item.name}
                        </option>
                    ))}
                </Select>
            </FormField>
            <FormField label="型號" htmlFor={modelId}>
                <Select
                    id={modelId}
                    name={modelRefName}
                    value={effectiveModelRef}
                    onMouseDown={handleModelMouseDown}
                    onFocus={handleModelFocus}
                    onChange={(event) => handleModelChange(event.currentTarget.value)}
                    className={controlClass}
                >
                    <option value="">
                        {!hasSelectedBrand ? "請先選擇品牌" : modelOptions.length === 0 ? "該品牌暫無型號" : "未指定"}
                    </option>
                    {modelOptions.map((item) => (
                        <option key={`model-${item.brandId ?? "na"}-${item.id}`} value={encodeRef(item.id, item.name)}>
                            {item.name}
                        </option>
                    ))}
                </Select>
            </FormField>
        </div>
    );
}
