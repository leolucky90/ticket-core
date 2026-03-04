"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type CreateSaleModalLabels = {
    addBtn: string;
    addWindowTitle: string;
    item: string;
    amount: string;
    checkoutAt: string;
    paymentMethod: string;
    paymentCash: string;
    paymentCard: string;
    submitCreate: string;
    cancelBtn: string;
    closeLabel: string;
};

type CreateSaleModalProps = {
    labels: CreateSaleModalLabels;
    createAction: (formData: FormData) => Promise<void>;
};

export function CreateSaleModal({ labels, createAction }: CreateSaleModalProps) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    return (
        <>
            <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
                {labels.addBtn}
            </Button>

            {open ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-[rgb(var(--bg))]/70"
                        aria-label={labels.closeLabel}
                        onClick={() => setOpen(false)}
                    />

                    <div className="relative z-10 w-full max-w-xl rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4 shadow-xl">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="text-sm font-semibold">{labels.addWindowTitle}</div>
                            <button
                                type="button"
                                className="rounded-md border border-[rgb(var(--border))] px-2 py-1 text-xs hover:border-[rgb(var(--accent))]"
                                aria-label={labels.closeLabel}
                                onClick={() => setOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form action={createAction} className="grid gap-2" onSubmit={() => setOpen(false)}>
                            <Input type="text" name="item" required placeholder={labels.item} />
                            <Input type="number" name="amount" required min={0} placeholder={labels.amount} />
                            <Input type="datetime-local" name="checkoutAt" placeholder={labels.checkoutAt} />
                            <Select name="paymentMethod" defaultValue="cash" aria-label={labels.paymentMethod}>
                                <option value="cash">{labels.paymentCash}</option>
                                <option value="card">{labels.paymentCard}</option>
                            </Select>
                            <div className="mt-1 flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="rounded-xl border border-[rgb(var(--border))] px-4 py-2 text-sm"
                                    onClick={() => setOpen(false)}
                                >
                                    {labels.cancelBtn}
                                </button>
                                <Button type="submit">{labels.submitCreate}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </>
    );
}
