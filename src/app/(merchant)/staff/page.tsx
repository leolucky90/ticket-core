import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { MerchantPageShell } from "@/components/merchant/shell";
import { StaffManagementPanel } from "@/components/staff/StaffManagementPanel";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { activateStaff, deactivateStaff, listStaffMembers, resetStaffPassword, softDeleteStaff } from "@/lib/services/staff.service";

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
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const staffUi = getUiText(lang).merchantStaff;
    const sp = await searchParams;
    const keyword = (sp.keyword ?? "").trim();
    const items = await listStaffMembers({ keyword });
    const title = staffUi.pageTitle;
    const subtitle = staffUi.pageSubtitle;

    async function deactivateAction(formData: FormData): Promise<void> {
        "use server";
        const m = getUiText(getUiLanguage((await cookies()).get("lang")?.value)).merchantStaff;
        try {
            await deactivateStaff(String(formData.get("id") ?? ""));
            redirectWithFlash(m.flashDeactivated);
        } catch (error) {
            if (isRedirectError(error)) throw error;
            redirectWithFlash(error instanceof Error ? error.message : m.flashDeactivateFailed);
        }
    }

    async function activateAction(formData: FormData): Promise<void> {
        "use server";
        const m = getUiText(getUiLanguage((await cookies()).get("lang")?.value)).merchantStaff;
        try {
            await activateStaff(String(formData.get("id") ?? ""));
            redirectWithFlash(m.flashActivated);
        } catch (error) {
            if (isRedirectError(error)) throw error;
            redirectWithFlash(error instanceof Error ? error.message : m.flashActivateFailed);
        }
    }

    async function softDeleteAction(formData: FormData): Promise<void> {
        "use server";
        const m = getUiText(getUiLanguage((await cookies()).get("lang")?.value)).merchantStaff;
        try {
            await softDeleteStaff({
                id: String(formData.get("id") ?? ""),
                reason: String(formData.get("reason") ?? ""),
                confirmPassword: String(formData.get("confirmPassword") ?? ""),
            });
            redirectWithFlash(m.flashSoftDeleted);
        } catch (error) {
            if (isRedirectError(error)) throw error;
            redirectWithFlash(error instanceof Error ? error.message : m.flashDeleteFailed);
        }
    }

    async function resetPasswordAction(formData: FormData): Promise<void> {
        "use server";
        const m = getUiText(getUiLanguage((await cookies()).get("lang")?.value)).merchantStaff;
        try {
            await resetStaffPassword({
                id: String(formData.get("id") ?? ""),
                newPassword: String(formData.get("newPassword") ?? ""),
                requirePasswordChange: true,
            });
            redirectWithFlash(m.flashPasswordReset);
        } catch (error) {
            if (isRedirectError(error)) throw error;
            redirectWithFlash(error instanceof Error ? error.message : m.flashResetPasswordFailed);
        }
    }

    return (
        <MerchantPageShell title={title} subtitle={subtitle} width="index">
            <StaffManagementPanel
                items={items}
                keyword={keyword}
                flash={sp.flash}
                activateAction={activateAction}
                deactivateAction={deactivateAction}
                softDeleteAction={softDeleteAction}
                resetPasswordAction={resetPasswordAction}
                lang={lang}
            />
        </MerchantPageShell>
    );
}
