// src/lib/ai/chat.ts
type AskChatInput = { // AI layer 輸入型別
    message: string; // 使用者訊息
    version: string; // 指定版本（versioned）
}; // 型別結束

type AskChatOutput = { // AI layer 輸出型別
    reply: string; // AI 回覆文字
    version: string; // 回傳版本
}; // 型別結束

export async function askChat(input: AskChatInput): Promise<AskChatOutput> { // askChat：唯一 AI 呼叫入口（UI 不直接 fetch）
    const res = await fetch("/api/ai/chat", { // 呼叫 API route
        method: "POST", // POST
        headers: { "Content-Type": "application/json" }, // JSON
        body: JSON.stringify(input), // 序列化 body
    }); // fetch 結束

    if (!res.ok) { // 若 HTTP 不是 2xx
        return { reply: "AI 目前無法回應（請稍後再試）", version: input.version }; // 回傳保底訊息（human-in-loop：不影響資料）
    } // if 結束

    const data = (await res.json()) as AskChatOutput; // 解析 JSON
    return data; // 回傳結果
} // askChat 結束