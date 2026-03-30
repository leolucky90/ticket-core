"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { PoDraft } from "@/lib/schema/ai/po-draft";
import type { PurchaseOrderDraft } from "@/lib/types/purchase-order";
import type { DimensionPickerBundle } from "@/lib/types/catalog";
import { emptyDimensionBundle, PoDraftLineItemsEditor } from "@/components/feature/receipt-po/draft-editor";
import { ProcessingOverlay } from "@/components/ui/processing-overlay";
import type { UiLanguage } from "@/lib/i18n/ui-text";
import { getUiText } from "@/lib/i18n/ui-text";

const emptyDraft = (): PoDraft => ({
    documentType: "unknown",
    vendorName: null,
    documentNumber: null,
    documentDate: null,
    currency: null,
    subtotal: null,
    tax: null,
    total: null,
    items: [
        {
            description: "",
            qty: null,
            unitPrice: null,
            amount: null,
            productId: null,
            sku: null,
            nameEntryHint: null,
        },
    ],
    warnings: [],
    confidence: 0,
    rawSummary: "",
});

function cloneDraft(d: PoDraft): PoDraft {
    return {
        ...d,
        items: d.items.map((row) => ({ ...row })),
        warnings: [...d.warnings],
    };
}

type PoDraftEditorProps = {
    lang: UiLanguage;
    draftId: string;
    value: PoDraft;
    onChange: (next: PoDraft) => void;
    onSave: () => Promise<void>;
    onConfirm: () => Promise<void>;
    onDelete: () => Promise<void>;
    busy: boolean;
    dimensionBundle: DimensionPickerBundle;
};

function PoDraftEditor({
    lang,
    draftId,
    value,
    onChange,
    onSave,
    onConfirm,
    onDelete,
    busy,
    dimensionBundle,
}: PoDraftEditorProps) {
    const t = getUiText(lang).receiptPo;

    const setField = useCallback(
        <K extends keyof PoDraft>(key: K, v: PoDraft[K]) => {
            onChange({ ...value, [key]: v });
        },
        [onChange, value],
    );

    const numOrNull = (raw: string): number | null => {
        const n = Number(raw);
        return raw.trim() === "" || !Number.isFinite(n) ? null : n;
    };

    return (
        <div className="space-y-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-5">
            <p className="font-mono text-xs text-[rgb(var(--muted))]">draftId: {draftId}</p>

            <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-[rgb(var(--muted))]">
                    {t.docType}
                    <select
                        value={value.documentType}
                        onChange={(e) =>
                            setField(
                                "documentType",
                                e.target.value as PoDraft["documentType"],
                            )
                        }
                        className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                    >
                        <option value="receipt">{t.receipt}</option>
                        <option value="invoice">{t.invoice}</option>
                        <option value="unknown">{t.unknown}</option>
                    </select>
                </label>
                <label className="block text-xs font-medium text-[rgb(var(--muted))]">
                    {t.vendor}
                    <input
                        value={value.vendorName ?? ""}
                        onChange={(e) => setField("vendorName", e.target.value || null)}
                        className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                    />
                </label>
                <label className="block text-xs font-medium text-[rgb(var(--muted))]">
                    {t.docNo}
                    <input
                        value={value.documentNumber ?? ""}
                        onChange={(e) => setField("documentNumber", e.target.value || null)}
                        className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                    />
                </label>
                <label className="block text-xs font-medium text-[rgb(var(--muted))]">
                    {t.docDate}
                    <input
                        value={value.documentDate ?? ""}
                        onChange={(e) => setField("documentDate", e.target.value || null)}
                        className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                    />
                </label>
                <label className="block text-xs font-medium text-[rgb(var(--muted))]">
                    {t.currency}
                    <input
                        value={value.currency ?? ""}
                        onChange={(e) => setField("currency", e.target.value || null)}
                        className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                    />
                </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                {(
                    [
                        ["subtotal", t.subtotal],
                        ["tax", t.tax],
                        ["total", t.total],
                    ] as const
                ).map(([key, label]) => (
                    <label key={key} className="block text-xs font-medium text-[rgb(var(--muted))]">
                        {label}
                        <input
                            value={value[key] === null || value[key] === undefined ? "" : String(value[key])}
                            onChange={(e) => setField(key, numOrNull(e.target.value))}
                            inputMode="decimal"
                            className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                        />
                    </label>
                ))}
            </div>

            <label className="block text-xs font-medium text-[rgb(var(--muted))]">
                {t.summary}
                <textarea
                    value={value.rawSummary}
                    onChange={(e) => setField("rawSummary", e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                />
            </label>

            <label className="block text-xs font-medium text-[rgb(var(--muted))]">
                {t.confidence}
                <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={value.confidence}
                    onChange={(e) => setField("confidence", Number(e.target.value) || 0)}
                    className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))]"
                />
            </label>

            {value.warnings.length > 0 ? (
                <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
                    <span className="font-medium text-[rgb(var(--text))]">{t.warnings}: </span>
                    {value.warnings.join(" · ")}
                </div>
            ) : null}

            <div className="space-y-2">
                <p className="text-xs font-medium text-[rgb(var(--muted))]">{t.items}</p>
                <PoDraftLineItemsEditor
                    lang={lang}
                    dimensionBundle={dimensionBundle}
                    items={value.items}
                    onItemsChange={(items) => onChange({ ...value, items })}
                />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onSave()}
                    className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-4 py-2 text-sm font-semibold text-[rgb(var(--text))] disabled:opacity-50"
                >
                    {t.saveDraft}
                </button>
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onConfirm()}
                    className="rounded-xl border border-[rgb(var(--accent))] bg-[rgb(var(--accent))] px-4 py-2 text-sm font-semibold text-[rgb(var(--bg))] disabled:opacity-50"
                >
                    {t.confirmPo}
                </button>
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onDelete()}
                    className="rounded-xl border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] disabled:opacity-50"
                >
                    {t.deleteDraft}
                </button>
            </div>
        </div>
    );
}

export type PurchaseOrderAiIntakeCardProps = {
    lang: UiLanguage;
};

export function PurchaseOrderAiIntakeCard({ lang }: PurchaseOrderAiIntakeCardProps) {
    const router = useRouter();
    const t = getUiText(lang).receiptPo;
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        const form = e.currentTarget;
        const input = form.elements.namedItem("file") as HTMLInputElement | null;
        const file = input?.files?.[0];
        if (!file) {
            setError(t.errChooseFile);
            return;
        }
        setBusy(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/document-intake", { method: "POST", body: fd });
            const data = (await res.json()) as { draftId?: string; error?: string };
            if (!res.ok) {
                setError(data.error ?? t.errRequestFailed);
                return;
            }
            if (data.draftId) {
                router.push(`/dashboard/purchase-orders?draftId=${encodeURIComponent(data.draftId)}`);
                router.refresh();
            }
        } catch {
            setError(t.errUploadFailed);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-5">
            <h3 className="text-base font-semibold text-[rgb(var(--text))]">{t.uploadTitle}</h3>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">{t.uploadHint}</p>
            {error ? (
                <p className="mt-2 text-sm text-[rgb(var(--accent))]" role="alert">
                    {error}
                </p>
            ) : null}
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
                <input
                    name="file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="block w-full text-sm text-[rgb(var(--muted))] file:mr-3 file:rounded-lg file:border file:border-[rgb(var(--border))] file:bg-[rgb(var(--panel2))] file:px-3 file:py-2 file:text-sm file:text-[rgb(var(--text))]"
                />
                <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[rgb(var(--accent))] bg-[rgb(var(--accent))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--bg))] transition hover:opacity-90 disabled:opacity-50"
                >
                    {t.submit}
                </button>
            </form>
            {busy ? <ProcessingOverlay title={t.saving} /> : null}
        </div>
    );
}

function purchaseOrderToPoDraft(draft: PurchaseOrderDraft): PoDraft {
    if (draft.poDraftSnapshot) {
        return cloneDraft(draft.poDraftSnapshot);
    }
    return {
        documentType: "unknown",
        vendorName: draft.supplierLabel || null,
        documentNumber: null,
        documentDate: null,
        currency: null,
        subtotal: null,
        tax: null,
        total: null,
        items:
            draft.lines.length > 0
                ? draft.lines.map((l) => ({
                      description: l.label,
                      qty: l.qty,
                      unitPrice: l.unitPrice ?? null,
                      amount: l.amount ?? null,
                      productId: l.productId ?? null,
                      sku: l.sku ?? null,
                      nameEntryHint: null,
                  }))
                : [
                      {
                          description: "",
                          qty: null,
                          unitPrice: null,
                          amount: null,
                          productId: null,
                          sku: null,
                          nameEntryHint: null,
                      },
                  ],
        warnings: [],
        confidence: 0,
        rawSummary: draft.note ?? "",
    };
}

export type PoDraftReviewPanelProps = {
    lang: UiLanguage;
    draft: PurchaseOrderDraft;
    dimensionBundle: DimensionPickerBundle;
};

export function PoDraftReviewPanel({ lang, draft, dimensionBundle }: PoDraftReviewPanelProps) {
    const router = useRouter();
    const t = getUiText(lang).receiptPo;
    const [value, setValue] = useState<PoDraft>(() => purchaseOrderToPoDraft(draft));
    const [busy, setBusy] = useState(false);

    async function save() {
        const parsed = value.items.filter((r) => r.description.trim().length > 0);
        if (parsed.length === 0) return;
        setBusy(true);
        try {
            const body = { ...value, items: parsed };
            const res = await fetch(`/api/po/draft/${encodeURIComponent(draft.id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ poDraft: body }),
            });
            if (!res.ok) {
                const err = (await res.json()) as { error?: string };
                throw new Error(err.error ?? "save failed");
            }
            router.refresh();
        } finally {
            setBusy(false);
        }
    }

    async function confirm() {
        const parsed = value.items.filter((r) => r.description.trim().length > 0);
        if (parsed.length === 0) return;
        setBusy(true);
        try {
            const body = { ...value, items: parsed };
            const res = await fetch("/api/po/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ draftId: draft.id, poDraft: body }),
            });
            if (!res.ok) {
                const err = (await res.json()) as { error?: string };
                throw new Error(err.error ?? "confirm failed");
            }
            router.push("/dashboard/purchase-orders?flash=po_confirmed");
            router.refresh();
        } finally {
            setBusy(false);
        }
    }

    async function remove() {
        setBusy(true);
        try {
            const res = await fetch(`/api/po/draft/${encodeURIComponent(draft.id)}`, { method: "DELETE" });
            if (!res.ok) {
                const err = (await res.json()) as { error?: string };
                throw new Error(err.error ?? "delete failed");
            }
            router.push("/dashboard/purchase-orders");
            router.refresh();
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-3" key={draft.id}>
            <PoDraftEditor
                lang={lang}
                draftId={draft.id}
                value={value}
                onChange={setValue}
                onSave={save}
                onConfirm={confirm}
                onDelete={remove}
                busy={busy}
                dimensionBundle={dimensionBundle}
            />
            {busy ? <ProcessingOverlay title={t.saving} /> : null}
        </div>
    );
}

type ReceiptPoFormProps = {
    lang?: UiLanguage;
    dimensionBundle?: DimensionPickerBundle;
};

export function ReceiptPoForm({ lang = "zh", dimensionBundle }: ReceiptPoFormProps) {
    const t = getUiText(lang).receiptPo;
    const [result, setResult] = useState<{
        draftId: string;
        draft: PoDraft;
    } | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [value, setValue] = useState<PoDraft>(() => emptyDraft());

    async function submitUpload(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        const form = e.currentTarget;
        const input = form.elements.namedItem("file") as HTMLInputElement | null;
        const file = input?.files?.[0];
        if (!file) {
            setError(t.errChooseFile);
            return;
        }
        setBusy(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/document-intake", { method: "POST", body: fd });
            const data = (await res.json()) as { draftId?: string; draft?: PoDraft; error?: string };
            if (res.status === 401) {
                setError(t.loginNote);
                return;
            }
            if (!res.ok) {
                setError(data.error ?? t.errGeneric);
                return;
            }
            if (data.draft && data.draftId) {
                setResult({ draftId: data.draftId, draft: data.draft });
                setValue(cloneDraft(data.draft));
            }
        } catch {
            setError(t.errRequestFailed);
        } finally {
            setBusy(false);
        }
    }

    async function save() {
        if (!result) return;
        const items = value.items.filter((r) => r.description.trim().length > 0);
        if (items.length === 0) return;
        setBusy(true);
        try {
            await fetch(`/api/po/draft/${encodeURIComponent(result.draftId)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ poDraft: { ...value, items } }),
            });
        } finally {
            setBusy(false);
        }
    }

    async function confirm() {
        if (!result) return;
        const items = value.items.filter((r) => r.description.trim().length > 0);
        if (items.length === 0) return;
        setBusy(true);
        try {
            await fetch("/api/po/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ draftId: result.draftId, poDraft: { ...value, items } }),
            });
        } finally {
            setBusy(false);
        }
    }

    async function remove() {
        if (!result) return;
        setBusy(true);
        try {
            await fetch(`/api/po/draft/${encodeURIComponent(result.draftId)}`, { method: "DELETE" });
            setResult(null);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6 p-4">
            <form onSubmit={submitUpload} className="space-y-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-5">
                <h2 className="text-lg font-semibold text-[rgb(var(--text))]">{t.uploadTitle}</h2>
                <p className="text-sm text-[rgb(var(--muted))]">{t.uploadHint}</p>
                {error ? (
                    <p className="text-sm text-[rgb(var(--accent))]" role="alert">
                        {error}
                    </p>
                ) : null}
                <input
                    name="file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="block w-full text-sm text-[rgb(var(--muted))] file:mr-3 file:rounded-lg file:border file:border-[rgb(var(--border))] file:bg-[rgb(var(--panel2))] file:px-3 file:py-2 file:text-sm file:text-[rgb(var(--text))]"
                />
                <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl border border-[rgb(var(--accent))] bg-[rgb(var(--accent))] px-4 py-2 text-sm font-semibold text-[rgb(var(--bg))] disabled:opacity-50"
                >
                    {t.submit}
                </button>
            </form>

            {result ? (
                <PoDraftEditor
                    lang={lang}
                    draftId={result.draftId}
                    value={value}
                    onChange={setValue}
                    onSave={save}
                    onConfirm={confirm}
                    onDelete={remove}
                    busy={busy}
                    dimensionBundle={dimensionBundle ?? emptyDimensionBundle()}
                />
            ) : null}

            {busy ? <ProcessingOverlay title={t.saving} /> : null}
        </div>
    );
}
