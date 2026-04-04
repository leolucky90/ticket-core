"use client";

import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CheckoutDocument, RegionalReceiptSettings } from "@/lib/schema";

type InvoiceCarrierFieldProps = {
    ui: ReturnType<typeof import("@/lib/i18n/ui-text").getUiText>["checkoutWorkspace"];
    settings: RegionalReceiptSettings;
    document: CheckoutDocument;
    onChange: (updater: (current: CheckoutDocument) => CheckoutDocument) => void;
};

export function InvoiceCarrierField({ ui, settings, document, onChange }: InvoiceCarrierFieldProps) {
    if (settings.businessRegion !== "TW" || !settings.tw.carrierEnabled) {
        return (
            <>
                <input type="hidden" name="checkoutDocument.tw.carrierType" value={document.tw.carrierType} />
                <input type="hidden" name="checkoutDocument.tw.carrierCode" value={document.tw.carrierCode} />
                <input type="hidden" name="checkoutDocument.tw.donationCode" value={document.tw.donationCode} />
            </>
        );
    }

    return (
        <>
            <FormField label={ui.twCarrierTypeLabel}>
                <Select
                    name="checkoutDocument.tw.carrierType"
                    value={document.tw.carrierType}
                    onChange={(event) =>
                        onChange((current) => ({
                            ...current,
                            tw: {
                                ...current.tw,
                                carrierType:
                                    event.target.value === "mobile-barcode"
                                        ? "mobile-barcode"
                                        : event.target.value === "member-carrier"
                                          ? "member-carrier"
                                          : "none",
                            },
                        }))
                    }
                >
                    <option value="none">{ui.twCarrierTypeNone}</option>
                    {settings.tw.mobileBarcodeEnabled ? <option value="mobile-barcode">{ui.twCarrierTypeMobileBarcode}</option> : null}
                    {settings.tw.memberCarrierEnabled ? <option value="member-carrier">{ui.twCarrierTypeMemberCarrier}</option> : null}
                </Select>
            </FormField>

            {document.tw.carrierType !== "none" ? (
                <FormField label={ui.twCarrierCodeLabel}>
                    <Input
                        name="checkoutDocument.tw.carrierCode"
                        value={document.tw.carrierCode}
                        onChange={(event) => onChange((current) => ({ ...current, tw: { ...current.tw, carrierCode: event.target.value } }))}
                    />
                </FormField>
            ) : (
                <input type="hidden" name="checkoutDocument.tw.carrierCode" value={document.tw.carrierCode} />
            )}

            {settings.tw.donationCodeEnabled ? (
                <FormField label={ui.twDonationCodeLabel}>
                    <Input
                        name="checkoutDocument.tw.donationCode"
                        value={document.tw.donationCode}
                        onChange={(event) => onChange((current) => ({ ...current, tw: { ...current.tw, donationCode: event.target.value } }))}
                    />
                </FormField>
            ) : (
                <input type="hidden" name="checkoutDocument.tw.donationCode" value={document.tw.donationCode} />
            )}
        </>
    );
}
