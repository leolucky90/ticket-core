"use client";

import { useId, useState } from "react";
import type { BuilderMediaStorageProvider } from "@/lib/types/builder";
import { BuilderUploadNotice } from "@/components/ui/builder/BuilderUploadNotice";

export type BuilderMediaFieldMode = "url" | "upload";

export type BuilderMediaFieldKind = "image" | "video";

export type BuilderMediaFieldLabels = {
    label: string;
    description?: string;
    urlPlaceholder: string;
    modeUrl: string;
    modeUpload: string;
    uploadImage: string;
    uploadVideo: string;
    uploadDisabledHint: string;
    previewAlt: string;
    helper?: string;
    error?: string;
    toastUnsupported: string;
    noticeTitle: string;
    noticeLines: readonly string[];
};

type BuilderMediaFieldProps = {
    kind: BuilderMediaFieldKind;
    value: string;
    onChange: (next: string) => void;
    labels: BuilderMediaFieldLabels;
    storageProvider?: BuilderMediaStorageProvider;
    className?: string;
};

export function BuilderMediaField({ kind, value, onChange, labels, storageProvider = "external-url", className = "" }: BuilderMediaFieldProps) {
    const id = useId();
    const [mode, setMode] = useState<BuilderMediaFieldMode>("url");

    const showPreview = value.trim().length > 0;

    return (
        <div className={`space-y-3 ${className}`}>
            <div>
                <label htmlFor={id} className="block text-sm font-medium text-[rgb(var(--text))]">
                    {labels.label}
                </label>
                {labels.description ? <p className="mt-1 text-xs text-[rgb(var(--muted))]">{labels.description}</p> : null}
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        mode === "url"
                            ? "bg-[rgb(var(--accent))] text-[rgb(var(--panel))]"
                            : "border border-[rgb(var(--border))] bg-[rgb(var(--panel))] text-[rgb(var(--text))]"
                    }`}
                    onClick={() => setMode("url")}
                >
                    {labels.modeUrl}
                </button>
                <button
                    type="button"
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        mode === "upload"
                            ? "bg-[rgb(var(--accent))] text-[rgb(var(--panel))]"
                            : "border border-[rgb(var(--border))] bg-[rgb(var(--panel))] text-[rgb(var(--text))]"
                    }`}
                    onClick={() => setMode("upload")}
                >
                    {labels.modeUpload}
                </button>
                <span className="self-center text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">
                    {storageProvider === "external-url" ? "external-url" : storageProvider}
                </span>
            </div>

            {mode === "url" ? (
                <input
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={labels.urlPlaceholder}
                    className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2 text-sm text-[rgb(var(--text))] outline-none ring-[rgb(var(--accent))] focus:ring-2"
                />
            ) : (
                <div className="space-y-2">
                    <input type="file" disabled className="hidden" id={`${id}-file`} accept={kind === "image" ? "image/*" : "video/*"} />
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            disabled
                            className="cursor-not-allowed rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-4 py-2 text-sm font-medium text-[rgb(var(--muted))] opacity-60"
                        >
                            {kind === "image" ? labels.uploadImage : labels.uploadVideo}
                        </button>
                    </div>
                    <p className="text-xs text-[rgb(var(--muted))]">{labels.uploadDisabledHint}</p>
                </div>
            )}

            {labels.helper ? <p className="text-xs text-[rgb(var(--muted))]">{labels.helper}</p> : null}
            {labels.error ? (
                <p className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-2 py-1 text-xs font-medium text-[rgb(var(--text))]">
                    {labels.error}
                </p>
            ) : null}

            {showPreview ? (
                <div className="overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]">
                    {kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external preview URL from builder field
                        <img src={value} alt={labels.previewAlt} className="max-h-64 w-full object-contain" />
                    ) : (
                        <video className="max-h-64 w-full" controls muted src={value} playsInline />
                    )}
                </div>
            ) : null}

            <BuilderUploadNotice title={labels.noticeTitle} lines={labels.noticeLines} />
        </div>
    );
}
