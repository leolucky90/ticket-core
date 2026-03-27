import Link from "next/link";
import { useId } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/cn";

type IconTextActionBaseProps = {
    icon: LucideIcon;
    label: string;
    tooltip?: string;
    className?: string;
    iconClassName?: string;
    children?: ReactNode;
};

type IconTextActionButtonAsButton = IconTextActionBaseProps &
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
        href?: undefined;
    };

type IconTextActionButtonAsLink = IconTextActionBaseProps &
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "aria-label" | "type"> & {
        href: string;
    };

type IconTextActionButtonProps = IconTextActionButtonAsButton | IconTextActionButtonAsLink;

function isLinkProps(props: IconTextActionButtonProps): props is IconTextActionButtonAsLink {
    return typeof (props as IconTextActionButtonAsLink).href === "string";
}

const BASE_CLASS =
    "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 text-sm text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel2))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--panel2))]";

const TOOLTIP_CLASS =
    "pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-xs text-[rgb(var(--text))] opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-within:opacity-100";

export function IconTextActionButton(props: IconTextActionButtonProps) {
    const tooltipId = useId();
    const tooltipText = props.tooltip ?? props.label;
    const Icon = props.icon;

    if (isLinkProps(props)) {
        const { href, icon, label, tooltip, className, iconClassName, children, ...linkProps } = props;
        void icon;
        void tooltip;

        return (
            <span className="group relative inline-flex">
                <Link href={href} aria-label={label} aria-describedby={tooltipId} className={cn(BASE_CLASS, className)} {...linkProps}>
                    <Icon className={cn("h-4 w-4", iconClassName)} aria-hidden="true" />
                    <span>{children ?? label}</span>
                </Link>
                <span id={tooltipId} role="tooltip" className={TOOLTIP_CLASS}>
                    {tooltipText}
                </span>
            </span>
        );
    }

    const { icon, label, tooltip, className, iconClassName, children, type = "button", ...buttonProps } = props;
    void icon;
    void tooltip;

    return (
        <span className="group relative inline-flex">
            <button type={type} aria-label={label} aria-describedby={tooltipId} className={cn(BASE_CLASS, className)} {...buttonProps}>
                <Icon className={cn("h-4 w-4", iconClassName)} aria-hidden="true" />
                <span>{children ?? label}</span>
            </button>
            <span id={tooltipId} role="tooltip" className={TOOLTIP_CLASS}>
                {tooltipText}
            </span>
        </span>
    );
}
