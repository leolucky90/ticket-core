import { Menu } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/components/ui/cn";

type SidebarToggleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
    expanded: boolean;
    className?: string;
};

export function SidebarToggle({ expanded, className, ...props }: SidebarToggleProps) {
    const label = expanded ? "收合側邊導覽" : "展開側邊導覽";
    const shortLabel = expanded ? "收合導覽" : "展開導覽";
    return (
        <span className="group relative inline-flex">
            <button
                type="button"
                aria-label={label}
                title={label}
                aria-pressed={expanded}
                className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel2))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--panel))]",
                    className,
                )}
                {...props}
            >
                <Menu className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">{shortLabel}</span>
            </button>
            <span
                role="tooltip"
                className="pointer-events-none absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            >
                {label}
            </span>
        </span>
    );
}
