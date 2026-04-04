import { ChevronLeft, ChevronRight } from "lucide-react";

type CarouselArrowButtonProps = {
    direction: "prev" | "next";
    onClick: () => void;
    disabled?: boolean;
    label: string;
};

export function CarouselArrowButton({ direction, onClick, disabled, label }: CarouselArrowButtonProps) {
    const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
    return (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel))] text-[rgb(var(--text))] shadow-sm transition hover:bg-[rgb(var(--panel2))] disabled:pointer-events-none disabled:opacity-40"
        >
            <Icon className="h-5 w-5" aria-hidden />
        </button>
    );
}
