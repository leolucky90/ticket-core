"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus, Search, X } from "lucide-react";
import type { Product } from "@/lib/types/commerce";

type ProductManagementWorkspaceProps = {
    products: Product[];
    productKeyword: string;
    supplierOptions: string[];
    supplierFilter: string;
    minStock: string;
    maxStock: string;
    minPrice: string;
    maxPrice: string;
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

export function ProductManagementWorkspace({
    products,
    productKeyword,
    supplierOptions,
    supplierFilter,
    minStock,
    maxStock,
    minPrice,
    maxPrice,
    flash,
    actionTs,
    createProductAction,
    updateProductAction,
    deleteProductAction,
}: ProductManagementWorkspaceProps) {
    const [showCreateForm, setShowCreateForm] = useState(false);

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

    return (
        <div className="space-y-4">
            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">搜尋 / 新增</div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                    <form action="/dashboard/products" method="get" className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                        <input type="hidden" name="supplier" value={supplierFilter} />
                        <input type="hidden" name="minStock" value={minStock} />
                        <input type="hidden" name="maxStock" value={maxStock} />
                        <input type="hidden" name="minPrice" value={minPrice} />
                        <input type="hidden" name="maxPrice" value={maxPrice} />
                        <div className="relative w-full">
                            <Input
                                name="productQ"
                                defaultValue={productKeyword}
                                placeholder="查詢品名、SKU、供應商"
                                className="pr-10"
                            />
                            <Link
                                href="/dashboard/products"
                                aria-label="清除"
                                className="group absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel2))] hover:text-[rgb(var(--text))]"
                            >
                                <X className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        </div>
                        <Button
                            type="submit"
                            variant="ghost"
                            aria-label="查詢"
                            className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center"
                        >
                            <Search className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                        </Button>
                    </form>
                    <Button
                        type="button"
                        variant={showCreateForm ? "solid" : "ghost"}
                        aria-label="新增"
                        className="group relative h-10 w-10 shrink-0 !p-0 flex items-center justify-center"
                        onClick={() => setShowCreateForm((prev) => !prev)}
                    >
                        <Plus className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                    </Button>
                </div>

                {showCreateForm ? (
                    <form action={createProductAction} className="mt-3 grid gap-2 md:grid-cols-5">
                        <input type="hidden" name="tab" value="inventory" />
                        <input type="hidden" name="inventoryView" value="settings" />
                        <input type="hidden" name="redirectPath" value="/dashboard/products" />
                        <Input name="name" placeholder="品名" required />
                        <Input type="number" min={0} name="price" placeholder="售價" required />
                        <Input type="number" min={0} name="cost" placeholder="成本" required />
                        <Input name="supplier" placeholder="供應商" />
                        <Input name="sku" placeholder="SKU" />
                        <Input type="number" min={0} name="stock" placeholder="庫存" defaultValue={0} className="md:col-span-1" />
                        <Button type="submit" className="md:col-span-4">新增產品</Button>
                    </form>
                ) : null}
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">過濾欄位</div>
                <form action="/dashboard/products" method="get" className="grid gap-2 md:grid-cols-6">
                    <input type="hidden" name="productQ" value={productKeyword} />
                    <Select name="supplier" defaultValue={supplierFilter}>
                        <option value="">供應商（全部）</option>
                        {supplierOptions.map((supplier) => (
                            <option key={supplier} value={supplier}>
                                {supplier}
                            </option>
                        ))}
                    </Select>
                    <Input type="number" min={0} name="minStock" defaultValue={minStock} placeholder="最小庫存" />
                    <Input type="number" min={0} name="maxStock" defaultValue={maxStock} placeholder="最大庫存" />
                    <Input type="number" min={0} name="minPrice" defaultValue={minPrice} placeholder="最低售價" />
                    <Input type="number" min={0} name="maxPrice" defaultValue={maxPrice} placeholder="最高售價" />
                    <div className="md:col-span-6 flex flex-wrap gap-2">
                        <Button type="submit">套用篩選</Button>
                        <Link href="/dashboard/products">
                            <Button type="button" variant="ghost">清除篩選</Button>
                        </Link>
                    </div>
                </form>
            </Card>

            <Card className="rounded-xl p-3">
                <div className="mb-2 text-sm font-semibold">產品列表（{products.length}）</div>
                {products.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">目前沒有產品資料。</div>
                ) : (
                    <div className="grid gap-2">
                        {products.map((product) => (
                            <details key={product.id} className="rounded-lg border border-[rgb(var(--border))]">
                                <summary className="grid cursor-pointer list-none gap-1 px-3 py-2 text-sm sm:grid-cols-6 [&::-webkit-details-marker]:hidden">
                                    <span>{product.name}</span>
                                    <span>庫存 {product.stock}</span>
                                    <span>售價 {formatMoney(product.price)}</span>
                                    <span>成本 {formatMoney(product.cost)}</span>
                                    <span>{product.supplier || "-"}</span>
                                    <span>{product.sku || "-"}</span>
                                </summary>
                                <div className="border-t border-[rgb(var(--border))] p-3">
                                    <form action={updateProductAction} className="grid gap-2 md:grid-cols-5">
                                        <input type="hidden" name="tab" value="inventory" />
                                        <input type="hidden" name="inventoryView" value="settings" />
                                        <input type="hidden" name="redirectPath" value="/dashboard/products" />
                                        <input type="hidden" name="productId" value={product.id} />
                                        <Input name="name" defaultValue={product.name} required />
                                        <Input type="number" min={0} name="price" defaultValue={product.price} required />
                                        <Input type="number" min={0} name="cost" defaultValue={product.cost} required />
                                        <Input name="supplier" defaultValue={product.supplier} />
                                        <Input name="sku" defaultValue={product.sku} />
                                        <Input type="number" min={0} name="stock" defaultValue={product.stock} />
                                        <Button type="submit" className="md:col-span-3">更新產品</Button>
                                    </form>
                                    <form action={deleteProductAction} className="mt-2">
                                        <input type="hidden" name="tab" value="inventory" />
                                        <input type="hidden" name="inventoryView" value="settings" />
                                        <input type="hidden" name="redirectPath" value="/dashboard/products" />
                                        <input type="hidden" name="productId" value={product.id} />
                                        <Button type="submit" variant="ghost">刪除產品</Button>
                                    </form>
                                </div>
                            </details>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
