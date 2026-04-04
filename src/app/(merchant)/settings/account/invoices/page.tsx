import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { InvoiceSettingsForm } from "@/components/invoices/InvoiceSettingsForm";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getInvoiceSettingsRouteData } from "@/lib/services/merchant/invoice-admin-read-model.service";
import { updateInvoiceSettingsFromFormData } from "@/lib/services/merchant/invoice-admin-write.service";

type InvoiceSettingsPageProps = {
    searchParams: Promise<{ flash?: string; ts?: string }>;
};

function buildTabs(ui: ReturnType<typeof getUiText>["invoiceAdmin"]) {
    return [
        { id: "account", label: ui.tabs.account, href: "/settings/account" },
        { id: "invoice-settings", label: ui.tabs.invoiceSettings, href: "/settings/account/invoices" },
        { id: "invoice-tracks", label: ui.tabs.invoiceTracks, href: "/settings/account/invoice-tracks" },
    ];
}

export default async function InvoiceSettingsPage({ searchParams }: InvoiceSettingsPageProps) {
    const sp = await searchParams;
    const lang = getUiLanguage((await cookies()).get("lang")?.value);
    const ui = getUiText(lang).invoiceAdmin;
    const data = await getInvoiceSettingsRouteData();

    if (!data) {
        redirect("/login?next=/settings/account/invoices");
    }

    async function saveAction(formData: FormData): Promise<void> {
        "use server";

        const updated = await updateInvoiceSettingsFromFormData(formData);
        if (!updated) {
            redirect(`/settings/account/invoices?flash=${encodeURIComponent(ui.settingsSaveFailed)}&ts=${Date.now()}`);
        }

        redirect(`/settings/account/invoices?flash=${encodeURIComponent(ui.settingsSaved)}&ts=${Date.now()}`);
    }

    return (
        <MerchantPageShell
            title={ui.settingsPageTitle}
            subtitle={ui.settingsPageSubtitle}
            width="index"
            tabs={buildTabs(getUiText(lang).invoiceAdmin)}
        >
            <div className="grid gap-4">
                {sp.flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{sp.flash}</div> : null}
                <InvoiceSettingsForm ui={ui} settings={data.settings} saveAction={saveAction} />
            </div>
        </MerchantPageShell>
    );
}
