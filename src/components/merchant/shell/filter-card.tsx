import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";

type FilterCardProps = {
    title: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
};

export function FilterCard({ title, description, actions, children, className, bodyClassName }: FilterCardProps) {
    return (
        <Card className={cn("space-y-2 p-3", className)}>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h2 className="text-sm font-semibold text-[rgb(var(--text))]">{title}</h2>
                    {description ? <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">{description}</p> : null}
                </div>
                {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            </div>
            <div className={cn("space-y-2", bodyClassName)}>{children}</div>
        </Card>
    );
}
