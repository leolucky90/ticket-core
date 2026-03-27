import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { StaffForm } from "@/components/staff/StaffForm";
import { getPermissionLevels } from "@/lib/services/permission-level.service";
import { createStaff } from "@/lib/services/staff.service";

function toBool(formData: FormData, key: string): boolean {
    return formData.get(key) === "on";
}

export default async function NewStaffPage() {
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
        <MerchantPageShell title="Create Staff" subtitle="建立員工帳號並設定初始權限" width="default">
            <StaffForm mode="create" levels={levels} submitAction={createAction} />
        </MerchantPageShell>
    );
}
