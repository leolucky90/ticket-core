"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LinkButton } from "@/components/ui/link-button";
import type { QuoteStatus, Ticket, TicketStatus } from "@/lib/types/ticket";
import { CreateCaseModal } from "@/components/ticket/CreateCaseModal";
import type { TicketLabels } from "@/components/ticket/ticket-labels";

type TicketWorkspaceProps = {
    labels: TicketLabels;
    lang: "zh" | "en";
    keyword: string;
    tickets: Ticket[];
    statusText: Record<TicketStatus, string>;
    quoteStatusText: Record<QuoteStatus, string>;
    flowMap: Record<TicketStatus, TicketStatus[]>;
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

function formatCaseNumber(ts: number): string {
    const d = new Date(ts);
    const yy = String(d.getFullYear() % 100).padStart(2, "0");
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${yy}${mo}${dd}${hh}${mm}`;
}

function formatAmount(value: number, lang: "zh" | "en"): string {
    const locale = lang === "zh" ? "zh-TW" : "en-US";
    return new Intl.NumberFormat(locale).format(value);
}

type FieldRowProps = {
    label: string;
    children: ReactNode;
};

type ReadonlyRowProps = {
    label: string;
    value: string;
};

function FieldRow({ label, children }: FieldRowProps) {
    return (
        <label className="grid gap-1 text-sm">
            <span className="text-xs text-[rgb(var(--muted))]">{label}</span>
            {children}
        </label>
    );
}

function ReadonlyRow({ label, value }: ReadonlyRowProps) {
    return (
        <div className="text-sm">
            {label}: {value || "-"}
        </div>
    );
}

export function TicketWorkspace({
    labels,
    lang,
    keyword,
    tickets,
    statusText,
    quoteStatusText,
    flowMap,
    createAction,
    updateAction,
    deleteAction,
    flash,
    actionTs,
    queryTs,
}: TicketWorkspaceProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [quickUpdateId, setQuickUpdateId] = useState<string | null>(null);
    const [queryAt, setQueryAt] = useState<string>(queryTs || "");
    const queryAtRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!flash) return;
        const key = `ticket-flash:${flash}:${actionTs || "no-ts"}`;
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
                        action="/ticket"
                        method="get"
                        className="flex w-full flex-col gap-2 sm:flex-row sm:items-center"
                        onSubmit={() => {
                            const ts = String(Date.now());
                            setQueryAt(ts);
                            if (queryAtRef.current) queryAtRef.current.value = ts;
                        }}
                    >
                        <Input
                            type="text"
                            name="q"
                            defaultValue={keyword}
                            placeholder={labels.queryPlaceholder}
                        />
                        <input ref={queryAtRef} type="hidden" name="qt" defaultValue={queryAt} />
                        <Button type="submit" variant="ghost">
                            {labels.queryBtn}
                        </Button>
                        <LinkButton href="/ticket">{labels.clearBtn}</LinkButton>
                    </form>
                    <CreateCaseModal
                        createAction={createAction}
                        labels={{
                            addBtn: labels.addBtn,
                            addWindowTitle: labels.addWindowTitle,
                            customerName: labels.customerName,
                            customerPhone: labels.customerPhone,
                            customerAddress: labels.customerAddress,
                            customerEmail: labels.customerEmail,
                            deviceName: labels.deviceName,
                            deviceModel: labels.deviceModel,
                            repairReason: labels.repairReason,
                            repairSuggestion: labels.repairSuggestion,
                            note: labels.note,
                            repairAmount: labels.repairAmount,
                            inspectionFee: labels.inspectionFee,
                            quoteStatus: labels.quoteStatus,
                            quoteInspectionEstimate: labels.quoteInspectionEstimate,
                            quoteQuoted: labels.quoteQuoted,
                            quoteRejected: labels.quoteRejected,
                            quoteAccepted: labels.quoteAccepted,
                            submitCreate: labels.submitCreate,
                            cancelBtn: labels.cancelBtn,
                            closeLabel: labels.closeLabel,
                        }}
                    />
                </div>
                {lastQueryText ? (
                    <div className="mt-2 text-xs text-[rgb(var(--muted))]">{lastQueryText}</div>
                ) : null}
            </Card>

            <Card>
                <div className="mb-3 text-sm font-semibold">{labels.listTitle}</div>
                <p className="mb-3 text-sm text-[rgb(var(--muted))]">{labels.total}</p>
                <div className="grid gap-3">
                    {tickets.map((t) => {
                        const isEditing = editingId === t.id;
                        const isQuickUpdating = quickUpdateId === t.id;
                        return (
                            <details
                                key={t.id}
                                name="case-accordion"
                                className="rounded-xl border border-[rgb(var(--border))]"
                            >
                            <summary className="flex cursor-pointer list-none flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                                <div className="text-sm font-semibold">
                                    {labels.customerName}: {t.customer.name}
                                </div>
                                <div className="text-xs text-[rgb(var(--muted))]">
                                    {labels.customerPhone}: {t.customer.phone}
                                </div>
                                <div className="text-xs text-[rgb(var(--muted))]">
                                    {labels.deviceName}: {t.device.name}
                                </div>
                                <div className="text-xs text-[rgb(var(--muted))]">
                                    {labels.updatedAt}: {formatTime(t.updatedAt, lang)}
                                </div>
                                    <div className="text-xs text-[rgb(var(--muted))]">{labels.detailsHint}</div>
                                </summary>
                                <div className="border-t border-[rgb(var(--border))] p-3">
                                    {!isEditing ? (
                                        <>
                                            <div className="mb-2 text-xs text-[rgb(var(--muted))]">
                                                {labels.caseNumber}: {formatCaseNumber(t.createdAt)}
                                            </div>
                                            <div className="mb-2 text-xs text-[rgb(var(--muted))]">
                                                {labels.createdAt}: {formatTime(t.createdAt, lang)}
                                            </div>
                                            <div className="mb-3 grid gap-1 text-sm">
                                                <ReadonlyRow label={labels.customerName} value={t.customer.name} />
                                                <ReadonlyRow label={labels.customerPhone} value={t.customer.phone} />
                                                <ReadonlyRow label={labels.customerAddress} value={t.customer.address} />
                                                <ReadonlyRow label={labels.customerEmail} value={t.customer.email} />
                                                <ReadonlyRow label={labels.deviceName} value={t.device.name} />
                                                <ReadonlyRow label={labels.deviceModel} value={t.device.model} />
                                                <ReadonlyRow label={labels.repairReason} value={t.repairReason} />
                                                <ReadonlyRow
                                                    label={labels.repairSuggestion}
                                                    value={t.repairSuggestion}
                                                />
                                                <ReadonlyRow label={labels.note} value={t.note} />
                                                <ReadonlyRow
                                                    label={labels.repairAmount}
                                                    value={formatAmount(t.repairAmount, lang)}
                                                />
                                                <ReadonlyRow
                                                    label={labels.inspectionFee}
                                                    value={formatAmount(t.inspectionFee, lang)}
                                                />
                                                <ReadonlyRow
                                                    label={labels.pendingFee}
                                                    value={formatAmount(t.pendingFee, lang)}
                                                />
                                                <ReadonlyRow
                                                    label={labels.quoteStatus}
                                                    value={quoteStatusText[t.quoteStatus]}
                                                />
                                                <ReadonlyRow label={labels.status} value={statusText[t.status]} />
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setEditingId(t.id);
                                                        setQuickUpdateId(null);
                                                    }}
                                                >
                                                    {labels.editBtn}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setQuickUpdateId((prev) => (prev === t.id ? null : t.id));
                                                        setEditingId(null);
                                                    }}
                                                >
                                                    {labels.quickUpdateBtn}
                                                </Button>
                                                <form
                                                    action={deleteAction}
                                                    onSubmit={(e) => {
                                                        if (!window.confirm(labels.confirmDelete)) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                >
                                                    <input type="hidden" name="id" value={t.id} />
                                                    <Button type="submit">{labels.deleteBtn}</Button>
                                                </form>
                                            </div>
                                            {isQuickUpdating ? (
                                                <form action={updateAction} className="mt-3 grid gap-2">
                                                    <input type="hidden" name="id" value={t.id} />
                                                    <FieldRow label={`${labels.repairReason}:`}>
                                                        <Textarea
                                                            name="repairReason"
                                                            rows={3}
                                                            defaultValue={t.repairReason}
                                                            placeholder={labels.repairReason}
                                                        />
                                                    </FieldRow>
                                                    <FieldRow label={`${labels.repairSuggestion}:`}>
                                                        <Textarea
                                                            name="repairSuggestion"
                                                            rows={3}
                                                            defaultValue={t.repairSuggestion}
                                                            placeholder={labels.repairSuggestion}
                                                        />
                                                    </FieldRow>
                                                    <FieldRow label={`${labels.note}:`}>
                                                        <Textarea
                                                            name="note"
                                                            rows={3}
                                                            defaultValue={t.note}
                                                            placeholder={labels.note}
                                                        />
                                                    </FieldRow>
                                                    <FieldRow label={`${labels.status}:`}>
                                                        <Select name="status" defaultValue={t.status}>
                                                            {flowMap[t.status].map((statusKey) => (
                                                                <option key={statusKey} value={statusKey}>
                                                                    {labels.status}: {statusText[statusKey]}
                                                                </option>
                                                            ))}
                                                        </Select>
                                                    </FieldRow>
                                                    <FieldRow label={`${labels.quoteStatus}:`}>
                                                        <Select name="quoteStatus" defaultValue={t.quoteStatus}>
                                                            <option value="inspection_estimate">{labels.quoteInspectionEstimate}</option>
                                                            <option value="quoted">{labels.quoteQuoted}</option>
                                                            <option value="rejected">{labels.quoteRejected}</option>
                                                            <option value="accepted">{labels.quoteAccepted}</option>
                                                        </Select>
                                                    </FieldRow>
                                                    <FieldRow label={`${labels.repairAmount}:`}>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            name="repairAmount"
                                                            defaultValue={t.repairAmount}
                                                            placeholder={labels.repairAmount}
                                                        />
                                                    </FieldRow>
                                                    <FieldRow label={`${labels.inspectionFee}:`}>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            name="inspectionFee"
                                                            defaultValue={t.inspectionFee}
                                                            placeholder={labels.inspectionFee}
                                                        />
                                                    </FieldRow>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button type="submit" variant="ghost">
                                                            {labels.quickUpdateBtn}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => setQuickUpdateId(null)}
                                                        >
                                                            {labels.cancelEditBtn}
                                                        </Button>
                                                    </div>
                                                </form>
                                            ) : null}
                                        </>
                                    ) : (
                                        <form action={updateAction} className="grid gap-2">
                                            <input type="hidden" name="id" value={t.id} />
                                            <FieldRow label={`${labels.customerName}:`}>
                                                <Input
                                                    type="text"
                                                    name="customerName"
                                                    defaultValue={t.customer.name}
                                                    required
                                                    placeholder={labels.customerName}
                                                />
                                            </FieldRow>
                                            <FieldRow label={`${labels.customerPhone}:`}>
                                                <Input
                                                    type="text"
                                                    name="customerPhone"
                                                    defaultValue={t.customer.phone}
                                                    required
                                                    placeholder={labels.customerPhone}
                                                />
                                            </FieldRow>
                                            <FieldRow label={`${labels.customerAddress}:`}>
                                                <Input
                                                    type="text"
                                                    name="customerAddress"
                                                    defaultValue={t.customer.address}
                                                    placeholder={labels.customerAddress}
                                                />
                                            </FieldRow>
                                            <FieldRow label={`${labels.customerEmail}:`}>
                                                <Input
                                                    type="email"
                                                    name="customerEmail"
                                                    defaultValue={t.customer.email}
                                                    placeholder={labels.customerEmail}
                                                />
                                            </FieldRow>
                                            <FieldRow label={`${labels.deviceName}:`}>
                                                <Input
                                                    type="text"
                                                    name="deviceName"
                                                    defaultValue={t.device.name}
                                                    required
                                                    placeholder={labels.deviceName}
                                                />
                                            </FieldRow>
                                            <FieldRow label={`${labels.deviceModel}:`}>
                                                <Input
                                                    type="text"
                                                    name="deviceModel"
                                                    defaultValue={t.device.model}
                                                    required
                                                    placeholder={labels.deviceModel}
                                                />
                                            </FieldRow>
                                            <FieldRow label={`${labels.repairReason}:`}>
                                                <Textarea
                                                    name="repairReason"
                                                    rows={3}
                                                    defaultValue={t.repairReason}
                                                    placeholder={labels.repairReason}
                                                />
                                            </FieldRow>
                                            <FieldRow label={`${labels.repairSuggestion}:`}>
                                                <Textarea
                                                    name="repairSuggestion"
                                                    rows={3}
                                                    defaultValue={t.repairSuggestion}
                                                    placeholder={labels.repairSuggestion}
                                                />
                                            </FieldRow>
                                            <FieldRow label={`${labels.note}:`}>
                                                <Textarea
                                                    name="note"
                                                    rows={3}
                                                    defaultValue={t.note}
                                                    placeholder={labels.note}
                                                />
                                            </FieldRow>
                                            <FieldRow label={`${labels.status}:`}>
                                                <Select name="status" defaultValue={t.status}>
                                                    {flowMap[t.status].map((statusKey) => (
                                                        <option key={statusKey} value={statusKey}>
                                                            {labels.status}: {statusText[statusKey]}
                                                        </option>
                                                    ))}
                                                </Select>
                                            </FieldRow>
                                            <FieldRow label={`${labels.quoteStatus}:`}>
                                                <Select name="quoteStatus" defaultValue={t.quoteStatus}>
                                                    <option value="inspection_estimate">{labels.quoteInspectionEstimate}</option>
                                                    <option value="quoted">{labels.quoteQuoted}</option>
                                                    <option value="rejected">{labels.quoteRejected}</option>
                                                    <option value="accepted">{labels.quoteAccepted}</option>
                                                </Select>
                                            </FieldRow>
                                            <FieldRow label={`${labels.repairAmount}:`}>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    name="repairAmount"
                                                    defaultValue={t.repairAmount}
                                                    placeholder={labels.repairAmount}
                                                />
                                            </FieldRow>
                                            <FieldRow label={`${labels.inspectionFee}:`}>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    name="inspectionFee"
                                                    defaultValue={t.inspectionFee}
                                                    placeholder={labels.inspectionFee}
                                                />
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
                                    )}
                                </div>
                            </details>
                        );
                    })}
                </div>
            </Card>
        </>
    );
}
