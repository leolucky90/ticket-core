// src/components/ui/card.tsx
import type { ReactNode } from "react"; // 引入 ReactNode
import { cn } from "@/components/ui/cn"; // 引入 cn

type CardProps = { // CardProps：定義 Card 需要的 props
    children: ReactNode; // 內容
    className?: string; // 額外 class
}; // 型別結束

export function Card({ children, className }: CardProps) { // Card：標準內容容器（UI abstraction）
    return ( // 回傳容器
        <div
            className={cn( // 合併 class
                "rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4", // 顏色全用 CSS variables
                className, // 外部補充 class
            )} // className 結束
        >
            {children} {/* 渲染卡片內容 */}
        </div> // div 結束
    ); // return 結束
} // Card 結束