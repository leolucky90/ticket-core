"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useUiLanguage } from "@/components/layout/ui-language-provider";
import { cn } from "@/components/ui/cn";
import { MerchantPageHeader } from "@/components/merchant/shell/merchant-page-header";
import type { MerchantPageShellProps } from "@/components/merchant/shell/merchant-shell.types";
import { ProcessingOverlay } from "@/components/ui/processing-overlay";
import { getUiText } from "@/lib/i18n/ui-text";

const WIDTH_CLASS: Record<NonNullable<MerchantPageShellProps["width"]>, string> = {
    default: "max-w-[1320px]",
    overview: "max-w-[1520px]",
    index: "max-w-[1600px]",
    builder: "max-w-[1760px]",
};

export function MerchantPageShell({
    title,
    subtitle,
    actions,
    tabs,
    width = "default",
    children,
    className,
    contentClassName,
}: MerchantPageShellProps) {
    const lang = useUiLanguage();
    const ui = getUiText(lang);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const locationKey = `${pathname}?${searchParams.toString()}`;
    const [pendingLocationKey, setPendingLocationKey] = useState<string | null>(null);

    useEffect(() => {
        if (!pendingLocationKey) return;
        const timer = window.setTimeout(() => setPendingLocationKey(null), 15000);
        return () => window.clearTimeout(timer);
    }, [pendingLocationKey]);

    const isSubmitting = pendingLocationKey !== null;

    return (
        <div
            className={cn("w-full space-y-5", WIDTH_CLASS[width], className)}
            onClickCapture={(event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) return;
                const anchor = target.closest("a");
                if (!(anchor instanceof HTMLAnchorElement)) return;
                if (!anchor.href || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
                const nextUrl = new URL(anchor.href, window.location.href);
                const currentUrl = new URL(window.location.href);
                if (nextUrl.origin !== currentUrl.origin) return;
                if (`${nextUrl.pathname}${nextUrl.search}` === `${currentUrl.pathname}${currentUrl.search}`) return;
                setPendingLocationKey(`${nextUrl.pathname}${nextUrl.search}`);
            }}
            onSubmit={(event) => {
                if (event.defaultPrevented) return;
                setPendingLocationKey(locationKey);
            }}
        >
            {isSubmitting ? (
                <ProcessingOverlay
                    title={ui.processing.pageActionTitle}
                    description={ui.processing.pageActionDescription}
                />
            ) : null}
            <MerchantPageHeader title={title} subtitle={subtitle} actions={actions} tabs={tabs} />
            <div className={cn("w-full space-y-4", contentClassName)}>{children}</div>
        </div>
    );
}
