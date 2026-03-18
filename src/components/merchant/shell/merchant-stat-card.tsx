import { cn } from "@/components/ui/cn";
import type { MerchantStatItem } from "@/components/merchant/shell/merchant-shell.types";

type MerchantStatCardProps = {
    item: MerchantStatItem;
    className?: string;
};

export function MerchantStatCard({ item, className }: MerchantStatCardProps) {
    return (
        <div className={cn("rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3", className)}>
            <div className="text-xs text-[rgb(var(--muted))]">{item.label}</div>
            <div className="mt-1 text-2xl font-semibold text-[rgb(var(--text))]">{item.value}</div>
            {item.hint ? <div className="mt-1 text-xs text-[rgb(var(--muted))]">{item.hint}</div> : null}
            {item.trend ? <div className="mt-1 text-xs text-[rgb(var(--accent))]">{item.trend}</div> : null}
        </div>
    );
}
