// src/lib/types/ticket.ts
export type KnownTicketStatus = "new" | "in_progress" | "waiting_customer" | "resolved" | "closed";
export type KnownQuoteStatus = "inspection_estimate" | "quoted" | "rejected" | "accepted";
export type TicketStatus = KnownTicketStatus | (string & {});
export type QuoteStatus = KnownQuoteStatus | (string & {});

export type TicketCustomer = {
    name: string;
    phone: string;
    address: string;
    email: string;
};

export type TicketDevice = {
    name: string;
    model: string;
};

export type Ticket = { // Ticket 型別定義
    id: string; // 唯一 ID
    title: string; // 標題
    status: TicketStatus; // 狀態
    companyId?: string;
    customerId?: string;
    customer: TicketCustomer;
    device: TicketDevice;
    repairReason: string;
    repairSuggestion: string;
    note: string;
    repairAmount: number;
    inspectionFee: number;
    pendingFee: number;
    quoteStatus: QuoteStatus;
    createdAt: number; // 建立時間（epoch ms）
    updatedAt: number; // 最後更新時間
}; // Ticket 結束
