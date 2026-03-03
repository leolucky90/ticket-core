// src/app/layout.tsx
import type { ReactNode } from "react"; // 引入 ReactNode 型別，用來描述 children 的型別
import "@/styles/globals.css"; // 全域 CSS（含 Tailwind + CSS Variables theme）

export const metadata = { // Next.js App Router 的 metadata，用來設定頁面基本資訊
  title: "Ticket Core", // 網站標題（不涉及顏色，符合規範）
  description: "Next.js 16 + TS strict + Tailwind v4 + CSS Variables", // 網站描述
}; // metadata 結束

type RootLayoutProps = { // 定義 RootLayout 的 props 型別
  children: ReactNode; // children 是 ReactNode，代表可渲染的任何內容
}; // props 型別結束

export default function RootLayout({ children }: RootLayoutProps) { // layout 可以 default export（規範允許 Page/layout default export）
  return ( // 回傳整個 HTML 結構
    <html lang="zh-Hant"> {/* 設定語系，讓瀏覽器/讀屏更準確 */}
      <body> {/* body 不寫 inline style，不用 hard-coded 顏色 */}
        {children} {/* 渲染所有 route 的內容 */}
      </body> {/* body 結束 */}
    </html> // html 結束
  ); // return 結束
} // RootLayout 結束