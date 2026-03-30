"use client";

import { ArrowLeft, ArrowRight, Filter, PackagePlus, PackageSearch, Plus, RotateCcw, Save, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ItemFormFields } from "@/components/dashboard/ItemFormFields";
import {
    FilterCard,
    MerchantListPagination,
    MerchantListShell,
    MerchantSectionCard,
    SearchToolbar,
} from "@/components/merchant/shell";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import { FormField } from "@/components/ui/form-field";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getUiText, type UiLanguage } from "@/lib/i18n/ui-text";
import type { ItemNamingSettings } from "@/lib/schema/itemNamingSettings";
import type { DimensionPickerBundle } from "@/lib/types/catalog";
import type { Product } from "@/lib/types/merchant-product";
import { LIST_DISPLAY_OPTIONS } from "@/lib/ui/list-display";

type ProductManagementWorkspaceProps = {
    products: Product[];
    productKeyword: string;
    supplierItems: Array<{ id: string; name: string; status?: string }>;
    supplierFilter: string;
    categoryFilter: string;
    brandFilter: string;
    modelFilter: string;
    statusFilter: string;
    minStock: string;
    maxStock: string;
    minPrice: string;
    maxPrice: string;
    dimensionBundle: DimensionPickerBundle;
    namingSettings: ItemNamingSettings;
    flash: string;
    actionTs: string;
    pageSize: string;
    currentCursor: string;
    currentCursorStack: string;
    previousCursor: string;
    previousCursorStack: string;
    nextCursor: string;
    nextCursorStack: string;
    hasNextPage: boolean;
    createProductAction: (formData: FormData) => Promise<void>;
    updateProductAction: (formData: FormData) => Promise<void>;
    deleteProductAction: (formData: FormData) => Promise<void>;
    lang: UiLanguage;
};

function flashTone(flash: string): "success" | "error" {
    if (flash === "invalid" || flash === "error" || flash === "delete_auth_required" || flash === "delete_auth_failed") return "error";
    return "success";
}

function guardDeleteWithPassword(event: FormEvent<HTMLFormElement>, ui: ReturnType<typeof getUiText>["productManagementWorkspace"]) {
    const form = event.currentTarget;
    const targetText = (form.dataset.deleteTarget ?? ui.deleteTargetDefault).trim();
    const confirmed = window.confirm(ui.deleteConfirm.replace("{target}", targetText));
    if (!confirmed) {
        event.preventDefault();
        return;
    }
    const password = window.prompt(ui.deletePasswordPrompt);
    if (!password) {
        event.preventDefault();
        return;
    }
    let input = form.querySelector('input[name="confirmPassword"]') as HTMLInputElement | null;
    if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = "confirmPassword";
        form.appendChild(input);
    }
    input.value = password;
}

function formatMoney(value: number, lang: UiLanguage): string {
    return new Intl.NumberFormat(lang === "en" ? "en-US" : "zh-TW").format(Math.max(0, value));
}

function filterModelsByBrand(bundle: DimensionPickerBundle, brandId: string): DimensionPickerBundle["models"] {
    const targetBrandId = brandId.trim();
    if (!targetBrandId) return [];
    const targetBrandName = (bundle.brands.find((item) => item.id === targetBrandId)?.name ?? "").trim().toLowerCase();
    return bundle.models
        .filter((model) => {
            const modelBrandId = (model.brandId ?? "").trim();
            const modelBrandName = (model.brandName ?? "").trim().toLowerCase();
            if (modelBrandId) return modelBrandId === targetBrandId;
            if (modelBrandName && targetBrandName) return modelBrandName === targetBrandName;
            return false;
        })
        .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
}

export function ProductManagementWorkspace({
    lang,
    products,
    productKeyword,
    supplierItems,
    supplierFilter,
    categoryFilter,
    brandFilter,
    modelFilter,
    statusFilter,
    minStock,
    maxStock,
    minPrice,
    maxPrice,
    dimensionBundle,
    namingSettings,
    flash,
    actionTs,
    pageSize,
    currentCursor,
    currentCursorStack,
    previousCursor,
    previousCursorStack,
    nextCursor,
    nextCursorStack,
    hasNextPage,
    createProductAction,
    updateProductAction,
    deleteProductAction,
}: ProductManagementWorkspaceProps) {
    const ui = getUiText(lang).productManagementWorkspace;
    const flashLabels = getUiText(lang).dashboardFlash;
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [dismissedFlashKey, setDismissedFlashKey] = useState<string | null>(null);
    const [selectedBrandFilter, setSelectedBrandFilter] = useState(brandFilter);
    const [selectedModelFilter, setSelectedModelFilter] = useState(modelFilter);
    const currentFlashKey = `${flash}:${actionTs || "no-ts"}`;
    const currentFlashText = flashLabels[flash as keyof typeof flashLabels] ?? "";
    const showFlashNotice = Boolean(currentFlashText) && dismissedFlashKey !== currentFlashKey;
    const filteredModelOptions = useMemo(
        () => filterModelsByBrand(dimensionBundle, selectedBrandFilter),
        [dimensionBundle, selectedBrandFilter],
    );
    const supplierNames = useMemo(
        () =>
            Array.from(
                new Set([
                    ...supplierItems.filter((item) => item.status !== "inactive").map((item) => item.name.trim()),
                    supplierFilter,
                    ...products.map((product) => product.supplier.trim()),
                ]),
            )
                .filter((item) => item.length > 0)
                .sort((a, b) => a.localeCompare(b, "zh-Hant")),
        [products, supplierFilter, supplierItems],
    );
    const productSearchSuggestions = useMemo(
        () =>
            products.map((product) => ({
                id: product.id,
                value: product.name,
                title: product.name,
                subtitle: [product.sku, product.brandName, product.modelName].filter(Boolean).join(" / ") || undefined,
                keywords: [
                    product.name,
                    product.sku,
                    product.categoryName,
                    product.secondaryCategoryName,
                    product.brandName,
                    product.modelName,
                    product.supplier,
                    ...(product.aliases ?? []),
                ].filter((value): value is string => Boolean(value)),
            })),
        [products],
    );

    useEffect(() => {
        if (!flash) return;
        const url = new URL(window.location.href);
        url.searchParams.delete("flash");
        url.searchParams.delete("ts");
        window.history.replaceState({}, "", url.toString());
    }, [flash]);

    useEffect(() => {
        setSelectedBrandFilter(brandFilter);
    }, [brandFilter]);

    useEffect(() => {
        setSelectedModelFilter(modelFilter);
    }, [modelFilter]);

    useEffect(() => {
        if (!selectedBrandFilter) {
            if (selectedModelFilter) setSelectedModelFilter("");
            return;
        }
        if (!selectedModelFilter) return;
        const exists = filteredModelOptions.some((item) => item.id === selectedModelFilter);
        if (!exists) setSelectedModelFilter("");
    }, [filteredModelOptions, selectedBrandFilter, selectedModelFilter]);

    const controlClass = "h-10 w-full min-w-0";
    const promptSelectBrandFirst = () => window.alert(ui.selectBrandFirst);
    const baseQueryFields = [
        { name: "productQ", value: productKeyword },
        { name: "supplier", value: supplierFilter },
        { name: "categoryId", value: categoryFilter },
        { name: "brandId", value: brandFilter },
        { name: "modelId", value: modelFilter },
        { name: "status", value: statusFilter },
        { name: "minStock", value: minStock },
        { name: "maxStock", value: maxStock },
        { name: "minPrice", value: minPrice },
        { name: "maxPrice", value: maxPrice },
        { name: "pageSize", value: pageSize },
    ].filter((field) => field.value);
    const buildRedirectPath = (options?: { includeCursor?: boolean; cursor?: string; cursorStack?: string }) => {
        const query = new URLSearchParams();
        for (const field of baseQueryFields) query.set(field.name, field.value);
        if (options?.includeCursor) {
            if (options.cursor) query.set("cursor", options.cursor);
            if (options.cursorStack) query.set("cursorStack", options.cursorStack);
        }
        const qs = query.toString();
        return qs ? `/dashboard/products?${qs}` : "/dashboard/products";
    };
    const createRedirectPath = buildRedirectPath();
    const currentRedirectPath = buildRedirectPath({ includeCursor: true, cursor: currentCursor, cursorStack: currentCursorStack });
    const renderBaseQueryInputs = (omit: string[] = []) =>
        baseQueryFields
            .filter((field) => !omit.includes(field.name))
            .map((field) => <input key={`query-${field.name}`} type="hidden" name={field.name} value={field.value} />);

    const toolbar = (
        <SearchToolbar
            searchSlot={
                <form action="/dashboard/products" method="get" className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                    <input type="hidden" name="supplier" value={supplierFilter} />
                    <input type="hidden" name="categoryId" value={categoryFilter} />
                    <input type="hidden" name="brandId" value={brandFilter} />
                    <input type="hidden" name="modelId" value={modelFilter} />
                    <input type="hidden" name="status" value={statusFilter} />
                    <input type="hidden" name="minStock" value={minStock} />
                    <input type="hidden" name="maxStock" value={maxStock} />
                    <input type="hidden" name="minPrice" value={minPrice} />
                    <input type="hidden" name="maxPrice" value={maxPrice} />
                    <input type="hidden" name="pageSize" value={pageSize} />
                    <label htmlFor="product-management-search" className="sr-only">
                        {ui.searchKeywordLabel}
                    </label>
                    <MerchantPredictiveSearchInput
                        id="product-management-search"
                        name="productQ"
                        defaultValue={productKeyword}
                        placeholder={ui.searchPlaceholder}
                        targets={["products", "inventory"]}
                        localSuggestions={productSearchSuggestions}
                        className="min-w-0 flex-1"
                        inputClassName={controlClass}
                    />
                    <div className="flex items-center gap-2">
                        <IconActionButton icon={Search} label={ui.searchItems} tooltip={ui.searchTooltip} type="submit" />
                        <IconActionButton href="/dashboard/products" icon={RotateCcw} label={ui.clearSearchAndFilters} tooltip={ui.clearTooltip} />
                        <IconActionButton
                            icon={SlidersHorizontal}
                            label={showFilters ? ui.collapseFilters : ui.expandFilters}
                            tooltip={showFilters ? ui.collapseFiltersTooltip : ui.expandFiltersTooltip}
                            onClick={() => setShowFilters((prev) => !prev)}
                            aria-pressed={showFilters}
                        />
                    </div>
                </form>
            }
            primaryActionSlot={
                <IconTextActionButton
                    type="button"
                    icon={showCreateForm ? X : PackagePlus}
                    label={showCreateForm ? ui.collapseCreateForm : ui.expandCreateForm}
                    tooltip={showCreateForm ? ui.collapseCreateForm : ui.expandCreateForm}
                    onClick={() => setShowCreateForm((prev) => !prev)}
                    className={showCreateForm ? "h-10 px-4 border-[rgb(var(--accent))] text-[rgb(var(--accent))]" : "h-10 px-4"}
                >
                    {ui.createItem}
                </IconTextActionButton>
            }
        />
    );

    const filters = showFilters ? (
        <FilterCard title={ui.filtersTitle} description={ui.filtersDescription}>
            <form action="/dashboard/products" method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <input type="hidden" name="productQ" value={productKeyword} />
                <input type="hidden" name="pageSize" value={pageSize} />

                <FormField label={ui.category} htmlFor="filter-category">
                    <Select id="filter-category" name="categoryId" defaultValue={categoryFilter} className={controlClass}>
                        <option value="">{ui.allCategories}</option>
                        {dimensionBundle.categories
                            .filter((category) => (category.categoryLevel ?? 1) === 1)
                            .map((category) => (
                            <option key={`category-${category.id}`} value={category.id}>
                                {category.fullPath || category.name}
                            </option>
                            ))}
                    </Select>
                </FormField>

                <FormField label={ui.brand} htmlFor="filter-brand">
                    <Select
                        id="filter-brand"
                        name="brandId"
                        value={selectedBrandFilter}
                        onChange={(event) => setSelectedBrandFilter(event.currentTarget.value)}
                        className={controlClass}
                    >
                        <option value="">{ui.allBrands}</option>
                        {dimensionBundle.brands.map((brand) => (
                            <option key={`brand-${brand.id}`} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </Select>
                </FormField>

                <FormField label={ui.model} htmlFor="filter-model">
                    <Select
                        id="filter-model"
                        name="modelId"
                        value={selectedModelFilter}
                        onMouseDown={(event) => {
                            if (selectedBrandFilter) return;
                            event.preventDefault();
                            promptSelectBrandFirst();
                        }}
                        onFocus={(event) => {
                            if (selectedBrandFilter) return;
                            event.currentTarget.blur();
                            promptSelectBrandFirst();
                        }}
                        onChange={(event) => {
                            if (!selectedBrandFilter) {
                                setSelectedModelFilter("");
                                promptSelectBrandFirst();
                                return;
                            }
                            setSelectedModelFilter(event.currentTarget.value);
                        }}
                        className={controlClass}
                    >
                        <option value="">
                            {!selectedBrandFilter ? ui.selectBrandFirst : filteredModelOptions.length === 0 ? ui.noModelsForBrand : ui.allModels}
                        </option>
                        {filteredModelOptions.map((model) => (
                            <option key={`model-${model.brandId ?? "na"}-${model.id}`} value={model.id}>
                                {model.name}
                            </option>
                        ))}
                    </Select>
                </FormField>

                <FormField label={ui.supplier} htmlFor="filter-supplier">
                    <Select id="filter-supplier" name="supplier" defaultValue={supplierFilter} className={controlClass}>
                        <option value="">{ui.allSuppliers}</option>
                        {supplierNames.map((supplier) => (
                            <option key={supplier} value={supplier}>
                                {supplier}
                            </option>
                        ))}
                    </Select>
                </FormField>

                <FormField label={ui.status} htmlFor="filter-status">
                    <Select id="filter-status" name="status" defaultValue={statusFilter} className={controlClass}>
                        <option value="">{ui.allStatuses}</option>
                        <option value="active">{ui.active}</option>
                        <option value="inactive">{ui.inactive}</option>
                    </Select>
                </FormField>

                <FormField label={ui.minStock} htmlFor="filter-min-stock">
                    <Input id="filter-min-stock" type="number" min={0} name="minStock" defaultValue={minStock} placeholder={ui.stockPlaceholder} className={controlClass} />
                </FormField>

                <FormField label={ui.maxStock} htmlFor="filter-max-stock">
                    <Input id="filter-max-stock" type="number" min={0} name="maxStock" defaultValue={maxStock} placeholder={ui.maxStockPlaceholder} className={controlClass} />
                </FormField>

                <FormField label={ui.minPrice} htmlFor="filter-min-price">
                    <Input id="filter-min-price" type="number" min={0} name="minPrice" defaultValue={minPrice} placeholder={ui.minPricePlaceholder} className={controlClass} />
                </FormField>

                <FormField label={ui.maxPrice} htmlFor="filter-max-price">
                    <Input id="filter-max-price" type="number" min={0} name="maxPrice" defaultValue={maxPrice} placeholder={ui.maxPricePlaceholder} className={controlClass} />
                </FormField>

                <div className="flex flex-wrap items-end gap-2 md:col-span-2 xl:col-span-3">
                    <IconTextActionButton type="submit" icon={Filter} label={ui.applyFilters} tooltip={ui.applyFiltersTooltip} className="h-10 px-4">
                        {ui.applyFilters}
                    </IconTextActionButton>
                    <IconTextActionButton href="/dashboard/products" icon={RotateCcw} label={ui.clearFilters} tooltip={ui.clearFiltersTooltip} className="h-10 px-4">
                        {ui.clearFilters}
                    </IconTextActionButton>
                </div>
            </form>
        </FilterCard>
    ) : null;

    const createForm = showCreateForm ? (
        <FilterCard title={ui.createTitle} description={ui.createDescription}>
            <form action={createProductAction} className="grid gap-3">
                <input type="hidden" name="tab" value="inventory" />
                <input type="hidden" name="inventoryView" value="settings" />
                <input type="hidden" name="redirectPath" value={createRedirectPath} />
                <ItemFormFields
                    bundle={dimensionBundle}
                    namingSettings={namingSettings}
                    idPrefix="create-item"
                    supplierListId="product-supplier-options"
                    controlClass={controlClass}
                />

                <div className="flex items-end">
                    <IconTextActionButton type="submit" icon={Plus} label={ui.createItem} tooltip={ui.createItemTooltip} className="h-10 px-4">
                        {ui.createItem}
                    </IconTextActionButton>
                </div>
            </form>
        </FilterCard>
    ) : null;

    const list = (
        <MerchantSectionCard
            title={ui.listTitle.replace("{count}", String(products.length))}
            description={ui.listDescription}
            actions={
                <form action="/dashboard/products" method="get" className="flex flex-wrap items-center gap-2">
                    {renderBaseQueryInputs(["pageSize"])}
                    <span className="text-xs text-[rgb(var(--muted))]">{ui.perPage}</span>
                    <Select name="pageSize" defaultValue={pageSize} className="h-9 w-[96px]">
                        {LIST_DISPLAY_OPTIONS.map((size) => (
                            <option key={`product-page-size-${size}`} value={size}>
                                {size}
                            </option>
                        ))}
                    </Select>
                    <IconTextActionButton type="submit" icon={Filter} label={ui.applyPageSize} tooltip={ui.applyPageSizeTooltip} className="h-9 px-3">
                        {ui.applyFilters}
                    </IconTextActionButton>
                </form>
            }
            className="p-3"
            bodyClassName="space-y-2"
            emptyState={
                products.length === 0
                    ? {
                          icon: PackageSearch,
                          title: ui.emptyTitle,
                          description: ui.emptyDescription,
                      }
                    : undefined
            }
        >
            {products.length === 0 ? null : (
                <div className="space-y-3">
                    <MerchantListPagination
                        summary={<span>{ui.listSummary.replace("{count}", String(products.length))}</span>}
                        previousAction={
                            <form action="/dashboard/products" method="get">
                                {renderBaseQueryInputs()}
                                {previousCursor ? <input type="hidden" name="cursor" value={previousCursor} /> : null}
                                {previousCursorStack ? <input type="hidden" name="cursorStack" value={previousCursorStack} /> : null}
                                <IconTextActionButton
                                    type="submit"
                                    icon={ArrowLeft}
                                    label={ui.previousPage}
                                    tooltip={ui.previousPageTooltip}
                                    className="h-9 px-3"
                                    disabled={!currentCursor}
                                >
                                    {ui.previousPage}
                                </IconTextActionButton>
                            </form>
                        }
                        nextAction={
                            <form action="/dashboard/products" method="get">
                                {renderBaseQueryInputs()}
                                <input type="hidden" name="cursor" value={nextCursor} />
                                {nextCursorStack ? <input type="hidden" name="cursorStack" value={nextCursorStack} /> : null}
                                <IconTextActionButton
                                    type="submit"
                                    icon={ArrowRight}
                                    label={ui.nextPage}
                                    tooltip={ui.nextPageTooltip}
                                    className="h-9 px-3"
                                    disabled={!hasNextPage || !nextCursor}
                                >
                                    {ui.nextPage}
                                </IconTextActionButton>
                            </form>
                        }
                    />
                    <div className="h-[720px] overflow-y-auto pr-1">
                        <div className="grid gap-2">
                            {products.map((product) => (
                        <details key={product.id} className="rounded-lg border border-[rgb(var(--border))]">
                            <summary className="grid cursor-pointer list-none gap-1.5 px-3 py-2 text-sm sm:grid-cols-2 lg:grid-cols-6 [&::-webkit-details-marker]:hidden">
                                <span className="font-medium">{product.name}</span>
                                <span>{ui.stock} {product.stock}</span>
                                <span>{ui.price} {formatMoney(product.price, lang)}</span>
                                <span>{ui.cost} {formatMoney(product.cost, lang)}</span>
                                <span>{product.supplier || "-"}</span>
                                <span>{product.status === "inactive" ? ui.inactive : ui.active}</span>
                            </summary>
                            <div className="border-t border-[rgb(var(--border))] p-3">
                                <form action={updateProductAction} className="grid gap-3">
                                    <input type="hidden" name="tab" value="inventory" />
                                    <input type="hidden" name="inventoryView" value="settings" />
                                    <input type="hidden" name="redirectPath" value={currentRedirectPath} />
                                    <input type="hidden" name="productId" value={product.id} />
                                    <ItemFormFields
                                        bundle={dimensionBundle}
                                        namingSettings={namingSettings}
                                        idPrefix={`edit-item-${product.id}`}
                                        supplierListId="product-supplier-options"
                                        controlClass={controlClass}
                                        product={product}
                                    />

                                    <div className="flex items-end gap-2">
                                        <IconTextActionButton type="submit" icon={Save} label={ui.updateItem} tooltip={ui.updateItemTooltip} className="h-10 px-4">
                                            {ui.updateItem}
                                        </IconTextActionButton>
                                    </div>
                                </form>
                                <form action={deleteProductAction} className="mt-2" onSubmit={(event) => guardDeleteWithPassword(event, ui)} data-delete-target={`${ui.createItem} ${product.name}`}>
                                    <input type="hidden" name="tab" value="inventory" />
                                    <input type="hidden" name="inventoryView" value="settings" />
                                    <input type="hidden" name="redirectPath" value={currentRedirectPath} />
                                    <input type="hidden" name="productId" value={product.id} />
                                    <IconTextActionButton type="submit" icon={Trash2} label={ui.deleteItem} tooltip={ui.deleteItemTooltip} className="h-10 px-4">
                                        {ui.deleteItem}
                                    </IconTextActionButton>
                                </form>
                            </div>
                        </details>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </MerchantSectionCard>
    );

    return (
        <MerchantListShell
            className="space-y-2.5"
            toolbar={
                <div className="space-y-2.5">
                    {showFlashNotice ? (
                        <div
                            className={
                                flashTone(flash) === "error"
                                    ? "flex items-start justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
                                    : "flex items-start justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                            }
                            role="status"
                            aria-live="polite"
                        >
                            <span>{currentFlashText}</span>
                            <IconActionButton
                                icon={X}
                                label={ui.closeNotice}
                                tooltip={ui.closeNotice}
                                onClick={() => setDismissedFlashKey(currentFlashKey)}
                            />
                        </div>
                    ) : null}
                    <datalist id="product-supplier-options">
                        {supplierNames.map((supplier) => (
                            <option key={`product-supplier-${supplier}`} value={supplier} />
                        ))}
                    </datalist>
                    {toolbar}
                    {createForm}
                    {filters}
                </div>
            }
            list={list}
        />
    );
}
