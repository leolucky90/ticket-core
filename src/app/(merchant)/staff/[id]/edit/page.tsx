import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { StaffForm } from "@/components/staff/StaffForm";
import { getPermissionLevels } from "@/lib/services/permission-level.service";
import { getStaffMemberById, updateStaff } from "@/lib/services/staff.service";

type EditStaffPageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ flash?: string; ts?: string }>;
};

function toBool(formData: FormData, key: string): boolean {
    return formData.get(key) === "on";
}

export default async function EditStaffPage({ params, searchParams }: EditStaffPageProps) {
    const { id } = await params;
    const sp = await searchParams;
    const levels = await getPermissionLevels();
    const staff = await getStaffMemberById(id);
    if (!staff) {
        redirect(`/staff?flash=${encodeURIComponent("找不到員工")}`);
    }

    async function updateAction(formData: FormData): Promise<void> {
        "use server";
        try {
            await updateStaff({
                id: String(formData.get("id") ?? ""),
                name: String(formData.get("name") ?? ""),
                phone: String(formData.get("phone") ?? ""),
                address: String(formData.get("address") ?? ""),
                email: String(formData.get("email") ?? ""),
                roleLevel: Number(formData.get("roleLevel") ?? 1),
                enabled: toBool(formData, "enabled"),
                note: String(formData.get("note") ?? ""),
                mustChangePassword: toBool(formData, "mustChangePassword"),
                isRepairTechnician: toBool(formData, "isRepairTechnician"),
            });
            redirect(`/staff?flash=${encodeURIComponent("員工資料已更新")}&ts=${Date.now()}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : "更新失敗";
            redirect(`/staff/${encodeURIComponent(id)}/edit?flash=${encodeURIComponent(message)}&ts=${Date.now()}`);
        }
    }

    return (
        <MerchantPageShell title="Edit Staff" subtitle="編輯員工資料與權限設定" width="default">
            {sp.flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{sp.flash}</div> : null}
            <StaffForm mode="edit" levels={levels} staff={staff} submitAction={updateAction} />
        </MerchantPageShell>
    );
}
