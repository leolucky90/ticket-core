type AnimatedBackgroundProps = {
    variant?: "gradient" | "blobs" | "layers";
    className?: string;
};

/**
 * Lightweight CSS-only animated backdrop (no heavy animation libraries).
 * `layers`: slow parallax-like planes for a calmer “product surface” feel.
 */
export function AnimatedBackground({ variant = "gradient", className = "" }: AnimatedBackgroundProps) {
    if (variant === "blobs") {
        return (
            <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
                <div className="builder-blob-a absolute -left-1/4 top-0 h-[55%] w-[55%] rounded-full bg-[color-mix(in_srgb,rgb(var(--accent))_18%,transparent)] blur-3xl" />
                <div className="builder-blob-b absolute bottom-0 right-[-15%] h-[50%] w-[50%] rounded-full bg-[color-mix(in_srgb,rgb(var(--muted))_14%,transparent)] blur-3xl" />
                <div className="builder-blob-c absolute left-1/3 top-1/3 h-[35%] w-[35%] rounded-full bg-[color-mix(in_srgb,rgb(var(--accent))_10%,transparent)] blur-2xl" />
            </div>
        );
    }

    if (variant === "layers") {
        return (
            <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
                <div className="builder-parallax-a absolute -inset-[12%] rounded-[3rem] bg-[color-mix(in_srgb,rgb(var(--panel))_88%,rgb(var(--accent))_12%)] opacity-90" />
                <div className="builder-parallax-b absolute inset-[8%] rounded-[2.5rem] border border-[color-mix(in_srgb,rgb(var(--border))_55%,transparent)] bg-[color-mix(in_srgb,rgb(var(--panel2))_82%,rgb(var(--muted))_18%)] opacity-80" />
                <div className="builder-parallax-c absolute inset-[18%] rounded-[2rem] bg-[color-mix(in_srgb,rgb(var(--accent))_8%,rgb(var(--panel))_92%)] opacity-70" />
                <div className="builder-blob-a absolute -right-1/4 top-1/4 h-[45%] w-[45%] rounded-full bg-[color-mix(in_srgb,rgb(var(--accent))_12%,transparent)] blur-3xl" />
                <div className="builder-blob-b absolute bottom-0 left-[-10%] h-[40%] w-[40%] rounded-full bg-[color-mix(in_srgb,rgb(var(--muted))_10%,transparent)] blur-3xl" />
            </div>
        );
    }

    return (
        <div
            className={`pointer-events-none absolute inset-0 bg-[length:200%_200%] builder-animated-gradient ${className}`}
            aria-hidden
        />
    );
}
