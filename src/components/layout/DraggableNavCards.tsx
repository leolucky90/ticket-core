"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type DragEvent, type PointerEvent, useEffect, useMemo, useRef, useState } from "react";

export type NavCardItem = {
    id: string;
    href: string;
    label: string;
};

type DraggableNavCardsProps = {
    items: NavCardItem[];
    lang: "zh" | "en";
    storageKey?: string;
};

function swapOrder(order: string[], first: string, second: string): string[] {
    const firstIndex = order.indexOf(first);
    const secondIndex = order.indexOf(second);
    if (firstIndex === -1 || secondIndex === -1 || firstIndex === secondIndex) {
        return order;
    }
    const next = [...order];
    [next[firstIndex], next[secondIndex]] = [next[secondIndex], next[firstIndex]];
    return next;
}

function normalizeOrder(candidate: unknown, allowedIds: string[]): string[] {
    if (!Array.isArray(candidate)) return [...allowedIds];
    const picked = candidate
        .filter((value): value is string => typeof value === "string")
        .filter((value) => allowedIds.includes(value));
    const next = Array.from(new Set(picked));
    for (const id of allowedIds) {
        if (!next.includes(id)) next.push(id);
    }
    return next;
}

export function DraggableNavCards({ items, lang, storageKey }: DraggableNavCardsProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const allowedIds = useMemo(() => items.map((item) => item.id), [items]);
    const itemMap = useMemo(() => {
        const map = new Map<string, NavCardItem>();
        for (const item of items) map.set(item.id, item);
        return map;
    }, [items]);

    const [order, setOrder] = useState<string[]>(allowedIds);
    const hasLoadedOrderRef = useRef(false);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState<string | null>(null);
    const resolvedOrder = useMemo(() => normalizeOrder(order, allowedIds), [order, allowedIds]);

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            if (!storageKey) {
                hasLoadedOrderRef.current = true;
                setOrder((prev) => normalizeOrder(prev, allowedIds));
                return;
            }
            try {
                const raw = window.localStorage.getItem(storageKey);
                if (!raw) {
                    hasLoadedOrderRef.current = true;
                    setOrder((prev) => normalizeOrder(prev, allowedIds));
                    return;
                }
                const parsed = JSON.parse(raw) as unknown;
                hasLoadedOrderRef.current = true;
                setOrder(normalizeOrder(parsed, allowedIds));
            } catch {
                hasLoadedOrderRef.current = true;
                setOrder((prev) => normalizeOrder(prev, allowedIds));
            }
        });
        return () => window.cancelAnimationFrame(frame);
    }, [allowedIds, storageKey]);

    useEffect(() => {
        if (!storageKey) return;
        if (!hasLoadedOrderRef.current) return;
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(resolvedOrder));
        } catch {
            // noop
        }
    }, [resolvedOrder, storageKey, hasLoadedOrderRef]);

    const isNavCardId = (value: unknown): value is string => typeof value === "string" && itemMap.has(value);

    const hintText = lang === "zh" ? "拖曳卡片或右側把手可對調位置" : "Drag card or handle to swap order";
    const dragHandleLabel = lang === "zh" ? "拖曳把手" : "Drag handle";

    const handleDragStart = (id: string) => (event: DragEvent<HTMLDivElement>) => {
        setDragging(id);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
    };

    const handleDragOver = (target: string) => (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (!dragging || dragging === target) return;
        setDragOver(target);
        event.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (target: string) => (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const source = event.dataTransfer.getData("text/plain");
        const sourceId = isNavCardId(source) ? source : dragging;
        if (sourceId && sourceId !== target) {
            setOrder((prev) => swapOrder(prev, sourceId, target));
        }
        setDragging(null);
        setDragOver(null);
    };

    const handleDragEnd = () => {
        setDragging(null);
        setDragOver(null);
    };

    const handlePointerDown = (id: string) => (event: PointerEvent<HTMLButtonElement>) => {
        if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
        event.preventDefault();
        setDragging(id);
        setDragOver(null);
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
        if (!dragging || (event.pointerType !== "touch" && event.pointerType !== "pen")) return;
        event.preventDefault();
        const pointTarget = document.elementFromPoint(event.clientX, event.clientY);
        const cardElement = pointTarget?.closest<HTMLElement>("[data-nav-card-id]");
        const nextTarget = cardElement?.dataset.navCardId;
        if (!isNavCardId(nextTarget) || nextTarget === dragging) {
            setDragOver(null);
            return;
        }
        setDragOver(nextTarget);
    };

    const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
        if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
        event.preventDefault();
        if (dragging && dragOver && dragging !== dragOver) {
            setOrder((prev) => swapOrder(prev, dragging, dragOver));
        }
        setDragging(null);
        setDragOver(null);
    };

    const handlePointerCancel = () => {
        setDragging(null);
        setDragOver(null);
    };

    const isCardActive = (href: string): boolean => {
        const [targetPath, targetQuery = ""] = href.split("?");
        if (pathname !== targetPath && !pathname.startsWith(`${targetPath}/`)) return false;
        if (!targetQuery) return true;

        const query = new URLSearchParams(targetQuery);
        for (const [key, value] of query.entries()) {
            if (searchParams.get(key) !== value) return false;
        }
        return true;
    };

    return (
        <div className="grid gap-2">
            <div className="px-1 text-[11px] text-[rgb(var(--muted))]">{hintText}</div>
            {resolvedOrder
                .map((id) => itemMap.get(id) ?? null)
                .filter((item): item is NavCardItem => item !== null)
                .map((card) => {
                    const isActive = isCardActive(card.href);
                    const isDropTarget = dragOver === card.id && dragging !== null && dragging !== card.id;
                    return (
                        <div
                            key={card.id}
                            data-nav-card-id={card.id}
                            draggable
                            onDragStart={handleDragStart(card.id)}
                            onDragOver={handleDragOver(card.id)}
                            onDrop={handleDrop(card.id)}
                            onDragEnd={handleDragEnd}
                            className={[
                                "group rounded-xl border bg-[rgb(var(--panel2))] p-3 transition",
                                "cursor-grab active:cursor-grabbing",
                                isActive ? "border-[rgb(var(--accent))]" : "border-[rgb(var(--border))]",
                                isDropTarget ? "ring-1 ring-[rgb(var(--accent))]" : "",
                            ].join(" ")}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <Link href={card.href} className="min-w-0 flex-1 text-sm font-semibold">
                                    {card.label}
                                </Link>
                                <button
                                    type="button"
                                    aria-label={dragHandleLabel}
                                    onPointerDown={handlePointerDown(card.id)}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onPointerCancel={handlePointerCancel}
                                    className="rounded px-1.5 py-1 text-xs text-[rgb(var(--muted))] touch-none"
                                >
                                    ::
                                </button>
                            </div>
                        </div>
                    );
                })}
        </div>
    );
}
