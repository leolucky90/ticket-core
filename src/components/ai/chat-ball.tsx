"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUiLanguage } from "@/components/layout/ui-language-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { useAiChatBallVisibility } from "@/components/ai/ai-chat-ball-visibility-provider";
import { getUiText } from "@/lib/i18n/ui-text";
import { askChat } from "@/lib/ai/chat";

type ChatLine = { role: "user" | "ai"; text: string };

/** 超過此位移視為拖曳，鬆開後不觸發按鈕 click（避免拖完誤開面板） */
const DRAG_CLICK_SUPPRESS_PX = 6;

type ChatBallProps = {
    /** false：不渲染（由帳號設定關閉） */
    enabled?: boolean;
};

export function ChatBall({ enabled: enabledProp = true }: ChatBallProps) {
    const ctx = useAiChatBallVisibility();
    const enabled = ctx ? ctx.enabled : enabledProp;

    const lang = useUiLanguage();
    const t = getUiText(lang).chatBall;

    const [open, setOpen] = useState(false);
    const [lines, setLines] = useState<ChatLine[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const ballRef = useRef<HTMLDivElement | null>(null);
    const draggingRef = useRef(false);
    const offsetRef = useRef({ x: 0, y: 0 });
    const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
    const dragExceededThresholdRef = useRef(false);

    const storageKey = "ticket-core:chatball:pos";
    const defaultPos = useMemo(() => ({ x: 24, y: 24 }), []);

    useEffect(() => {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw) as { x: number; y: number };
            const el = ballRef.current;
            if (!el) return;
            el.style.left = `${parsed.x}px`;
            el.style.bottom = `${parsed.y}px`;
        } catch {
            return;
        }
    }, []);

    useEffect(() => {
        const el = ballRef.current;
        if (!el) return;
        if (el.style.left || el.style.bottom) return;
        el.style.left = `${defaultPos.x}px`;
        el.style.bottom = `${defaultPos.y}px`;
    }, [defaultPos]);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!draggingRef.current) return;
            const el = ballRef.current;
            if (!el) return;

            if (pointerDownRef.current) {
                const dx = Math.abs(e.clientX - pointerDownRef.current.x);
                const dy = Math.abs(e.clientY - pointerDownRef.current.y);
                if (dx > DRAG_CLICK_SUPPRESS_PX || dy > DRAG_CLICK_SUPPRESS_PX) {
                    dragExceededThresholdRef.current = true;
                }
            }

            const x = e.clientX - offsetRef.current.x;
            const yFromBottom = window.innerHeight - e.clientY - offsetRef.current.y;

            const clampedX = Math.max(8, Math.min(x, window.innerWidth - 72));
            const clampedY = Math.max(8, Math.min(yFromBottom, window.innerHeight - 72));

            el.style.left = `${clampedX}px`;
            el.style.bottom = `${clampedY}px`;

            localStorage.setItem(storageKey, JSON.stringify({ x: clampedX, y: clampedY }));
        };

        const onUp = () => {
            draggingRef.current = false;
            pointerDownRef.current = null;
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);

        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, []);

    const onBallMouseDown = (e: React.MouseEvent) => {
        const el = ballRef.current;
        if (!el) return;

        dragExceededThresholdRef.current = false;
        pointerDownRef.current = { x: e.clientX, y: e.clientY };

        const rect = el.getBoundingClientRect();
        offsetRef.current = { x: e.clientX - rect.left, y: rect.bottom - e.clientY };
        draggingRef.current = true;
    };

    const onBallButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (dragExceededThresholdRef.current) {
            e.preventDefault();
            e.stopPropagation();
            dragExceededThresholdRef.current = false;
            return;
        }
        setOpen((v) => !v);
    };

    const onSend = async () => {
        const text = input.trim();
        if (!text) return;
        setInput("");
        setLines((prev) => [...prev, { role: "user", text }]);
        setLoading(true);
        try {
            const res = await askChat({ message: text, version: "v1" });
            setLines((prev) => [...prev, { role: "ai", text: res.reply }]);
        } finally {
            setLoading(false);
        }
    };

    if (!enabled) {
        return null;
    }

    return (
        <>
            <div
                ref={ballRef}
                className={cn("fixed z-50 select-none", open && "hidden")}
                onMouseDown={onBallMouseDown}
                aria-hidden={open}
            >
                <button
                    type="button"
                    onClick={onBallButtonClick}
                    className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-full border-2 border-[rgb(var(--accent))]/40 bg-[rgb(var(--panel2))] text-[rgb(var(--accent))] shadow-md transition hover:bg-[rgb(var(--panel))] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg))]",
                    )}
                    aria-label={t.toggleLabel}
                >
                    <Sparkles className="h-6 w-6 shrink-0" aria-hidden />
                </button>
            </div>

            {open ? (
                <div
                    className="fixed right-6 bottom-24 z-50 w-[min(320px,calc(100vw-48px))]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Card>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-[rgb(var(--text))]">{t.panelTitle}</p>
                                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                                    {t.close}
                                </Button>
                            </div>

                            <div className="max-h-64 space-y-2 overflow-auto rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                {lines.length === 0 ? (
                                    <p className="text-sm text-[rgb(var(--muted))]">{t.emptyHint}</p>
                                ) : (
                                    lines.map((l, i) => (
                                        <div key={i}>
                                            <p className="text-xs text-[rgb(var(--muted))]">{l.role === "user" ? t.you : t.ai}</p>
                                            <p className="text-sm text-[rgb(var(--text))]">{l.text}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            void onSend();
                                        }
                                    }}
                                    className="flex-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))]"
                                    placeholder={t.placeholder}
                                />
                                <Button type="button" onClick={() => void onSend()} disabled={loading}>
                                    {loading ? t.sending : t.send}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            ) : null}
        </>
    );
}
