"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/components/ui/cn";
import type { MerchantPageTab } from "@/components/merchant/shell/merchant-shell.types";

type PageTabsProps = {
    tabs: MerchantPageTab[];
    className?: string;
    ariaLabel?: string;
};

function isTabActive(targetHref: string, pathname: string, searchParams: URLSearchParams): boolean {
    const [targetPath, targetQuery = ""] = targetHref.split("?");
    if (pathname !== targetPath && !pathname.startsWith(`${targetPath}/`)) return false;
    if (!targetQuery) return true;

    const query = new URLSearchParams(targetQuery);
    for (const [key, value] of query.entries()) {
        if (searchParams.get(key) !== value) return false;
    }
    return true;
}

export function PageTabs({ tabs, className, ariaLabel = "頁面子導覽" }: PageTabsProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    if (tabs.length === 0) return null;

    return (
        <nav className={cn("overflow-x-auto pb-1", className)} aria-label={ariaLabel}>
            <div className="inline-flex min-w-full gap-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-1">
                {tabs.map((tab) => {
                    const active = isTabActive(tab.href, pathname, searchParams);
                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            className={cn(
                                "rounded-lg px-3 py-2 text-sm transition",
                                active
                                    ? "bg-[rgb(var(--panel2))] font-semibold text-[rgb(var(--text))]"
                                    : "text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel2))] hover:text-[rgb(var(--text))]",
                            )}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
