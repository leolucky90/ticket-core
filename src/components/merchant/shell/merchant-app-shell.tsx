"use client";

import type { MerchantSidebarGroup } from "@/components/merchant/shell/merchant-shell.types";
import { useState } from "react";
import { AppSidebar } from "@/components/merchant/shell/app-sidebar";
import { MerchantContentLayout } from "@/components/merchant/shell/merchant-content-layout";
import { SidebarToggle } from "@/components/merchant/shell/sidebar-toggle";
import { MerchantTopbar } from "@/components/merchant/shell/merchant-topbar";
import { cn } from "@/components/ui/cn";
import type { ReactNode } from "react";

type MerchantAppShellProps = {
    sidebarGroups: MerchantSidebarGroup[];
    topbarActions?: ReactNode;
    children: ReactNode;
    brandHref?: string;
    brandLabel?: string;
};

export function MerchantAppShell({
    sidebarGroups,
    topbarActions,
    children,
    brandHref = "/dashboard",
    brandLabel = "Ticket Core",
}: MerchantAppShellProps) {
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleToggleSidebar = () => {
        if (window.matchMedia("(min-width: 1024px)").matches) {
            setDesktopCollapsed((prev) => !prev);
            return;
        }
        setMobileOpen((prev) => !prev);
    };

    return (
        <div className="min-h-dvh bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
            <MerchantTopbar
                brandHref={brandHref}
                brandLabel={brandLabel}
                actions={topbarActions}
                navigationToggle={<SidebarToggle expanded={mobileOpen || !desktopCollapsed} onClick={handleToggleSidebar} />}
            />
            <MerchantContentLayout>
                <div
                    className={cn(
                        "grid gap-4 lg:gap-5 xl:gap-6",
                        desktopCollapsed
                            ? "lg:grid-cols-[74px_minmax(0,1fr)] xl:grid-cols-[74px_minmax(0,1fr)]"
                            : "lg:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[272px_minmax(0,1fr)]",
                    )}
                >
                    <div className="self-start lg:sticky lg:top-4">
                        <AppSidebar
                            groups={sidebarGroups}
                            desktopCollapsed={desktopCollapsed}
                            mobileOpen={mobileOpen}
                            onCloseMobile={() => setMobileOpen(false)}
                        />
                    </div>
                    <main className="min-w-0 space-y-4">{children}</main>
                </div>
            </MerchantContentLayout>
        </div>
    );
}
