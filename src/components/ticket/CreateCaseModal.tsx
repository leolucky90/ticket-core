"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
