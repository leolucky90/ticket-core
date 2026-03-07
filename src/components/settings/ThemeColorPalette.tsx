"use client";

type ThemeColorPaletteProps = {
    label: string;
    customColorLabel: string;
    customHexValue: string;
    onCustomColorChange: (value: string) => void;
};

export function ThemeColorPalette({
    label,
    customColorLabel,
    customHexValue,
    onCustomColorChange,
}: ThemeColorPaletteProps) {
    const pickerLabel = `${label} - ${customColorLabel}`;

    return (
        <div className="grid gap-2">
            <div className="text-sm text-[rgb(var(--muted))]">{label}</div>
            <div className="flex flex-wrap items-center gap-2">
                <label className="flex h-9 items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 text-xs text-[rgb(var(--muted))]">
                    <span className="sr-only">{pickerLabel}</span>
                    <input
                        type="color"
                        value={customHexValue}
                        aria-label={pickerLabel}
                        onChange={(event) => onCustomColorChange(event.target.value)}
                        className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <span className="font-mono uppercase">{customHexValue}</span>
                </label>
            </div>
        </div>
    );
}
