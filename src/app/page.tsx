// src/app/page.tsx
import { PageShell } from "@/components/ui/page-shell"; // 引入頁面外殼（避免 Page 堆 Tailwind）
import { Section } from "@/components/ui/section"; // 引入區塊容器（統一間距/排版）
import { Card } from "@/components/ui/card"; // 引入 Card（統一面板樣式）
import { Button } from "@/components/ui/button"; // 引入 Button（統一互動樣式）
import Link from "next/link"; // Next.js Link，用於 client-side navigation
import { ChatBall } from "@/components/ai/chat-ball"; // AI 對話小球（可拖移）

export default function HomePage() { // Page 允許 default export（規範）
  return ( // 回傳 UI
    <PageShell> {/* Page 只組裝，不堆 Tailwind class */}
      <Section title="Ticket Core"> {/* 使用 Section 統一標題/間距 */}
        <Card> {/* 用 Card 來呈現內容面板 */}
          <p> {/* 文字不指定 text-white，顏色由 CSS variables 控制 */}
            這是首頁。你可以進入 Ticket 頁面建立/查看 tickets。 {/* 說明文字 */}
          </p> {/* p 結束 */}
          <div> {/* 不用 inline style，不寫顏色 */}
            <Link href="/ticket"> {/* 導航到 /ticket */}
              <Button>前往 Ticket</Button> {/* 使用統一 Button */}
            </Link> {/* Link 結束 */}
          </div> {/* div 結束 */}
        </Card> {/* Card 結束 */}
      </Section> {/* Section 結束 */}
      <ChatBall /> {/* 全站漂浮 AI 小球（human-in-loop：只聊天，不改資料） */}
    </PageShell> // PageShell 結束
  ); // return 結束
} // HomePage 結束