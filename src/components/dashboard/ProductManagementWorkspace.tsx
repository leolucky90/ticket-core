"use client";

import { ArrowLeft, ArrowRight, Filter, PackagePlus, PackageSearch, Plus, RotateCcw, Save, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
    FilterCard,
    MerchantListShell,
    MerchantSectionCard,
    SearchToolbar,
} from "@/components/merchant/shell";
import { DimensionPicker } from "@/components/merchant/catalog";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import { FormField } from "@/components/ui/form-field";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { DimensionPickerBundle } from "@/lib/types/catalog";
import type { Product } from "@/lib/types/commerce";
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
};

const FLASH_LABELS: Record<string, string> = {
    invalid: "輸入資料不完整或格式錯誤",
    error: "操作失敗，請稍後再試",
    delete_auth_required: "請先輸入帳戶密碼才能刪除",
    delete_auth_failed: "密碼驗證失敗，刪除已取消",
    product_created: "產品已建立",
    product_updated: "產品已更新",
    product_deleted: "產品已刪除",
};

function flashTone(flash: string): "success" | "error" {
    if (flash === "invalid" || flash === "error" || flash === "delete_auth_required" || flash === "delete_auth_failed") return "error";
    return "success";
}

function guardDeleteWithPassword(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const targetText = (form.dataset.deleteTarget ?? "此產品").trim();
    const confirmed = window.confirm(`確定要刪除「${targetText}」嗎？此操作無法復原。`);
    if (!confirmed) {
        event.preventDefault();
        return;
    }
    const password = window.prompt("請輸入帳戶密碼以確認刪除：");
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

function formatMoney(value: number): string {
    return new Intl.NumberFormat("zh-TW").format(Math.max(0, value));
}

function toRefValue(id: string | undefined, name: string | undefined): string {
    const idText = (id ?? "").trim();
    const nameText = (name ?? "").trim();
    if (!idText && !nameText) return "";
    return `${idText || nameText}::${nameText || idText}`;
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
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [dismissedFlashKey, setDismissedFlashKey] = useState<string | null>(null);
    const [selectedBrandFilter, setSelectedBrandFilter] = useState(brandFilter);
    const [selectedModelFilter, setSelectedModelFilter] = useState(modelFilter);
    const currentFlashKey = `${flash}:${actionTs || "no-ts"}`;
    const currentFlashText = FLASH_LABELS[flash] ?? "";
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
                keywords: [product.name, product.sku, product.categoryName, product.brandName, product.modelName, product.supplier, ...(product.aliases ?? [])].filter(
                    (value): value is string => Boolean(value),
                ),
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
    const promptSelectBrandFirst = () => window.alert("請先選擇品牌");
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
                        搜尋產品關鍵字
                    </label>
                    <MerchantPredictiveSearchInput
                        id="product-management-search"
                        name="productQ"
                        defaultValue={productKeyword}
                        placeholder="查詢品名、SKU、分類、品牌、型號"
                        targets={["products", "inventory"]}
                        localSuggestions={productSearchSuggestions}
                        className="min-w-0 flex-1"
                        inputClassName={controlClass}
                    />
                    <div className="flex items-center gap-2">
                        <IconActionButton icon={Search} label="搜尋產品" tooltip="搜尋" type="submit" />
                        <IconActionButton href="/dashboard/products" icon={RotateCcw} label="清除查詢與篩選" tooltip="清除" />
                        <IconActionButton
                            icon={SlidersHorizontal}
                            label={showFilters ? "收合篩選條件" : "展開篩選條件"}
                            tooltip={showFilters ? "收合篩選" : "展開篩選"}
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
                    label={showCreateForm ? "收合新增產品表單" : "展開新增產品表單"}
                    tooltip={showCreateForm ? "收合新增產品表單" : "展開新增產品表單"}
                    onClick={() => setShowCreateForm((prev) => !prev)}
                    className={showCreateForm ? "h-10 px-4 border-[rgb(var(--accent))] text-[rgb(var(--accent))]" : "h-10 px-4"}
                >
                    新增產品
                </IconTextActionButton>
            }
        />
    );

    const filters = showFilters ? (
        <FilterCard title="篩選條件" description="分類、品牌、型號、供應商、狀態與庫存/價格區間。">
            <form action="/dashboard/products" method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <input type="hidden" name="productQ" value={productKeyword} />
                <input type="hidden" name="pageSize" value={pageSize} />

                <FormField label="分類" htmlFor="filter-category">
                    <Select id="filter-category" name="categoryId" defaultValue={categoryFilter} className={controlClass}>
                        <option value="">全部分類</option>
                        {dimensionBundle.categories.map((category) => (
                            <option key={`category-${category.id}`} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </Select>
                </FormField>

                <FormField label="品牌" htmlFor="filter-brand">
                    <Select
                        id="filter-brand"
                        name="brandId"
                        value={selectedBrandFilter}
                        onChange={(event) => setSelectedBrandFilter(event.currentTarget.value)}
                        className={controlClass}
                    >
                        <option value="">全部品牌</option>
                        {dimensionBundle.brands.map((brand) => (
                            <option key={`brand-${brand.id}`} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </Select>
                </FormField>

                <FormField label="型號" htmlFor="filter-model">
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
                            {!selectedBrandFilter ? "請先選擇品牌" : filteredModelOptions.length === 0 ? "該品牌暫無型號" : "全部型號"}
                        </option>
                        {filteredModelOptions.map((model) => (
                            <option key={`model-${model.brandId ?? "na"}-${model.id}`} value={model.id}>
                                {model.name}
                            </option>
                        ))}
                    </Select>
                </FormField>

                <FormField label="供應商" htmlFor="filter-supplier">
                    <Select id="filter-supplier" name="supplier" defaultValue={supplierFilter} className={controlClass}>
                        <option value="">全部供應商</option>
                        {supplierNames.map((supplier) => (
                            <option key={supplier} value={supplier}>
                                {supplier}
                            </option>
                        ))}
                    </Select>
                </FormField>

                <FormField label="狀態" htmlFor="filter-status">
                    <Select id="filter-status" name="status" defaultValue={statusFilter} className={controlClass}>
                        <option value="">全部狀態</option>
                        <option value="active">啟用</option>
                        <option value="inactive">停用</option>
                    </Select>
                </FormField>

                <FormField label="最低庫存" htmlFor="filter-min-stock">
                    <Input id="filter-min-stock" type="number" min={0} name="minStock" defaultValue={minStock} placeholder="例如 5" className={controlClass} />
                </FormField>

                <FormField label="最高庫存" htmlFor="filter-max-stock">
                    <Input id="filter-max-stock" type="number" min={0} name="maxStock" defaultValue={maxStock} placeholder="例如 200" className={controlClass} />
                </FormField>

                <FormField label="最低售價" htmlFor="filter-min-price">
                    <Input id="filter-min-price" type="number" min={0} name="minPrice" defaultValue={minPrice} placeholder="例如 1000" className={controlClass} />
                </FormField>

                <FormField label="最高售價" htmlFor="filter-max-price">
                    <Input id="filter-max-price" type="number" min={0} name="maxPrice" defaultValue={maxPrice} placeholder="例如 50000" className={controlClass} />
                </FormField>

                <div className="flex flex-wrap items-end gap-2 md:col-span-2 xl:col-span-3">
                    <IconTextActionButton type="submit" icon={Filter} label="套用篩選" tooltip="套用篩選條件" className="h-10 px-4">
                        套用篩選
                    </IconTextActionButton>
                    <IconTextActionButton href="/dashboard/products" icon={RotateCcw} label="清除篩選" tooltip="清除篩選條件" className="h-10 px-4">
                        清除篩選
                    </IconTextActionButton>
                </div>
            </form>
        </FilterCard>
    ) : null;

    const createForm = showCreateForm ? (
        <FilterCard title="新增產品" description="以分類、品牌、型號建立產品主資料；產品名稱可手動覆寫，其他命名欄位已整合移除。">
            <form action={createProductAction} className="grid gap-3">
                <input type="hidden" name="tab" value="inventory" />
                <input type="hidden" name="inventoryView" value="settings" />
                <input type="hidden" name="redirectPath" value={createRedirectPath} />

                <DimensionPicker bundle={dimensionBundle} idPrefix="create-product" />

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <FormField label="產品名稱" htmlFor="create-name" hint="可留空，系統會依分類 / 品牌 / 型號自動組合。">
                        <Input id="create-name" name="name" placeholder="例如：iPhone 16 Pro" className={controlClass} />
                    </FormField>

                    <FormField label="SKU" htmlFor="create-sku">
                        <Input id="create-sku" name="sku" placeholder="例如：IP16P-256-BLK" className={controlClass} />
                    </FormField>

                    <FormField label="供應商" htmlFor="create-supplier">
                        <Input id="create-supplier" name="supplier" list="product-supplier-options" placeholder="例如：Apple 授權供應商" className={controlClass} />
                    </FormField>

                    <FormField label="售價" htmlFor="create-price" required>
                        <Input id="create-price" type="number" min={0} name="price" placeholder="例如 38900" required className={controlClass} />
                    </FormField>

                    <FormField label="成本" htmlFor="create-cost" required>
                        <Input id="create-cost" type="number" min={0} name="cost" placeholder="例如 32000" required className={controlClass} />
                    </FormField>

                    <FormField label="初始庫存" htmlFor="create-stock" required>
                        <Input id="create-stock" type="number" min={0} name="stock" defaultValue={0} required className={controlClass} />
                    </FormField>

                    <FormField label="最小庫存警戒" htmlFor="create-low-stock" required>
                        <Input id="create-low-stock" type="number" min={0} name="lowStockThreshold" defaultValue={5} required className={controlClass} />
                    </FormField>

                    <FormField label="扣庫存模式" htmlFor="create-stock-mode" required>
                        <Select id="create-stock-mode" name="stockDeductionMode" defaultValue="immediate" className={controlClass}>
                            <option value="immediate">即時扣庫存（一般銷售）</option>
                            <option value="redeem_only">兌換才扣庫存（客戶權益/活動）</option>
                        </Select>
                    </FormField>

                    <FormField label="狀態" htmlFor="create-status" required>
                        <Select id="create-status" name="status" defaultValue="active" className={controlClass}>
                            <option value="active">啟用</option>
                            <option value="inactive">停用</option>
                        </Select>
                    </FormField>

                    <div className="flex items-end md:col-span-2 xl:col-span-3">
                        <IconTextActionButton type="submit" icon={Plus} label="新增產品" tooltip="建立產品資料" className="h-10 px-4">
                            新增產品
                        </IconTextActionButton>
                    </div>
                </div>
            </form>
        </FilterCard>
    ) : null;

    const list = (
        <MerchantSectionCard
            title={`產品列表（${products.length}）`}
            description="採用 server 分頁與固定高度清單，保留目前篩選器操作方式。"
            actions={
                <form action="/dashboard/products" method="get" className="flex flex-wrap items-center gap-2">
                    {renderBaseQueryInputs(["pageSize"])}
                    <span className="text-xs text-[rgb(var(--muted))]">每頁</span>
                    <Select name="pageSize" defaultValue={pageSize} className="h-9 w-[96px]">
                        {LIST_DISPLAY_OPTIONS.map((size) => (
                            <option key={`product-page-size-${size}`} value={size}>
                                {size}
                            </option>
                        ))}
                    </Select>
                    <IconTextActionButton type="submit" icon={Filter} label="套用每頁筆數" tooltip="套用每頁顯示筆數" className="h-9 px-3">
                        套用
                    </IconTextActionButton>
                </form>
            }
            className="p-3"
            bodyClassName="space-y-2"
            emptyState={
                products.length === 0
                    ? {
                          icon: PackageSearch,
                          title: "沒有符合條件的產品",
                          description: "調整查詢條件或先建立第一筆產品資料。",
                      }
                    : undefined
            }
        >
            {products.length === 0 ? null : (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[rgb(var(--muted))]">
                        <span>本頁顯示 {products.length} 筆，清單高度固定並可滾動。</span>
                        <div className="flex flex-wrap items-center gap-2">
                            <form action="/dashboard/products" method="get">
                                {renderBaseQueryInputs()}
                                {previousCursor ? <input type="hidden" name="cursor" value={previousCursor} /> : null}
                                {previousCursorStack ? <input type="hidden" name="cursorStack" value={previousCursorStack} /> : null}
                                <IconTextActionButton
                                    type="submit"
                                    icon={ArrowLeft}
                                    label="上一頁"
                                    tooltip="載入上一頁"
                                    className="h-9 px-3"
                                    disabled={!currentCursor}
                                >
                                    上一頁
                                </IconTextActionButton>
                            </form>
                            <form action="/dashboard/products" method="get">
                                {renderBaseQueryInputs()}
                                <input type="hidden" name="cursor" value={nextCursor} />
                                {nextCursorStack ? <input type="hidden" name="cursorStack" value={nextCursorStack} /> : null}
                                <IconTextActionButton
                                    type="submit"
                                    icon={ArrowRight}
                                    label="下一頁"
                                    tooltip="載入下一頁"
                                    className="h-9 px-3"
                                    disabled={!hasNextPage || !nextCursor}
                                >
                                    下一頁
                                </IconTextActionButton>
                            </form>
                        </div>
                    </div>
                    <div className="h-[720px] overflow-y-auto pr-1">
                        <div className="grid gap-2">
                            {products.map((product) => (
                        <details key={product.id} className="rounded-lg border border-[rgb(var(--border))]">
                            <summary className="grid cursor-pointer list-none gap-1.5 px-3 py-2 text-sm sm:grid-cols-2 lg:grid-cols-6 [&::-webkit-details-marker]:hidden">
                                <span className="font-medium">{product.name}</span>
                                <span>庫存 {product.stock}</span>
                                <span>售價 {formatMoney(product.price)}</span>
                                <span>成本 {formatMoney(product.cost)}</span>
                                <span>{product.supplier || "-"}</span>
                                <span>{product.status === "inactive" ? "停用" : "啟用"}</span>
                            </summary>
                            <div className="border-t border-[rgb(var(--border))] p-3">
                                <form action={updateProductAction} className="grid gap-3">
                                    <input type="hidden" name="tab" value="inventory" />
                                    <input type="hidden" name="inventoryView" value="settings" />
                                    <input type="hidden" name="redirectPath" value={currentRedirectPath} />
                                    <input type="hidden" name="productId" value={product.id} />

                                    <DimensionPicker
                                        bundle={dimensionBundle}
                                        idPrefix={`edit-${product.id}`}
                                        value={{
                                            categoryRef: toRefValue(product.categoryId, product.categoryName),
                                            brandRef: toRefValue(product.brandId, product.brandName),
                                            modelRef: toRefValue(product.modelId, product.modelName),
                                        }}
                                    />

                                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                        <FormField label="產品名稱" htmlFor={`edit-name-${product.id}`} required>
                                            <Input id={`edit-name-${product.id}`} name="name" defaultValue={product.name} required className={controlClass} />
                                        </FormField>

                                        <FormField label="SKU" htmlFor={`edit-sku-${product.id}`}>
                                            <Input id={`edit-sku-${product.id}`} name="sku" defaultValue={product.sku} className={controlClass} />
                                        </FormField>

                                        <FormField label="供應商" htmlFor={`edit-supplier-${product.id}`}>
                                            <Input
                                                id={`edit-supplier-${product.id}`}
                                                name="supplier"
                                                list="product-supplier-options"
                                                defaultValue={product.supplier}
                                                className={controlClass}
                                            />
                                        </FormField>

                                        <FormField label="售價" htmlFor={`edit-price-${product.id}`} required>
                                            <Input
                                                id={`edit-price-${product.id}`}
                                                type="number"
                                                min={0}
                                                name="price"
                                                defaultValue={product.price}
                                                required
                                                className={controlClass}
                                            />
                                        </FormField>

                                        <FormField label="成本" htmlFor={`edit-cost-${product.id}`} required>
                                            <Input
                                                id={`edit-cost-${product.id}`}
                                                type="number"
                                                min={0}
                                                name="cost"
                                                defaultValue={product.cost}
                                                required
                                                className={controlClass}
                                            />
                                        </FormField>

                                        <FormField label="目前庫存" htmlFor={`edit-stock-${product.id}`} required>
                                            <Input
                                                id={`edit-stock-${product.id}`}
                                                type="number"
                                                min={0}
                                                name="stock"
                                                defaultValue={product.stock}
                                                required
                                                className={controlClass}
                                            />
                                        </FormField>

                                        <FormField label="最小庫存警戒" htmlFor={`edit-low-stock-${product.id}`} required>
                                            <Input
                                                id={`edit-low-stock-${product.id}`}
                                                type="number"
                                                min={0}
                                                name="lowStockThreshold"
                                                defaultValue={product.lowStockThreshold ?? 5}
                                                required
                                                className={controlClass}
                                            />
                                        </FormField>

                                        <FormField label="扣庫存模式" htmlFor={`edit-stock-mode-${product.id}`} required>
                                            <Select
                                                id={`edit-stock-mode-${product.id}`}
                                                name="stockDeductionMode"
                                                defaultValue={product.stockDeductionMode ?? "immediate"}
                                                className={controlClass}
                                            >
                                                <option value="immediate">即時扣庫存</option>
                                                <option value="redeem_only">兌換才扣庫存</option>
                                            </Select>
                                        </FormField>

                                        <FormField label="狀態" htmlFor={`edit-status-${product.id}`} required>
                                            <Select id={`edit-status-${product.id}`} name="status" defaultValue={product.status ?? "active"} className={controlClass}>
                                                <option value="active">啟用</option>
                                                <option value="inactive">停用</option>
                                            </Select>
                                        </FormField>

                                        <div className="flex items-end gap-2 md:col-span-2 xl:col-span-3">
                                            <IconTextActionButton type="submit" icon={Save} label="更新產品" tooltip="儲存產品資料" className="h-10 px-4">
                                                更新產品
                                            </IconTextActionButton>
                                        </div>
                                    </div>
                                </form>
                                <form action={deleteProductAction} className="mt-2" onSubmit={guardDeleteWithPassword} data-delete-target={`產品 ${product.name}`}>
                                    <input type="hidden" name="tab" value="inventory" />
                                    <input type="hidden" name="inventoryView" value="settings" />
                                    <input type="hidden" name="redirectPath" value={currentRedirectPath} />
                                    <input type="hidden" name="productId" value={product.id} />
                                    <IconTextActionButton type="submit" icon={Trash2} label="刪除產品" tooltip="刪除產品資料" className="h-10 px-4">
                                        刪除產品
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
                                label="關閉提示"
                                tooltip="關閉"
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
