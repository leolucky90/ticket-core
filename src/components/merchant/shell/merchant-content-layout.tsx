import { cn } from "@/components/ui/cn";
import type { ReactNode } from "react";

type MerchantContentLayoutProps = {
    children: ReactNode;
    className?: string;
};

export function MerchantContentLayout({ children, className }: MerchantContentLayoutProps) {
    return <div className={cn("mx-auto w-full max-w-[1880px] px-4 py-4 sm:px-6 sm:py-6 xl:px-8", className)}>{children}</div>;
}
