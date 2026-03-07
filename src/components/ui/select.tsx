import type { SelectHTMLAttributes } from "react";
import { cn } from "@/components/ui/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select(props: SelectProps) {
    return (
        <select
            {...props}
            className={cn(
                "ui-select w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--accent))] [&_optgroup]:bg-[rgb(var(--panel))] [&_optgroup]:text-[rgb(var(--text))] [&_option]:bg-[rgb(var(--panel))] [&_option]:text-[rgb(var(--text))]",
                props.className,
            )}
        />
    );
}
