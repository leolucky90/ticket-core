// src/components/ui/cn.ts
export function cn(...parts: Array<string | undefined | null | false>) { // cn：把多個 class 片段安全合併
    return parts.filter(Boolean).join(" "); // 過濾掉空值/false，再用空白串起來
} // cn 結束