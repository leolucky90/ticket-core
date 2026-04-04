type BuilderUploadNoticeProps = {
    title: string;
    lines: readonly string[];
    className?: string;
};

export function BuilderUploadNotice({ title, lines, className = "" }: BuilderUploadNoticeProps) {
    return (
        <aside
            className={`rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-4 text-sm leading-relaxed text-[rgb(var(--muted))] ${className}`}
            role="note"
        >
            <p className="font-semibold text-[rgb(var(--text))]">{title}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
                {lines.map((line) => (
                    <li key={line}>{line}</li>
                ))}
            </ul>
        </aside>
    );
}
