import { MerchantStatCard } from "@/components/merchant/shell/merchant-stat-card";
import type { MerchantStatItem } from "@/components/merchant/shell/merchant-shell.types";

type MerchantStatGridProps = {
    items: MerchantStatItem[];
};

export function MerchantStatGrid({ items }: MerchantStatGridProps) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => (
                <MerchantStatCard key={item.id} item={item} />
            ))}
        </div>
    );
}
