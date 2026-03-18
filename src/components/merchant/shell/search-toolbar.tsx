import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

type SearchToolbarProps = {
    searchSlot: ReactNode;
    toolsSlot?: ReactNode;
    primaryActionSlot?: ReactNode;
    className?: string;
};

export function SearchToolbar({ searchSlot, toolsSlot, primaryActionSlot, className }: SearchToolbarProps) {
    return (
        <div className={cn("rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-2.5", className)}>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">{searchSlot}</div>
                {toolsSlot ? <div className="flex items-center gap-2">{toolsSlot}</div> : null}
                {primaryActionSlot ? <div className="lg:ml-auto">{primaryActionSlot}</div> : null}
            </div>
        </div>
    );
}
