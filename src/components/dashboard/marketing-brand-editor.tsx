"use client";

import type { Dispatch, FormEvent, MouseEvent, ReactNode, SetStateAction } from "react";
import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { prepareBrandTypeDelete, prepareBrandTypeRename, submitBrandRename } from "@/components/dashboard/marketing-brand-form-helpers";
import {
    getBrandCategoryNames,
    getBrandModelsForType,
    getBrandTypeNames,
    rankBrandTypeSuggestions,
} from "@/lib/marketing/brand-catalog-helpers";
import type { DimensionPickerBundle } from "@/lib/types/catalog";
import type { RepairBrand } from "@/lib/types/repair-brand";
import { cn } from "@/components/ui/cn";

function IconOnlyButton({
    label,
    icon,
    form,
    type = "button",
    variant = "ghost",
    className,
    disabled,
    onClick,
    formAction,
}: {
    label: string;
    icon: ReactNode;
    form?: string;
    type?: "button" | "submit" | "reset";
    variant?: "solid" | "ghost";
    className?: string;
    disabled?: boolean;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    formAction?: string | ((formData: FormData) => void | Promise<void>);
}) {
    return (
        <Button
            form={form}
            formAction={formAction}
            type={type}
            variant={variant}
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
            className={cn("group relative h-10 w-10 !p-0", className)}
        >
            {icon}
            <span className="sr-only">{label}</span>
            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {label}
            </span>
        </Button>
    );
}

export type MarketingBrandEditorProps = {
    brand: RepairBrand;
    dimensionBundle: DimensionPickerBundle;
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
    brand,
    dimensionBundle,
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
                            <span className="text-[10px] uppercase tracking-[0.14em]">分類</span>
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
                            <span>{brandCategoryOptions.length > 0 ? "未設定裝置類型" : "未指定商品類型"}</span>
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <form action={updateBrandAction} onClick={(event) => event.stopPropagation()}>
                        <input type="hidden" name="tab" value="marketing" />
                        <input type="hidden" name="brandId" value={brand.id} />
                        <input type="hidden" name="brandName" value={brand.name} />
                        <IconOnlyButton
                            label="修改品牌"
                            type="button"
                            variant="solid"
                            icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                            onClick={(event) => submitBrandRename(event, brand.name)}
                        />
                    </form>
                    <form action={deleteBrandAction} onSubmit={onDeleteGuard} data-delete-target={`品牌 ${brand.name}`} onClick={(event) => event.stopPropagation()}>
                        <input type="hidden" name="tab" value="marketing" />
                        <input type="hidden" name="brandId" value={brand.id} />
                        <IconOnlyButton label="移除品牌" type="submit" icon={<Trash2 className="h-4 w-4" aria-hidden="true" />} />
                    </form>
                </div>
            </div>

            <div className="rounded-lg border border-[rgb(var(--border))] p-3">
                <form action={updateBrandAction} className="mb-2 grid gap-2 rounded-lg border border-[rgb(var(--border))] p-3">
                    <input type="hidden" name="tab" value="marketing" />
                    <input type="hidden" name="brandId" value={brand.id} />
                    <input type="hidden" name="brandName" value={brand.name} />
                    <input type="hidden" name="brandTypesMode" value="sync" />
                    <input type="hidden" name="oldTypeName" value="" />
                    <input type="hidden" name="nextTypeName" value="" />
                    <div className="grid gap-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-3">
                        <div className="grid gap-1">
                            <div className="text-sm font-medium">店內商品分類</div>
                            <div className="text-xs text-[rgb(var(--muted))]">通用商品、維修零件、配件品牌都可以勾選；Apple、Samsung 這種品牌也能同時勾這裡，再另外管理裝置類型與型號。</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {dimensionBundle.categories.length > 0 ? (
                                dimensionBundle.categories.map((category) => (
                                    <label key={`${brand.id}-linked-category-${category.id}`} className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-1.5 text-xs">
                                        <input
                                            type="checkbox"
                                            name="brandCategoryNames"
                                            value={category.name}
                                            defaultChecked={brandCategoryOptions.some((item) => item.toLowerCase() === category.name.toLowerCase())}
                                            className="h-4 w-4 accent-[rgb(var(--accent))]"
                                        />
                                        {category.name}
                                    </label>
                                ))
                            ) : (
                                <div className="text-xs text-[rgb(var(--muted))]">尚未建立商品分類，請先到「分類」分頁新增。</div>
                            )}
                        </div>
                    </div>
                    <div className="text-xs text-[rgb(var(--muted))]">
                        裝置類型由這裡集中管理；適合 Apple / Samsung 這類品牌的 iPhone、iPad、Galaxy 等系列。勾選「啟用二手商品設定」後，該類型才會出現在二手商品規格模板。
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
                                            label={`修改品牌類型：${typeName}`}
                                            type="submit"
                                            formAction={renameBrandTypeAction}
                                            className="h-8 w-8"
                                            icon={<Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
                                            onClick={(event) => prepareBrandTypeRename(event, typeName)}
                                        />
                                        <IconOnlyButton
                                            label={`移除品牌類型：${typeName}`}
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
                                            啟用二手商品設定
                                        </label>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-[rgb(var(--muted))]">尚未建立任何裝置類型；如果這個品牌只做配件或維修零件，可以只勾上面的店內商品分類。</div>
                        )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                        <label className="grid gap-1">
                            <span className="text-xs text-[rgb(var(--muted))]">新增類型</span>
                            <Input
                                name="newBrandTypeName"
                                list={`brand-type-suggestions-${brand.id}`}
                                placeholder="例如：手機配件 / 車用配件 / iPhone"
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
                            <IconOnlyButton label="儲存品牌類型設定" type="submit" variant="solid" icon={<Save className="h-4 w-4" aria-hidden="true" />} />
                        </div>
                    </div>
                    {brandTypeSuggestions.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-[rgb(var(--muted))]">建議：</span>
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
                            <span className="text-xs text-[rgb(var(--muted))]">型號類型</span>
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
                                <option value="">{brandTypeOptions.length > 0 ? "請選擇商品類型" : "請先新增商品類型"}</option>
                                {brandTypeOptions.map((typeName) => (
                                    <option key={`${brand.id}-model-type-${typeName}`} value={typeName}>
                                        {typeName}
                                    </option>
                                ))}
                            </Select>
                        </label>
                        <div className="text-xs text-[rgb(var(--muted))]">
                            {selectedModelType ? `目前只顯示「${selectedModelType}」的型號，新增時也會存到這個類型。` : "請先選擇品牌類型，再管理該類型的型號。"}
                        </div>
                    </div>

                    <div className="text-xs text-[rgb(var(--muted))]">目前型號</div>
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
                                                <input type="hidden" name="brandId" value={brand.id} />
                                                <input type="hidden" name="modelTypeName" value={selectedModelType} />
                                                <input type="hidden" name="oldModel" value={model} />
                                                <Input name="modelName" defaultValue={model} required className="min-w-[160px]" />
                                            </form>
                                            <div className="flex items-center justify-end gap-2 rounded-lg bg-[rgb(var(--panel))] px-2 py-2">
                                                <div className="text-[11px] text-[rgb(var(--muted))]">操作</div>
                                                <IconOnlyButton
                                                    label="修改型號"
                                                    form={updateFormId}
                                                    type="submit"
                                                    variant="solid"
                                                    className="h-9 w-9"
                                                    icon={<Save className="h-4 w-4" aria-hidden="true" />}
                                                />
                                                <form action={deleteModelAction} onSubmit={onDeleteGuard} data-delete-target={`型號 ${model}`}>
                                                    <input type="hidden" name="tab" value="marketing" />
                                                    <input type="hidden" name="brandId" value={brand.id} />
                                                    <input type="hidden" name="modelTypeName" value={selectedModelType} />
                                                    <input type="hidden" name="modelName" value={model} />
                                                    <IconOnlyButton
                                                        label="移除型號"
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
                            {visibleModels.length === 0 ? <div className="text-xs text-[rgb(var(--muted))]">這個類型目前還沒有型號。</div> : null}
                        </div>
                    ) : (
                        <div className="text-xs text-[rgb(var(--muted))]">請先新增並儲存品牌類型，再選擇要管理的類型。</div>
                    )}

                    <form action={createModelAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="tab" value="marketing" />
                        <input type="hidden" name="brandId" value={brand.id} />
                        <input type="hidden" name="modelTypeName" value={selectedModelType} />
                        <Input
                            name="modelName"
                            placeholder={selectedModelType ? `新增 ${selectedModelType} 型號` : "請先選擇商品類型"}
                            required
                            disabled={!selectedModelType}
                            className="w-full sm:w-80"
                        />
                        <IconOnlyButton label="新增型號" type="submit" variant="solid" disabled={!selectedModelType} icon={<Plus className="h-4 w-4" aria-hidden="true" />} />
                    </form>
                </div>
            </div>
        </div>
    );
}
