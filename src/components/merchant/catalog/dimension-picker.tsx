"use client";

import { useMemo, useState, type FocusEvent, type MouseEvent } from "react";
import { useUiLanguage } from "@/components/layout/ui-language-provider";
import { Select } from "@/components/ui/select";
import { cn } from "@/components/ui/cn";
import { FormField } from "@/components/ui/form-field";
import { getUiText } from "@/lib/i18n/ui-text";
import {
    filterBrandsForPrimaryCategory,
    filterModelsForCatalogSelection,
    listProductTypesForCatalogSelection,
} from "@/lib/marketing/brand-catalog-helpers";
import type { DimensionPickerBundle } from "@/lib/types/catalog";

type DimensionPickerValue = {
    categoryRef?: string;
    secondaryCategoryRef?: string;
    tertiaryCategoryRef?: string;
    brandRef?: string;
    productTypeRef?: string;
    modelRef?: string;
};

type DimensionPickerProps = {
    bundle: DimensionPickerBundle;
    value?: DimensionPickerValue;
    className?: string;
    idPrefix?: string;
    categoryRefName?: string;
    secondaryCategoryRefName?: string;
    tertiaryCategoryRefName?: string;
    brandRefName?: string;
    productTypeRefName?: string;
    modelRefName?: string;
    onChange?: (value: DimensionPickerValue) => void;
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

export function DimensionPicker({
    bundle,
    value,
    className,
    idPrefix = "dimension-picker",
    categoryRefName = "categoryRef",
    secondaryCategoryRefName = "secondaryCategoryRef",
    tertiaryCategoryRefName = "tertiaryCategoryRef",
    brandRefName = "brandRef",
    productTypeRefName = "productTypeRef",
    modelRefName = "modelRef",
    onChange,
}: DimensionPickerProps) {
    const lang = useUiLanguage();
    const ui = getUiText(lang).dimensionPicker;
    const categoryId = `${idPrefix}-${categoryRefName}`;
    const secondaryCategoryId = `${idPrefix}-${secondaryCategoryRefName}`;
    const tertiaryCategoryId = `${idPrefix}-${tertiaryCategoryRefName}`;
    const brandId = `${idPrefix}-${brandRefName}`;
    const productTypeId = `${idPrefix}-${productTypeRefName}`;
    const modelId = `${idPrefix}-${modelRefName}`;
    const controlClass = "h-10 min-w-0 w-full";
    const [selectedCategoryRef, setSelectedCategoryRef] = useState(value?.categoryRef ?? "");
    const [selectedSecondaryCategoryRef, setSelectedSecondaryCategoryRef] = useState(value?.secondaryCategoryRef ?? "");
    const [selectedTertiaryCategoryRef, setSelectedTertiaryCategoryRef] = useState(value?.tertiaryCategoryRef ?? "");
    const [selectedBrandRef, setSelectedBrandRef] = useState(value?.brandRef ?? "");
    const [selectedProductTypeRef, setSelectedProductTypeRef] = useState(value?.productTypeRef ?? "");
    const [selectedModelRef, setSelectedModelRef] = useState(value?.modelRef ?? "");

    const selectedCategory = useMemo(() => parseRef(selectedCategoryRef), [selectedCategoryRef]);
    const selectedSecondaryCategory = useMemo(() => parseRef(selectedSecondaryCategoryRef), [selectedSecondaryCategoryRef]);
    const selectedBrand = useMemo(() => parseRef(selectedBrandRef), [selectedBrandRef]);
    const selectedProductType = useMemo(() => parseRef(selectedProductTypeRef), [selectedProductTypeRef]);
    const hasSelectedCategory = Boolean(selectedCategory.id || selectedCategory.name);
    const hasSelectedSecondaryCategory = Boolean(selectedSecondaryCategory.id || selectedSecondaryCategory.name);
    const hasSelectedBrand = Boolean(selectedBrand.id || selectedBrand.name);
    const topLevelCategories = useMemo(
        () => bundle.categories.filter((item) => (item.categoryLevel ?? 1) === 1),
        [bundle.categories],
    );
    const secondaryCategoryOptions = useMemo(() => {
        if (!hasSelectedCategory) return [];
        return bundle.categories.filter((item) => {
            if ((item.categoryLevel ?? 1) !== 2) return false;
            const parentId = (item.parentCategoryId ?? "").trim();
            const parentName = (item.parentCategoryName ?? "").trim().toLowerCase();
            if (selectedCategory.id && parentId) return parentId === selectedCategory.id;
            if (selectedCategory.name && parentName) return parentName === selectedCategory.name.toLowerCase();
            return false;
        });
    }, [bundle.categories, hasSelectedCategory, selectedCategory.id, selectedCategory.name]);
    const tertiaryCategoryOptions = useMemo(() => {
        if (!hasSelectedSecondaryCategory) return [];
        return bundle.categories.filter((item) => {
            if ((item.categoryLevel ?? 1) !== 3) return false;
            const parentId = (item.parentCategoryId ?? "").trim();
            const parentName = (item.parentCategoryName ?? "").trim().toLowerCase();
            if (selectedSecondaryCategory.id && parentId) return parentId === selectedSecondaryCategory.id;
            if (selectedSecondaryCategory.name && parentName) return parentName === selectedSecondaryCategory.name.toLowerCase();
            return false;
        });
    }, [bundle.categories, hasSelectedSecondaryCategory, selectedSecondaryCategory.id, selectedSecondaryCategory.name]);
    const brandOptions = useMemo(
        () => filterBrandsForPrimaryCategory(bundle.brands, selectedCategory),
        [bundle.brands, selectedCategory],
    );
    const productTypeOptions = useMemo(
        () =>
            listProductTypesForCatalogSelection(bundle.models, bundle.brands, {
                brand: selectedBrand,
                primaryCategory: selectedCategory,
            }),
        [bundle.models, bundle.brands, selectedBrand, selectedCategory],
    );
    const modelOptions = useMemo(
        () =>
            filterModelsForCatalogSelection(bundle.models, {
                brand: selectedBrand,
                primaryCategory: selectedCategory,
                secondaryCategory: selectedSecondaryCategory,
                tertiaryCategory: parseRef(selectedTertiaryCategoryRef),
                productType: selectedProductType,
            }),
        [bundle.models, selectedBrand, selectedCategory, selectedSecondaryCategory, selectedTertiaryCategoryRef, selectedProductType],
    );
    const effectiveModelRef = useMemo(() => {
        if (!hasSelectedBrand) return "";
        if (!selectedModelRef) return "";
        const exists = modelOptions.some((item) => encodeRef(item.id, item.name) === selectedModelRef);
        return exists ? selectedModelRef : "";
    }, [hasSelectedBrand, modelOptions, selectedModelRef]);
    const effectiveSecondaryCategoryRef = useMemo(() => {
        if (!hasSelectedCategory) return "";
        if (!selectedSecondaryCategoryRef) return "";
        const exists = secondaryCategoryOptions.some((item) => encodeRef(item.id, item.name) === selectedSecondaryCategoryRef);
        return exists ? selectedSecondaryCategoryRef : "";
    }, [hasSelectedCategory, secondaryCategoryOptions, selectedSecondaryCategoryRef]);
    const effectiveTertiaryCategoryRef = useMemo(() => {
        if (!hasSelectedSecondaryCategory) return "";
        if (!selectedTertiaryCategoryRef) return "";
        const exists = tertiaryCategoryOptions.some((item) => encodeRef(item.id, item.name) === selectedTertiaryCategoryRef);
        return exists ? selectedTertiaryCategoryRef : "";
    }, [hasSelectedSecondaryCategory, selectedTertiaryCategoryRef, tertiaryCategoryOptions]);
    const effectiveProductTypeRef = useMemo(() => {
        if (!hasSelectedBrand) return "";
        if (!selectedProductTypeRef) return "";
        const exists = productTypeOptions.some((item) => encodeRef(item, item) === selectedProductTypeRef);
        return exists ? selectedProductTypeRef : "";
    }, [hasSelectedBrand, productTypeOptions, selectedProductTypeRef]);

    const emitChange = (next: Partial<DimensionPickerValue>) => {
        onChange?.({
            categoryRef: next.categoryRef ?? selectedCategoryRef,
            secondaryCategoryRef: next.secondaryCategoryRef ?? selectedSecondaryCategoryRef,
            tertiaryCategoryRef: next.tertiaryCategoryRef ?? selectedTertiaryCategoryRef,
            brandRef: next.brandRef ?? selectedBrandRef,
            productTypeRef: next.productTypeRef ?? selectedProductTypeRef,
            modelRef: next.modelRef ?? selectedModelRef,
        });
    };

    const promptSelectBrandFirst = () => {
        window.alert(ui.selectBrandFirst);
    };
    const promptSelectCategoryFirst = () => {
        window.alert(ui.selectCategoryFirst);
    };

    const handleCategoryChange = (nextRef: string) => {
        setSelectedCategoryRef(nextRef);
        setSelectedSecondaryCategoryRef("");
        setSelectedTertiaryCategoryRef("");
        setSelectedProductTypeRef("");
        if (!nextRef) {
            setSelectedBrandRef("");
            setSelectedModelRef("");
            emitChange({ categoryRef: "", secondaryCategoryRef: "", tertiaryCategoryRef: "", brandRef: "", productTypeRef: "", modelRef: "" });
            return;
        }
        const nextCategory = parseRef(nextRef);
        const nextBrandOptions = filterBrandsForPrimaryCategory(bundle.brands, nextCategory);
        if (nextBrandOptions.length === 0) {
            setSelectedBrandRef("");
            setSelectedProductTypeRef("");
            setSelectedModelRef("");
            emitChange({ categoryRef: nextRef, secondaryCategoryRef: "", tertiaryCategoryRef: "", brandRef: "", productTypeRef: "", modelRef: "" });
            return;
        }
        const selectedBrandExists = nextBrandOptions.some((brand) => encodeRef(brand.id, brand.name) === selectedBrandRef);
        if (!selectedBrandExists) {
            setSelectedBrandRef("");
            setSelectedModelRef("");
        }
        emitChange({
            categoryRef: nextRef,
            secondaryCategoryRef: "",
            tertiaryCategoryRef: "",
            productTypeRef: "",
            brandRef: selectedBrandExists ? selectedBrandRef : "",
            modelRef: selectedBrandExists ? selectedModelRef : "",
        });
    };

    const handleBrandChange = (nextRef: string) => {
        setSelectedBrandRef(nextRef);
        setSelectedProductTypeRef("");
        if (!nextRef) {
            setSelectedModelRef("");
            emitChange({ brandRef: "", productTypeRef: "", modelRef: "" });
            return;
        }
        const nextBrand = parseRef(nextRef);
        const nextProductTypes = listProductTypesForCatalogSelection(bundle.models, bundle.brands, {
            brand: nextBrand,
            primaryCategory: selectedCategory,
        });
        const nextProductTypeRef = nextProductTypes.length === 1 ? encodeRef(nextProductTypes[0], nextProductTypes[0]) : "";
        if (nextProductTypeRef) setSelectedProductTypeRef(nextProductTypeRef);
        const nextModelOptions = filterModelsForCatalogSelection(bundle.models, {
            brand: nextBrand,
            primaryCategory: selectedCategory,
            secondaryCategory: selectedSecondaryCategory,
            tertiaryCategory: parseRef(selectedTertiaryCategoryRef),
            productType: parseRef(nextProductTypeRef),
        });
        const exists = nextModelOptions.some((item) => encodeRef(item.id, item.name) === selectedModelRef);
        if (!exists) setSelectedModelRef("");
        emitChange({ brandRef: nextRef, productTypeRef: nextProductTypeRef, modelRef: exists ? selectedModelRef : "" });
    };

    const handleSecondaryCategoryChange = (nextRef: string) => {
        if (!hasSelectedCategory) {
            setSelectedSecondaryCategoryRef("");
            setSelectedTertiaryCategoryRef("");
            promptSelectCategoryFirst();
            return;
        }
        setSelectedSecondaryCategoryRef(nextRef);
        setSelectedTertiaryCategoryRef("");
        setSelectedProductTypeRef("");
        setSelectedModelRef("");
        emitChange({ secondaryCategoryRef: nextRef, tertiaryCategoryRef: "", productTypeRef: "", modelRef: "" });
    };

    const promptSelectSecondaryCategoryFirst = () => {
        window.alert(ui.selectSecondaryCategoryFirst);
    };

    const handleTertiaryCategoryChange = (nextRef: string) => {
        if (!hasSelectedSecondaryCategory) {
            setSelectedTertiaryCategoryRef("");
            promptSelectSecondaryCategoryFirst();
            return;
        }
        setSelectedTertiaryCategoryRef(nextRef);
        setSelectedProductTypeRef("");
        setSelectedModelRef("");
        emitChange({ tertiaryCategoryRef: nextRef, productTypeRef: "", modelRef: "" });
    };

    const promptSelectProductTypeFirst = () => {
        window.alert(ui.selectProductTypeFirst);
    };

    const handleProductTypeChange = (nextRef: string) => {
        if (!hasSelectedBrand) {
            setSelectedProductTypeRef("");
            promptSelectBrandFirst();
            return;
        }
        setSelectedProductTypeRef(nextRef);
        setSelectedModelRef("");
        emitChange({ productTypeRef: nextRef, modelRef: "" });
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
        if (productTypeOptions.length > 0 && !selectedProductTypeRef) {
            setSelectedModelRef("");
            promptSelectProductTypeFirst();
            return;
        }
        setSelectedModelRef(nextRef);
        emitChange({ modelRef: nextRef });
    };

    return (
        <div className={cn("grid gap-3 md:grid-cols-2 xl:grid-cols-6", className)}>
            <FormField label={ui.primaryCategory} htmlFor={categoryId}>
                <Select id={categoryId} name={categoryRefName} value={selectedCategoryRef} onChange={(event) => handleCategoryChange(event.currentTarget.value)} className={controlClass}>
                    <option value="">{ui.unspecified}</option>
                    {topLevelCategories.map((item) => (
                        <option key={`cat-${item.id}`} value={encodeRef(item.id, item.name)}>
                            {item.name}
                        </option>
                    ))}
                </Select>
            </FormField>
            <FormField label={ui.secondaryCategory} htmlFor={secondaryCategoryId}>
                <Select
                    id={secondaryCategoryId}
                    name={secondaryCategoryRefName}
                    value={effectiveSecondaryCategoryRef}
                    onMouseDown={(event) => {
                        if (hasSelectedCategory) return;
                        event.preventDefault();
                        promptSelectCategoryFirst();
                    }}
                    onFocus={(event) => {
                        if (hasSelectedCategory) return;
                        event.currentTarget.blur();
                        promptSelectCategoryFirst();
                    }}
                    onChange={(event) => handleSecondaryCategoryChange(event.currentTarget.value)}
                    className={controlClass}
                >
                    <option value="">
                        {!hasSelectedCategory ? ui.selectCategoryFirst : secondaryCategoryOptions.length === 0 ? ui.noSecondaryCategories : ui.unspecified}
                    </option>
                    {secondaryCategoryOptions.map((item) => (
                        <option key={`secondary-category-${item.id}`} value={encodeRef(item.id, item.name)}>
                            {item.name}
                        </option>
                    ))}
                </Select>
            </FormField>
            <FormField label={ui.tertiaryCategory} htmlFor={tertiaryCategoryId}>
                <Select
                    id={tertiaryCategoryId}
                    name={tertiaryCategoryRefName}
                    value={effectiveTertiaryCategoryRef}
                    onMouseDown={(event) => {
                        if (hasSelectedSecondaryCategory) return;
                        event.preventDefault();
                        promptSelectSecondaryCategoryFirst();
                    }}
                    onFocus={(event) => {
                        if (hasSelectedSecondaryCategory) return;
                        event.currentTarget.blur();
                        promptSelectSecondaryCategoryFirst();
                    }}
                    onChange={(event) => handleTertiaryCategoryChange(event.currentTarget.value)}
                    className={controlClass}
                >
                    <option value="">
                        {!hasSelectedSecondaryCategory ? ui.selectSecondaryCategoryFirst : tertiaryCategoryOptions.length === 0 ? ui.noTertiaryCategories : ui.unspecified}
                    </option>
                    {tertiaryCategoryOptions.map((item) => (
                        <option key={`tertiary-category-${item.id}`} value={encodeRef(item.id, item.name)}>
                            {item.name}
                        </option>
                    ))}
                </Select>
            </FormField>
            <FormField label={ui.brand} htmlFor={brandId}>
                <Select
                    id={brandId}
                    name={brandRefName}
                    value={selectedBrandRef}
                    onChange={(event) => handleBrandChange(event.currentTarget.value)}
                    className={controlClass}
                >
                    <option value="">{ui.unspecified}</option>
                    {brandOptions.map((item) => (
                        <option key={`brand-${item.id}`} value={encodeRef(item.id, item.name)}>
                            {item.name}
                        </option>
                    ))}
                </Select>
            </FormField>
            <FormField label={ui.productType} htmlFor={productTypeId}>
                <Select
                    id={productTypeId}
                    name={productTypeRefName}
                    value={effectiveProductTypeRef}
                    onMouseDown={(event) => {
                        if (hasSelectedBrand) return;
                        event.preventDefault();
                        promptSelectBrandFirst();
                    }}
                    onFocus={(event) => {
                        if (hasSelectedBrand) return;
                        event.currentTarget.blur();
                        promptSelectBrandFirst();
                    }}
                    onChange={(event) => handleProductTypeChange(event.currentTarget.value)}
                    className={controlClass}
                >
                    <option value="">
                        {!hasSelectedBrand ? ui.selectBrandFirst : productTypeOptions.length === 0 ? ui.noProductTypesForBrand : ui.unspecified}
                    </option>
                    {productTypeOptions.map((item) => (
                        <option key={`product-type-${item}`} value={encodeRef(item, item)}>
                            {item}
                        </option>
                    ))}
                </Select>
            </FormField>
            <FormField label={ui.model} htmlFor={modelId}>
                <Select
                    id={modelId}
                    name={modelRefName}
                    value={effectiveModelRef}
                    onMouseDown={(event) => {
                        if (!hasSelectedBrand) {
                            handleModelMouseDown(event);
                            return;
                        }
                        if (productTypeOptions.length > 0 && !selectedProductTypeRef) {
                            event.preventDefault();
                            promptSelectProductTypeFirst();
                        }
                    }}
                    onFocus={(event) => {
                        if (!hasSelectedBrand) {
                            handleModelFocus(event);
                            return;
                        }
                        if (productTypeOptions.length > 0 && !selectedProductTypeRef) {
                            event.currentTarget.blur();
                            promptSelectProductTypeFirst();
                        }
                    }}
                    onChange={(event) => handleModelChange(event.currentTarget.value)}
                    className={controlClass}
                >
                    <option value="">
                        {!hasSelectedBrand
                            ? ui.selectBrandFirst
                            : productTypeOptions.length > 0 && !selectedProductTypeRef
                              ? ui.selectProductTypeFirst
                              : modelOptions.length === 0
                                ? ui.noModelsForBrand
                                : ui.unspecified}
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
