"use client";

import { Card } from "@/components/ui/card";
import { useUiLanguage } from "@/components/layout/ui-language-provider";
import type { BusinessProfile, ReceiptTemplatePreviewModel } from "@/lib/schema";
import type { RegionalReceiptSettings } from "@/lib/schema";
import { resolveReceiptTemplatePreviewModel } from "@/lib/schema";
import { getUiText } from "@/lib/i18n/ui-text";

type ReceiptTemplatePreviewProps = {
    businessProfile: BusinessProfile | null;
    settings: RegionalReceiptSettings;
};

function PreviewRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-3 border-b border-dashed border-[rgb(var(--border))] py-2 text-sm last:border-b-0">
            <span className="text-[rgb(var(--muted))]">{label}</span>
            <span className="text-right font-medium text-[rgb(var(--text))]">{value}</span>
        </div>
    );
}

function resolvePreview(settings: RegionalReceiptSettings, businessProfile: BusinessProfile | null): ReceiptTemplatePreviewModel {
    return resolveReceiptTemplatePreviewModel({
        businessProfile,
        regionalReceiptSettings: settings,
    });
}

export function ReceiptTemplatePreview({ businessProfile, settings }: ReceiptTemplatePreviewProps) {
    const lang = useUiLanguage();
    const t = getUiText(lang).receiptTemplatePreview;
    const preview = resolvePreview(settings, businessProfile);

    return (
        <Card className="grid gap-4 bg-[rgb(var(--panel2))]">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                    <h3 className="text-sm font-semibold text-[rgb(var(--text))]">{t.title}</h3>
                    <p className="text-xs text-[rgb(var(--muted))]">{t.description}</p>
                </div>
                <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-1 text-xs font-medium text-[rgb(var(--text))]">
                    {preview.documentTitle}
                </span>
            </div>

            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4">
                <div className="grid gap-1 border-b border-[rgb(var(--border))] pb-4">
                    <div className="text-base font-semibold text-[rgb(var(--text))]">{preview.companyName}</div>
                    <div className="text-sm text-[rgb(var(--muted))]">{preview.displayName}</div>
                </div>

                <div className="grid gap-0 pt-3 font-mono">
                    <PreviewRow label={t.documentTitle} value={preview.documentTitle} />
                    <PreviewRow label={t.invoiceNo} value={preview.invoiceNoPlaceholder} />
                    <PreviewRow label={t.invoiceDate} value={preview.invoiceDatePlaceholder} />
                    {preview.businessRegion === "TW" && preview.showTaxId ? <PreviewRow label={t.taxId} value={preview.taxId} /> : null}
                    {preview.businessRegion === "TW" && preview.showCarrier ? <PreviewRow label={t.carrier} value={t.carrierPlaceholder} /> : null}
                    {preview.businessRegion === "TW" && preview.showDonationCode ? <PreviewRow label={t.donationCode} value={t.donationPlaceholder} /> : null}
                    {preview.businessRegion === "AU" && preview.showAbn ? <PreviewRow label={t.abn} value={preview.abn} /> : null}
                    {preview.businessRegion === "AU" && preview.showSubtotal ? <PreviewRow label={t.subtotal} value={preview.subtotalPlaceholder} /> : null}
                    {preview.businessRegion === "AU" && preview.showGst ? <PreviewRow label={t.gst} value={preview.gstPlaceholder} /> : null}
                    <PreviewRow label={t.total} value={preview.totalPlaceholder} />
                </div>

                <div className="grid gap-2 border-t border-[rgb(var(--border))] pt-4 text-xs text-[rgb(var(--muted))]">
                    <div>
                        <span className="font-medium text-[rgb(var(--text))]">{t.invoiceNote}</span>
                        <p className="mt-1">{preview.invoiceNote || t.notePlaceholder}</p>
                    </div>
                    <div>
                        <span className="font-medium text-[rgb(var(--text))]">{t.receiptNote}</span>
                        <p className="mt-1">{preview.receiptNote || t.notePlaceholder}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
