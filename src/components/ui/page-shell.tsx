// src/components/ui/page-shell.tsx
import type { ReactNode } from "react"; // 引入 ReactNode
import { cn } from "@/components/ui/cn"; // 引入 cn

type PageShellProps = { // PageShellProps：頁面外殼 props
    children: ReactNode; // 頁面內容
    className?: string; // 額外 class
}; // 型別結束

export function PageShell({ children, className }: PageShellProps) { // PageShell：避免 Page 堆 Tailwind
    return ( // 回傳外殼
        <div
            className={cn( // 合併 class
                "min-h-dvh bg-[rgb(var(--bg))] text-[rgb(var(--text))]", // 背景/文字顏色只用 CSS variables
                className, // 外部補充 class
            )} // className 結束
        >
            <main className="mx-auto w-full max-w-3xl space-y-6 p-6"> {/* 版型/間距 OK；不寫顏色 */}
                {children} {/* 渲染頁面內容 */}
            </main> {/* main 結束 */}
        </div> // div 結束
    ); // return 結束
} // PageShell 結束