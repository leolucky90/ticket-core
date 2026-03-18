import { cn } from "@/components/ui/cn";
import type { ReactNode } from "react";

type MerchantBuilderShellProps = {
    sectionList?: ReactNode;
    editor: ReactNode;
    preview?: ReactNode;
    className?: string;
};

export function MerchantBuilderShell({ sectionList, editor, preview, className }: MerchantBuilderShellProps) {
    const layoutClass = preview
        ? "grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_minmax(420px,0.95fr)]"
        : sectionList
          ? "grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)]"
          : "grid-cols-1";

    return (
        <div className={cn("grid gap-4 xl:gap-5 2xl:gap-6", layoutClass, className)}>
            {/* Builder shell intentionally switches columns by breakpoint: mobile stacks, desktop expands to usable widths. */}
            {sectionList ? <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4">{sectionList}</div> : null}
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4">{editor}</div>
            {preview ? <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4">{preview}</div> : null}
        </div>
    );
}
