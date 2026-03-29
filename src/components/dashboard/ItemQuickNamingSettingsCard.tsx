"use client";

import { ChevronDown, GripVertical, Save } from "lucide-react";
import { useMemo, useState, type DragEvent } from "react";
import { MerchantSectionCard } from "@/components/merchant/shell";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import type { ItemNamingSettings } from "@/lib/schema/itemNamingSettings";
import type { ItemNamingToken } from "@/lib/types/catalog";

type ItemQuickNamingSettingsCardProps = {
    settings: ItemNamingSettings;
    submitAction: (formData: FormData) => Promise<void>;
};

const TOKEN_OPTIONS: Array<{ token: ItemNamingToken; label: string; description: string }> = [
    { token: "brand", label: "品牌", description: "例如 Apple / Samsung" },
    { token: "model", label: "型號", description: "例如 iPhone 16 Pro" },
    { token: "category", label: "主分類", description: "例如 手機零件" },
    { token: "secondaryCategory", label: "第二分類", description: "例如 LCD SCREEN" },
];

function moveToken(order: ItemNamingToken[], fromIndex: number, toIndex: number): ItemNamingToken[] {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= order.length || toIndex >= order.length) {
        return order;
    }
    const next = [...order];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
}

export function ItemQuickNamingSettingsCard({ settings, submitAction }: ItemQuickNamingSettingsCardProps) {
    const [order, setOrder] = useState<ItemNamingToken[]>(settings.order);
    const [draggingToken, setDraggingToken] = useState<ItemNamingToken | null>(null);
    const selectedSet = useMemo(() => new Set(order), [order]);

    const toggleToken = (token: ItemNamingToken) => {
        setOrder((current) => {
            if (current.includes(token)) return current.filter((item) => item !== token);
            return [...current, token];
        });
    };

    return (
        <MerchantSectionCard
            title="品項快速命名設置"
            description="勾選命名欄位並拖曳排序；系統會依序組合自動命名，自訂名稱則保留人工輸入。"
        >
            <details className="group rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-[rgb(var(--text))] [&::-webkit-details-marker]:hidden">
                    <span>展開命名欄位與排序</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-[rgb(var(--muted))] transition group-open:rotate-180" aria-hidden="true" />
                </summary>
            <form action={submitAction} className="grid gap-4 border-t border-[rgb(var(--border))] p-3 pt-4">
                <input type="hidden" name="tab" value="marketing" />
                <input type="hidden" name="order" value={order.join(",")} />

                <div className="grid gap-2 md:grid-cols-2">
                    {TOKEN_OPTIONS.map((option) => (
                        <label
                            key={option.token}
                            className="flex items-start gap-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3 text-sm"
                        >
                            <input
                                type="checkbox"
                                checked={selectedSet.has(option.token)}
                                onChange={() => toggleToken(option.token)}
                                className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--accent))]"
                            />
                            <div className="grid gap-0.5">
                                <div className="font-medium text-[rgb(var(--text))]">{option.label}</div>
                                <div className="text-xs text-[rgb(var(--muted))]">{option.description}</div>
                            </div>
                        </label>
                    ))}
                </div>

                <div className="grid gap-2">
                    <div className="text-sm font-medium">目前排序</div>
                    {order.length === 0 ? (
                        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3 text-sm text-[rgb(var(--muted))]">
                            至少勾選一個欄位後，這裡才會顯示可拖曳的命名順序。
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {order.map((token, index) => {
                                const option = TOKEN_OPTIONS.find((item) => item.token === token);
                                if (!option) return null;
                                return (
                                    <div
                                        key={token}
                                        draggable
                                        onDragStart={() => setDraggingToken(token)}
                                        onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
                                        onDrop={() => {
                                            if (!draggingToken || draggingToken === token) return;
                                            setOrder((current) => {
                                                const fromIndex = current.indexOf(draggingToken);
                                                const toIndex = current.indexOf(token);
                                                return moveToken(current, fromIndex, toIndex);
                                            });
                                            setDraggingToken(null);
                                        }}
                                        onDragEnd={() => setDraggingToken(null)}
                                        className="flex items-center gap-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2"
                                    >
                                        <GripVertical className="h-4 w-4 shrink-0 text-[rgb(var(--muted))]" aria-hidden="true" />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium">{option.label}</div>
                                            <div className="text-xs text-[rgb(var(--muted))]">{option.description}</div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                                            <button
                                                type="button"
                                                onClick={() => setOrder((current) => moveToken(current, index, index - 1))}
                                                disabled={index === 0}
                                                className="rounded border border-[rgb(var(--border))] px-2 py-1 disabled:opacity-40"
                                            >
                                                上移
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setOrder((current) => moveToken(current, index, index + 1))}
                                                disabled={index === order.length - 1}
                                                className="rounded border border-[rgb(var(--border))] px-2 py-1 disabled:opacity-40"
                                            >
                                                下移
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <IconTextActionButton type="submit" icon={Save} label="儲存命名設定" tooltip="儲存品項快速命名設定" className="h-10 px-4">
                        儲存命名設定
                    </IconTextActionButton>
                    <div className="text-xs text-[rgb(var(--muted))]">
                        目前預覽順序：{order.length > 0 ? order.map((token) => TOKEN_OPTIONS.find((item) => item.token === token)?.label ?? token).join(" + ") : "未設定"}
                    </div>
                </div>
            </form>
            </details>
        </MerchantSectionCard>
    );
}
