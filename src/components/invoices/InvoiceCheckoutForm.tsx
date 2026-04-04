"use client";

import { CheckoutDocumentModeBadge } from "@/components/dashboard/checkout/CheckoutDocumentModeBadge";
import { InvoiceBuyerFields } from "@/components/invoices/InvoiceBuyerFields";
import { InvoiceCarrierField } from "@/components/invoices/InvoiceCarrierField";
import type { CheckoutDocument, RegionalReceiptSettings } from "@/lib/schema";

type InvoiceCheckoutFormProps = {
    ui: ReturnType<typeof import("@/lib/i18n/ui-text").getUiText>["checkoutWorkspace"];
    settings: RegionalReceiptSettings;
    document: CheckoutDocument;
    onChange: (updater: (current: CheckoutDocument) => CheckoutDocument) => void;
};

export function InvoiceCheckoutForm({ ui, settings, document, onChange }: InvoiceCheckoutFormProps) {
    return (
        <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
                <CheckoutDocumentModeBadge label={settings.businessRegion === "TW" ? ui.documentRegionTw : ui.documentRegionAu} active />
                <CheckoutDocumentModeBadge label={settings.locale} />
                <CheckoutDocumentModeBadge label={settings.currency} />
                <CheckoutDocumentModeBadge label={settings.timezone} />
            </div>

            <InvoiceBuyerFields ui={ui} settings={settings} document={document} onChange={onChange} />

            {settings.businessRegion === "TW" ? <div className="grid gap-3 md:grid-cols-2"><InvoiceCarrierField ui={ui} settings={settings} document={document} onChange={onChange} /></div> : null}
        </div>
    );
}
