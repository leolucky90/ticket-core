import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type MerchantPageTab = {
    id: string;
    label: string;
    href: string;
};

export type MerchantPageShellProps = {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    tabs?: MerchantPageTab[];
    width?: "default" | "overview" | "index" | "builder";
    children: ReactNode;
    className?: string;
    contentClassName?: string;
};

export type MerchantSectionCardProps = {
    title?: string;
    description?: string;
    actions?: ReactNode;
    children?: ReactNode;
    emptyState?: {
        icon?: LucideIcon;
        title: string;
        description: string;
        action?: ReactNode;
    };
    className?: string;
    bodyClassName?: string;
};

export type MerchantToolbarProps = {
    searchSlot?: ReactNode;
    filtersSlot?: ReactNode;
    sortSlot?: ReactNode;
    bulkActionsSlot?: ReactNode;
    primaryActionSlot?: ReactNode;
    className?: string;
};

export type MerchantListPaginationProps = {
    summary?: ReactNode;
    previousAction?: ReactNode;
    nextAction?: ReactNode;
    className?: string;
};

export type MerchantStatItem = {
    id: string;
    label: string;
    value: string | number;
    hint?: string;
    trend?: string;
};

export type BuilderSectionItem = {
    id: string;
    title: string;
    description?: string;
    enabled?: boolean;
};

export type MerchantSidebarItem = {
    id: string;
    label: string;
    href: string;
    icon?: MerchantSidebarIcon;
};

export type MerchantSidebarGroup = {
    id: string;
    title: string;
    items: MerchantSidebarItem[];
};

export type MerchantTopbarLink = {
    id: string;
    label: string;
    href: string;
    external?: boolean;
};

export type MerchantSidebarIcon =
    | "gauge"
    | "handshake"
    | "credit-card"
    | "receipt-text"
    | "ticket"
    | "users"
    | "package"
    | "shopping-bag"
    | "megaphone"
    | "building"
    | "settings"
    | "shopping-cart";
