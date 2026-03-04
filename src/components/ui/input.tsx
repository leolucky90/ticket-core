import type { InputHTMLAttributes } from "react";
import { cn } from "@/components/ui/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input(props: InputProps) {
    return (
        <input
            {...props}
            className={cn(
                "w-full rounded-xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm outline-none focus:border-[rgb(var(--accent))]",
                props.className,
            )}
        />
    );
}
