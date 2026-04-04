"use client";

import { MerchantSectionCard } from "@/components/merchant/shell";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CustomerProfile } from "@/lib/types/customer";
import type { CheckoutCustomerMode } from "@/components/dashboard/checkout/checkout-workspace.types";

type CheckoutCustomerCardProps = {
    ui: ReturnType<typeof import("@/lib/i18n/ui-text").getUiText>["checkoutWorkspace"];
    customerMode: CheckoutCustomerMode;
    customerId: string;
    customerQuery: string;
    selectedCustomer: CustomerProfile | null;
    defaultCustomer: { name: string; phone: string; email: string };
    shouldShowSuggestions: boolean;
    suggestions: CustomerProfile[];
    onModeChange: (mode: CheckoutCustomerMode) => void;
    onQueryChange: (value: string) => void;
    onCustomerSelect: (customer: CustomerProfile) => void;
};

export function CheckoutCustomerCard({
    ui,
    customerMode,
    customerId,
    customerQuery,
    selectedCustomer,
    defaultCustomer,
    shouldShowSuggestions,
    suggestions,
    onModeChange,
    onQueryChange,
    onCustomerSelect,
}: CheckoutCustomerCardProps) {
    const activeCustomer = customerMode === "customer" ? selectedCustomer : null;
    const previewName = customerMode === "customer" ? activeCustomer?.name || ui.notSelected : defaultCustomer.name;
    const previewPhone = customerMode === "customer" ? activeCustomer?.phone || "-" : defaultCustomer.phone || "-";
    const previewEmail = customerMode === "customer" ? activeCustomer?.email || "-" : defaultCustomer.email || "-";

    return (
        <MerchantSectionCard title={ui.customerSection} description={ui.customerSectionDescription} bodyClassName="grid gap-3">
            <div className="grid gap-3 md:grid-cols-3">
                <FormField label={ui.customerType}>
                    <Select value={customerMode} onChange={(event) => onModeChange(event.target.value === "customer" ? "customer" : "walkin")}>
                        <option value="walkin">{ui.walkin}</option>
                        <option value="customer">{ui.selectCustomer}</option>
                    </Select>
                </FormField>
                {customerMode === "customer" ? (
                    <FormField label={ui.searchCustomerLabel} className="md:col-span-2">
                        <Input value={customerQuery} onChange={(event) => onQueryChange(event.target.value)} placeholder={ui.searchCustomerPlaceholder} />
                    </FormField>
                ) : null}
            </div>

            {shouldShowSuggestions ? (
                <div className="grid max-h-52 gap-2 overflow-y-auto">
                    {suggestions.length === 0 ? (
                        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3 text-sm text-[rgb(var(--muted))]">
                            {ui.noMatchingCustomers}
                        </div>
                    ) : (
                        suggestions.map((customer) => (
                            <button
                                key={customer.id}
                                type="button"
                                onClick={() => onCustomerSelect(customer)}
                                className={[
                                    "grid gap-1 rounded-xl border px-3 py-3 text-left text-sm transition",
                                    customerId === customer.id
                                        ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel2))]"
                                        : "border-[rgb(var(--border))] bg-[rgb(var(--panel))] hover:bg-[rgb(var(--panel2))]",
                                ].join(" ")}
                            >
                                <span className="font-medium text-[rgb(var(--text))]">{customer.name}</span>
                                <span className="text-xs text-[rgb(var(--muted))]">{customer.phone || "-"} / {customer.email || "-"}</span>
                            </button>
                        ))
                    )}
                </div>
            ) : null}

            <div className="grid gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-4 md:grid-cols-3">
                <div className="grid gap-1">
                    <span className="text-xs text-[rgb(var(--muted))]">{ui.previewCustomer}</span>
                    <span className="text-sm font-medium text-[rgb(var(--text))]">{previewName}</span>
                </div>
                <div className="grid gap-1">
                    <span className="text-xs text-[rgb(var(--muted))]">{ui.customerPhoneLabel}</span>
                    <span className="text-sm text-[rgb(var(--text))]">{previewPhone}</span>
                </div>
                <div className="grid gap-1">
                    <span className="text-xs text-[rgb(var(--muted))]">{ui.customerEmailLabel}</span>
                    <span className="text-sm text-[rgb(var(--text))]">{previewEmail}</span>
                </div>
            </div>

            <input type="hidden" name="customerMode" value={customerMode} />
            <input type="hidden" name="customerId" value={customerMode === "customer" ? customerId : ""} />
            <input type="hidden" name="customerName" value={customerMode === "customer" ? selectedCustomer?.name ?? "" : defaultCustomer.name} />
            <input type="hidden" name="customerPhone" value={customerMode === "customer" ? selectedCustomer?.phone ?? "" : defaultCustomer.phone} />
            <input type="hidden" name="customerEmail" value={customerMode === "customer" ? selectedCustomer?.email ?? "" : defaultCustomer.email} />
        </MerchantSectionCard>
    );
}
