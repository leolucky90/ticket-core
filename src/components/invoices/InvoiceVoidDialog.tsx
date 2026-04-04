"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type InvoiceVoidDialogProps = {
    title: string;
    description: string;
    reasonLabel: string;
    cancelLabel: string;
    submitLabel: string;
    triggerLabel: string;
    documentId: string;
    action: (formData: FormData) => Promise<void>;
};

export function InvoiceVoidDialog({
    title,
    description,
    reasonLabel,
    cancelLabel,
    submitLabel,
    triggerLabel,
    documentId,
    action,
}: InvoiceVoidDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
                {triggerLabel}
            </Button>
            {open ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
                    <button
                        type="button"
                        className="absolute inset-0 bg-[rgb(var(--bg))]/70"
                        aria-label={cancelLabel}
                        onClick={() => setOpen(false)}
                    />
                    <form action={action} className="relative z-10 grid w-full max-w-md gap-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4 shadow-xl" role="dialog" aria-modal="true">
                        <div className="grid gap-1">
                            <h2 className="text-sm font-semibold text-[rgb(var(--text))]">{title}</h2>
                            <p className="text-sm text-[rgb(var(--muted))]">{description}</p>
                        </div>
                        <input type="hidden" name="documentId" value={documentId} />
                        <label className="grid gap-1 text-sm">
                            <span className="text-xs font-medium text-[rgb(var(--text))]">{reasonLabel}</span>
                            <Textarea name="reason" rows={4} required />
                        </label>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                {cancelLabel}
                            </Button>
                            <Button type="submit">{submitLabel}</Button>
                        </div>
                    </form>
                </div>
            ) : null}
        </>
    );
}
