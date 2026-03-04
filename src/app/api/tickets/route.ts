// src/app/api/tickets/route.ts
import { NextResponse } from "next/server"; // Next.js API 回應工具
import { listTickets } from "@/lib/services/ticket";

export async function GET() { // GET /api/tickets：取得列表
    const tickets = await listTickets();
    return NextResponse.json({ tickets }); // 回傳 JSON
} // GET 結束

export async function POST() { // POST /api/tickets：新增一張示範 ticket
    return NextResponse.json({ ok: false, message: "Use server actions for create/update/delete." }, { status: 405 });
} // POST 結束
