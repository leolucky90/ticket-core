import { Menu } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/components/ui/cn";

type SidebarToggleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
    expanded: boolean;
    className?: string;
};

export function SidebarToggle({ expanded, className, ...props }: SidebarToggleProps) {
    return (
        <button
            type="button"
            aria-label={expanded ? "收合側邊導覽" : "展開側邊導覽"}
            aria-pressed={expanded}
            className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel2))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--panel))]",
                className,
            )}
            {...props}
        >
            <Menu className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{expanded ? "收合導覽" : "展開導覽"}</span>
        </button>
    );
}
