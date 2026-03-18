import type { ReactNode } from "react";

type MerchantWidgetGridProps = {
    children: ReactNode;
};

export function MerchantWidgetGrid({ children }: MerchantWidgetGridProps) {
    // Sortable widgets are intentionally scoped to overview/builder contexts.
    return <div className="grid gap-4 lg:grid-cols-2">{children}</div>;
}
