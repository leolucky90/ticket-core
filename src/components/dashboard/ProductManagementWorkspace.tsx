"use client";

import { PackageSearch, Plus, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
    FilterCard,
    MerchantListShell,
    MerchantSectionCard,
    SearchToolbar,
} from "@/components/merchant/shell";
import { DimensionPicker } from "@/components/merchant/catalog";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { DimensionPickerBundle } from "@/lib/types/catalog";
import type { Product } from "@/lib/types/commerce";

type ProductManagementWorkspaceProps = {
    products: Product[];
    productKeyword: string;
    supplierOptions: string[];
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
    createProductAction: (formData: FormData) => Promise<void>;
    updateProductAction: (formData: FormData) => Promise<void>;
    deleteProductAction: (formData: FormData) => Promise<void>;
};

const FLASH_LABELS: Record<string, string> = {
    invalid: "輸入資料不完整或格式錯誤",
    product_created: "產品已建立",
    product_updated: "產品已更新",
    product_deleted: "產品已刪除",
};

function formatMoney(value: number): string {
    return new Intl.NumberFormat("zh-TW").format(Math.max(0, value));
}

function toRefValue(id: string | undefined, name: string | undefined): string {
    const idText = (id ?? "").trim();
    const nameText = (name ?? "").trim();
    if (!idText && !nameText) return "";
    return `${idText || nameText}::${nameText || idText}`;
}

export function ProductManagementWorkspace({
    products,
    productKeyword,
    supplierOptions,
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
    createProductAction,
    updateProductAction,
    deleteProductAction,
}: ProductManagementWorkspaceProps) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showFilters, setShowFilters] = useState(true);

    useEffect(() => {
        if (!flash) return;
        const key = `product-management-flash:${flash}:${actionTs || "no-ts"}`;
        const seen = window.sessionStorage.getItem(key);
        if (seen === "1") return;
        window.sessionStorage.setItem(key, "1");

        const text = FLASH_LABELS[flash];
        if (text) window.alert(text);

        const url = new URL(window.location.href);
        url.searchParams.delete("flash");
        url.searchParams.delete("ts");
        window.history.replaceState({}, "", url.toString());
    }, [flash, actionTs]);

    const controlClass = "h-10 w-full min-w-0";

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
                    <label htmlFor="product-management-search" className="sr-only">
                        搜尋產品關鍵字
                    </label>
                    <MerchantPredictiveSearchInput
                        id="product-management-search"
                        name="productQ"
                        defaultValue={productKeyword}
                        placeholder="查詢品名、SKU、分類、品牌、型號"
                        targets={["products", "inventory"]}
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
                <Button
                    type="button"
                    variant={showCreateForm ? "solid" : "ghost"}
                    onClick={() => setShowCreateForm((prev) => !prev)}
                    className="h-10 px-4"
                >
                    <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                    新增產品
                </Button>
            }
        />
    );

    const filters = showFilters ? (
        <FilterCard title="篩選條件" description="分類、品牌、型號、供應商、狀態與庫存/價格區間。">
            <form action="/dashboard/products" method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <input type="hidden" name="productQ" value={productKeyword} />

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
                    <Select id="filter-brand" name="brandId" defaultValue={brandFilter} className={controlClass}>
                        <option value="">全部品牌</option>
                        {dimensionBundle.brands.map((brand) => (
                            <option key={`brand-${brand.id}`} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </Select>
                </FormField>

                <FormField label="型號" htmlFor="filter-model">
                    <Select id="filter-model" name="modelId" defaultValue={modelFilter} className={controlClass}>
                        <option value="">全部型號</option>
                        {dimensionBundle.models.map((model) => (
                            <option key={`model-${model.id}`} value={model.id}>
                                {model.name}
                            </option>
                        ))}
                    </Select>
                </FormField>

                <FormField label="供應商" htmlFor="filter-supplier">
                    <Select id="filter-supplier" name="supplier" defaultValue={supplierFilter} className={controlClass}>
                        <option value="">全部供應商</option>
                        {supplierOptions.map((supplier) => (
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
                    <Button type="submit" className="h-10 px-4">
                        套用篩選
                    </Button>
                    <Link href="/dashboard/products">
                        <Button type="button" variant="ghost" className="h-10 px-4">
                            清除篩選
                        </Button>
                    </Link>
                </div>
            </form>
        </FilterCard>
    ) : null;

    const createForm = showCreateForm ? (
        <FilterCard title="新增產品" description="可用結構化命名（分類/品牌/型號）或自訂名稱快速建立產品。">
            <form action={createProductAction} className="grid gap-3">
                <input type="hidden" name="tab" value="inventory" />
                <input type="hidden" name="inventoryView" value="settings" />
                <input type="hidden" name="redirectPath" value="/dashboard/products" />

                <DimensionPicker bundle={dimensionBundle} idPrefix="create-product" />

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <FormField label="產品名稱" htmlFor="create-name" hint="可留空，系統會依命名維度自動組合。">
                        <Input id="create-name" name="name" placeholder="例如：iPhone 16 Pro" className={controlClass} />
                    </FormField>

                    <FormField label="SKU" htmlFor="create-sku">
                        <Input id="create-sku" name="sku" placeholder="例如：IP16P-256-BLK" className={controlClass} />
                    </FormField>

                    <FormField label="供應商" htmlFor="create-supplier">
                        <Input id="create-supplier" name="supplier" placeholder="例如：Apple 授權供應商" className={controlClass} />
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
                        <Button type="submit" className="h-10 px-4">
                            新增產品
                        </Button>
                    </div>
                </div>
            </form>
        </FilterCard>
    ) : null;

    const list = (
        <MerchantSectionCard
            title={`產品列表（${products.length}）`}
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
                                    <input type="hidden" name="redirectPath" value="/dashboard/products" />
                                    <input type="hidden" name="productId" value={product.id} />

                                    <DimensionPicker
                                        bundle={dimensionBundle}
                                        idPrefix={`edit-${product.id}`}
                                        value={{
                                            namingMode: product.namingMode,
                                            categoryRef: toRefValue(product.categoryId, product.categoryName),
                                            brandRef: toRefValue(product.brandId, product.brandName),
                                            modelRef: toRefValue(product.modelId, product.modelName),
                                            nameEntryRef: toRefValue(product.nameEntryId, product.nameEntryName),
                                            customLabel: product.customLabel,
                                            aliasText: (product.aliases ?? []).join(", "),
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
                                            <Input id={`edit-supplier-${product.id}`} name="supplier" defaultValue={product.supplier} className={controlClass} />
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
                                            <Button type="submit" className="h-10 px-4">
                                                更新產品
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                                <form action={deleteProductAction} className="mt-2">
                                    <input type="hidden" name="tab" value="inventory" />
                                    <input type="hidden" name="inventoryView" value="settings" />
                                    <input type="hidden" name="redirectPath" value="/dashboard/products" />
                                    <input type="hidden" name="productId" value={product.id} />
                                    <Button type="submit" variant="ghost" className="h-10 px-4">
                                        刪除產品
                                    </Button>
                                </form>
                            </div>
                        </details>
                    ))}
                </div>
            )}
        </MerchantSectionCard>
    );

    return (
        <MerchantListShell
            className="space-y-2.5"
            toolbar={
                <div className="space-y-2.5">
                    {toolbar}
                    {createForm}
                    {filters}
                </div>
            }
            list={list}
        />
    );
}
