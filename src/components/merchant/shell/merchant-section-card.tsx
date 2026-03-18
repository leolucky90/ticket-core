import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { EmptyStateCard } from "@/components/merchant/shell/empty-state-card";
import type { MerchantSectionCardProps } from "@/components/merchant/shell/merchant-shell.types";

export function MerchantSectionCard({ title, description, actions, children, emptyState, className, bodyClassName }: MerchantSectionCardProps) {
    return (
        <Card className={cn("space-y-2.5", className)}>
            {title || description || actions ? (
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        {title ? <h2 className="text-base font-semibold text-[rgb(var(--text))]">{title}</h2> : null}
                        {description ? <p className="mt-1 text-sm text-[rgb(var(--muted))]">{description}</p> : null}
                    </div>
                    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
                </div>
            ) : null}
            <div className={cn("space-y-2.5", bodyClassName)}>
                {emptyState ? (
                    <EmptyStateCard
                        icon={emptyState.icon}
                        title={emptyState.title}
                        description={emptyState.description}
                        action={emptyState.action}
                    />
                ) : (
                    children
                )}
            </div>
        </Card>
    );
}
