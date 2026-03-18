import { cn } from "@/components/ui/cn";
import type { ReactNode } from "react";

type MerchantListShellProps = {
    toolbar?: ReactNode;
    list: ReactNode;
    detailPanel?: ReactNode;
    pagination?: ReactNode;
    className?: string;
};

export function MerchantListShell({ toolbar, list, detailPanel, pagination, className }: MerchantListShellProps) {
    return (
        <div className={cn("space-y-3", className)}>
            {toolbar}
            {list}
            {detailPanel}
            {pagination}
        </div>
    );
}
