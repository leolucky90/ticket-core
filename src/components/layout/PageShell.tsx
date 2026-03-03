import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

type PageShellProps = {
    children: ReactNode;
    className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
    return (
        <div className={cn("PageShell", className)}>
            <main className="page main">{children}</main>
        </div>
    )
}