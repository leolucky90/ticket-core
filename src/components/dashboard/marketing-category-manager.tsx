"use client";

import { type FormEvent, useMemo, useState } from "react";
import { ChevronRight, Plus, Save, Search, Trash2 } from "lucide-react";
import { useUiLanguage } from "@/components/layout/ui-language-provider";
import { EmptyStateCard } from "@/components/merchant/shell";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getUiText } from "@/lib/i18n/ui-text";
import type { DimensionOption } from "@/lib/types/catalog";
import type { MarketingSectionId } from "@/components/dashboard/marketing-settings-workspace";

export type MarketingCategoryManagerProps = {
    marketingSection: MarketingSectionId;
    categories: DimensionOption[];
    createCategoryAction: (formData: FormData) => Promise<void>;
    updateCategoryAction: (formData: FormData) => Promise<void>;
    deleteCategoryAction: (formData: FormData) => Promise<void>;
    onDeleteGuard: (event: FormEvent<HTMLFormElement>) => void;
};

function sortCategories(list: DimensionOption[]) {
    return [...list].sort(
        (a, b) =>
            Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0) ||
            (a.fullPath ?? a.name).localeCompare(b.fullPath ?? b.name, "zh-Hant"),
    );
}

function matchesCategory(item: DimensionOption, keyword: string) {
    const q = keyword.trim().toLowerCase();
    if (!q) return true;
    return [item.name, item.fullPath ?? "", item.parentCategoryName ?? ""].some((value) => value.toLowerCase().includes(q));
}

function categoryKindLabel(item: DimensionOption, t: ReturnType<typeof getUiText>["marketingCategory"]) {
    const level = item.categoryLevel ?? 1;
    if (level <= 1) return t.kindPrimary;
    if (level === 2) return t.kindSecondary;
    return t.kindTertiary;
}

export function MarketingCategoryManager({
    marketingSection,
    categories,
    createCategoryAction,
    updateCategoryAction,
    deleteCategoryAction,
    onDeleteGuard,
}: MarketingCategoryManagerProps) {
    const lang = useUiLanguage();
    const t = getUiText(lang).marketingCategory;
    const [searchDraft, setSearchDraft] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
    const [createParentId, setCreateParentId] = useState("");

    const categoryById = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);

    const childrenByParent = useMemo(() => {
        const map = new Map<string, DimensionOption[]>();
        for (const category of categories) {
            const parentId = (category.parentCategoryId ?? "").trim();
            if (!parentId) continue;
            const list = map.get(parentId) ?? [];
            list.push(category);
            map.set(parentId, list);
        }
        for (const [key, list] of map.entries()) {
            map.set(key, sortCategories(list));
        }
        return map;
    }, [categories]);

    const rootCategories = useMemo(
        () => sortCategories(categories.filter((item) => (item.categoryLevel ?? 1) === 1)),
        [categories],
    );

    const selectableParents = useMemo(
        () => sortCategories(categories.filter((item) => (item.categoryLevel ?? 1) < 3)),
        [categories],
    );

    const searchKeyword = searchTerm.trim().toLowerCase();

    function hasVisibleNode(category: DimensionOption): boolean {
        if (matchesCategory(category, searchKeyword)) return true;
        const children = childrenByParent.get(category.id) ?? [];
        return children.some((child) => hasVisibleNode(child));
    }

    function collectDescendantIds(categoryId: string) {
        const seen = new Set<string>();
        const queue = [categoryId];
        while (queue.length > 0) {
            const currentId = queue.shift();
            if (!currentId) continue;
            const children = childrenByParent.get(currentId) ?? [];
            for (const child of children) {
                if (seen.has(child.id)) continue;
                seen.add(child.id);
                queue.push(child.id);
            }
        }
        return seen;
    }

    function expandAncestorChain(category: DimensionOption | undefined) {
        if (!category) return;
        const nextExpanded: Record<string, boolean> = {};
        let parentId = category.parentCategoryId ?? "";
        while (parentId) {
            nextExpanded[parentId] = true;
            parentId = categoryById.get(parentId)?.parentCategoryId ?? "";
        }
        if (Object.keys(nextExpanded).length === 0) return;
        setExpandedIds((prev) => ({ ...prev, ...nextExpanded }));
    }

    function selectCategory(id: string | null) {
        setSelectedCategoryId(id);
        if (!id) {
            setCreateParentId("");
            return;
        }
        const category = categoryById.get(id);
        if (!category) return;
        expandAncestorChain(category);
        if ((category.categoryLevel ?? 1) >= 3) {
            setCreateParentId(category.parentCategoryId ?? "");
            return;
        }
        setCreateParentId(category.id);
    }

    const selectedCategory = selectedCategoryId ? categoryById.get(selectedCategoryId) : undefined;
    const updateFormId = "marketing-category-update-form";
    const datalistId = "marketing-category-manager-options";

    function renderCategoryNode(category: DimensionOption, depth = 1) {
        const children = childrenByParent.get(category.id) ?? [];
        const visibleChildren = children.filter((child) => hasVisibleNode(child));
        const totalChildren = children.length;
        const isOpen = searchKeyword ? true : Boolean(expandedIds[category.id]);
        const childPaddingClass = depth === 1 ? "pl-4" : depth === 2 ? "pl-8" : "pl-12";
        return (
            <div key={category.id} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))]">
                <div className="flex min-w-0 items-stretch gap-0">
                    <button
                        type="button"
                        title={isOpen ? t.collapseSubcategories : t.expandSubcategories}
                        className="group relative flex w-9 shrink-0 items-center justify-center border-r border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel2))]"
                        aria-expanded={isOpen}
                        aria-label={isOpen ? t.collapseSubcategories : t.expandSubcategories}
                        onClick={() =>
                            setExpandedIds((prev) => ({
                                ...prev,
                                [category.id]: !prev[category.id],
                            }))
                        }
                        disabled={totalChildren === 0}
                    >
                        <ChevronRight className={`h-4 w-4 transition ${isOpen ? "rotate-90" : ""} ${totalChildren === 0 ? "opacity-30" : ""}`} aria-hidden="true" />
                        <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                            {isOpen ? t.collapseSubcategories : t.expandSubcategories}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => selectCategory(category.id)}
                        className={`min-w-0 flex-1 px-2 py-2 text-left text-sm transition ${
                            selectedCategoryId === category.id
                                ? "bg-[rgb(var(--accent))]/15 font-semibold text-[rgb(var(--text))]"
                                : "hover:bg-[rgb(var(--panel2))]"
                        }`}
                    >
                        <div className="truncate">{category.name}</div>
                        <div className="text-[11px] text-[rgb(var(--muted))]">
                            {categoryKindLabel(category, t)}
                            {totalChildren > 0 ? t.secondaryCount.replace("{count}", String(totalChildren)) : ""}
                        </div>
                    </button>
                </div>
                {isOpen && visibleChildren.length > 0 ? (
                    <div className={`border-t border-[rgb(var(--border))] py-1 ${childPaddingClass}`}>
                        {visibleChildren.map((child) => (
                            <div key={`child-wrap-${child.id}`} className="py-0.5">
                                {renderCategoryNode(child, depth + 1)}
                            </div>
                        ))}
                    </div>
                ) : null}
                {isOpen && totalChildren === 0 ? (
                    <div className="border-t border-[rgb(var(--border))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
                        {t.emptySecondaryHint}
                    </div>
                ) : null}
            </div>
        );
    }

    const visibleRootCategories = rootCategories.filter((category) => hasVisibleNode(category));

    const selectedDescendants = selectedCategoryId ? collectDescendantIds(selectedCategoryId) : new Set<string>();

    const updateParentOptions = !selectedCategory
        ? selectableParents
        : selectableParents.filter((category) => category.id !== selectedCategory.id && !selectedDescendants.has(category.id));

    return (
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <datalist id={datalistId}>
                {categories.map((item) => (
                    <option key={`mcm-${item.id}`} value={item.name} />
                ))}
            </datalist>

            <div className="min-w-0 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                <div className="mb-2 text-xs font-medium text-[rgb(var(--muted))]">
                    {t.listHeader.replace("{count}", String(categories.length))}
                </div>
                <div className="mb-2 flex flex-wrap gap-2">
                    <Input
                        value={searchDraft}
                        onChange={(event) => setSearchDraft(event.target.value)}
                        placeholder={t.searchPlaceholder}
                        className="min-w-0 flex-1"
                        list={datalistId}
                    />
                    <Button type="button" variant="ghost" className="shrink-0 px-3" onClick={() => setSearchTerm(searchDraft.trim())}>
                        <Search className="mr-1 h-4 w-4" aria-hidden="true" />
                        {t.search}
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
                        {t.clearSearch}
                    </button>
                ) : null}

                <div className="max-h-[min(520px,70vh)] min-w-0 overflow-x-hidden overflow-y-auto pr-1">
                    {visibleRootCategories.length === 0 ? (
                        <EmptyStateCard
                            icon={Search}
                            title={t.noResultsTitle}
                            description={t.noResultsDescription}
                            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))]"
                        />
                    ) : (
                        <div className="grid gap-1">
                            {visibleRootCategories.map((category) => renderCategoryNode(category))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid min-w-0 gap-4 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3 sm:p-4">
                <div>
                    <div className="text-sm font-semibold text-[rgb(var(--text))]">{t.createTitle}</div>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">{t.createHint}</p>
                    <form action={createCategoryAction} className="mt-3 grid gap-3">
                        <input type="hidden" name="tab" value="marketing" />
                        <input type="hidden" name="marketingSection" value={marketingSection} />
                        <FormField label={t.parentField} htmlFor="marketing-cat-create-parent">
                            <Select
                                id="marketing-cat-create-parent"
                                name="parentCategoryId"
                                value={createParentId}
                                onChange={(event) => setCreateParentId(event.currentTarget.value)}
                                className="h-10 w-full"
                            >
                                <option value="">{t.parentRoot}</option>
                                {selectableParents.map((category) => (
                                    <option key={`create-under-${category.id}`} value={category.id}>
                                        {t.parentUnder.replace("{name}", category.fullPath ?? category.name)}
                                    </option>
                                ))}
                            </Select>
                        </FormField>
                        <FormField label={t.newNameField} htmlFor="marketing-cat-create-name" required>
                            <Input
                                id="marketing-cat-create-name"
                                name="categoryName"
                                list={datalistId}
                                placeholder={t.newNamePlaceholder}
                                required
                                className="h-10 w-full"
                            />
                        </FormField>
                        <div className="flex justify-end">
                            <Button type="submit" variant="solid" className="gap-2">
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                {t.createSubmit}
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="border-t border-[rgb(var(--border))] pt-4">
                    <div className="text-sm font-semibold text-[rgb(var(--text))]">{t.selectedTitle}</div>
                    {!selectedCategory ? (
                        <p className="mt-2 text-sm text-[rgb(var(--muted))]">{t.selectPrompt}</p>
                    ) : (
                        <div className="mt-3 grid gap-3">
                            <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2 text-sm">
                                <div className="text-xs text-[rgb(var(--muted))]">{t.currentBadge}</div>
                                <div className="font-medium text-[rgb(var(--text))]">{selectedCategory.name}</div>
                                <div className="mt-1 text-xs text-[rgb(var(--muted))]">
                                    {categoryKindLabel(selectedCategory, t)}
                                    {selectedCategory.fullPath && selectedCategory.fullPath !== selectedCategory.name ? (
                                        <>
                                            {t.pathLabel}
                                            {selectedCategory.fullPath}
                                        </>
                                    ) : null}
                                    {selectedCategory.parentCategoryName &&
                                    !(selectedCategory.fullPath && selectedCategory.fullPath !== selectedCategory.name) ? (
                                        <>
                                            {t.parentPrimaryLabel}
                                            {selectedCategory.parentCategoryName}
                                        </>
                                    ) : null}
                                </div>
                            </div>

                            <form key={selectedCategory.id} id={updateFormId} action={updateCategoryAction} className="grid gap-3">
                                <input type="hidden" name="tab" value="marketing" />
                                <input type="hidden" name="marketingSection" value={marketingSection} />
                                <input type="hidden" name="categoryId" value={selectedCategory.id} />
                                <FormField label={t.nameField} htmlFor="marketing-cat-update-name" required>
                                    <Input
                                        id="marketing-cat-update-name"
                                        name="categoryName"
                                        defaultValue={selectedCategory.name}
                                        required
                                        className="h-10 w-full"
                                    />
                                </FormField>
                                <FormField label={t.parentAdjustField} htmlFor="marketing-cat-update-parent">
                                    <Select
                                        id="marketing-cat-update-parent"
                                        name="parentCategoryId"
                                        defaultValue={selectedCategory.parentCategoryId ?? ""}
                                        className="h-10 w-full"
                                    >
                                        <option value="">{t.parentAsPrimary}</option>
                                        {updateParentOptions.map((category) => (
                                            <option key={`upd-parent-${selectedCategory.id}-${category.id}`} value={category.id}>
                                                {category.fullPath ?? category.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormField>
                                <div className="flex flex-wrap justify-end gap-2">
                                    <Button form={updateFormId} type="submit" variant="solid" className="gap-2">
                                        <Save className="h-4 w-4" aria-hidden="true" />
                                        {t.saveChanges}
                                    </Button>
                                </div>
                            </form>

                            <form
                                action={deleteCategoryAction}
                                onSubmit={onDeleteGuard}
                                data-delete-target={t.deleteTarget.replace("{name}", selectedCategory.name)}
                            >
                                <input type="hidden" name="tab" value="marketing" />
                                <input type="hidden" name="marketingSection" value={marketingSection} />
                                <input type="hidden" name="categoryId" value={selectedCategory.id} />
                                <Button type="submit" variant="ghost" className="gap-2 border border-[rgb(var(--border))]">
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    {t.removeCategory}
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
