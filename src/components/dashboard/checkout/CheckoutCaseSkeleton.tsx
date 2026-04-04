export function CheckoutCaseSkeleton() {
    return (
        <div className="grid gap-2">
            {Array.from({ length: 2 }).map((_, index) => (
                <div key={`checkout-case-skeleton-${index}`} className="grid gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                    <div className="h-4 w-32 animate-pulse rounded bg-[rgb(var(--border))]" />
                    <div className="h-3 w-48 animate-pulse rounded bg-[rgb(var(--border))]" />
                    <div className="h-3 w-24 animate-pulse rounded bg-[rgb(var(--border))]" />
                </div>
            ))}
        </div>
    );
}
