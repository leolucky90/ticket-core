import { cn } from "@/components/ui/cn";
import { MerchantPageHeader } from "@/components/merchant/shell/merchant-page-header";
import type { MerchantPageShellProps } from "@/components/merchant/shell/merchant-shell.types";

const WIDTH_CLASS: Record<NonNullable<MerchantPageShellProps["width"]>, string> = {
    default: "max-w-[1320px]",
    overview: "max-w-[1520px]",
    index: "max-w-[1600px]",
    builder: "max-w-[1760px]",
};

export function MerchantPageShell({
    title,
    subtitle,
    actions,
    tabs,
    width = "default",
    children,
    className,
    contentClassName,
}: MerchantPageShellProps) {
    return (
        <div className={cn("w-full space-y-5", WIDTH_CLASS[width], className)}>
            <MerchantPageHeader title={title} subtitle={subtitle} actions={actions} tabs={tabs} />
            <div className={cn("w-full space-y-4", contentClassName)}>{children}</div>
        </div>
    );
}
