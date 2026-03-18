import { cn } from "@/components/ui/cn";
import type { MerchantToolbarProps } from "@/components/merchant/shell/merchant-shell.types";

export function MerchantToolbar({ searchSlot, filtersSlot, sortSlot, bulkActionsSlot, primaryActionSlot, className }: MerchantToolbarProps) {
    return (
        <div className={cn("rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-2.5", className)}>
            <div className="flex flex-wrap items-center gap-2">
                {searchSlot ? <div className="min-w-0 flex-1">{searchSlot}</div> : null}
                {filtersSlot ? <div className="flex flex-wrap items-center gap-2">{filtersSlot}</div> : null}
                {sortSlot ? <div className="flex flex-wrap items-center gap-2">{sortSlot}</div> : null}
                {bulkActionsSlot ? <div className="flex flex-wrap items-center gap-2">{bulkActionsSlot}</div> : null}
                {primaryActionSlot ? <div className="ml-auto">{primaryActionSlot}</div> : null}
            </div>
        </div>
    );
}
