// src/lib/types/ticket.ts
export type TicketStatus = "open" | "closed"; // Ticket 狀態（Domain Layer：純型別，不碰 UI/DB）

export type Ticket = { // Ticket 型別定義
    id: string; // 唯一 ID
    title: string; // 標題
    status: TicketStatus; // 狀態
    createdAt: number; // 建立時間（epoch ms）
}; // Ticket 結束