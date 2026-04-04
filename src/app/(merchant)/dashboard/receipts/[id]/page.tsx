import { ArrowLeft, Hash, Settings } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { InvoiceDocumentDetailPanel } from "@/components/invoices/InvoiceDocumentDetailPanel";
import { MerchantPageShell } from "@/components/merchant/shell";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getReceiptDocumentDetailRouteData } from "@/lib/services/merchant/invoice-admin-read-model.service";
import {
    reissueReceiptDocumentFromFormData,
    voidReceiptDocumentFromFormData,
} from "@/lib/services/merchant/invoice-admin-write.service";

type ReceiptDocumentDetailPageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ flash?: string; ts?: string }>;
};

export default async function ReceiptDocumentDetailPage({ params, searchParams }: ReceiptDocumentDetailPageProps) {
    const { id } = await params;
    const sp = await searchParams;
    const lang = getUiLanguage((await cookies()).get("lang")?.value);
    const ui = getUiText(lang).invoiceAdmin;
    const data = await getReceiptDocumentDetailRouteData(id);

    if (!data) {
        redirect(`/dashboard/receipts?flash=${encodeURIComponent(ui.documentNotFound)}`);
    }

    async function voidAction(formData: FormData): Promise<void> {
        "use server";

        const result = await voidReceiptDocumentFromFormData(formData);
        const documentId = String(formData.get("documentId") ?? id);
        if (!result.document) {
            redirect(`/dashboard/receipts/${encodeURIComponent(documentId)}?flash=${encodeURIComponent(ui.voidFailed)}&ts=${Date.now()}`);
        }

        const flash =
            result.document.status === "voided"
                ? ui.voided
                : result.document.status === "void_pending"
                  ? ui.voidPending
                  : ui.voidFailed;
        redirect(`/dashboard/receipts/${encodeURIComponent(documentId)}?flash=${encodeURIComponent(flash)}&ts=${Date.now()}`);
    }

    async function reissueAction(formData: FormData): Promise<void> {
        "use server";

        const next = await reissueReceiptDocumentFromFormData(formData);
        if (!next) {
            redirect(`/dashboard/receipts/${encodeURIComponent(id)}?flash=${encodeURIComponent(ui.reissueFailed)}&ts=${Date.now()}`);
        }

        redirect(`/dashboard/receipts/${encodeURIComponent(next.id)}?flash=${encodeURIComponent(ui.reissued)}&ts=${Date.now()}`);
    }

    return (
        <MerchantPageShell
            title={ui.detailPageTitle}
            subtitle={ui.detailPageSubtitle}
            width="index"
            actions={
                <div className="flex flex-wrap gap-2">
                    <IconTextActionButton icon={ArrowLeft} href="/dashboard/receipts" label={ui.backToList} tooltip={ui.backToList} />
                    <IconTextActionButton icon={Settings} href="/settings/account/invoices" label={ui.settingsPageShort} tooltip={ui.settingsPageShort} />
                    <IconTextActionButton icon={Hash} href="/settings/account/invoice-tracks" label={ui.trackPageShort} tooltip={ui.trackPageShort} />
                </div>
            }
        >
            <div className="grid gap-4">
                {sp.flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{sp.flash}</div> : null}
                <InvoiceDocumentDetailPanel
                    lang={lang}
                    ui={ui}
                    document={data.document}
                    logs={data.logs}
                    voidAction={voidAction}
                    reissueAction={reissueAction}
                />
            </div>
        </MerchantPageShell>
    );
}
