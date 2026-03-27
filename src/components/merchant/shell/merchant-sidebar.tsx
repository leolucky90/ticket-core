"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { MerchantSidebarGroup as MerchantSidebarGroupType } from "@/components/merchant/shell/merchant-shell.types";
import { MerchantSidebarGroup } from "@/components/merchant/shell/merchant-sidebar-group";

type MerchantSidebarProps = {
    groups: MerchantSidebarGroupType[];
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

export function MerchantSidebar({ groups }: MerchantSidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    return (
        <aside className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-3">
            <nav className="space-y-4" aria-label="Merchant navigation">
                {groups.map((group) => (
                    <MerchantSidebarGroup
                        key={group.id}
                        group={group}
                        isActive={(href) => hrefMatches(href, pathname, searchParams)}
                    />
                ))}
            </nav>
        </aside>
    );
}
