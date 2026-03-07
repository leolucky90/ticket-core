"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, Plus, X } from "lucide-react";

type CreateCaseModalLabels = {
    addBtn: string;
    addWindowTitle: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerEmail: string;
    deviceName: string;
    deviceModel: string;
    repairReason: string;
    repairSuggestion: string;
    note: string;
    repairAmount: string;
    inspectionFee: string;
    quoteStatus: string;
    quoteInspectionEstimate: string;
    quoteQuoted: string;
    quoteRejected: string;
    quoteAccepted: string;
    submitCreate: string;
    cancelBtn: string;
    closeLabel: string;
};

type CreateCaseModalProps = {
    labels: CreateCaseModalLabels;
    createAction: (formData: FormData) => Promise<void>;
};

export function CreateCaseModal({ labels, createAction }: CreateCaseModalProps) {
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
            <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(true)}
                aria-label={labels.addBtn}
                className="group relative h-10 w-10 !p-0 flex items-center justify-center"
            >
                <Plus className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                <span className="sr-only">{labels.addBtn}</span>
                <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    {labels.addBtn}
                </span>
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

                        <form
                            action={createAction}
                            className="grid gap-2"
                            onSubmit={() => setOpen(false)}
                        >
                            <Input
                                type="text"
                                name="customerName"
                                required
                                placeholder={labels.customerName}
                            />
                            <Input
                                type="text"
                                name="customerPhone"
                                required
                                placeholder={labels.customerPhone}
                            />
                            <Input
                                type="text"
                                name="customerAddress"
                                placeholder={labels.customerAddress}
                            />
                            <Input
                                type="email"
                                name="customerEmail"
                                placeholder={labels.customerEmail}
                            />
                            <Input
                                type="text"
                                name="deviceName"
                                required
                                placeholder={labels.deviceName}
                            />
                            <Input
                                type="text"
                                name="deviceModel"
                                required
                                placeholder={labels.deviceModel}
                            />
                            <Textarea
                                name="repairReason"
                                rows={3}
                                placeholder={labels.repairReason}
                            />
                            <Textarea
                                name="repairSuggestion"
                                rows={3}
                                placeholder={labels.repairSuggestion}
                            />
                            <Textarea
                                name="note"
                                rows={3}
                                placeholder={labels.note}
                            />
                            <Input
                                type="number"
                                name="repairAmount"
                                min={0}
                                placeholder={labels.repairAmount}
                            />
                            <Input
                                type="number"
                                name="inspectionFee"
                                min={0}
                                placeholder={labels.inspectionFee}
                            />
                            <Select name="quoteStatus" defaultValue="inspection_estimate">
                                <option value="inspection_estimate">{labels.quoteInspectionEstimate}</option>
                                <option value="quoted">{labels.quoteQuoted}</option>
                                <option value="rejected">{labels.quoteRejected}</option>
                                <option value="accepted">{labels.quoteAccepted}</option>
                            </Select>
                            <div className="mt-1 flex justify-end gap-2">
                                <button
                                    type="button"
                                    aria-label={labels.cancelBtn}
                                    className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--border))] p-0 text-sm"
                                    onClick={() => setOpen(false)}
                                >
                                    <X className="h-4 w-4" aria-hidden="true" />
                                    <span className="sr-only">{labels.cancelBtn}</span>
                                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                        {labels.cancelBtn}
                                    </span>
                                </button>
                                <Button
                                    type="submit"
                                    aria-label={labels.submitCreate}
                                    className="group relative h-10 w-10 !p-0 flex items-center justify-center"
                                >
                                    <Check className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                                    <span className="sr-only">{labels.submitCreate}</span>
                                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                        {labels.submitCreate}
                                    </span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </>
    );
}
