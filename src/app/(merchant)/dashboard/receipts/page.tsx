import { Hash, Settings } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReceiptWorkspace } from "@/components/dashboard/ReceiptWorkspace";
import { MerchantPageShell } from "@/components/merchant/shell";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getReceiptDocumentsRouteData } from "@/lib/services/merchant/invoice-admin-read-model.service";
import { parseInvoiceStatus } from "@/lib/services/merchant/invoice-admin-write.service";

type ReceiptsPageProps = {
    searchParams: Promise<{ q?: string; status?: string; pageSize?: string; flash?: string; ts?: string }>;
};

export default async function DashboardReceiptsPage({ searchParams }: ReceiptsPageProps) {
    const sp = await searchParams;
    const lang = getUiLanguage((await cookies()).get("lang")?.value);
    const p = getUiText(lang).merchantStandalonePages.receipts;
    const invoiceUi = getUiText(lang).invoiceAdmin;
    const keyword = (sp.q ?? "").trim();
    const statusFilter = parseInvoiceStatus((sp.status ?? "").trim());
    const limit = Math.max(1, Math.min(200, Number((sp.pageSize ?? "").trim()) || 100));
    const routeData = await getReceiptDocumentsRouteData({
        keyword,
        status: statusFilter,
        limit,
    });

    if (!routeData) {
        redirect("/login?next=/dashboard/receipts");
    }

    return (
        <MerchantPageShell
            title={p.title}
            subtitle={p.subtitle}
            width="index"
            actions={
                <div className="flex flex-wrap gap-2">
                    <IconTextActionButton icon={Settings} href="/settings/account/invoices" label={invoiceUi.settingsPageShort} tooltip={invoiceUi.settingsPageShort} />
                    <IconTextActionButton icon={Hash} href="/settings/account/invoice-tracks" label={invoiceUi.trackPageShort} tooltip={invoiceUi.trackPageShort} />
                </div>
            }
        >
            <div className="grid gap-4">
                {sp.flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{sp.flash}</div> : null}
            <ReceiptWorkspace
                lang={lang}
                documents={routeData.documents}
                keyword={keyword}
                statusFilter={statusFilter}
            />
            </div>
        </MerchantPageShell>
    );
}
