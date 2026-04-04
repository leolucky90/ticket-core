import type { ReactNode } from "react";

type BuilderSectionLabelProps = {
    children: ReactNode;
    className?: string;
};

export function BuilderSectionLabel({ children, className = "" }: BuilderSectionLabelProps) {
    return (
        <p className={`text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))] ${className}`}>{children}</p>
    );
}
