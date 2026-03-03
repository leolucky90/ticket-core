// src/components/ui/section.tsx
import type { ReactNode } from "react"; // 引入 ReactNode
import { cn } from "@/components/ui/cn"; // 引入 cn

type SectionProps = { // SectionProps：區塊 props
    title?: string; // 可選標題
    children: ReactNode; // 內容
    className?: string; // 額外 class
}; // 型別結束

export function Section({ title, children, className }: SectionProps) { // Section：統一頁面區塊
    return ( // 回傳區塊
        <section className={cn("space-y-3", className)}> {/* 只做間距，不碰顏色 */}
            {title ? ( // 若有標題
                <h2 className="text-lg font-semibold text-[rgb(var(--text))]"> {/* 文字顏色用 --text */}
                    {title} {/* 顯示標題 */}
                </h2> // h2 結束
            ) : null} {/* 沒標題就不渲染 */}
            {children} {/* 渲染內容 */}
        </section> // section 結束
    ); // return 結束
} // Section 結束