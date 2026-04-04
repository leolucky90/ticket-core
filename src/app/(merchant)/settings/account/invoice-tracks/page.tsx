import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { InvoiceTrackSettingsPanel } from "@/components/invoices/InvoiceTrackSettingsPanel";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getInvoiceTrackSettingsRouteData } from "@/lib/services/merchant/invoice-admin-read-model.service";
import { saveInvoiceTrackSettingFromFormData } from "@/lib/services/merchant/invoice-admin-write.service";

type InvoiceTrackSettingsPageProps = {
    searchParams: Promise<{ flash?: string; ts?: string }>;
};

function buildTabs(ui: ReturnType<typeof getUiText>["invoiceAdmin"]) {
    return [
        { id: "account", label: ui.tabs.account, href: "/settings/account" },
        { id: "invoice-settings", label: ui.tabs.invoiceSettings, href: "/settings/account/invoices" },
        { id: "invoice-tracks", label: ui.tabs.invoiceTracks, href: "/settings/account/invoice-tracks" },
    ];
}

export default async function InvoiceTrackSettingsPage({ searchParams }: InvoiceTrackSettingsPageProps) {
    const sp = await searchParams;
    const lang = getUiLanguage((await cookies()).get("lang")?.value);
    const ui = getUiText(lang).invoiceAdmin;
    const data = await getInvoiceTrackSettingsRouteData();

    if (!data) {
        redirect("/login?next=/settings/account/invoice-tracks");
    }

    async function saveAction(formData: FormData): Promise<void> {
        "use server";

        const updated = await saveInvoiceTrackSettingFromFormData(formData);
        if (!updated) {
            redirect(`/settings/account/invoice-tracks?flash=${encodeURIComponent(ui.trackSaveFailed)}&ts=${Date.now()}`);
        }

        redirect(`/settings/account/invoice-tracks?flash=${encodeURIComponent(ui.trackSaved)}&ts=${Date.now()}`);
    }

    return (
        <MerchantPageShell
            title={ui.trackPageTitle}
            subtitle={ui.trackPageSubtitle}
            width="index"
            tabs={buildTabs(getUiText(lang).invoiceAdmin)}
        >
            <div className="grid gap-4">
                {sp.flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{sp.flash}</div> : null}
                <InvoiceTrackSettingsPanel ui={ui} tracks={data.tracks} saveAction={saveAction} />
            </div>
        </MerchantPageShell>
    );
}
