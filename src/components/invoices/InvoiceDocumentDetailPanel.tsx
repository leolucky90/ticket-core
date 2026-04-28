import { MerchantSectionCard } from "@/components/merchant/shell";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { InvoiceVoidDialog } from "@/components/invoices/InvoiceVoidDialog";
import type { InvoiceLogRecord, ReceiptDocumentRecord } from "@/lib/schema";
import { uiLocale, type UiLanguage } from "@/lib/i18n/ui-text";

type InvoiceDocumentDetailPanelProps = {
    lang: UiLanguage;
    ui: ReturnType<typeof import("@/lib/i18n/ui-text").getUiText>["invoiceAdmin"];
    receiptUi: ReturnType<typeof import("@/lib/i18n/ui-text").getUiText>["receiptWorkspace"];
    document: ReceiptDocumentRecord;
    logs: InvoiceLogRecord[];
    voidAction: (formData: FormData) => Promise<void>;
    voidAndRebuildAction: (formData: FormData) => Promise<void>;
    reissueAction: (formData: FormData) => Promise<void>;
};

function formatMoney(value: number, locale: string, currency: string): string {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(value);
}

function formatDate(value: string, locale: string): string {
    if (!value) return "-";
    const ts = Date.parse(value);
    if (!Number.isFinite(ts)) return "-";
    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(ts);
}

function getDocumentTypeLabel(
    labels: InvoiceDocumentDetailPanelProps["ui"]["documentTypes"],
    documentType: ReceiptDocumentRecord["documentType"],
): string {
    if (documentType === "tax-invoice") return labels.taxInvoice;
    if (documentType === "electronic-invoice") return labels.electronicInvoice;
    return labels[documentType];
}

export function InvoiceDocumentDetailPanel({
    lang,
    ui,
    receiptUi,
    document,
    logs,
    voidAction,
    voidAndRebuildAction,
    reissueAction,
}: InvoiceDocumentDetailPanelProps) {
    const locale = uiLocale(lang);

    return (
        <div className="grid gap-4">
            <MerchantSectionCard
                title={ui.detailTitle}
                description={ui.detailDescription}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {document.status !== "voided" && document.status !== "void_pending" ? (
                            <>
                                <InvoiceVoidDialog
                                    title={ui.voidDialogTitle}
                                    description={ui.voidDialogDescription}
                                    reasonLabel={ui.voidReason}
                                    cancelLabel={ui.cancel}
                                    submitLabel={ui.confirmVoid}
                                    triggerLabel={ui.voidDocument}
                                    documentId={document.id}
                                    action={voidAction}
                                />
                                <InvoiceVoidDialog
                                    title={receiptUi.voidRebuildDialogTitle}
                                    description={receiptUi.voidRebuildDialogDescription}
                                    reasonLabel={receiptUi.voidReason}
                                    cancelLabel={receiptUi.cancel}
                                    submitLabel={receiptUi.confirmVoidRebuild}
                                    triggerLabel={receiptUi.voidAndCorrect}
                                    documentId={document.id}
                                    action={voidAndRebuildAction}
                                />
                            </>
                        ) : null}
                        {document.status === "voided" ? (
                            <form action={reissueAction}>
                                <input type="hidden" name="documentId" value={document.id} />
                                <Button type="submit">{ui.reissueDocument}</Button>
                            </form>
                        ) : null}
                    </div>
                }
                bodyClassName="grid gap-4"
            >
                <div className="flex flex-wrap items-center gap-2">
                    <InvoiceStatusBadge status={document.status} labels={ui.statuses} />
                    <span className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-2.5 py-1 text-xs font-medium text-[rgb(var(--text))]">
                        {getDocumentTypeLabel(ui.documentTypes, document.documentType)}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2.5 py-1 text-xs font-medium text-[rgb(var(--muted))]">
                        {document.integrationMode}
                    </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <div className="grid gap-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-4">
                        <span className="text-xs text-[rgb(var(--muted))]">{ui.documentNo}</span>
                        <span className="text-sm font-medium text-[rgb(var(--text))]">{document.documentNo || "-"}</span>
                    </div>
                    <div className="grid gap-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-4">
                        <span className="text-xs text-[rgb(var(--muted))]">{ui.issuedAt}</span>
                        <span className="text-sm font-medium text-[rgb(var(--text))]">{formatDate(document.issuedAt, locale)}</span>
                    </div>
                    <div className="grid gap-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-4">
                        <span className="text-xs text-[rgb(var(--muted))]">{ui.buyer}</span>
                        <span className="text-sm font-medium text-[rgb(var(--text))]">{document.buyerName || "-"}</span>
                    </div>
                    <div className="grid gap-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-4">
                        <span className="text-xs text-[rgb(var(--muted))]">{ui.platformStatus}</span>
                        <span className="text-sm font-medium text-[rgb(var(--text))]">{ui.platformStatuses[document.platformStatus]}</span>
                    </div>
                </div>

                <div className="grid gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-4 text-sm text-[rgb(var(--text))]">
                    <div>{ui.buyerType}: {ui.buyerTypes[document.buyerType]}</div>
                    <div>{ui.buyerTaxId}: {document.buyerTaxId || "-"}</div>
                    <div>{ui.buyerAbn}: {document.buyerAbn || "-"}</div>
                    <div>{ui.carrier}: {document.carrierType === "none" ? "-" : `${document.carrierType}${document.carrierCode ? ` / ${document.carrierCode}` : ""}`}</div>
                    <div>{ui.donationCode}: {document.donationCode || "-"}</div>
                    <div>{ui.voidReason}: {document.voidReason || "-"}</div>
                    <div>{ui.reissueFrom}: {document.reissueFromDocumentId || "-"}</div>
                    <div>{ui.reissueTo}: {document.reissueToDocumentId || "-"}</div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-[rgb(var(--muted))]">
                                <th className="px-2 py-2">{ui.colItem}</th>
                                <th className="px-2 py-2">{ui.colQty}</th>
                                <th className="px-2 py-2">{ui.colAmount}</th>
                                <th className="px-2 py-2">{ui.colTax}</th>
                                <th className="px-2 py-2">{ui.colTotal}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {document.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-2 py-2">{item.name}</td>
                                    <td className="px-2 py-2">{item.qty}</td>
                                    <td className="px-2 py-2">{formatMoney(item.amount, locale, document.currency)}</td>
                                    <td className="px-2 py-2">{formatMoney(item.taxAmount, locale, document.currency)}</td>
                                    <td className="px-2 py-2">{formatMoney(item.totalAmount, locale, document.currency)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid gap-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-4 text-sm text-[rgb(var(--text))]">
                    <div>{ui.amount}: {formatMoney(document.amount, locale, document.currency)}</div>
                    <div>{ui.taxAmount}: {formatMoney(document.taxAmount, locale, document.currency)}</div>
                    <div className="font-semibold">{ui.totalAmount}: {formatMoney(document.totalAmount, locale, document.currency)}</div>
                </div>
            </MerchantSectionCard>

            <MerchantSectionCard title={ui.logsTitle} description={ui.logsDescription} bodyClassName="grid gap-3">
                {logs.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">{ui.noLogs}</div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="grid gap-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-[rgb(var(--text))]">{ui.logActions[log.action]}</span>
                                <span className="text-xs text-[rgb(var(--muted))]">{formatDate(log.createdAt, locale)}</span>
                            </div>
                            <div className="text-sm text-[rgb(var(--text))]">{log.message}</div>
                            {/* Hide raw platform payload in normal detail UI to reduce noise and prevent exposing low-level internals. */}
                        </div>
                    ))
                )}
            </MerchantSectionCard>
        </div>
    );
}
