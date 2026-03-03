// src/app/api/ai/chat/route.ts
import { NextResponse } from "next/server"; // Next.js 回應工具

type ChatRequestBody = { // 定義請求 body 型別（TS strict）
    message: string; // 使用者訊息
    version?: string; // 可選：前端帶版本（可用於升級/灰度）
}; // 型別結束

export async function POST(req: Request) { // POST /api/ai/chat：AI 聊天端點
    const body = (await req.json()) as ChatRequestBody; // 解析 JSON 並套用型別
    const message = (body.message ?? "").trim(); // 安全地取出 message 並去空白
    const version = body.version ?? "v1"; // versioned：若沒給就用 v1

    if (!message) { // 若訊息為空
        return NextResponse.json( // 回傳錯誤
            { error: "Missing message" }, // 錯誤內容
            { status: 400 }, // HTTP 400
        ); // json 結束
    } // if 結束

    // human-in-loop：這裡只回傳建議/回答，不會寫入任何 ticket 資料或覆蓋資料
    // 注意：這是一個「可跑的 stub」，你之後再把它替換成真正的 LLM 呼叫（放在 src/lib/ai）
    const reply = `（${version}）我收到：${message}。我可以幫你整理票券內容、產生建議，但不會自動修改資料。`; // 產生回覆文字（不涉及顏色）

    return NextResponse.json({ reply, version }); // versioned result：回傳 reply + version
} // POST 結束