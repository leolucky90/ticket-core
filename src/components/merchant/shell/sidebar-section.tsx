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

type SidebarSectionProps = {
    group: MerchantSidebarGroup;
    collapsed?: boolean;
    isActive: (href: string) => boolean;
    onNavigate?: () => void;
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

export function SidebarSection({ group, collapsed = false, isActive, onNavigate }: SidebarSectionProps) {
    return (
        <section className="space-y-2">
            <h3 className={cn("px-2 text-xs font-semibold tracking-wide text-[rgb(var(--muted))]", collapsed ? "sr-only" : "")}>{group.title}</h3>
            <div className="grid gap-1">
                {group.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon ? SIDEBAR_ICONS[item.icon] : null;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            title={collapsed ? item.label : undefined}
                            onClick={onNavigate}
                            className={cn(
                                "flex min-w-0 items-center rounded-lg border text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--panel))]",
                                collapsed ? "h-10 justify-center px-2" : "h-10 gap-2 px-3",
                                active
                                    ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel2))] text-[rgb(var(--text))]"
                                    : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel2))] hover:text-[rgb(var(--text))]",
                            )}
                        >
                            {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                            {collapsed ? <span className="sr-only">{item.label}</span> : <span className="min-w-0 truncate">{item.label}</span>}
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
