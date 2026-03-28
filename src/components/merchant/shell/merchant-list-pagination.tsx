import { cn } from "@/components/ui/cn";
import type { MerchantListPaginationProps } from "@/components/merchant/shell/merchant-shell.types";

export function MerchantListPagination({ summary, previousAction, nextAction, className }: MerchantListPaginationProps) {
    if (!summary && !previousAction && !nextAction) return null;

    return (
        <div className={cn("flex flex-wrap items-center justify-between gap-2 text-xs text-[rgb(var(--muted))]", className)}>
            <div>{summary}</div>
            <div className="flex flex-wrap items-center gap-2">
                {previousAction}
                {nextAction}
            </div>
        </div>
    );
}
