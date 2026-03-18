import Link from "next/link";
import type { ReactNode } from "react";

type MerchantTopbarProps = {
    brandHref: string;
    brandLabel: string;
    actions?: ReactNode;
    navigationToggle?: ReactNode;
};

export function MerchantTopbar({ brandHref, brandLabel, actions, navigationToggle }: MerchantTopbarProps) {
    return (
        <header className="border-b border-[rgb(var(--border))] bg-[rgb(var(--panel))]">
            <div className="mx-auto flex w-full max-w-[1880px] items-center justify-between gap-3 px-4 py-3 sm:px-6 xl:px-8">
                <div className="flex min-w-0 items-center gap-2">
                    {navigationToggle}
                    <Link href={brandHref} className="truncate text-base font-semibold text-[rgb(var(--text))]">
                        {brandLabel}
                    </Link>
                </div>
                {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            </div>
        </header>
    );
}
