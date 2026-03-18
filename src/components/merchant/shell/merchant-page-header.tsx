"use client";

import type { ReactNode } from "react";
import { PageTabs } from "@/components/merchant/shell/page-tabs";
import { cn } from "@/components/ui/cn";
import type { MerchantPageTab } from "@/components/merchant/shell/merchant-shell.types";

type MerchantPageHeaderProps = {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    tabs?: MerchantPageTab[];
    className?: string;
};

export function MerchantPageHeader({ title, subtitle, actions, tabs, className }: MerchantPageHeaderProps) {
    return (
        <header className={cn("space-y-4", className)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-[rgb(var(--text))]">{title}</h1>
                    {subtitle ? <p className="mt-1 text-sm text-[rgb(var(--muted))]">{subtitle}</p> : null}
                </div>
                {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
            </div>
            {tabs && tabs.length > 0 ? <PageTabs tabs={tabs} /> : null}
        </header>
    );
}
