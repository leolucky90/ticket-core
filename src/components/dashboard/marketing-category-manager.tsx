"use client";

import { type FormEvent, useCallback, useMemo, useState } from "react";
import { ChevronRight, Plus, Save, Search, Trash2 } from "lucide-react";
import { EmptyStateCard } from "@/components/merchant/shell";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { DimensionOption } from "@/lib/types/catalog";

export type MarketingCategoryManagerProps = {
    categories: DimensionOption[];
    createCategoryAction: (formData: FormData) => Promise<void>;
    updateCategoryAction: (formData: FormData) => Promise<void>;
    deleteCategoryAction: (formData: FormData) => Promise<void>;
    onDeleteGuard: (event: FormEvent<HTMLFormElement>) => void;
};

export function MarketingCategoryManager({
    categories,
    createCategoryAction,
    updateCategoryAction,
    deleteCategoryAction,
    onDeleteGuard,
}: MarketingCategoryManagerProps) {
    const [searchDraft, setSearchDraft] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [expandedMainIds, setExpandedMainIds] = useState<Record<string, boolean>>({});
    const [createParentId, setCreateParentId] = useState("");

    const childrenByParent = useMemo(() => {
        const map = new Map<string, DimensionOption[]>();
        for (const c of categories) {
            if ((c.categoryLevel ?? 1) !== 2 || !c.parentCategoryId) continue;
            const list = map.get(c.parentCategoryId) ?? [];
            list.push(c);
            map.set(c.parentCategoryId, list);
        }
        for (const list of map.values()) {
            list.sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
        }
        return map;
    }, [categories]);

    const mainCategories = useMemo(() => {
        return categories
            .filter((c) => (c.categoryLevel ?? 1) === 1)
            .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
    }, [categories]);

    const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

    const selectCategory = useCallback(
        (id: string | null) => {
            setSelectedCategoryId(id);
            if (!id) {
                setCreateParentId("");
                return;
            }
            const cat = categoryById.get(id);
            if (!cat) return;
            if ((cat.categoryLevel ?? 1) === 1) {
                setCreateParentId(id);
            } else {
                setCreateParentId(cat.parentCategoryId ?? "");
                if (cat.categoryLevel === 2 && cat.parentCategoryId) {
                    setExpandedMainIds((prev) => ({ ...prev, [cat.parentCategoryId!]: true }));
                }
            }
        },
        [categoryById],
    );

    const visibleMains = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return mainCategories;
        return mainCategories.filter((main) => {
            const kids = childrenByParent.get(main.id) ?? [];
            if (main.name.toLowerCase().includes(q)) return true;
            return kids.some(
                (k) =>
                    k.name.toLowerCase().includes(q) ||
                    (k.fullPath ?? "").toLowerCase().includes(q) ||
                    (k.parentCategoryName ?? "").toLowerCase().includes(q),
            );
        });
    }, [mainCategories, childrenByParent, searchTerm]);

    const getVisibleChildren = (mainId: string): DimensionOption[] => {
        const kids = childrenByParent.get(mainId) ?? [];
        const q = searchTerm.trim().toLowerCase();
        if (!q) return kids;
        return kids.filter(
            (k) =>
                k.name.toLowerCase().includes(q) ||
                (k.fullPath ?? "").toLowerCase().includes(q) ||
                (categoryById.get(mainId)?.name ?? "").toLowerCase().includes(q),
        );
    };

    const selectedCategory = selectedCategoryId ? categoryById.get(selectedCategoryId) : undefined;

    const updateFormId = "marketing-category-update-form";
    const datalistId = "marketing-category-manager-options";

    return (
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <datalist id={datalistId}>
                {categories.map((item) => (
                    <option key={`mcm-${item.id}`} value={item.name} />
                ))}
            </datalist>

            <div className="min-w-0 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                <div className="mb-2 text-xs font-medium text-[rgb(var(--muted))]">
                    分類清單（{categories.length}）· 點主分類列可展開第二分類
                </div>
                <div className="mb-2 flex flex-wrap gap-2">
                    <Input
                        value={searchDraft}
                        onChange={(e) => setSearchDraft(e.target.value)}
                        placeholder="搜尋分類名稱或路徑"
                        className="min-w-0 flex-1"
                        list={datalistId}
                    />
                    <Button type="button" variant="ghost" className="shrink-0 px-3" onClick={() => setSearchTerm(searchDraft.trim())}>
                        <Search className="mr-1 h-4 w-4" aria-hidden="true" />
                        搜尋
                    </Button>
                </div>
                {searchTerm ? (
                    <button
                        type="button"
                        className="mb-2 text-xs text-[rgb(var(--accent))] underline"
                        onClick={() => {
                            setSearchDraft("");
                            setSearchTerm("");
                        }}
                    >
                        清除搜尋
                    </button>
                ) : null}

                <div className="max-h-[min(520px,70vh)] min-w-0 overflow-x-hidden overflow-y-auto pr-1">
                    {visibleMains.length === 0 ? (
                        <EmptyStateCard
                            icon={Search}
                            title="找不到符合條件的分類"
                            description="可清除搜尋或建立新分類。"
                            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))]"
                        />
                    ) : (
                        <div className="grid gap-1">
                            {visibleMains.map((main) => {
                                const open = Boolean(expandedMainIds[main.id]);
                                const childList = getVisibleChildren(main.id);
                                const subCount = (childrenByParent.get(main.id) ?? []).length;
                                return (
                                    <div key={main.id} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))]">
                                        <div className="flex min-w-0 items-stretch gap-0">
                                            <button
                                                type="button"
                                                className="flex w-9 shrink-0 items-center justify-center border-r border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel2))]"
                                                aria-expanded={open}
                                                aria-label={open ? "收合子分類" : "展開子分類"}
                                                onClick={() =>
                                                    setExpandedMainIds((prev) => ({
                                                        ...prev,
                                                        [main.id]: !prev[main.id],
                                                    }))
                                                }
                                            >
                                                <ChevronRight
                                                    className={`h-4 w-4 transition ${open ? "rotate-90" : ""}`}
                                                    aria-hidden="true"
                                                />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => selectCategory(main.id)}
                                                className={`min-w-0 flex-1 px-2 py-2 text-left text-sm transition ${
                                                    selectedCategoryId === main.id
                                                        ? "bg-[rgb(var(--accent))]/15 font-semibold text-[rgb(var(--text))]"
                                                        : "hover:bg-[rgb(var(--panel2))]"
                                                }`}
                                            >
                                                <div className="truncate">{main.name}</div>
                                                <div className="text-[11px] text-[rgb(var(--muted))]">
                                                    主分類
                                                    {subCount > 0 ? ` · ${subCount} 個第二分類` : ""}
                                                </div>
                                            </button>
                                        </div>
                                        {open && childList.length > 0 ? (
                                            <div className="border-t border-[rgb(var(--border))] py-1 pl-4">
                                                {childList.map((sub) => (
                                                    <button
                                                        key={sub.id}
                                                        type="button"
                                                        onClick={() => selectCategory(sub.id)}
                                                        className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
                                                            selectedCategoryId === sub.id
                                                                ? "bg-[rgb(var(--accent))]/15 font-medium text-[rgb(var(--text))]"
                                                                : "text-[rgb(var(--text))] hover:bg-[rgb(var(--panel2))]"
                                                        }`}
                                                    >
                                                        <div className="truncate">{sub.name}</div>
                                                        <div className="break-words text-[11px] leading-snug text-[rgb(var(--muted))]">
                                                            第二分類 · 上層：{main.name}
                                                            {sub.fullPath && sub.fullPath !== sub.name ? ` · ${sub.fullPath}` : ""}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}
                                        {open && subCount === 0 ? (
                                            <div className="border-t border-[rgb(var(--border))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
                                                尚未建立第二分類；選取此主分類後，可在右側於其下新增。
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid min-w-0 gap-4 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3 sm:p-4">
                <div>
                    <div className="text-sm font-semibold text-[rgb(var(--text))]">新增分類</div>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        「上層主分類」留空表示建立主分類；選擇某主分類表示在其下新增第二分類。點左側列可快速帶入上層。
                    </p>
                    <form action={createCategoryAction} className="mt-3 grid gap-3">
                        <input type="hidden" name="tab" value="marketing" />
                        <FormField label="上層主分類（可選）" htmlFor="marketing-cat-create-parent">
                            <Select
                                id="marketing-cat-create-parent"
                                name="parentCategoryId"
                                value={createParentId}
                                onChange={(e) => setCreateParentId(e.currentTarget.value)}
                                className="h-10 w-full"
                            >
                                <option value="">建立為主分類（最上層）</option>
                                {mainCategories.map((c) => (
                                    <option key={`create-under-${c.id}`} value={c.id}>
                                        在「{c.name}」底下新增第二分類
                                    </option>
                                ))}
                            </Select>
                        </FormField>
                        <FormField label="新分類名稱" htmlFor="marketing-cat-create-name" required>
                            <Input
                                id="marketing-cat-create-name"
                                name="categoryName"
                                list={datalistId}
                                placeholder="例如：手機零件、LCD 螢幕"
                                required
                                className="h-10 w-full"
                            />
                        </FormField>
                        <div className="flex justify-end">
                            <Button type="submit" variant="solid" className="gap-2">
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                新增分類
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="border-t border-[rgb(var(--border))] pt-4">
                    <div className="text-sm font-semibold text-[rgb(var(--text))]">選取項目的內容</div>
                    {!selectedCategory ? (
                        <p className="mt-2 text-sm text-[rgb(var(--muted))]">請從左側點選一筆主分類或第二分類，以檢視路徑並進行更新或刪除。</p>
                    ) : (
                        <div className="mt-3 grid gap-3">
                            <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2 text-sm">
                                <div className="text-xs text-[rgb(var(--muted))]">目前選取</div>
                                <div className="font-medium text-[rgb(var(--text))]">{selectedCategory.name}</div>
                                <div className="mt-1 text-xs text-[rgb(var(--muted))]">
                                    {(selectedCategory.categoryLevel ?? 1) === 1 ? "主分類" : "第二分類"}
                                    {selectedCategory.fullPath && selectedCategory.fullPath !== selectedCategory.name ? (
                                        <> · 路徑：{selectedCategory.fullPath}</>
                                    ) : null}
                                    {(selectedCategory.categoryLevel ?? 1) === 2 && selectedCategory.parentCategoryName ? (
                                        <> · 上層主分類：{selectedCategory.parentCategoryName}</>
                                    ) : null}
                                </div>
                            </div>

                            <form key={selectedCategory.id} id={updateFormId} action={updateCategoryAction} className="grid gap-3">
                                <input type="hidden" name="tab" value="marketing" />
                                <input type="hidden" name="categoryId" value={selectedCategory.id} />
                                <FormField label="分類名稱" htmlFor="marketing-cat-update-name" required>
                                    <Input
                                        id="marketing-cat-update-name"
                                        name="categoryName"
                                        defaultValue={selectedCategory.name}
                                        required
                                        className="h-10 w-full"
                                    />
                                </FormField>
                                <FormField label="上層主分類（可調整）" htmlFor="marketing-cat-update-parent">
                                    <Select
                                        id="marketing-cat-update-parent"
                                        name="parentCategoryId"
                                        defaultValue={selectedCategory.parentCategoryId ?? ""}
                                        className="h-10 w-full"
                                    >
                                        <option value="">作為主分類（最上層）</option>
                                        {mainCategories
                                            .filter((c) => c.id !== selectedCategory.id)
                                            .map((c) => (
                                                <option key={`upd-parent-${selectedCategory.id}-${c.id}`} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                    </Select>
                                </FormField>
                                <div className="flex flex-wrap justify-end gap-2">
                                    <Button form={updateFormId} type="submit" variant="solid" className="gap-2">
                                        <Save className="h-4 w-4" aria-hidden="true" />
                                        儲存變更
                                    </Button>
                                </div>
                            </form>

                            <form action={deleteCategoryAction} onSubmit={onDeleteGuard} data-delete-target={`分類 ${selectedCategory.name}`}>
                                <input type="hidden" name="tab" value="marketing" />
                                <input type="hidden" name="categoryId" value={selectedCategory.id} />
                                <Button type="submit" variant="ghost" className="gap-2 border border-[rgb(var(--border))]">
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    移除此分類
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
