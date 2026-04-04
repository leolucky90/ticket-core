"use client";

import { MerchantSectionCard } from "@/components/merchant/shell";
import { InvoiceCheckoutForm } from "@/components/invoices/InvoiceCheckoutForm";
import type { CheckoutDocument, RegionalReceiptSettings } from "@/lib/schema";

type CheckoutDocumentSettingsCardProps = {
    ui: ReturnType<typeof import("@/lib/i18n/ui-text").getUiText>["checkoutWorkspace"];
    settings: RegionalReceiptSettings;
    document: CheckoutDocument;
    onChange: (updater: (current: CheckoutDocument) => CheckoutDocument) => void;
};

export function CheckoutDocumentSettingsCard({ ui, settings, document, onChange }: CheckoutDocumentSettingsCardProps) {
    return (
        <MerchantSectionCard title={ui.documentSection} description={ui.documentSectionDescription} bodyClassName="grid gap-4">
            <InvoiceCheckoutForm ui={ui} settings={settings} document={document} onChange={onChange} />
        </MerchantSectionCard>
    );
}
