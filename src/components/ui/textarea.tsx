import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/components/ui/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea(props: TextareaProps) {
    return (
        <textarea
            {...props}
            className={cn(
                "w-full rounded-xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm outline-none focus:border-[rgb(var(--accent))]",
                props.className,
            )}
        />
    );
}
