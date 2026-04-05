"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import { IconOnlyButton } from "@/components/ui/icon-only-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { prepareBrandTypeDelete, prepareBrandTypeRename, submitBrandRename } from "@/components/dashboard/marketing-brand-form-helpers";
import {
    getBrandCategoryNames,
    getBrandModelsForType,
    getBrandTypeNames,
    rankBrandTypeSuggestions,
} from "@/lib/marketing/brand-catalog-helpers";
import type { RepairBrand } from "@/lib/types/repair-brand";
import { getUiText } from "@/lib/i18n/ui-text";
import type { MarketingSectionId } from "@/components/dashboard/marketing-settings-workspace";

export type MarketingBrandEditorProps = {
    lang: "zh" | "en";
    marketingSection: MarketingSectionId;
    brand: RepairBrand;
    brandTypeSuggestionPool: string[];
    brandModelTypeById: Record<string, string>;
    setBrandModelTypeById: Dispatch<SetStateAction<Record<string, string>>>;
    brandTypeDraftById: Record<string, string>;
    setBrandTypeDraftById: Dispatch<SetStateAction<Record<string, string>>>;
    updateBrandAction: (formData: FormData) => Promise<void>;
    deleteBrandAction: (formData: FormData) => Promise<void>;
    renameBrandTypeAction: (formData: FormData) => Promise<void>;
    deleteBrandTypeAction: (formData: FormData) => Promise<void>;
    createModelAction: (formData: FormData) => Promise<void>;
    updateModelAction: (formData: FormData) => Promise<void>;
    deleteModelAction: (formData: FormData) => Promise<void>;
    onDeleteGuard: (event: FormEvent<HTMLFormElement>) => void;
};

export function MarketingBrandEditor({
    lang,
    marketingSection,
    brand,
    brandTypeSuggestionPool,
    brandModelTypeById,
    setBrandModelTypeById,
    brandTypeDraftById,
    setBrandTypeDraftById,
    updateBrandAction,
    deleteBrandAction,
    renameBrandTypeAction,
    deleteBrandTypeAction,
    createModelAction,
    updateModelAction,
    deleteModelAction,
    onDeleteGuard,
}: MarketingBrandEditorProps) {
    const t = getUiText(lang).marketingBrandEditor;
    const brandCategoryOptions = getBrandCategoryNames(brand);
    const brandTypeOptions = getBrandTypeNames(brand);
    const selectedModelType = brandModelTypeById[brand.id] ?? brandTypeOptions[0] ?? "";
    const visibleModels = getBrandModelsForType(brand, selectedModelType).sort((a, b) => a.localeCompare(b, "zh-Hant"));
    const brandTypeDraft = brandTypeDraftById[brand.id] ?? "";
    const brandTypeSuggestions = rankBrandTypeSuggestions(brandTypeSuggestionPool, brandTypeDraft, brandTypeOptions);

    return (
        <div className="grid gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                <div className="min-w-0 grid gap-1">
                    <div className="text-lg font-semibold text-[rgb(var(--text))]">{brand.name}</div>
                    {brandCategoryOptions.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1 text-xs text-[rgb(var(--muted))]">
                            <span className="text-[10px] uppercase tracking-[0.14em]">{t.categoryTag}</span>
                            {brandCategoryOptions.map((categoryName) => (
                                <span key={`${brand.id}-category-${categoryName}`} className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-1.5 py-0.5">
                                    {categoryName}
                                </span>
                            ))}
                        </div>
                    ) : null}
                    <div className="flex flex-wrap gap-1 text-xs text-[rgb(var(--muted))]">
                        {brandTypeOptions.length > 0 ? (
                            brandTypeOptions.map((typeName) => (
                                <span key={`${brand.id}-${typeName}`} className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-1.5 py-0.5">
                                    {typeName}
                                </span>
                            ))
                        ) : (
                            <span>{brandCategoryOptions.length > 0 ? t.noDeviceTypeSet : t.noProductTypeSet}</span>
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <form action={updateBrandAction} onClick={(event) => event.stopPropagation()}>
                        <input type="hidden" name="tab" value="marketing" />
                        <input type="hidden" name="marketingSection" value={marketingSection} />
                        <input type="hidden" name="brandId" value={brand.id} />
                        <input type="hidden" name="brandName" value={brand.name} />
                        <IconOnlyButton
                            label={t.editBrand}
                            type="button"
                            variant="solid"
                            icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                            onClick={(event) => submitBrandRename(event, brand.name)}
                        />
                    </form>
                    <form action={deleteBrandAction} onSubmit={onDeleteGuard} data-delete-target={t.deleteBrandTarget.replace("{name}", brand.name)} onClick={(event) => event.stopPropagation()}>
                        <input type="hidden" name="tab" value="marketing" />
                        <input type="hidden" name="marketingSection" value={marketingSection} />
                        <input type="hidden" name="brandId" value={brand.id} />
                        <IconOnlyButton label={t.removeBrand} type="submit" icon={<Trash2 className="h-4 w-4" aria-hidden="true" />} />
                    </form>
                </div>
            </div>

            <div className="rounded-lg border border-[rgb(var(--border))] p-3">
                <form action={updateBrandAction} className="mb-2 grid gap-2 rounded-lg border border-[rgb(var(--border))] p-3">
                    <input type="hidden" name="tab" value="marketing" />
                    <input type="hidden" name="marketingSection" value={marketingSection} />
                    <input type="hidden" name="brandId" value={brand.id} />
                    <input type="hidden" name="brandName" value={brand.name} />
                    <input type="hidden" name="brandTypesMode" value="sync" />
                    <input type="hidden" name="oldTypeName" value="" />
                    <input type="hidden" name="nextTypeName" value="" />
                    <div className="grid gap-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-3">
                        <div className="grid gap-1">
                            <div className="text-sm font-medium">{t.inStoreCategoriesTitle}</div>
                            <div className="text-xs text-[rgb(var(--muted))]">{t.inStoreCategoriesDescription}</div>
                        </div>
                        {brandCategoryOptions.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {brandCategoryOptions.map((categoryName) => (
                                    <span
                                        key={`${brand.id}-linked-category-chip-${categoryName}`}
                                        className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-1.5 text-xs"
                                    >
                                        {categoryName}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-[rgb(var(--muted))]">{t.noLinkedCategoriesYet}</div>
                        )}
                        <div className="text-xs text-[rgb(var(--muted))]">{t.inStoreCategoriesReadonlyHint}</div>
                        {brandCategoryOptions.map((categoryName) => (
                            <input key={`${brand.id}-linked-category-hidden-${categoryName}`} type="hidden" name="brandCategoryNames" value={categoryName} />
                        ))}
                    </div>
                    <div className="text-xs text-[rgb(var(--muted))]">
                        {t.deviceTypesExplainer}
                    </div>
                    <div className="grid gap-2">
                        {brandTypeOptions.length > 0 ? (
                            brandTypeOptions.map((typeName) => (
                                <div
                                    key={`${brand.id}_type_${typeName}`}
                                    className="flex flex-col gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium text-[rgb(var(--text))]">{typeName}</div>
                                        <IconOnlyButton
                                            label={t.renameBrandType.replace("{name}", typeName)}
                                            type="submit"
                                            formAction={renameBrandTypeAction}
                                            className="h-8 w-8"
                                            icon={<Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
                                            onClick={(event) => prepareBrandTypeRename(event, typeName)}
                                        />
                                        <IconOnlyButton
                                            label={t.removeBrandType.replace("{name}", typeName)}
                                            type="submit"
                                            formAction={deleteBrandTypeAction}
                                            className="h-8 w-8"
                                            icon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                                            onClick={(event) => prepareBrandTypeDelete(event, typeName)}
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <input type="hidden" name="brandTypeNames" value={typeName} />
                                        <label className="inline-flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                name="usedProductTypeNames"
                                                value={typeName}
                                                defaultChecked={(brand.usedProductTypes ?? []).some((row) => row.toLowerCase() === typeName.toLowerCase())}
                                                className="h-4 w-4 accent-[rgb(var(--accent))]"
                                            />
                                            {t.usedProductToggle}
                                        </label>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-[rgb(var(--muted))]">{t.noDeviceTypesYet}</div>
                        )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{t.newTypeLabel}</span>
                            <Input
                                name="newBrandTypeName"
                                list={`brand-type-suggestions-${brand.id}`}
                                placeholder={t.newTypePlaceholder}
                                value={brandTypeDraft}
                                onChange={(event) => {
                                    const nextValue = event.currentTarget.value;
                                    setBrandTypeDraftById((current) => ({
                                        ...current,
                                        [brand.id]: nextValue,
                                    }));
                                }}
                                className="w-full"
                            />
                            <datalist id={`brand-type-suggestions-${brand.id}`}>
                                {brandTypeSuggestions.map((suggestion) => (
                                    <option key={`${brand.id}-suggestion-option-${suggestion}`} value={suggestion} />
                                ))}
                            </datalist>
                        </label>
                        <div className="flex justify-end">
                            <IconOnlyButton label={t.saveBrandTypes} type="submit" variant="solid" icon={<Save className="h-4 w-4" aria-hidden="true" />} />
                        </div>
                    </div>
                    {brandTypeSuggestions.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-[rgb(var(--muted))]">{t.suggestionsLabel}</span>
                            {brandTypeSuggestions.map((suggestion) => (
                                <button
                                    key={`${brand.id}-suggestion-chip-${suggestion}`}
                                    type="button"
                                    className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2.5 py-1 text-xs text-[rgb(var(--muted))] transition hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--accent))]"
                                    onClick={() =>
                                        setBrandTypeDraftById((current) => ({
                                            ...current,
                                            [brand.id]: suggestion,
                                        }))
                                    }
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </form>

                <div className="grid gap-2 rounded-lg border border-[rgb(var(--border))] p-3">
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-end">
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">{t.modelTypeLabel}</span>
                            <Select
                                value={selectedModelType}
                                onChange={(event) => {
                                    const nextModelType = event.currentTarget.value;
                                    setBrandModelTypeById((current) => ({
                                        ...current,
                                        [brand.id]: nextModelType,
                                    }));
                                }}
                                disabled={brandTypeOptions.length === 0}
                            >
                                <option value="">{brandTypeOptions.length > 0 ? t.selectProductType : t.addProductTypeFirst}</option>
                                {brandTypeOptions.map((typeName) => (
                                    <option key={`${brand.id}-model-type-${typeName}`} value={typeName}>
                                        {typeName}
                                    </option>
                                ))}
                            </Select>
                        </label>
                        <div className="text-xs text-[rgb(var(--muted))]">
                            {selectedModelType ? t.modelScopeWithType.replace("{type}", selectedModelType) : t.modelScopePickTypeFirst}
                        </div>
                    </div>

                    <div className="text-xs text-[rgb(var(--muted))]">{t.modelsCurrentLabel}</div>
                    {selectedModelType ? (
                        <div className="flex flex-wrap gap-2">
                            {visibleModels.map((model) => {
                                const updateFormId = `update-model-${brand.id}-${selectedModelType}-${model}`.replace(/\s+/g, "-");
                                return (
                                    <details
                                        key={`${brand.id}-${selectedModelType}-${model}`}
                                        className="min-w-[180px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-2 py-1.5 text-xs shadow-sm transition-colors hover:border-[rgb(var(--accent))]/30"
                                    >
                                        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">{model}</summary>
                                        <div className="mt-2 space-y-2">
                                            <form id={updateFormId} action={updateModelAction} className="grid gap-2">
                                                <input type="hidden" name="tab" value="marketing" />
                                                <input type="hidden" name="marketingSection" value={marketingSection} />
                                                <input type="hidden" name="brandId" value={brand.id} />
                                                <input type="hidden" name="modelTypeName" value={selectedModelType} />
                                                <input type="hidden" name="oldModel" value={model} />
                                                <Input name="modelName" defaultValue={model} required className="min-w-[160px]" />
                                            </form>
                                            <div className="flex items-center justify-end gap-2 rounded-lg bg-[rgb(var(--panel))] px-2 py-2">
                                                <div className="text-[11px] text-[rgb(var(--muted))]">{t.operationsLabel}</div>
                                                <IconOnlyButton
                                                    label={t.editModel}
                                                    form={updateFormId}
                                                    type="submit"
                                                    variant="solid"
                                                    className="h-9 w-9"
                                                    icon={<Save className="h-4 w-4" aria-hidden="true" />}
                                                />
                                                <form action={deleteModelAction} onSubmit={onDeleteGuard} data-delete-target={t.deleteModelTarget.replace("{name}", model)}>
                                                    <input type="hidden" name="tab" value="marketing" />
                                                    <input type="hidden" name="marketingSection" value={marketingSection} />
                                                    <input type="hidden" name="brandId" value={brand.id} />
                                                    <input type="hidden" name="modelTypeName" value={selectedModelType} />
                                                    <input type="hidden" name="modelName" value={model} />
                                                    <IconOnlyButton
                                                        label={t.removeModel}
                                                        type="submit"
                                                        className="h-9 w-9 border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                                                        icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                                                    />
                                                </form>
                                            </div>
                                        </div>
                                    </details>
                                );
                            })}
                            {visibleModels.length === 0 ? <div className="text-xs text-[rgb(var(--muted))]">{t.noModelsInType}</div> : null}
                        </div>
                    ) : (
                        <div className="text-xs text-[rgb(var(--muted))]">{t.addTypesFirst}</div>
                    )}

                    <form action={createModelAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="tab" value="marketing" />
                        <input type="hidden" name="marketingSection" value={marketingSection} />
                        <input type="hidden" name="brandId" value={brand.id} />
                        <input type="hidden" name="modelTypeName" value={selectedModelType} />
                        <Input
                            name="modelName"
                            placeholder={selectedModelType ? t.addModelPlaceholder.replace("{type}", selectedModelType) : t.selectProductType}
                            required
                            disabled={!selectedModelType}
                            className="w-full sm:w-80"
                        />
                        <IconOnlyButton label={t.addModel} type="submit" variant="solid" disabled={!selectedModelType} icon={<Plus className="h-4 w-4" aria-hidden="true" />} />
                    </form>
                </div>
            </div>
        </div>
    );
}
