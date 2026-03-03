// src/components/ai/chat-ball.tsx
"use client"; // 這個元件需要拖曳與狀態，所以必須是 client component

import { useEffect, useMemo, useRef, useState } from "react"; // 引入 React hooks
import { Card } from "@/components/ui/card"; // 引入 UI Card
import { Button } from "@/components/ui/button"; // 引入 UI Button
import { askChat } from "@/lib/ai/chat"; // 引入 AI layer（不在 UI 寫 AI 呼叫）
import { cn } from "@/components/ui/cn"; // 引入 cn

type ChatLine = { // 定義每一行對話的資料結構
    role: "user" | "ai"; // 角色：使用者或 AI
    text: string; // 文字內容
}; // 型別結束

export function ChatBall() { // ChatBall：漂浮可拖移小球 + 對話面板
    const [open, setOpen] = useState(false); // open：控制面板開關
    const [lines, setLines] = useState<ChatLine[]>([]); // lines：對話內容（human-in-loop：只暫存，不改資料）
    const [input, setInput] = useState(""); // input：輸入框文字
    const [loading, setLoading] = useState(false); // loading：送出中狀態

    const ballRef = useRef<HTMLDivElement | null>(null); // ballRef：用於操作小球 DOM
    const draggingRef = useRef(false); // draggingRef：是否正在拖曳（用 ref 避免頻繁 re-render）
    const offsetRef = useRef({ x: 0, y: 0 }); // offsetRef：記錄滑鼠相對小球左上角的偏移

    const storageKey = "ticket-core:chatball:pos"; // localStorage key：儲存小球位置（純 UI 狀態）

    const defaultPos = useMemo(() => ({ x: 24, y: 24 }), []); // defaultPos：預設位置（以 px 為單位，非顏色）

    useEffect(() => { // 掛載時讀取上次位置
        const raw = localStorage.getItem(storageKey); // 讀 localStorage
        if (!raw) return; // 沒資料就保持預設
        try { // try 解析 JSON
            const parsed = JSON.parse(raw) as { x: number; y: number }; // 套用型別
            const el = ballRef.current; // 取得 DOM
            if (!el) return; // 沒 DOM 就結束
            el.style.left = `${parsed.x}px`; // 設定 left（這是 DOM style 設定，不是 inline style 寫在 JSX）
            el.style.bottom = `${parsed.y}px`; // 設定 bottom（用 bottom 方便貼右下角概念）
        } catch { // 解析失敗就忽略
            return; // 不做任何事
        } // try/catch 結束
    }, []); // 只在第一次執行

    useEffect(() => { // 初始化預設位置（只做一次）
        const el = ballRef.current; // 取得 DOM
        if (!el) return; // 沒 DOM 就結束
        if (el.style.left || el.style.bottom) return; // 若已被 storage 還原就不覆蓋
        el.style.left = `${defaultPos.x}px`; // 設定預設 left
        el.style.bottom = `${defaultPos.y}px`; // 設定預設 bottom
    }, [defaultPos]); // 依 defaultPos（固定）

    useEffect(() => { // 註冊全域滑鼠事件，支援拖曳
        const onMove = (e: MouseEvent) => { // 滑鼠移動事件
            if (!draggingRef.current) return; // 沒在拖曳就跳過
            const el = ballRef.current; // 取得 DOM
            if (!el) return; // 沒 DOM 就跳過

            const x = e.clientX - offsetRef.current.x; // 計算新的 left
            const yFromBottom = window.innerHeight - e.clientY - offsetRef.current.y; // 計算新的 bottom（以底部為基準）

            const clampedX = Math.max(8, Math.min(x, window.innerWidth - 72)); // 限制在視窗內（72 約等於球寬）
            const clampedY = Math.max(8, Math.min(yFromBottom, window.innerHeight - 72)); // 限制在視窗內

            el.style.left = `${clampedX}px`; // 寫入 left
            el.style.bottom = `${clampedY}px`; // 寫入 bottom

            localStorage.setItem(storageKey, JSON.stringify({ x: clampedX, y: clampedY })); // 存回 localStorage
        }; // onMove 結束

        const onUp = () => { // 滑鼠放開事件
            draggingRef.current = false; // 結束拖曳
        }; // onUp 結束

        window.addEventListener("mousemove", onMove); // 監聽滑鼠移動
        window.addEventListener("mouseup", onUp); // 監聽滑鼠放開

        return () => { // 清理監聽避免 memory leak
            window.removeEventListener("mousemove", onMove); // 移除移動監聽
            window.removeEventListener("mouseup", onUp); // 移除放開監聽
        }; // cleanup 結束
    }, []); // 只註冊一次

    const onBallMouseDown = (e: React.MouseEvent) => { // 按下小球開始拖曳
        const el = ballRef.current; // 取得 DOM
        if (!el) return; // 沒 DOM 就結束

        const rect = el.getBoundingClientRect(); // 取得小球位置與大小
        offsetRef.current = { x: e.clientX - rect.left, y: rect.bottom - e.clientY }; // 記錄偏移（y 用 bottom 系統）
        draggingRef.current = true; // 標記正在拖曳
    }; // onBallMouseDown 結束

    const onSend = async () => { // 送出訊息
        const text = input.trim(); // 去除空白
        if (!text) return; // 空字串不送
        setInput(""); // 清空輸入框
        setLines((prev) => [...prev, { role: "user", text }]); // 追加使用者訊息
        setLoading(true); // 進入 loading
        try { // 呼叫 AI layer
            const res = await askChat({ message: text, version: "v1" }); // 呼叫 askChat（versioned）
            setLines((prev) => [...prev, { role: "ai", text: res.reply }]); // 追加 AI 回覆
        } finally { // 不論成功失敗都結束 loading
            setLoading(false); // 關閉 loading
        } // try/finally 結束
    }; // onSend 結束

    return ( // 回傳 UI
        <> {/* fragment 包住球與面板 */}
            <div
                ref={ballRef} // 綁定 ref
                className={cn( // 小球的 class
                    "fixed z-50 select-none", // 固定定位 + 最上層 + 不可選取文字
                )} // className 結束
                onMouseDown={onBallMouseDown} // 支援拖曳
            >
                <button
                    type="button" // button 類型
                    onClick={() => setOpen((v) => !v)} // 點擊切換面板
                    className={cn( // 小球外觀（只用 CSS variables）
                        "h-14 w-14 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] text-[rgb(var(--text))] shadow-sm", // 不用 hard-coded 顏色
                    )} // className 結束
                    aria-label="Open AI Chat" // 無障礙 label
                >
                    AI {/* 小球文字 */}
                </button> {/* button 結束 */}
            </div> {/* 小球容器結束 */}

            {open ? ( // 若 open 為 true 顯示面板
                <div
                    className={cn( // 面板固定在右下角附近（不跟著球移動，避免太複雜）
                        "fixed bottom-24 right-6 z-50 w-[320px] max-w-[calc(100vw-48px)]", // 版型用 Tailwind，允許
                    )} // className 結束
                >
                    <Card> {/* 面板用 Card */}
                        <div className="space-y-3"> {/* 只做間距 */}
                            <div className="flex items-center justify-between"> {/* 標題列 */}
                                <p className="font-semibold text-[rgb(var(--text))]">AI 對話</p> {/* 標題 */}
                                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>關閉</Button> {/* 關閉 */}
                            </div> {/* 標題列結束 */}

                            <div className="max-h-64 space-y-2 overflow-auto rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3"> {/* 訊息區 */}
                                {lines.length === 0 ? ( // 沒訊息時顯示提示
                                    <p className="text-sm text-[rgb(var(--muted))]">輸入一句話開始。AI 只給建議，不會自動改資料。</p> // human-in-loop 提示
                                ) : (
                                    lines.map((l, i) => ( // 渲染每一行
                                        <div key={i}> {/* key 用 index（短列表可接受） */}
                                            <p className="text-xs text-[rgb(var(--muted))]">{l.role === "user" ? "你" : "AI"}</p> {/* 角色標籤 */}
                                            <p className="text-sm text-[rgb(var(--text))]">{l.text}</p> {/* 內容 */}
                                        </div> // 一行結束
                                    ))
                                )} {/* 條件渲染結束 */}
                            </div> {/* 訊息區結束 */}

                            <div className="flex gap-2"> {/* 輸入列 */}
                                <input
                                    value={input} // 綁定 input 狀態
                                    onChange={(e) => setInput(e.target.value)} // 更新狀態
                                    onKeyDown={(e) => { // Enter 送出
                                        if (e.key === "Enter") { // 若按下 Enter
                                            e.preventDefault(); // 防止 form 行為
                                            void onSend(); // 呼叫送出（void 避免未處理 Promise 警告）
                                        } // if 結束
                                    }} // onKeyDown 結束
                                    className="flex-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))]" // 顏色用 variables
                                    placeholder="輸入訊息…" // placeholder 文字
                                /> {/* input 結束 */}
                                <Button type="button" onClick={() => void onSend()} disabled={loading}> {/* 送出按鈕 */}
                                    {loading ? "送出中" : "送出"} {/* loading 狀態文字 */}
                                </Button> {/* Button 結束 */}
                            </div> {/* 輸入列結束 */}
                        </div> {/* space-y 結束 */}
                    </Card> {/* Card 結束 */}
                </div> // 面板容器結束
            ) : null} {/* open 為 false 不渲染 */}
        </> // fragment 結束
    ); // return 結束
} // ChatBall 結束