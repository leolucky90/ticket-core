"use client";

import { Loader2 } from "lucide-react";

export default function MerchantLoading() {
    return (
        <div className="flex min-h-[50vh] items-center justify-center px-6 py-16">
            <div className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-5 py-4 shadow-xl">
                <Loader2 className="h-5 w-5 animate-spin text-[rgb(var(--accent))]" aria-hidden="true" />
                <div className="grid gap-0.5">
                    <div className="text-sm font-medium">頁面載入中</div>
                    <div className="text-xs text-[rgb(var(--muted))]">正在切換頁面或更新資料，請稍候...</div>
                </div>
            </div>
        </div>
    );
}
