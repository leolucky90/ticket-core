"use client";

import { MerchantSectionCard } from "@/components/merchant/shell";
import { CheckoutDocumentModeBadge } from "@/components/dashboard/checkout/CheckoutDocumentModeBadge";
import type { BusinessProfile, CheckoutDocument, RegionalReceiptSettings } from "@/lib/schema";
import type { PaymentMethod, PaymentStatus } from "@/lib/types/sale";
import { buildCheckoutReceiptPreview } from "@/lib/services/checkout/document-service";

type CheckoutReceiptPreviewCardProps = {
    ui: ReturnType<typeof import("@/lib/i18n/ui-text").getUiText>["checkoutWorkspace"];
    locale: string;
    businessProfile: BusinessProfile | null;
    settings: RegionalReceiptSettings;
    document: CheckoutDocument;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    totalAmount: number;
};

export function CheckoutReceiptPreviewCard({
    ui,
    locale,
    businessProfile,
    settings,
    document,
    paymentMethod,
    paymentStatus,
    totalAmount,
}: CheckoutReceiptPreviewCardProps) {
    const preview = buildCheckoutReceiptPreview({
        businessProfile,
        settings,
        document,
        paymentMethod,
        paymentStatus,
        totalAmount,
        locale,
    });

    return (
        <MerchantSectionCard title={ui.receiptPreview} description={ui.receiptPreviewDescription} bodyClassName="grid gap-4">
            <div className="flex flex-wrap gap-2">
                {preview.badges.map((badge) => (
                    <CheckoutDocumentModeBadge key={`checkout-preview-badge-${badge}`} label={badge} active />
                ))}
            </div>
            <div className="grid gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-4">
                <div className="grid gap-1 border-b border-[rgb(var(--border))] pb-3">
                    <span className="text-sm font-semibold text-[rgb(var(--text))]">{preview.headlineValue}</span>
                    <span className="text-xs text-[rgb(var(--muted))]">{preview.documentTitle}</span>
                </div>
                <div className="grid gap-2 pt-1">
                    {preview.lines.map((line) => (
                        <div key={`checkout-preview-line-${line.label}`} className="flex items-start justify-between gap-3 text-sm">
                            <span className="text-[rgb(var(--muted))]">{line.label}</span>
                            <span className="text-right font-medium text-[rgb(var(--text))]">{line.value}</span>
                        </div>
                    ))}
                </div>
                {preview.note ? (
                    <div className="border-t border-[rgb(var(--border))] pt-3 text-sm text-[rgb(var(--muted))]">
                        <span className="font-medium text-[rgb(var(--text))]">{ui.auNoteLabel}</span>
                        <p className="mt-1">{preview.note}</p>
                    </div>
                ) : null}
            </div>
        </MerchantSectionCard>
    );
}
