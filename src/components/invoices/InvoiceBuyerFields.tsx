"use client";

import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CheckoutDocument, CheckoutDocumentMode, RegionalReceiptSettings } from "@/lib/schema";
import { allowedCheckoutDocumentModesForRegion } from "@/lib/schema";

type InvoiceBuyerFieldsProps = {
    ui: ReturnType<typeof import("@/lib/i18n/ui-text").getUiText>["checkoutWorkspace"];
    settings: RegionalReceiptSettings;
    document: CheckoutDocument;
    onChange: (updater: (current: CheckoutDocument) => CheckoutDocument) => void;
};

export function InvoiceBuyerFields({ ui, settings, document, onChange }: InvoiceBuyerFieldsProps) {
    const documentModes = allowedCheckoutDocumentModesForRegion(settings.businessRegion);

    return (
        <>
            <div className="grid gap-3 md:grid-cols-2">
                <FormField label={ui.documentModeLabel}>
                    <Select
                        name="checkoutDocument.documentMode"
                        value={document.documentMode}
                        onChange={(event) =>
                            onChange((current) => ({
                                ...current,
                                documentMode: event.target.value as CheckoutDocumentMode,
                            }))
                        }
                    >
                        {documentModes.map((mode) => (
                            <option key={`invoice-checkout-document-mode-${mode}`} value={mode}>
                                {mode === "electronic-invoice"
                                    ? ui.documentModeElectronicInvoice
                                    : mode === "tax-invoice"
                                      ? ui.documentModeTaxInvoice
                                      : mode === "invoice"
                                        ? ui.documentModeInvoice
                                        : ui.documentModeReceipt}
                            </option>
                        ))}
                    </Select>
                </FormField>
                <FormField label={ui.buyerTypeLabel}>
                    <Select
                        name="checkoutDocument.buyerType"
                        value={document.buyerType}
                        onChange={(event) =>
                            onChange((current) => ({
                                ...current,
                                buyerType: event.target.value === "business" ? "business" : "personal",
                            }))
                        }
                    >
                        <option value="personal">{ui.buyerTypePersonal}</option>
                        <option value="business">{ui.buyerTypeBusiness}</option>
                    </Select>
                </FormField>
            </div>

            {settings.businessRegion === "TW" ? (
                <div className="grid gap-3 md:grid-cols-2">
                    {document.buyerType === "business" ? (
                        <FormField label={ui.twBuyerTaxIdLabel}>
                            <Input
                                name="checkoutDocument.tw.taxId"
                                value={document.tw.taxId}
                                onChange={(event) => onChange((current) => ({ ...current, tw: { ...current.tw, taxId: event.target.value } }))}
                            />
                        </FormField>
                    ) : (
                        <input type="hidden" name="checkoutDocument.tw.taxId" value={document.tw.taxId} />
                    )}

                    <FormField label={ui.twPrintModeLabel}>
                        <Select
                            name="checkoutDocument.tw.printMode"
                            value={document.tw.printMode}
                            onChange={(event) =>
                                onChange((current) => ({
                                    ...current,
                                    tw: { ...current.tw, printMode: event.target.value === "print" ? "print" : "display" },
                                }))
                            }
                        >
                            <option value="display">{ui.twPrintModeDisplay}</option>
                            <option value="print">{ui.twPrintModePrint}</option>
                        </Select>
                    </FormField>
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    <FormField label={ui.auBuyerNameLabel}>
                        <Input
                            name="checkoutDocument.au.buyerName"
                            value={document.au.buyerName}
                            onChange={(event) => onChange((current) => ({ ...current, au: { ...current.au, buyerName: event.target.value } }))}
                        />
                    </FormField>
                    {document.buyerType === "business" ? (
                        <FormField label={ui.auBuyerAbnLabel}>
                            <Input
                                name="checkoutDocument.au.buyerAbn"
                                value={document.au.buyerAbn}
                                onChange={(event) => onChange((current) => ({ ...current, au: { ...current.au, buyerAbn: event.target.value } }))}
                            />
                        </FormField>
                    ) : (
                        <input type="hidden" name="checkoutDocument.au.buyerAbn" value={document.au.buyerAbn} />
                    )}

                    {settings.au.showAbnOnReceipt ? (
                        <label className="flex items-start gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3 md:col-span-2">
                            <input type="hidden" name="checkoutDocument.au.showBusinessAbn" value="false" />
                            <input
                                type="checkbox"
                                name="checkoutDocument.au.showBusinessAbn"
                                value="true"
                                checked={document.au.showBusinessAbn}
                                onChange={(event) => onChange((current) => ({ ...current, au: { ...current.au, showBusinessAbn: event.target.checked } }))}
                                className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]"
                            />
                            <span className="grid gap-1">
                                <span className="text-sm font-medium text-[rgb(var(--text))]">{ui.auShowBusinessAbnLabel}</span>
                                <span className="text-xs text-[rgb(var(--muted))]">{ui.auShowBusinessAbnHint}</span>
                            </span>
                        </label>
                    ) : (
                        <input type="hidden" name="checkoutDocument.au.showBusinessAbn" value={document.au.showBusinessAbn ? "true" : "false"} />
                    )}

                    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3 text-sm text-[rgb(var(--muted))] md:col-span-2">
                        {settings.au.gstRegistered && settings.au.showGstBreakdown ? ui.auGstBreakdownEnabled : ui.auGstBreakdownDisabled}
                    </div>
                    <FormField label={ui.auNoteLabel} className="md:col-span-2">
                        <Textarea
                            name="checkoutDocument.au.note"
                            rows={3}
                            value={document.au.note}
                            onChange={(event) => onChange((current) => ({ ...current, au: { ...current.au, note: event.target.value } }))}
                        />
                    </FormField>
                </div>
            )}
        </>
    );
}
