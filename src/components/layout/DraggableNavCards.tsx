"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type DragEvent, type PointerEvent, useState } from "react";

type NavCardId = "ticket" | "sales";

type DraggableNavCardsProps = {
    labels: {
        ticket: string;
        sales: string;
    };
    lang: "zh" | "en";
};

const DEFAULT_ORDER: NavCardId[] = ["ticket", "sales"];

function isNavCardId(value: unknown): value is NavCardId {
    return value === "ticket" || value === "sales";
}

function swapOrder(order: NavCardId[], first: NavCardId, second: NavCardId): NavCardId[] {
    const firstIndex = order.indexOf(first);
    const secondIndex = order.indexOf(second);
    if (firstIndex === -1 || secondIndex === -1 || firstIndex === secondIndex) {
        return order;
    }
    const next = [...order];
    [next[firstIndex], next[secondIndex]] = [next[secondIndex], next[firstIndex]];
    return next;
}

export function DraggableNavCards({ labels, lang }: DraggableNavCardsProps) {
    const pathname = usePathname();
    const [order, setOrder] = useState<NavCardId[]>(DEFAULT_ORDER);
    const [dragging, setDragging] = useState<NavCardId | null>(null);
    const [dragOver, setDragOver] = useState<NavCardId | null>(null);
    const cardMap = {
        ticket: { href: "/ticket", label: labels.ticket },
        sales: { href: "/sales", label: labels.sales },
    } as const;
    const hintText = lang === "zh" ? "拖曳卡片或右側把手可對調位置" : "Drag card or handle to swap order";
    const dragHandleLabel = lang === "zh" ? "拖曳把手" : "Drag handle";

    const handleDragStart = (id: NavCardId) => (event: DragEvent<HTMLDivElement>) => {
        setDragging(id);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
    };

    const handleDragOver = (target: NavCardId) => (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (!dragging || dragging === target) {
            return;
        }
        setDragOver(target);
        event.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (target: NavCardId) => (event: DragEvent<HTMLDivElement>) => {
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

    const handlePointerDown = (id: NavCardId) => (event: PointerEvent<HTMLButtonElement>) => {
        if (event.pointerType !== "touch" && event.pointerType !== "pen") {
            return;
        }
        event.preventDefault();
        setDragging(id);
        setDragOver(null);
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
        if (!dragging || (event.pointerType !== "touch" && event.pointerType !== "pen")) {
            return;
        }
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
        if (event.pointerType !== "touch" && event.pointerType !== "pen") {
            return;
        }
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

    return (
        <div className="grid gap-2">
            <div className="px-1 text-[11px] text-[rgb(var(--muted))]">{hintText}</div>
            {order.map((id) => {
                const card = cardMap[id];
                const isActive = pathname === card.href || pathname.startsWith(`${card.href}/`);
                const isDropTarget = dragOver === id && dragging !== null && dragging !== id;
                return (
                    <div
                        key={id}
                        data-nav-card-id={id}
                        draggable
                        onDragStart={handleDragStart(id)}
                        onDragOver={handleDragOver(id)}
                        onDrop={handleDrop(id)}
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
                                onPointerDown={handlePointerDown(id)}
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
