"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type InventoryTopNavProps = {
    lang: "zh" | "en";
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
    const labels =
        lang === "zh"
            ? {
                  stock: "庫存",
                  settings: "庫存設置",
                  stockIn: "入庫",
                  stockOut: "出庫",
                  productManagement: "產品管理",
              }
            : {
                  stock: "Stock",
                  settings: "Stock Setup",
                  stockIn: "Stock In",
                  stockOut: "Stock Out",
                  productManagement: "Product Management",
              };

    const links: Array<{ id: InventoryNavItemId; label: string; desc: string; href: string }> = [
        {
            id: "stock",
            label: labels.stock,
            desc: lang === "zh" ? "庫存摘要與列表" : "Summary and list",
            href: "/dashboard?tab=inventory&inventoryView=stock",
        },
        {
            id: "settings",
            label: labels.settings,
            desc: lang === "zh" ? "參數與資料設置" : "Configure products",
            href: "/dashboard?tab=inventory&inventoryView=settings",
        },
        {
            id: "stock-in",
            label: labels.stockIn,
            desc: lang === "zh" ? "商品數量增加" : "Increase quantity",
            href: "/dashboard?tab=inventory&inventoryView=stock-in",
        },
        {
            id: "stock-out",
            label: labels.stockOut,
            desc: lang === "zh" ? "商品數量扣除" : "Decrease quantity",
            href: "/dashboard?tab=inventory&inventoryView=stock-out",
        },
        {
            id: "product-management",
            label: labels.productManagement,
            desc: lang === "zh" ? "完整產品 CRUD" : "Dedicated CRUD page",
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
