"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/cn";
import type { CustomerProfile } from "@/lib/types/customer";

type CaseCustomerMode = "new" | "existing";

type CaseCustomerSelectorLabels = {
    customerModeLabel: string;
    newCustomerMode: string;
    existingCustomerMode: string;
    existingCustomerSearchPlaceholder: string;
    existingCustomerNoResults: string;
    existingCustomerSelected: string;
    clearExistingCustomer: string;
    customerNamePlaceholder: string;
    customerPhonePlaceholder: string;
    customerEmailPlaceholder: string;
    customerAddressPlaceholder: string;
};

type CaseCustomerSelectorProps = {
    customers: CustomerProfile[];
    labels: CaseCustomerSelectorLabels;
};

function normalizeSearchText(value: string): string {
    return value.trim().toLowerCase();
}

function customerSearchText(customer: CustomerProfile): string {
    return [customer.name, customer.phone].filter(Boolean).join(" ").toLowerCase();
}

export function CaseCustomerSelector({ customers, labels }: CaseCustomerSelectorProps) {
    const [mode, setMode] = useState<CaseCustomerMode>("new");
    const [query, setQuery] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState("");

    const selectedCustomer = useMemo(
        () => customers.find((customer) => customer.id === selectedCustomerId) ?? null,
        [customers, selectedCustomerId],
    );
    const normalizedQuery = normalizeSearchText(query);
    const matches = useMemo(() => {
        if (!normalizedQuery) return [];
        return customers
            .filter((customer) => customerSearchText(customer).includes(normalizedQuery))
            .slice(0, 8);
    }, [customers, normalizedQuery]);

    function setCustomerMode(nextMode: CaseCustomerMode) {
        setMode(nextMode);
        if (nextMode === "new") {
            setQuery("");
            setSelectedCustomerId("");
        }
    }

    function selectCustomer(customer: CustomerProfile) {
        setSelectedCustomerId(customer.id);
        setQuery([customer.name, customer.phone].filter(Boolean).join(" "));
    }

    return (
        <div className="md:col-span-2 grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[rgb(var(--muted))]">{labels.customerModeLabel}</span>
                <div className="inline-flex rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-1">
                    {(["new", "existing"] as const).map((option) => (
                        <label
                            key={option}
                            className={cn(
                                "inline-flex cursor-pointer items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                                mode === option
                                    ? "bg-[rgb(var(--accent))] text-[rgb(var(--bg))]"
                                    : "text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]",
                            )}
                        >
                            <input
                                type="radio"
                                name="customerMode"
                                value={option}
                                checked={mode === option}
                                onChange={() => setCustomerMode(option)}
                                className="sr-only"
                            />
                            {option === "new" ? labels.newCustomerMode : labels.existingCustomerMode}
                        </label>
                    ))}
                </div>
            </div>

            {mode === "new" ? (
                <div className="grid gap-2 md:grid-cols-2">
                    <Input name="customerName" placeholder={labels.customerNamePlaceholder} required />
                    <Input name="customerPhone" placeholder={labels.customerPhonePlaceholder} required />
                    <Input name="customerEmail" type="email" placeholder={labels.customerEmailPlaceholder} />
                    <Input name="customerAddress" placeholder={labels.customerAddressPlaceholder} />
                </div>
            ) : (
                <div className="grid gap-2">
                    <input type="hidden" name="existingCustomerId" value={selectedCustomer?.id ?? ""} readOnly />
                    <input type="hidden" name="customerName" value={selectedCustomer?.name ?? ""} readOnly />
                    <input type="hidden" name="customerPhone" value={selectedCustomer?.phone ?? ""} readOnly />
                    <input type="hidden" name="customerEmail" value={selectedCustomer?.email ?? ""} readOnly />
                    <input type="hidden" name="customerAddress" value={selectedCustomer?.address ?? ""} readOnly />
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" aria-hidden="true" />
                        <Input
                            value={query}
                            onChange={(event) => {
                                setQuery(event.currentTarget.value);
                                setSelectedCustomerId("");
                            }}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" && !selectedCustomer) event.preventDefault();
                            }}
                            placeholder={labels.existingCustomerSearchPlaceholder}
                            className="pl-9 pr-10"
                        />
                        {query ? (
                            <button
                                type="button"
                                aria-label={labels.clearExistingCustomer}
                                title={labels.clearExistingCustomer}
                                className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel2))] hover:text-[rgb(var(--text))]"
                                onClick={() => {
                                    setQuery("");
                                    setSelectedCustomerId("");
                                }}
                            >
                                <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                        ) : null}
                    </div>

                    {selectedCustomer ? (
                        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3 text-sm">
                            <div className="text-xs font-semibold text-[rgb(var(--muted))]">{labels.existingCustomerSelected}</div>
                            <div className="mt-1 font-semibold text-[rgb(var(--text))]">{selectedCustomer.name}</div>
                            <div className="text-xs text-[rgb(var(--muted))]">
                                {[selectedCustomer.phone, selectedCustomer.email].filter(Boolean).join(" / ") || "-"}
                            </div>
                        </div>
                    ) : normalizedQuery ? (
                        <div className="grid gap-2">
                            {matches.length > 0 ? (
                                matches.map((customer) => (
                                    <button
                                        key={customer.id}
                                        type="button"
                                        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-3 text-left text-sm transition hover:border-[rgb(var(--accent))] hover:bg-[rgb(var(--panel2))]"
                                        onClick={() => selectCustomer(customer)}
                                    >
                                        <span className="block font-semibold text-[rgb(var(--text))]">{customer.name}</span>
                                        <span className="block text-xs text-[rgb(var(--muted))]">
                                            {[customer.phone, customer.email].filter(Boolean).join(" / ") || "-"}
                                        </span>
                                    </button>
                                ))
                            ) : (
                                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3 text-sm text-[rgb(var(--muted))]">
                                    {labels.existingCustomerNoResults}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
