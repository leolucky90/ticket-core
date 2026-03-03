// src/components/ui/button.tsx
import type { ButtonHTMLAttributes } from "react"; // 引入 button 的原生 props 型別
import { cn } from "@/components/ui/cn"; // 引入 class 合併工具

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { // ButtonProps：繼承原生 button props
    variant?: "solid" | "ghost"; // variant：控制外觀（不靠 hard-coded 顏色）
}; // 型別結束

export function Button({ className, variant = "solid", ...props }: ButtonProps) { // UI component 不 default export（規範）
    const base = // base：共同樣式（用 Tailwind 做結構/間距，但顏色用 CSS variables）
        "inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition"; // 不寫顏色，只寫版型
    const solid = // solid：實心按鈕（顏色只用 --accent/--border/--text）
        "border-[rgb(var(--border))] bg-[rgb(var(--accent))] text-[rgb(var(--bg))]"; // 文字用 bg 當對比色（仍在允許集合內）
    const ghost = // ghost：透明按鈕
        "border-[rgb(var(--border))] bg-[rgb(var(--panel))] text-[rgb(var(--text))]"; // 只用允許的 variables

    return ( // 回傳 button
        <button
            {...props} // 展開原生 props（type/onClick/disabled 等）
            className={cn( // 合併 class
                base, // 基底樣式
                variant === "solid" ? solid : ghost, // 依 variant 決定外觀
                className, // 允許外部追加 class（仍可遵守規範）
            )} // className 結束
        /> // button 結束
    ); // return 結束
} // Button 結束