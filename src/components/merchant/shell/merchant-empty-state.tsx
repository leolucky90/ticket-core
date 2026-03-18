import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

type MerchantEmptyStateProps = {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
    className?: string;
};

export function MerchantEmptyState({ icon: Icon = Inbox, title, description, action, className }: MerchantEmptyStateProps) {
    return (
        <div className={cn("rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-5", className)}>
            <div className="flex items-start gap-3">
                <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-2 text-[rgb(var(--muted))]">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[rgb(var(--text))]">{title}</div>
                    <div className="mt-1 text-sm text-[rgb(var(--muted))]">{description}</div>
                    {action ? <div className="mt-3">{action}</div> : null}
                </div>
            </div>
        </div>
    );
}
