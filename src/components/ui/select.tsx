import type { SelectHTMLAttributes } from "react";
import { cn } from "@/components/ui/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select(props: SelectProps) {
    return (
        <select
            {...props}
            className={cn(
                "w-full rounded-xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm outline-none",
                props.className,
            )}
        />
    );
}
