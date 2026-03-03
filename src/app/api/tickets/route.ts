// src/app/api/tickets/route.ts
import { NextResponse } from "next/server"; // Next.js API 回應工具
import { ticketStore } from "@/lib/services/ticket"; // 引入 service 內部 store（示範用，無 DB）

export async function GET() { // GET /api/tickets：取得列表
    const tickets = ticketStore.list(); // 透過 service store 取得資料（集中管理）
    return NextResponse.json({ tickets }); // 回傳 JSON
} // GET 結束

export async function POST() { // POST /api/tickets：新增一張示範 ticket
    const created = ticketStore.create(); // 透過 service store 建立（不在 UI 寫）
    return NextResponse.json({ ticket: created }); // 回傳建立結果
} // POST 結束