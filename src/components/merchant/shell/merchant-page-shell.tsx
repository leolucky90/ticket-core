"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/components/ui/cn";
import { MerchantPageHeader } from "@/components/merchant/shell/merchant-page-header";
import type { MerchantPageShellProps } from "@/components/merchant/shell/merchant-shell.types";

const WIDTH_CLASS: Record<NonNullable<MerchantPageShellProps["width"]>, string> = {
    default: "max-w-[1320px]",
    overview: "max-w-[1520px]",
    index: "max-w-[1600px]",
    builder: "max-w-[1760px]",
};

export function MerchantPageShell({
    title,
    subtitle,
    actions,
    tabs,
    width = "default",
    children,
    className,
    contentClassName,
}: MerchantPageShellProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const locationKey = `${pathname}?${searchParams.toString()}`;
    const [pendingLocationKey, setPendingLocationKey] = useState<string | null>(null);

    useEffect(() => {
        if (!pendingLocationKey) return;
        const timer = window.setTimeout(() => setPendingLocationKey(null), 15000);
        return () => window.clearTimeout(timer);
    }, [pendingLocationKey]);

    const isSubmitting = pendingLocationKey !== null;

    return (
        <div
            className={cn("w-full space-y-5", WIDTH_CLASS[width], className)}
            onClickCapture={(event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) return;
                const anchor = target.closest("a");
                if (!(anchor instanceof HTMLAnchorElement)) return;
                if (!anchor.href || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
                const nextUrl = new URL(anchor.href, window.location.href);
                const currentUrl = new URL(window.location.href);
                if (nextUrl.origin !== currentUrl.origin) return;
                if (`${nextUrl.pathname}${nextUrl.search}` === `${currentUrl.pathname}${currentUrl.search}`) return;
                setPendingLocationKey(`${nextUrl.pathname}${nextUrl.search}`);
            }}
            onSubmit={(event) => {
                if (event.defaultPrevented) return;
                setPendingLocationKey(locationKey);
            }}
        >
            {isSubmitting ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(255,255,255,0.45)] backdrop-blur-[1px]">
                    <div className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-5 py-4 shadow-xl">
                        <Loader2 className="h-5 w-5 animate-spin text-[rgb(var(--accent))]" aria-hidden="true" />
                        <div className="grid gap-0.5">
                            <div className="text-sm font-medium">資料處理中</div>
                            <div className="text-xs text-[rgb(var(--muted))]">正在同步資料或切換查詢結果，請稍候...</div>
                        </div>
                    </div>
                </div>
            ) : null}
            <MerchantPageHeader title={title} subtitle={subtitle} actions={actions} tabs={tabs} />
            <div className={cn("w-full space-y-4", contentClassName)}>{children}</div>
        </div>
    );
}
