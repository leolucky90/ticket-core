import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { MerchantEmptyState } from "@/components/merchant/shell/merchant-empty-state";
import { cn } from "@/components/ui/cn";

type EmptyStateCardProps = {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
    className?: string;
};

export function EmptyStateCard({ icon, title, description, action, className }: EmptyStateCardProps) {
    return <MerchantEmptyState icon={icon} title={title} description={description} action={action} className={cn("p-4", className)} />;
}
