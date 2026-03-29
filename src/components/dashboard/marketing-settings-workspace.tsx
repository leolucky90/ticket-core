"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import { ItemQuickNamingSettingsCard } from "@/components/dashboard/ItemQuickNamingSettingsCard";
import { MarketingBrandEditor } from "@/components/dashboard/marketing-brand-editor";
import { MarketingCategoryManager } from "@/components/dashboard/marketing-category-manager";
import { MerchantBuilderShell, EmptyStateCard, MerchantSectionCard } from "@/components/merchant/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { UsedProductTypeSettingsCard } from "@/components/used-products";
import type { ItemNamingSettings } from "@/lib/schema/itemNamingSettings";
import { buildBrandTypeSuggestionPool } from "@/lib/marketing/brand-catalog-helpers";
import { LIST_DISPLAY_OPTIONS } from "@/lib/ui/list-display";
import type { DimensionPickerBundle } from "@/lib/types/catalog";
import type { RepairBrand } from "@/lib/types/repair-brand";
import type { UsedProductTypeSetting } from "@/lib/schema";

export type MarketingSectionId = "supplier" | "category" | "brand" | "used";

type MarketingLookupRow = {
    id: string;
    name: string;
    description?: string;
};

export type MarketingSettingsWorkspaceProps = {
    lang: "zh" | "en";
    dimensionBundle: DimensionPickerBundle;
    itemNamingSettings: ItemNamingSettings;
    supplierItems: { id: string; name: string; status?: string }[];
    brands: RepairBrand[];
    usedProductTypeSettings: UsedProductTypeSetting[];
    updateItemNamingSettingsAction: (formData: FormData) => Promise<void>;
    createCategoryAction: (formData: FormData) => Promise<void>;
    updateCategoryAction: (formData: FormData) => Promise<void>;
    deleteCategoryAction: (formData: FormData) => Promise<void>;
    createSupplierAction: (formData: FormData) => Promise<void>;
    updateSupplierAction: (formData: FormData) => Promise<void>;
    deleteSupplierAction: (formData: FormData) => Promise<void>;
    createBrandAction: (formData: FormData) => Promise<void>;
    updateBrandAction: (formData: FormData) => Promise<void>;
    deleteBrandAction: (formData: FormData) => Promise<void>;
    renameBrandTypeAction: (formData: FormData) => Promise<void>;
    deleteBrandTypeAction: (formData: FormData) => Promise<void>;
    createModelAction: (formData: FormData) => Promise<void>;
    updateModelAction: (formData: FormData) => Promise<void>;
    deleteModelAction: (formData: FormData) => Promise<void>;
    updateUsedProductTypeSettingAction: (formData: FormData) => Promise<void>;
    onDeleteGuard: (event: FormEvent<HTMLFormElement>) => void;
};

function limitRows<T>(rows: T[], size: string): T[] {
    if (size === "all") return rows;
    const limit = Number(size);
    if (!Number.isFinite(limit) || limit <= 0) return rows;
    return rows.slice(0, limit);
}

function IconOnlyButton({
    label,
    icon,
    form,
    type = "button",
    variant = "ghost",
    className,
    disabled,
    onClick,
}: {
    label: string;
    icon: React.ReactNode;
    form?: string;
    type?: "button" | "submit" | "reset";
    variant?: "solid" | "ghost";
    className?: string;
    disabled?: boolean;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
    return (
        <Button
            form={form}
            type={type}
            variant={variant}
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
            className={`group relative h-10 w-10 !p-0 ${className ?? ""}`.trim()}
        >
            {icon}
            <span className="sr-only">{label}</span>
        </Button>
    );
}

const SECTION_TABS: Array<{ id: MarketingSectionId; label: string; hint: string }> = [
    { id: "category", label: "分類", hint: "品項分類與快速命名" },
    { id: "supplier", label: "供應來源", hint: "供應商名單" },
    { id: "brand", label: "品牌", hint: "品牌、類型與型號" },
    { id: "used", label: "二手商品", hint: "規格模板" },
];

export function MarketingSettingsWorkspace(props: MarketingSettingsWorkspaceProps) {
    const {
        lang,
        dimensionBundle,
        itemNamingSettings,
        supplierItems,
        brands,
        usedProductTypeSettings,
        updateItemNamingSettingsAction,
        createCategoryAction,
        updateCategoryAction,
        deleteCategoryAction,
        createSupplierAction,
        updateSupplierAction,
        deleteSupplierAction,
        createBrandAction,
        updateBrandAction,
        deleteBrandAction,
        renameBrandTypeAction,
        deleteBrandTypeAction,
        createModelAction,
        updateModelAction,
        deleteModelAction,
        updateUsedProductTypeSettingAction,
        onDeleteGuard,
    } = props;

    const [section, setSection] = useState<MarketingSectionId>("category");
    const [supplierSearchDraft, setSupplierSearchDraft] = useState("");
    const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
    const [marketingLookupListSize, setMarketingLookupListSize] = useState("5");
    const [brandListFilter, setBrandListFilter] = useState("");
    const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
    const [newBrandNameDraft, setNewBrandNameDraft] = useState("");
    const [marketingBrandListSize, setMarketingBrandListSize] = useState("5");
    const [brandModelTypeById, setBrandModelTypeById] = useState<Record<string, string>>({});
    const [brandTypeDraftById, setBrandTypeDraftById] = useState<Record<string, string>>({});

    const topLevelCategoryNames = useMemo(
        () => dimensionBundle.categories.filter((c) => (c.categoryLevel ?? 1) === 1).map((c) => c.name),
        [dimensionBundle.categories],
    );

    const brandTypeSuggestionPool = useMemo(() => buildBrandTypeSuggestionPool(brands, topLevelCategoryNames), [brands, topLevelCategoryNames]);

    const marketingSupplierRows = useMemo(() => {
        const q = supplierSearchTerm.trim().toLowerCase();
        const source: MarketingLookupRow[] = supplierItems.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.status,
        }));
        if (!q) return source;
        return source.filter((item) => item.name.toLowerCase().includes(q));
    }, [supplierItems, supplierSearchTerm]);

    const visibleMarketingSupplierRows = useMemo(
        () => limitRows(marketingSupplierRows, marketingLookupListSize),
        [marketingSupplierRows, marketingLookupListSize],
    );

    const filteredBrands = useMemo(() => {
        const q = brandListFilter.trim().toLowerCase();
        if (!q) return brands;
        return brands.filter((b) => b.name.toLowerCase().includes(q));
    }, [brands, brandListFilter]);

    const visibleBrandRows = useMemo(() => limitRows(filteredBrands, marketingBrandListSize), [filteredBrands, marketingBrandListSize]);

    const selectedSupplier = selectedSupplierId ? supplierItems.find((s) => s.id === selectedSupplierId) : undefined;
    const selectedBrand = selectedBrandId ? brands.find((b) => b.id === selectedBrandId) : undefined;

    const supplierListShell = (
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
            <div className="text-xs font-medium text-[rgb(var(--muted))]">供應商清單（{supplierItems.length}）</div>
            <div className="flex flex-wrap gap-2">
                <Input
                    value={supplierSearchDraft}
                    onChange={(e) => setSupplierSearchDraft(e.target.value)}
                    placeholder="搜尋供應商"
                    className="min-w-0 flex-1"
                    list="marketing-supplier-workspace-options"
                />
                <IconOnlyButton label="搜尋供應商" type="button" icon={<Search className="h-4 w-4" aria-hidden="true" />} onClick={() => setSupplierSearchTerm(supplierSearchDraft.trim())} />
            </div>
            {supplierSearchTerm ? (
                <button
                    type="button"
                    className="w-fit text-xs text-[rgb(var(--accent))] underline"
                    onClick={() => {
                        setSupplierSearchDraft("");
                        setSupplierSearchTerm("");
                    }}
                >
                    清除搜尋
                </button>
            ) : null}
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[rgb(var(--muted))]">清單顯示</span>
                <Select value={marketingLookupListSize} onChange={(e) => setMarketingLookupListSize(e.currentTarget.value)} className="h-9 w-[96px]">
                    {LIST_DISPLAY_OPTIONS.map((size) => (
                        <option key={`mkt-supp-size-${size}`} value={size}>
                            {size}
                        </option>
                    ))}
                </Select>
            </div>
            <div className="max-h-[min(520px,65vh)] min-w-0 overflow-y-auto pr-1">
                {visibleMarketingSupplierRows.length === 0 ? (
                    <EmptyStateCard
                        icon={Search}
                        title="找不到供應商"
                        description="可調整搜尋或新增供應商。"
                        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                    />
                ) : (
                    <div className="grid gap-1">
                        {visibleMarketingSupplierRows.map((row) => (
                            <button
                                key={row.id}
                                type="button"
                                onClick={() => setSelectedSupplierId(row.id)}
                                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                                    selectedSupplierId === row.id
                                        ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10 font-medium"
                                        : "border-[rgb(var(--border))] bg-[rgb(var(--panel2))] hover:bg-[rgb(var(--panel))]"
                                }`}
                            >
                                <div className="truncate">{row.name}</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const supplierEditorShell = (
        <div className="grid min-w-0 gap-4">
            <div>
                <div className="text-sm font-semibold text-[rgb(var(--text))]">新增供應商</div>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">建立後可在品項表單的供應商欄位選用。</p>
                <form action={createSupplierAction} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="tab" value="marketing" />
                    <label className="grid min-w-[200px] flex-1 gap-1">
                        <span className="text-xs text-[rgb(var(--muted))]">名稱</span>
                        <Input name="supplierName" placeholder="例如：Apple 授權經銷" required className="h-10" list="marketing-supplier-workspace-options" />
                    </label>
                    <Button type="submit" variant="solid" className="h-10 gap-2">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        新增
                    </Button>
                </form>
            </div>

            <div className="border-t border-[rgb(var(--border))] pt-4">
                <div className="text-sm font-semibold text-[rgb(var(--text))]">選取項目</div>
                {!selectedSupplier ? (
                    <p className="mt-2 text-sm text-[rgb(var(--muted))]">請從左側點選一筆供應商以更新或移除。</p>
                ) : (
                    <div className="mt-3 grid gap-3">
                        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">
                            <div className="text-xs text-[rgb(var(--muted))]">目前選取</div>
                            <div className="font-medium">{selectedSupplier.name}</div>
                        </div>
                        <form id="marketing-supplier-update-form" action={updateSupplierAction} className="grid gap-2">
                            <input type="hidden" name="tab" value="marketing" />
                            <input type="hidden" name="supplierId" value={selectedSupplier.id} />
                            <label className="grid gap-1">
                                <span className="text-xs text-[rgb(var(--muted))]">供應商名稱</span>
                                <Input name="supplierName" defaultValue={selectedSupplier.name} required className="h-10" />
                            </label>
                            <div className="flex justify-end">
                                <Button form="marketing-supplier-update-form" type="submit" variant="solid" className="gap-2">
                                    <Save className="h-4 w-4" aria-hidden="true" />
                                    儲存
                                </Button>
                            </div>
                        </form>
                        <form action={deleteSupplierAction} onSubmit={onDeleteGuard} data-delete-target={`供應商 ${selectedSupplier.name}`}>
                            <input type="hidden" name="tab" value="marketing" />
                            <input type="hidden" name="supplierId" value={selectedSupplier.id} />
                            <Button type="submit" variant="ghost" className="gap-2 border border-[rgb(var(--border))]">
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                                移除此供應商
                            </Button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );

    const brandListShell = (
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
            <div className="text-xs font-medium text-[rgb(var(--muted))]">品牌清單（{brands.length}）</div>
            <form action={createBrandAction} className="grid gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                <input type="hidden" name="tab" value="marketing" />
                <div className="text-xs text-[rgb(var(--muted))]">快速新增</div>
                <div className="flex flex-wrap gap-2">
                    <Input name="brandName" value={newBrandNameDraft} onChange={(e) => setNewBrandNameDraft(e.target.value)} placeholder="品牌名稱" className="min-w-0 flex-1" />
                    <Button type="submit" variant="solid" disabled={newBrandNameDraft.trim().length === 0} className="shrink-0 gap-1">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        新增
                    </Button>
                </div>
            </form>
            <Input value={brandListFilter} onChange={(e) => setBrandListFilter(e.target.value)} placeholder="篩選品牌名稱" className="h-10" />
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[rgb(var(--muted))]">清單顯示</span>
                <Select value={marketingBrandListSize} onChange={(e) => setMarketingBrandListSize(e.currentTarget.value)} className="h-9 w-[96px]">
                    {LIST_DISPLAY_OPTIONS.map((size) => (
                        <option key={`mkt-brand-size-${size}`} value={size}>
                            {size}
                        </option>
                    ))}
                </Select>
            </div>
            <div className="max-h-[min(520px,65vh)] min-w-0 overflow-y-auto pr-1">
                {visibleBrandRows.length === 0 ? (
                    <EmptyStateCard
                        icon={Search}
                        title="沒有符合的品牌"
                        description="可清除篩選或新增品牌。"
                        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                    />
                ) : (
                    <div className="grid gap-1">
                        {visibleBrandRows.map((brand) => (
                            <button
                                key={brand.id}
                                type="button"
                                onClick={() => setSelectedBrandId(brand.id)}
                                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                                    selectedBrandId === brand.id
                                        ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10 font-medium"
                                        : "border-[rgb(var(--border))] bg-[rgb(var(--panel2))] hover:bg-[rgb(var(--panel))]"
                                }`}
                            >
                                <div className="truncate">{brand.name}</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const brandEditorShell =
        selectedBrand ? (
            <MarketingBrandEditor
                brand={selectedBrand}
                dimensionBundle={dimensionBundle}
                brandTypeSuggestionPool={brandTypeSuggestionPool}
                brandModelTypeById={brandModelTypeById}
                setBrandModelTypeById={setBrandModelTypeById}
                brandTypeDraftById={brandTypeDraftById}
                setBrandTypeDraftById={setBrandTypeDraftById}
                updateBrandAction={updateBrandAction}
                deleteBrandAction={deleteBrandAction}
                renameBrandTypeAction={renameBrandTypeAction}
                deleteBrandTypeAction={deleteBrandTypeAction}
                createModelAction={createModelAction}
                updateModelAction={updateModelAction}
                deleteModelAction={deleteModelAction}
                onDeleteGuard={onDeleteGuard}
            />
        ) : (
            <div className="rounded-xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-4 py-10 text-center text-sm text-[rgb(var(--muted))]">
                請從左側選擇品牌，以編輯類型、型號與店內分類關聯。
            </div>
        );

    const categoryPanel = (
        <MerchantSectionCard title="分類與命名" description="主分類／第二分類與品項自動命名規則">
            <ItemQuickNamingSettingsCard settings={itemNamingSettings} submitAction={updateItemNamingSettingsAction} />
            <div className="mt-4">
                <MarketingCategoryManager
                    categories={dimensionBundle.categories}
                    createCategoryAction={createCategoryAction}
                    updateCategoryAction={updateCategoryAction}
                    deleteCategoryAction={deleteCategoryAction}
                    onDeleteGuard={onDeleteGuard}
                />
            </div>
        </MerchantSectionCard>
    );

    return (
        <div className="space-y-4">
            <datalist id="marketing-supplier-workspace-options">
                {supplierItems.map((s) => (
                    <option key={`ws-supplier-${s.id}`} value={s.name} />
                ))}
            </datalist>

            <div className="flex flex-wrap gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-2">
                {SECTION_TABS.map((tab) => {
                    const active = section === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSection(tab.id)}
                            className={`flex min-w-[120px] flex-1 flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left text-sm transition sm:min-w-[140px] ${
                                active
                                    ? "bg-[rgb(var(--accent))] text-[rgb(var(--bg))] shadow-sm"
                                    : "text-[rgb(var(--text))] hover:bg-[rgb(var(--panel2))]"
                            }`}
                        >
                            <span className="font-semibold">{tab.label}</span>
                            <span className={`text-[11px] ${active ? "text-[rgb(var(--bg))]/80" : "text-[rgb(var(--muted))]"}`}>{tab.hint}</span>
                        </button>
                    );
                })}
            </div>

            {section === "supplier" ? (
                <MerchantBuilderShell sectionList={supplierListShell} editor={supplierEditorShell} />
            ) : null}

            {section === "category" ? <div className="min-w-0">{categoryPanel}</div> : null}

            {section === "brand" ? <MerchantBuilderShell sectionList={brandListShell} editor={brandEditorShell} /> : null}

            {section === "used" ? (
                <UsedProductTypeSettingsCard lang={lang} settings={usedProductTypeSettings} updateTypeAction={updateUsedProductTypeSettingAction} />
            ) : null}
        </div>
    );
}
