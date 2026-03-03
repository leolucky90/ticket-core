// src/lib/services/ticket.ts
import type { Ticket } from "@/lib/types/ticket"; // 引入 Ticket 型別
import { revalidatePath } from "next/cache"; // 用於刷新頁面快取

const memory: { tickets: Ticket[] } = { tickets: [] }; // in-memory store（示範用）

function now() { // 集中取時間
    return Date.now(); // 回傳 epoch ms
} // now 結束

function id() { // 集中生成 id
    return `t_${Math.random().toString(16).slice(2)}_${now()}`; // 簡易唯一 id
} // id 結束

export const ticketStore = { // service store
    list(): Ticket[] { // 取得列表
        return memory.tickets; // 回傳記憶體資料
    }, // list 結束
    create(): Ticket { // 建立 ticket
        const t: Ticket = { // 建立 ticket
            id: id(), // id
            title: "Demo Ticket", // 標題
            status: "open", // 狀態
            createdAt: now(), // 時間
        }; // t 結束
        memory.tickets = [t, ...memory.tickets]; // 插入到最前
        return t; // 回傳建立結果
    }, // create 結束
}; // store 結束

export async function listTickets(): Promise<Ticket[]> { // 給 Page 用：取得列表
    const res = await fetch("/api/tickets", { method: "GET", cache: "no-store" }); // 用相對路徑避免 env
    const data = (await res.json()) as { tickets: Ticket[] }; // 解析
    return data.tickets; // 回傳
} // listTickets 結束

export async function createTicket(): Promise<void> { // 給 Page 用：建立 ticket（server action）
    await fetch("/api/tickets", { method: "POST" }); // 呼叫 API
    revalidatePath("/ticket"); // 刷新 ticket 頁
} // createTicket 結束