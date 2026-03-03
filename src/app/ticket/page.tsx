// src/app/ticket/page.tsx
import { PageShell } from "@/components/ui/page-shell"; // 引入頁面外殼
import { Section } from "@/components/ui/section"; // 引入區塊容器
import { Card } from "@/components/ui/card"; // 引入 Card
import { Button } from "@/components/ui/button"; // 引入 Button
import { listTickets, createTicket } from "@/lib/services/ticket"; // 引入 Service Layer（Page 不寫業務邏輯）
import type { Ticket } from "@/lib/types/ticket"; // 引入 Domain Layer 型別
import { ChatBall } from "@/components/ai/chat-ball"; // AI 漂浮小球

export default async function TicketPage() { // Page 可用 async server component 讀資料（仍保持 Page 只組裝）
    const tickets: Ticket[] = await listTickets(); // 呼叫 service 取得 tickets（具體存取在 service / API route）
    return ( // 回傳 UI
        <PageShell> {/* 使用 PageShell 統一 layout */}
            <Section title="Tickets"> {/* Section 統一區塊樣式 */}
                <Card> {/* 顯示建立 ticket 的區塊 */}
                    <form action={createTicket}> {/* 用 server action 方式呼叫 service（仍屬 service 層處理） */}
                        <Button type="submit">建立一張示範 Ticket</Button> {/* 不在 Page 寫邏輯，讓 action 處理 */}
                    </form> {/* form 結束 */}
                </Card> {/* Card 結束 */}

                <Card> {/* 顯示 ticket 列表的區塊 */}
                    <p>目前共有 {tickets.length} 張。</p> {/* 顯示數量，顏色由主題控制 */}
                    <ul> {/* 列表不做額外樣式堆疊 */}
                        {tickets.map((t) => ( // map 渲染每一張 ticket
                            <li key={t.id}> {/* key 使用 id，React 列表需要 */}
                                <strong>{t.title}</strong> {/* 用語意 strong 強調標題 */}
                                {" — "} {/* 分隔符 */}
                                <span>{t.status}</span> {/* 顯示狀態 */}
                            </li> // li 結束
                        ))} {/* map 結束 */}
                    </ul> {/* ul 結束 */}
                </Card> {/* Card 結束 */}
            </Section> {/* Section 結束 */}
            <ChatBall /> {/* Ticket 頁也有 AI 小球 */}
        </PageShell> // PageShell 結束
    ); // return 結束
} // TicketPage 結束