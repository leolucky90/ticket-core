import { cookies } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { StaffForm } from "@/components/staff/StaffForm";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getPermissionLevels } from "@/lib/services/permission-level.service";
import { createStaff } from "@/lib/services/staff.service";

function toBool(formData: FormData, key: string): boolean {
    return formData.get(key) === "on";
}

type NewStaffPageProps = {
    searchParams: Promise<{ flash?: string; ts?: string }>;
};

function formText(formData: FormData, key: string): string {
    return String(formData.get(key) ?? "").trim();
}

export default async function NewStaffPage({ searchParams }: NewStaffPageProps) {
    const cookieStore = await cookies();
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const uiStaff = getUiText(lang).staffForm;
    const levels = await getPermissionLevels();
    const sp = await searchParams;

    async function createAction(formData: FormData): Promise<void> {
        "use server";
        try {
            await createStaff({
                name: formText(formData, "name"),
                phone: formText(formData, "phone"),
                address: formText(formData, "address"),
                email: formText(formData, "email"),
                password: String(formData.get("password") ?? "").trim(),
                roleLevel: Number(formData.get("roleLevel") ?? 1),
                enabled: toBool(formData, "enabled"),
                note: formText(formData, "note"),
                mustChangePassword: toBool(formData, "mustChangePassword"),
                isRepairTechnician: toBool(formData, "isRepairTechnician"),
            });
            redirect(`/staff?flash=${encodeURIComponent(uiStaff.flashCreated)}&ts=${Date.now()}`);
        } catch (error) {
            if (isRedirectError(error)) throw error;
            const message = error instanceof Error ? error.message : uiStaff.flashCreateFailed;
            redirect(`/staff/new?flash=${encodeURIComponent(message)}&ts=${Date.now()}`);
        }
    }

    return (
        <MerchantPageShell title={uiStaff.shellTitleCreate} subtitle={uiStaff.shellSubtitleCreate} width="default">
            {sp.flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{sp.flash}</div> : null}
            <StaffForm mode="create" levels={levels} submitAction={createAction} lang={lang} />
        </MerchantPageShell>
    );
}
