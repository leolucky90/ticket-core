"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LinkButton } from "@/components/ui/link-button";
import type { PaymentMethod, Sale } from "@/lib/types/sale";
import type { SalesLabels } from "@/components/sales/sales-labels";
import { CreateSaleModal } from "@/components/sales/CreateSaleModal";

type SalesWorkspaceProps = {
    labels: SalesLabels;
    lang: "zh" | "en";
    keyword: string;
    sales: Sale[];
    paymentText: Record<PaymentMethod, string>;
    createAction: (formData: FormData) => Promise<void>;
    updateAction: (formData: FormData) => Promise<void>;
    deleteAction: (formData: FormData) => Promise<void>;
    flash: string;
    actionTs: string;
    queryTs: string;
};

function formatTime(ts: number, lang: "zh" | "en"): string {
    const locale = lang === "zh" ? "zh-TW" : "en-US";
    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(ts);
}

function formatAmount(value: number, lang: "zh" | "en"): string {
    const locale = lang === "zh" ? "zh-TW" : "en-US";
    return new Intl.NumberFormat(locale).format(value);
}

function formatDateTimeLocal(ts: number): string {
    const d = new Date(ts);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hour = String(d.getHours()).padStart(2, "0");
    const minute = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:${minute}`;
}

type FieldRowProps = {
    label: string;
    children: ReactNode;
};

function FieldRow({ label, children }: FieldRowProps) {
    return (
        <label className="grid gap-1 text-sm">
            <span className="text-xs text-[rgb(var(--muted))]">{label}</span>
            {children}
        </label>
    );
}

export function SalesWorkspace({
    labels,
    lang,
    keyword,
    sales,
    paymentText,
    createAction,
    updateAction,
    deleteAction,
    flash,
    actionTs,
    queryTs,
}: SalesWorkspaceProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [queryAt, setQueryAt] = useState<string>(queryTs || "");
    const queryAtRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!flash) return;
        const key = `sales-flash:${flash}:${actionTs || "no-ts"}`;
        if (typeof window !== "undefined") {
            const seen = window.sessionStorage.getItem(key);
            if (seen === "1") return;
            window.sessionStorage.setItem(key, "1");
        }

        if (flash === "created") window.alert(labels.createdOk);
        if (flash === "updated") window.alert(labels.updatedOk);
        if (flash === "deleted") window.alert(labels.deletedOk);
        if (flash === "invalid") window.alert(labels.invalidInput);

        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("flash");
            url.searchParams.delete("ts");
            window.history.replaceState({}, "", url.toString());
        }
    }, [flash, actionTs, labels.createdOk, labels.updatedOk, labels.deletedOk, labels.invalidInput]);

    const lastQueryText = useMemo(() => {
        if (!queryAt) return "";
        const ts = Number(queryAt);
        if (!Number.isFinite(ts) || ts <= 0) return "";
        return `${labels.lastQueryAt}: ${formatTime(ts, lang)}`;
    }, [queryAt, labels.lastQueryAt, lang]);

    return (
        <>
            <Card>
                <div className="mb-3 text-sm font-semibold">{labels.queryTitle}</div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <form
                        action="/sales"
                        method="get"
                        className="flex w-full flex-col gap-2 sm:flex-row sm:items-center"
                        onSubmit={() => {
                            const ts = String(Date.now());
                            setQueryAt(ts);
                            if (queryAtRef.current) queryAtRef.current.value = ts;
                        }}
                    >
                        <Input type="text" name="q" defaultValue={keyword} placeholder={labels.queryPlaceholder} />
                        <input ref={queryAtRef} type="hidden" name="qt" defaultValue={queryAt} />
                        <Button type="submit" variant="ghost">
                            {labels.queryBtn}
                        </Button>
                        <LinkButton href="/sales">{labels.clearBtn}</LinkButton>
                    </form>
                    <CreateSaleModal
                        createAction={createAction}
                        labels={{
                            addBtn: labels.addBtn,
                            addWindowTitle: labels.addWindowTitle,
                            item: labels.item,
                            amount: labels.amount,
                            checkoutAt: labels.checkoutAt,
                            paymentMethod: labels.paymentMethod,
                            paymentCash: labels.paymentCash,
                            paymentCard: labels.paymentCard,
                            submitCreate: labels.submitCreate,
                            cancelBtn: labels.cancelBtn,
                            closeLabel: labels.closeLabel,
                        }}
                    />
                </div>
                {lastQueryText ? <div className="mt-2 text-xs text-[rgb(var(--muted))]">{lastQueryText}</div> : null}
            </Card>

            <Card>
                <div className="mb-3 text-sm font-semibold">{labels.listTitle}</div>
                <p className="mb-3 text-sm text-[rgb(var(--muted))]">{labels.total}</p>
                <div className="grid gap-3">
                    {sales.map((sale) => (
                        <details
                            key={sale.id}
                            name="sale-accordion"
                            className="rounded-xl border border-[rgb(var(--border))]"
                        >
                            <summary className="flex cursor-pointer list-none flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                                <div className="text-sm font-semibold">
                                    {labels.item}: {sale.item}
                                </div>
                                <div className="text-xs text-[rgb(var(--muted))]">
                                    {labels.amount}: {formatAmount(sale.amount, lang)}
                                </div>
                                <div className="text-xs text-[rgb(var(--muted))]">
                                    {labels.checkoutAt}: {formatTime(sale.checkoutAt, lang)}
                                </div>
                                <div className="text-xs text-[rgb(var(--muted))]">
                                    {labels.paymentMethod}: {paymentText[sale.paymentMethod]}
                                </div>
                                <div className="text-xs text-[rgb(var(--muted))]">{labels.detailsHint}</div>
                            </summary>
                            <div className="border-t border-[rgb(var(--border))] p-3">
                                {editingId === sale.id ? (
                                    <form action={updateAction} className="grid gap-2">
                                        <input type="hidden" name="id" value={sale.id} />
                                        <FieldRow label={`${labels.item}:`}>
                                            <Input type="text" name="item" defaultValue={sale.item} required />
                                        </FieldRow>
                                        <FieldRow label={`${labels.amount}:`}>
                                            <Input type="number" min={0} name="amount" defaultValue={sale.amount} required />
                                        </FieldRow>
                                        <FieldRow label={`${labels.checkoutAt}:`}>
                                            <Input
                                                type="datetime-local"
                                                name="checkoutAt"
                                                defaultValue={formatDateTimeLocal(sale.checkoutAt)}
                                            />
                                        </FieldRow>
                                        <FieldRow label={`${labels.paymentMethod}:`}>
                                            <Select name="paymentMethod" defaultValue={sale.paymentMethod}>
                                                <option value="cash">{labels.paymentCash}</option>
                                                <option value="card">{labels.paymentCard}</option>
                                            </Select>
                                        </FieldRow>
                                        <div className="flex flex-wrap gap-2">
                                            <Button type="submit" variant="ghost">
                                                {labels.updateBtn}
                                            </Button>
                                            <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>
                                                {labels.cancelEditBtn}
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div className="mb-3 grid gap-1 text-sm">
                                            <div>
                                                {labels.item}: {sale.item}
                                            </div>
                                            <div>
                                                {labels.amount}: {formatAmount(sale.amount, lang)}
                                            </div>
                                            <div>
                                                {labels.checkoutAt}: {formatTime(sale.checkoutAt, lang)}
                                            </div>
                                            <div>
                                                {labels.paymentMethod}: {paymentText[sale.paymentMethod]}
                                            </div>
                                            <div>
                                                {labels.createdAt}: {formatTime(sale.createdAt, lang)}
                                            </div>
                                            <div>
                                                {labels.updatedAt}: {formatTime(sale.updatedAt, lang)}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Button type="button" variant="ghost" onClick={() => setEditingId(sale.id)}>
                                                {labels.editBtn}
                                            </Button>
                                            <form
                                                action={deleteAction}
                                                onSubmit={(e) => {
                                                    if (!window.confirm(labels.confirmDelete)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            >
                                                <input type="hidden" name="id" value={sale.id} />
                                                <Button type="submit">{labels.deleteBtn}</Button>
                                            </form>
                                        </div>
                                    </>
                                )}
                            </div>
                        </details>
                    ))}
                </div>
            </Card>
        </>
    );
}
