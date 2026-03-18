import Link from "next/link";
import { useId } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/cn";

type IconActionBaseProps = {
    icon: LucideIcon;
    label: string;
    tooltip?: string;
    className?: string;
};

type IconActionButtonAsButton = IconActionBaseProps &
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
        href?: undefined;
    };

type IconActionButtonAsLink = IconActionBaseProps &
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "aria-label" | "type"> & {
        href: string;
    };

type IconActionButtonProps = IconActionButtonAsButton | IconActionButtonAsLink;

function isLinkProps(props: IconActionButtonProps): props is IconActionButtonAsLink {
    return typeof (props as IconActionButtonAsLink).href === "string";
}

const BASE_BUTTON_CLASS =
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] text-[rgb(var(--muted))] transition hover:bg-[rgb(var(--panel2))] hover:text-[rgb(var(--text))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--panel2))]";

const TOOLTIP_CLASS =
    "pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-xs text-[rgb(var(--text))] opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-within:opacity-100";

export function IconActionButton(props: IconActionButtonProps) {
    const tooltipId = useId();
    const tooltipText = props.tooltip ?? props.label;
    const Icon = props.icon;

    if (isLinkProps(props)) {
        const { href, icon, label, tooltip, className, ...linkProps } = props;
        void icon;
        void tooltip;
        return (
            <span className="group relative inline-flex">
                <Link href={href} aria-label={label} aria-describedby={tooltipId} className={cn(BASE_BUTTON_CLASS, className)} {...linkProps}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                </Link>
                <span id={tooltipId} role="tooltip" className={TOOLTIP_CLASS}>
                    {tooltipText}
                </span>
            </span>
        );
    }

    const { icon, label, tooltip, className, type = "button", ...buttonProps } = props;
    void icon;
    void tooltip;
    return (
        <span className="group relative inline-flex">
            <button type={type} aria-label={label} aria-describedby={tooltipId} className={cn(BASE_BUTTON_CLASS, className)} {...buttonProps}>
                <Icon className="h-4 w-4" aria-hidden="true" />
            </button>
            <span id={tooltipId} role="tooltip" className={TOOLTIP_CLASS}>
                {tooltipText}
            </span>
        </span>
    );
}
