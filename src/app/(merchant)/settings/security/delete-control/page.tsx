import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { DeleteControlSettingsForm } from "@/components/settings/DeleteControlSettingsForm";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getSecuritySettings, updateSecuritySettings } from "@/lib/services/security-settings.service";

type DeleteControlPageProps = {
    searchParams: Promise<{
        flash?: string;
        ts?: string;
    }>;
};

function toBool(formData: FormData, key: string): boolean {
    return formData.get(key) === "on";
}

function toLevel(formData: FormData, key: string, fallback: number): number {
    const value = Number(formData.get(key));
    if (!Number.isFinite(value)) return fallback;
    return Math.min(9, Math.max(1, Math.round(value)));
}

export default async function DeleteControlPage({ searchParams }: DeleteControlPageProps) {
    const cookieStore = await cookies();
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const ui = getUiText(lang).deleteControl;
    const settings = await getSecuritySettings();
    const sp = await searchParams;

    async function saveAction(formData: FormData): Promise<void> {
        "use server";
        try {
            await updateSecuritySettings({
                patch: {
                    deleteButtonEnabled: toBool(formData, "deleteButtonEnabled"),
                    requirePasswordWhenDeleteDisabled: toBool(formData, "requirePasswordWhenDeleteDisabled"),
                    requireSecondConfirmation: toBool(formData, "requireSecondConfirmation"),
                    requireReasonOnDelete: toBool(formData, "requireReasonOnDelete"),
                    deleteAuditLogEnabled: toBool(formData, "deleteAuditLogEnabled"),
                    softDeleteOnly: toBool(formData, "softDeleteOnly"),
                    allowLevelToDeleteFrom: toLevel(formData, "allowLevelToDeleteFrom", 5),
                    restoreEnabled: toBool(formData, "restoreEnabled"),
                    hardDeleteEnabled: toBool(formData, "hardDeleteEnabled"),
                    allowLevelToHardDeleteFrom: toLevel(formData, "allowLevelToHardDeleteFrom", 9),
                    requirePasswordForHardDelete: toBool(formData, "requirePasswordForHardDelete"),
                    requireReasonOnHardDelete: toBool(formData, "requireReasonOnHardDelete"),
                    employeeRestoreLevel: toLevel(formData, "employeeRestoreLevel", 8),
                    employeeHardDeleteLevel: toLevel(formData, "employeeHardDeleteLevel", 9),
                    employeeStrictOwnerOnly: toBool(formData, "employeeStrictOwnerOnly"),
                },
            });
            redirect(`/settings/security/delete-control?flash=${encodeURIComponent(ui.updated)}&ts=${Date.now()}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : ui.updateFailed;
            redirect(`/settings/security/delete-control?flash=${encodeURIComponent(message)}&ts=${Date.now()}`);
        }
    }

    return (
        <MerchantPageShell title={ui.pageTitle} subtitle={ui.pageSubtitle} width="index">
            {sp.flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{sp.flash}</div> : null}
            <DeleteControlSettingsForm settings={settings} canEdit={true} saveAction={saveAction} lang={lang} />
        </MerchantPageShell>
    );
}
