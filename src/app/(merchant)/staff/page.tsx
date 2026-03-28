import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { MerchantPageShell } from "@/components/merchant/shell";
import { StaffManagementPanel } from "@/components/staff/StaffManagementPanel";
import { deactivateStaff, listStaffMembers, resetStaffPassword, softDeleteStaff } from "@/lib/services/staff.service";

type StaffPageProps = {
    searchParams: Promise<{
        keyword?: string;
        flash?: string;
        ts?: string;
    }>;
};

function redirectWithFlash(message: string): never {
    redirect(`/staff?flash=${encodeURIComponent(message)}&ts=${Date.now()}`);
}

export default async function StaffPage({ searchParams }: StaffPageProps) {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";
    const sp = await searchParams;
    const keyword = (sp.keyword ?? "").trim();
    const items = await listStaffMembers({ keyword });
    const title = lang === "zh" ? "員工管理" : "Staff Management";
    const subtitle = lang === "zh" ? "員工管理、權限與帳號安全操作。" : "Manage staff records, permissions, and account security operations.";

    async function deactivateAction(formData: FormData): Promise<void> {
        "use server";
        try {
            await deactivateStaff(String(formData.get("id") ?? ""));
            redirectWithFlash("員工已停用");
        } catch (error) {
            redirectWithFlash(error instanceof Error ? error.message : "停用失敗");
        }
    }

    async function softDeleteAction(formData: FormData): Promise<void> {
        "use server";
        try {
            await softDeleteStaff({
                id: String(formData.get("id") ?? ""),
                reason: String(formData.get("reason") ?? ""),
                confirmPassword: String(formData.get("confirmPassword") ?? ""),
            });
            redirectWithFlash("員工已軟刪除");
        } catch (error) {
            redirectWithFlash(error instanceof Error ? error.message : "刪除失敗");
        }
    }

    async function resetPasswordAction(formData: FormData): Promise<void> {
        "use server";
        try {
            await resetStaffPassword({
                id: String(formData.get("id") ?? ""),
                newPassword: String(formData.get("newPassword") ?? ""),
                requirePasswordChange: true,
            });
            redirectWithFlash("員工密碼已重置，並要求下次登入改密碼");
        } catch (error) {
            redirectWithFlash(error instanceof Error ? error.message : "重置密碼失敗");
        }
    }

    return (
        <MerchantPageShell title={title} subtitle={subtitle} width="index">
            <StaffManagementPanel
                items={items}
                keyword={keyword}
                flash={sp.flash}
                deactivateAction={deactivateAction}
                softDeleteAction={softDeleteAction}
                resetPasswordAction={resetPasswordAction}
                lang={lang}
            />
        </MerchantPageShell>
    );
}
