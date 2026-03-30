"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { getUiText } from "@/lib/i18n/ui-text";
import type { UiLanguage } from "@/lib/i18n/ui-text";

type InventoryTopNavProps = {
    lang: UiLanguage;
};

type InventoryView = "stock" | "settings" | "stock-in" | "stock-out";
type InventoryNavItemId = InventoryView | "product-management";

function toInventoryView(value: string | null): InventoryView {
    if (value === "settings") return "settings";
    if (value === "stock-in") return "stock-in";
    if (value === "stock-out") return "stock-out";
    return "stock";
}

export function InventoryTopNav({ lang }: InventoryTopNavProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const onInventoryTab = pathname === "/dashboard" && searchParams.get("tab") === "inventory";
    const onProductManagementPage = pathname === "/dashboard/products";
    if (!onInventoryTab && !onProductManagementPage) return null;

    const activeView: InventoryNavItemId = onProductManagementPage
        ? "product-management"
        : toInventoryView(searchParams.get("inventoryView"));
    const nav = getUiText(lang).inventoryNav;

    const links: Array<{ id: InventoryNavItemId; label: string; desc: string; href: string }> = [
        {
            id: "stock",
            label: nav.stock,
            desc: nav.descStock,
            href: "/dashboard?tab=inventory&inventoryView=stock",
        },
        {
            id: "settings",
            label: nav.settings,
            desc: nav.descSettings,
            href: "/dashboard?tab=inventory&inventoryView=settings",
        },
        {
            id: "stock-in",
            label: nav.stockIn,
            desc: nav.descStockIn,
            href: "/dashboard?tab=inventory&inventoryView=stock-in",
        },
        {
            id: "stock-out",
            label: nav.stockOut,
            desc: nav.descStockOut,
            href: "/dashboard?tab=inventory&inventoryView=stock-out",
        },
        {
            id: "product-management",
            label: nav.productManagement,
            desc: nav.descProductManagement,
            href: "/dashboard/products",
        },
    ];

    return (
        <div className="border-t border-[rgb(var(--border))]">
            <div className="mx-auto grid w-full max-w-7xl gap-2 px-4 pb-3 sm:grid-cols-3 sm:px-6 lg:grid-cols-5">
                {links.map((link) => {
                    const active = link.id === activeView;
                    return (
                        <Link
                            key={link.id}
                            href={link.href}
                            className={[
                                "rounded-xl border px-3 py-2 text-sm transition",
                                "grid gap-0.5",
                                active
                                    ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel))] shadow-sm"
                                    : "border-[rgb(var(--border))] bg-[rgb(var(--panel2))] text-[rgb(var(--muted))] hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--text))]",
                            ].join(" ")}
                        >
                            <span className="font-semibold">{link.label}</span>
                            <span className="text-xs text-[rgb(var(--muted))]">{link.desc}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
