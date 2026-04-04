type CarouselDotsProps = {
    count: number;
    activeIndex: number;
    onSelect: (index: number) => void;
    labels: { goTo: string };
};

export function CarouselDots({ count, activeIndex, onSelect, labels }: CarouselDotsProps) {
    if (count <= 0) return null;

    return (
        <div className="flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label={labels.goTo}>
            {Array.from({ length: count }, (_, i) => {
                const active = i === activeIndex;
                return (
                    <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={`h-2.5 rounded-full transition-all ${
                            active ? "w-8 bg-[rgb(var(--accent))]" : "w-2.5 bg-[rgb(var(--border))] hover:bg-[rgb(var(--muted))]"
                        }`}
                        onClick={() => onSelect(i)}
                    />
                );
            })}
        </div>
    );
}
