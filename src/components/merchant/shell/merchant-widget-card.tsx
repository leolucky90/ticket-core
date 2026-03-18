import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import type { ReactNode } from "react";

type MerchantWidgetCardProps = {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
};

export function MerchantWidgetCard({ title, description, children, className }: MerchantWidgetCardProps) {
    return (
        <Card className={cn("space-y-2", className)}>
            <div>
                <h3 className="text-sm font-semibold text-[rgb(var(--text))]">{title}</h3>
                {description ? <p className="mt-1 text-xs text-[rgb(var(--muted))]">{description}</p> : null}
            </div>
            {children}
        </Card>
    );
}
