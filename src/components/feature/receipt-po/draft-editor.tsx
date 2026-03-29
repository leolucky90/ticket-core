"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DimensionPicker } from "@/components/feature/product/dimension-picker";
import type { PoDraft } from "@/lib/schema/ai/po-draft";
import type { PoDraftProductSearchHit } from "@/lib/schema/poDraftProduct";
import type { DimensionPickerBundle } from "@/lib/types/catalog";

export function emptyDimensionBundle(): DimensionPickerBundle {
    return { categories: [], brands: [], models: [] };
}

type Lang = "zh" | "en";

const copy = {
    zh: {
        dims: "目錄篩選（主分類／第二分類／品牌／型號）",
        nameEntryHint: "品項關鍵字（對應 name entry，可選）",
        searchProduct: "搜尋商品",
        pickOrCustom: "選擇商品或手改說明",
        linked: "已連結商品",
        unlink: "改為自訂",
        customLine: "自訂品項",
        qty: "數量",
        unit: "單價",
        amt: "金額",
        addLine: "新增列",
        remove: "刪除",
    },
    en: {
        dims: "Catalog filter (category / secondary / brand / model)",
        nameEntryHint: "Name-entry keyword (optional)",
        searchProduct: "Search products",
        pickOrCustom: "Pick a product or edit description",
        linked: "Linked product",
        unlink: "Switch to custom",
        customLine: "Custom line",
        qty: "Qty",
        unit: "Unit price",
        amt: "Amount",
        addLine: "Add line",
        remove: "Remove",
    },
} as const;

function parseRef(raw: string | undefined): { id: string } {
    const value = (raw ?? "").trim();
    if (!value) return { id: "" };
    const [id] = value.split("::");
    return { id: (id ?? "").trim() };
}

function computeAmount(qty: number | null, unit: number | null): number | null {
    if (qty === null || unit === null || !Number.isFinite(qty) || !Number.isFinite(unit)) return null;
    return Math.round(qty * unit * 100) / 100;
}

type DimensionFilterValue = {
    categoryRef?: string;
    secondaryCategoryRef?: string;
    brandRef?: string;
    modelRef?: string;
};

export type PoDraftLineItemsEditorProps = {
    lang: Lang;
    dimensionBundle: DimensionPickerBundle;
    items: PoDraft["items"];
    onItemsChange: (items: PoDraft["items"]) => void;
};

export function PoDraftLineItemsEditor({ lang, dimensionBundle, items, onItemsChange }: PoDraftLineItemsEditorProps) {
    const t = copy[lang];
    const [dimValue, setDimValue] = useState<DimensionFilterValue>({});
    const [nameEntryHint, setNameEntryHint] = useState("");

    const categoryId = useMemo(() => parseRef(dimValue.categoryRef).id, [dimValue.categoryRef]);
    const brandId = useMemo(() => parseRef(dimValue.brandRef).id, [dimValue.brandRef]);
    const modelId = useMemo(() => parseRef(dimValue.modelRef).id, [dimValue.modelRef]);

    const setItem = useCallback(
        (index: number, patch: Partial<PoDraft["items"][number]>) => {
            const next = items.map((row, i) => (i === index ? { ...row, ...patch } : row));
            onItemsChange(next);
        },
        [items, onItemsChange],
    );

    const addLine = useCallback(() => {
        onItemsChange([
            ...items,
            {
                description: "",
                qty: null,
                unitPrice: null,
                amount: null,
                productId: null,
                sku: null,
                nameEntryHint: null,
            },
        ]);
    }, [items, onItemsChange]);

    const removeLine = useCallback(
        (index: number) => {
            if (items.length <= 1) return;
            onItemsChange(items.filter((_, i) => i !== index));
        },
        [items, onItemsChange],
    );

    return (
        <div className="space-y-4">
            <div className="space-y-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                <p className="text-xs font-medium text-[rgb(var(--muted))]">{t.dims}</p>
                <DimensionPicker bundle={dimensionBundle} value={dimValue} onChange={(v) => setDimValue(v)} />
                <label className="block text-xs font-medium text-[rgb(var(--muted))]">
                    {t.nameEntryHint}
                    <input
                        value={nameEntryHint}
                        onChange={(e) => setNameEntryHint(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                    />
                </label>
            </div>

            <p className="text-xs font-medium text-[rgb(var(--muted))]">{t.pickOrCustom}</p>

            <div className="space-y-3">
                {items.map((row, index) => (
                    <PoDraftLineRow
                        key={`line-${index}`}
                        lang={lang}
                        row={row}
                        index={index}
                        filter={{ categoryId, brandId, modelId }}
                        nameEntryHint={nameEntryHint}
                        onSetItem={setItem}
                        onRemove={() => removeLine(index)}
                        canRemove={items.length > 1}
                    />
                ))}
            </div>

            <button
                type="button"
                onClick={addLine}
                className="text-sm font-medium text-[rgb(var(--accent))]"
            >
                + {t.addLine}
            </button>
        </div>
    );
}

type RowProps = {
    lang: Lang;
    row: PoDraft["items"][number];
    index: number;
    filter: { categoryId: string; brandId: string; modelId: string };
    nameEntryHint: string;
    onSetItem: (index: number, patch: Partial<PoDraft["items"][number]>) => void;
    onRemove: () => void;
    canRemove: boolean;
};

function PoDraftLineRow({ lang, row, index, filter, nameEntryHint, onSetItem, onRemove, canRemove }: RowProps) {
    const t = copy[lang];
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [hits, setHits] = useState<PoDraftProductSearchHit[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const q = query.trim();
        if (q.length < 1) {
            const clearTimer = window.setTimeout(() => {
                setHits([]);
            }, 0);
            return () => window.clearTimeout(clearTimer);
        }
        const timer = window.setTimeout(() => {
            setLoading(true);
            const params = new URLSearchParams();
            params.set("q", q);
            params.set("limit", "12");
            if (filter.categoryId) params.set("categoryId", filter.categoryId);
            if (filter.brandId) params.set("brandId", filter.brandId);
            if (filter.modelId) params.set("modelId", filter.modelId);
            if (nameEntryHint.trim()) params.set("nameEntryHint", nameEntryHint.trim());

            void fetch(`/api/products/search?${params.toString()}`)
                .then((res) => res.json() as Promise<{ ok?: boolean; products?: PoDraftProductSearchHit[] }>)
                .then((data) => {
                    setHits(data.products ?? []);
                })
                .catch(() => setHits([]))
                .finally(() => setLoading(false));
        }, 280);
        return () => window.clearTimeout(timer);
    }, [query, filter.categoryId, filter.brandId, filter.modelId, nameEntryHint]);

    const applyProduct = (p: PoDraftProductSearchHit) => {
        const qty = row.qty !== null && row.qty !== undefined ? row.qty : 1;
        const unitPrice = p.sellPrice;
        const amount = computeAmount(qty, unitPrice);
        onSetItem(index, {
            description: p.name,
            productId: p.id,
            sku: p.sku,
            unitPrice,
            amount,
            qty,
        });
        setQuery("");
        setOpen(false);
        setHits([]);
    };

    const clearProduct = () => {
        onSetItem(index, {
            productId: null,
            sku: null,
        });
    };

    const numOrNull = (raw: string): number | null => {
        const n = Number(raw);
        return raw.trim() === "" || !Number.isFinite(n) ? null : n;
    };

    const onQtyChange = (raw: string) => {
        const qty = numOrNull(raw);
        const unit = row.unitPrice;
        const amount = qty === null || unit === null ? null : computeAmount(qty, unit);
        onSetItem(index, { qty, amount });
    };

    const onUnitChange = (raw: string) => {
        const unitPrice = numOrNull(raw);
        const qty = row.qty;
        const amount =
            qty === null || unitPrice === null ? null : computeAmount(qty, unitPrice);
        onSetItem(index, { unitPrice, amount });
    };

    const linked = Boolean(row.productId);

    return (
        <div className="space-y-2 rounded-xl border border-[rgb(var(--border))]/90 bg-[rgb(var(--panel))] p-3">
            <div className="relative space-y-2">
                <label className="block text-xs font-medium text-[rgb(var(--muted))]">{t.searchProduct}</label>
                <input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder={t.searchProduct}
                    className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                />
                {loading ? (
                    <p className="text-xs text-[rgb(var(--muted))]">…</p>
                ) : null}
                {open && hits.length > 0 ? (
                    <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] shadow-lg">
                        {hits.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => applyProduct(p)}
                                className="block w-full px-3 py-2 text-left text-sm text-[rgb(var(--text))] hover:bg-[rgb(var(--panel2))]"
                            >
                                <span className="font-medium">{p.name}</span>
                                {p.sku ? (
                                    <span className="ml-2 text-xs text-[rgb(var(--muted))]">SKU {p.sku}</span>
                                ) : null}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>

            {linked ? (
                <p className="text-xs text-[rgb(var(--muted))]">
                    {t.linked}: <span className="font-mono text-[rgb(var(--text))]">{row.productId}</span>{" "}
                    <button type="button" onClick={clearProduct} className="text-[rgb(var(--accent))]">
                        {t.unlink}
                    </button>
                </p>
            ) : (
                <p className="text-xs text-[rgb(var(--muted))]">{t.customLine}</p>
            )}

            <label className="block text-xs font-medium text-[rgb(var(--muted))]">
                {lang === "zh" ? "品項說明" : "Description"}
                <input
                    value={row.description}
                    onChange={(e) => onSetItem(index, { description: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                />
            </label>

            <div className="grid gap-2 sm:grid-cols-3">
                <label className="block text-xs font-medium text-[rgb(var(--muted))]">
                    {t.qty}
                    <input
                        value={row.qty === null || row.qty === undefined ? "" : String(row.qty)}
                        onChange={(e) => onQtyChange(e.target.value)}
                        inputMode="numeric"
                        className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                    />
                </label>
                <label className="block text-xs font-medium text-[rgb(var(--muted))]">
                    {t.unit}
                    <input
                        value={row.unitPrice === null || row.unitPrice === undefined ? "" : String(row.unitPrice)}
                        onChange={(e) => onUnitChange(e.target.value)}
                        inputMode="decimal"
                        className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                    />
                </label>
                <label className="block text-xs font-medium text-[rgb(var(--muted))]">
                    {t.amt}
                    <input
                        readOnly
                        value={row.amount === null || row.amount === undefined ? "" : String(row.amount)}
                        className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm text-[rgb(var(--muted))]"
                    />
                </label>
            </div>

            {canRemove ? (
                <button type="button" onClick={onRemove} className="text-xs font-medium text-[rgb(var(--accent))]">
                    {t.remove}
                </button>
            ) : null}
        </div>
    );
}
