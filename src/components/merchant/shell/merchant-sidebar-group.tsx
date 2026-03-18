import Link from "next/link";
import {
    Building2,
    CreditCard,
    Gauge,
    Handshake,
    Megaphone,
    Package,
    ReceiptText,
    Settings2,
    ShoppingBag,
    ShoppingCart,
    Ticket,
    Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/cn";
import type { MerchantSidebarGroup, MerchantSidebarIcon } from "@/components/merchant/shell/merchant-shell.types";

type MerchantSidebarGroupProps = {
    group: MerchantSidebarGroup;
    isActive: (href: string) => boolean;
};

const SIDEBAR_ICONS: Record<MerchantSidebarIcon, LucideIcon> = {
    gauge: Gauge,
    handshake: Handshake,
    "credit-card": CreditCard,
    "receipt-text": ReceiptText,
    ticket: Ticket,
    users: Users,
    package: Package,
    "shopping-bag": ShoppingBag,
    megaphone: Megaphone,
    building: Building2,
    settings: Settings2,
    "shopping-cart": ShoppingCart,
};

export function MerchantSidebarGroup({ group, isActive }: MerchantSidebarGroupProps) {
    return (
        <section className="space-y-2">
            <h3 className="px-2 text-xs font-semibold tracking-wide text-[rgb(var(--muted))]">{group.title}</h3>
            <div className="grid gap-1">
                {group.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon ? SIDEBAR_ICONS[item.icon] : null;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                                active
                                    ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel2))] text-[rgb(var(--text))]"
                                    : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel2))] hover:text-[rgb(var(--text))]",
                            )}
                        >
                            {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                            <span className="min-w-0 truncate">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
