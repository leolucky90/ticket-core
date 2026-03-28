import Link from "next/link";
import type { MerchantTopbarLink } from "@/components/merchant/shell/merchant-shell.types";

type MerchantTopbarLinkBarProps = {
    links: MerchantTopbarLink[];
};

export function MerchantTopbarLinkBar({ links }: MerchantTopbarLinkBarProps) {
    if (links.length === 0) return null;

    return (
        <nav className="flex items-center gap-2">
            {links.map((link) =>
                link.external ? (
                    <a
                        key={link.id}
                        href={link.href}
                        className="rounded-md border border-[rgb(var(--border))] px-2 py-1 text-xs hover:bg-[rgb(var(--panel2))]"
                    >
                        {link.label}
                    </a>
                ) : (
                    <Link
                        key={link.id}
                        href={link.href}
                        className="rounded-md border border-[rgb(var(--border))] px-2 py-1 text-xs hover:bg-[rgb(var(--panel2))]"
                    >
                        {link.label}
                    </Link>
                ),
            )}
        </nav>
    );
}
