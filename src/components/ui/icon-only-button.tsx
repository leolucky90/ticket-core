import type { MouseEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";

export type IconOnlyButtonProps = {
    label: string;
    icon: ReactNode;
    form?: string;
    formAction?: string | ((formData: FormData) => void | Promise<void>);
    type?: "button" | "submit" | "reset";
    variant?: "solid" | "ghost";
    className?: string;
    disabled?: boolean;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

/**
 * Square icon-only control with native `title`, `aria-label`, and hover/focus-visible tooltip.
 * Prefer `IconActionButton` when the bordered toolbar icon style matches; use this for `Button`-variant chrome.
 */
export function IconOnlyButton({
    label,
    icon,
    form,
    formAction,
    type = "button",
    variant = "ghost",
    className,
    disabled,
    onClick,
}: IconOnlyButtonProps) {
    return (
        <Button
            form={form}
            formAction={formAction}
            type={type}
            variant={variant}
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
            className={cn("group relative h-10 w-10 !p-0", className)}
        >
            {icon}
            <span className="sr-only">{label}</span>
            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {label}
            </span>
        </Button>
    );
}
