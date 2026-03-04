import Link from "next/link";
import { cn } from "@/components/ui/cn";

type LinkButtonProps = {
    href: string;
    children: string;
    className?: string;
};

export function LinkButton({ href, children, className }: LinkButtonProps) {
    return (
        <Link
            href={href}
            className={cn(
                "inline-flex items-center justify-center rounded-xl border border-[rgb(var(--border))] px-4 py-2 text-sm",
                className,
            )}
        >
            {children}
        </Link>
    );
}
