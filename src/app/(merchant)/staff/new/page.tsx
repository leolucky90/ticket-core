import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { StaffForm } from "@/components/staff/StaffForm";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getPermissionLevels } from "@/lib/services/permission-level.service";
import { createStaff } from "@/lib/services/staff.service";

function toBool(formData: FormData, key: string): boolean {
    return formData.get(key) === "on";
}

export default async function NewStaffPage() {
    const cookieStore = await cookies();
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const uiStaff = getUiText(lang).staffForm;
    const levels = await getPermissionLevels();

    async function createAction(formData: FormData): Promise<void> {
        "use server";
        try {
            await createStaff({
                name: String(formData.get("name") ?? ""),
                phone: String(formData.get("phone") ?? ""),
                address: String(formData.get("address") ?? ""),
                email: String(formData.get("email") ?? ""),
                password: String(formData.get("password") ?? ""),
                roleLevel: Number(formData.get("roleLevel") ?? 1),
                enabled: toBool(formData, "enabled"),
                note: String(formData.get("note") ?? ""),
                mustChangePassword: toBool(formData, "mustChangePassword"),
                isRepairTechnician: toBool(formData, "isRepairTechnician"),
            });
            redirect(`/staff?flash=${encodeURIComponent("員工建立完成")}&ts=${Date.now()}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : "建立員工失敗";
            redirect(`/staff/new?flash=${encodeURIComponent(message)}&ts=${Date.now()}`);
        }
    }

    return (
        <MerchantPageShell title={uiStaff.shellTitleCreate} subtitle={uiStaff.shellSubtitleCreate} width="default">
            <StaffForm mode="create" levels={levels} submitAction={createAction} lang={lang} />
        </MerchantPageShell>
    );
}
