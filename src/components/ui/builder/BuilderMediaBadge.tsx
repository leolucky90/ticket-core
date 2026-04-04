import type { ReactNode } from "react";

type BuilderMediaBadgeProps = {
    children: ReactNode;
    className?: string;
};

export function BuilderMediaBadge({ children, className = "" }: BuilderMediaBadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-2 py-0.5 text-[10px] font-medium text-[rgb(var(--muted))] ${className}`}
        >
            {children}
        </span>
    );
}
