"use client";

import { X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/components/ui/cn";
import type { MerchantSidebarGroup } from "@/components/merchant/shell/merchant-shell.types";
import { SidebarSection } from "@/components/merchant/shell/sidebar-section";

type AppSidebarProps = {
    groups: MerchantSidebarGroup[];
    desktopCollapsed?: boolean;
    mobileOpen?: boolean;
    onCloseMobile?: () => void;
};

function hrefMatches(href: string, pathname: string, searchParams: URLSearchParams): boolean {
    const [targetPath, targetQuery = ""] = href.split("?");
    if (pathname !== targetPath && !pathname.startsWith(`${targetPath}/`)) return false;
    if (!targetQuery) return true;

    const query = new URLSearchParams(targetQuery);
    for (const [key, value] of query.entries()) {
        const current = searchParams.get(key);
        if (current === value) continue;
        // /dashboard defaults to tab=dashboard when query is omitted.
        if (targetPath === "/dashboard" && key === "tab" && value === "dashboard" && (current === null || current === "")) {
            continue;
        }
        return false;
    }
    return true;
}

export function AppSidebar({ groups, desktopCollapsed = false, mobileOpen = false, onCloseMobile }: AppSidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const searchKey = searchParams.toString();
    const routeKey = `${pathname}?${searchKey}`;
    const previousRouteRef = useRef(routeKey);

    useEffect(() => {
        const previousRoute = previousRouteRef.current;
        previousRouteRef.current = routeKey;
        if (!mobileOpen) return;
        if (previousRoute === routeKey) return;
        onCloseMobile?.();
        // Route changed while mobile drawer is open; close it to keep focus context clear.
    }, [mobileOpen, onCloseMobile, routeKey]);

    useEffect(() => {
        if (!mobileOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onCloseMobile?.();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [mobileOpen, onCloseMobile]);

    return (
        <>
            <aside
                className={cn(
                    "hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] lg:block",
                    desktopCollapsed ? "w-[74px] p-2" : "w-full p-3",
                )}
            >
                <nav className="space-y-4" aria-label="主導覽">
                    {groups.map((group) => (
                        <SidebarSection
                            key={group.id}
                            group={group}
                            collapsed={desktopCollapsed}
                            isActive={(href) => hrefMatches(href, pathname, searchParams)}
                        />
                    ))}
                </nav>
            </aside>

            <div
                className={cn("fixed inset-0 z-40 lg:hidden", mobileOpen ? "pointer-events-auto" : "pointer-events-none")}
                aria-hidden={!mobileOpen}
            >
                <button
                    type="button"
                    onClick={onCloseMobile}
                    aria-label="關閉導覽抽屜"
                    className={cn(
                        "absolute inset-0 bg-black/35 transition-opacity",
                        mobileOpen ? "opacity-100" : "opacity-0",
                    )}
                />
                <aside
                    className={cn(
                        "absolute inset-y-0 left-0 w-[292px] max-w-[88vw] border-r border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-3 shadow-xl transition-transform",
                        mobileOpen ? "translate-x-0" : "-translate-x-full",
                    )}
                    role="dialog"
                    aria-modal="true"
                    aria-label="主導覽"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-[rgb(var(--text))]">主導覽</h2>
                        <button
                            type="button"
                            onClick={onCloseMobile}
                            aria-label="關閉導覽"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--panel))]"
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                    <nav className="space-y-4" aria-label="主導覽">
                        {groups.map((group) => (
                            <SidebarSection
                                key={group.id}
                                group={group}
                                isActive={(href) => hrefMatches(href, pathname, searchParams)}
                                onNavigate={onCloseMobile}
                            />
                        ))}
                    </nav>
                </aside>
            </div>
        </>
    );
}
