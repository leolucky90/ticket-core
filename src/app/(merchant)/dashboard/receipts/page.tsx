import { Hash, Settings } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReceiptWorkspace } from "@/components/dashboard/ReceiptWorkspace";
import { MerchantPageShell } from "@/components/merchant/shell";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getReceiptDocumentsRouteData } from "@/lib/services/merchant/invoice-admin-read-model.service";
import { parseInvoiceStatus, voidReceiptDocumentFromFormData } from "@/lib/services/merchant/invoice-admin-write.service";

type ReceiptsPageProps = {
    searchParams: Promise<{ q?: string; status?: string; pageSize?: string; flash?: string; ts?: string; view?: string; fromMonth?: string; toMonth?: string }>;
};

function normalizeMonthInput(value: string): string {
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}$/.test(trimmed)) return "";
    const month = Number(trimmed.slice(5, 7));
    if (!Number.isInteger(month) || month < 1 || month > 12) return "";
    return trimmed;
}

function getMonthRangeIso(fromMonth: string, toMonth: string): { fromIso: string; toIso: string } {
    const [fromYear, fromMon] = fromMonth.split("-").map((part) => Number(part));
    const [toYear, toMon] = toMonth.split("-").map((part) => Number(part));
    const fromTs = Date.UTC(fromYear, fromMon - 1, 1, 0, 0, 0, 0);
    const toTs = Date.UTC(toYear, toMon, 1, 0, 0, 0, 0);
    return {
        fromIso: new Date(fromTs).toISOString(),
        toIso: new Date(toTs).toISOString(),
    };
}

export default async function DashboardReceiptsPage({ searchParams }: ReceiptsPageProps) {
    const sp = await searchParams;
    const lang = getUiLanguage((await cookies()).get("lang")?.value);
    const p = getUiText(lang).merchantStandalonePages.receipts;
    const invoiceUi = getUiText(lang).invoiceAdmin;
    const receiptUi = getUiText(lang).receiptWorkspace;
    const keyword = (sp.q ?? "").trim();
    const viewMode = (sp.view ?? "").trim() === "void" ? "void" : "receipts";
    const statusFilter = parseInvoiceStatus((sp.status ?? "").trim());
    const limit = Math.max(1, Math.min(200, Number((sp.pageSize ?? "").trim()) || 100));
    const currentMonth = new Date().toISOString().slice(0, 7);
    const fromMonthRaw = normalizeMonthInput(sp.fromMonth ?? "");
    const toMonthRaw = normalizeMonthInput(sp.toMonth ?? "");
    const fromMonth = fromMonthRaw || currentMonth;
    const toMonth = toMonthRaw || currentMonth;
    const isMonthRangeValid = fromMonth <= toMonth;
    const safeFromMonth = isMonthRangeValid ? fromMonth : currentMonth;
    const safeToMonth = isMonthRangeValid ? toMonth : currentMonth;
    const { fromIso, toIso } = getMonthRangeIso(safeFromMonth, safeToMonth);
    const routeData = await getReceiptDocumentsRouteData({
        keyword,
        status: statusFilter,
        limit,
        issuedAtFrom: fromIso,
        issuedAtTo: toIso,
    });

    if (!routeData) {
        redirect("/login?next=/dashboard/receipts");
    }

    async function voidAction(formData: FormData): Promise<void> {
        "use server";

        const result = await voidReceiptDocumentFromFormData(formData);
        const documentId = String(formData.get("documentId") ?? "");
        const fallback = `/dashboard/receipts?view=${viewMode}&fromMonth=${encodeURIComponent(safeFromMonth)}&toMonth=${encodeURIComponent(safeToMonth)}`;
        if (!result.document) {
            redirect(`${fallback}&flash=${encodeURIComponent(invoiceUi.voidFailed)}&ts=${Date.now()}`);
        }
        const flash =
            result.document.status === "voided"
                ? invoiceUi.voided
                : result.document.status === "void_pending"
                  ? invoiceUi.voidPending
                  : invoiceUi.voidFailed;
        redirect(`${fallback}&flash=${encodeURIComponent(flash)}&ts=${Date.now()}${documentId ? `#${encodeURIComponent(documentId)}` : ""}`);
    }

    async function voidAndRebuildAction(formData: FormData): Promise<void> {
        "use server";

        const result = await voidReceiptDocumentFromFormData(formData);
        const fallback = `/dashboard/receipts?view=${viewMode}&fromMonth=${encodeURIComponent(safeFromMonth)}&toMonth=${encodeURIComponent(safeToMonth)}`;
        if (!result.document) {
            redirect(`${fallback}&flash=${encodeURIComponent(invoiceUi.voidFailed)}&ts=${Date.now()}`);
        }
        if (result.document.status !== "voided" || !result.document.checkoutId) {
            redirect(`${fallback}&flash=${encodeURIComponent(receiptUi.voidRebuildFailed)}&ts=${Date.now()}`);
        }
        redirect(
            `/dashboard/checkout?rebuildSaleId=${encodeURIComponent(result.document.checkoutId)}&rebuildDocumentId=${encodeURIComponent(result.document.id)}&flash=rebuild&ts=${Date.now()}`,
        );
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
                viewMode={viewMode}
                fromMonth={safeFromMonth}
                toMonth={safeToMonth}
                voidAction={voidAction}
                voidAndRebuildAction={voidAndRebuildAction}
            />
            </div>
        </MerchantPageShell>
    );
}
