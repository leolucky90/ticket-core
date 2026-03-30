import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { MerchantPageShell } from "@/components/merchant/shell";
import { StaffDeletedRecordsPanel } from "@/components/staff/StaffDeletedRecordsPanel";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { listDeleteLogs } from "@/lib/services/delete-log.service";
import {
    hardDeleteStaff,
    purgeStaffDeleteLog,
    restoreStaff,
    restoreStaffFromHardDeletedLog,
} from "@/lib/services/staff.service";
import { requireCompanyOperator } from "@/lib/services/access-control";

type StaffDeletedPageProps = {
    searchParams: Promise<{
        keyword?: string;
        flash?: string;
        ts?: string;
    }>;
};

function redirectWith(message: string): never {
    redirect(`/staff/deleted?flash=${encodeURIComponent(message)}&ts=${Date.now()}`);
}

export default async function StaffDeletedPage({ searchParams }: StaffDeletedPageProps) {
    const cookieStore = await cookies();
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const pageUi = getUiText(lang).staffDeletedStaffPage;
    const sp = await searchParams;
    const keyword = (sp.keyword ?? "").trim();

    const operator = await requireCompanyOperator();
    const canViewVault = operator.roleLevel >= 9 || operator.isOwner;

    const allLogs = await listDeleteLogs({
        module: "staff",
        keyword,
    });

    const queueLogs = allLogs.filter((l) => l.status === "soft_deleted");
    const historyLogs = allLogs;
    const vaultLogs = canViewVault ? allLogs.filter((l) => l.status === "hard_deleted") : [];

    async function restoreAction(formData: FormData): Promise<void> {
        "use server";
        const m = getUiText(getUiLanguage((await cookies()).get("lang")?.value)).staffDeletedStaffPage;
        try {
            await restoreStaff({
                deleteLogId: String(formData.get("deleteLogId") ?? ""),
                restoreReason: String(formData.get("restoreReason") ?? ""),
                restoreMode: formData.get("restoreMode") === "inactive" ? "inactive" : "active",
                resetPassword: formData.get("resetPassword") === "on",
                requirePasswordChange: formData.get("requirePasswordChange") === "on",
            });
            redirectWith(m.flashRestored);
        } catch (error) {
            if (isRedirectError(error)) throw error;
            redirectWith(error instanceof Error ? error.message : m.flashRestoreFailed);
        }
    }

    async function hardDeleteAction(formData: FormData): Promise<void> {
        "use server";
        const m = getUiText(getUiLanguage((await cookies()).get("lang")?.value)).staffDeletedStaffPage;
        try {
            await hardDeleteStaff({
                deleteLogId: String(formData.get("deleteLogId") ?? ""),
                reason: String(formData.get("reason") ?? ""),
                authorizationPassword: String(formData.get("authorizationPassword") ?? ""),
            });
            redirectWith(m.flashHardDeleted);
        } catch (error) {
            if (isRedirectError(error)) throw error;
            redirectWith(error instanceof Error ? error.message : m.flashHardDeleteFailed);
        }
    }

    async function restoreHardDeleteAction(formData: FormData): Promise<void> {
        "use server";
        const m = getUiText(getUiLanguage((await cookies()).get("lang")?.value)).staffDeletedStaffPage;
        try {
            await restoreStaffFromHardDeletedLog({
                deleteLogId: String(formData.get("deleteLogId") ?? ""),
                restoreReason: String(formData.get("restoreReason") ?? ""),
                restoreMode: formData.get("restoreMode") === "inactive" ? "inactive" : "active",
            });
            redirectWith(m.flashRecoverFromArchive);
        } catch (error) {
            if (isRedirectError(error)) throw error;
            redirectWith(error instanceof Error ? error.message : m.flashRecoverFailed);
        }
    }

    async function purgeDeleteLogAction(formData: FormData): Promise<void> {
        "use server";
        const m = getUiText(getUiLanguage((await cookies()).get("lang")?.value)).staffDeletedStaffPage;
        try {
            await purgeStaffDeleteLog(String(formData.get("deleteLogId") ?? ""));
            redirectWith(m.flashPurgeLog);
        } catch (error) {
            if (isRedirectError(error)) throw error;
            redirectWith(error instanceof Error ? error.message : m.flashPurgeFailed);
        }
    }

    return (
        <MerchantPageShell title={pageUi.pageTitle} subtitle={pageUi.pageSubtitle} width="index">
            <StaffDeletedRecordsPanel
                queueLogs={queueLogs}
                historyLogs={historyLogs}
                vaultLogs={vaultLogs}
                canViewVault={canViewVault}
                keyword={keyword}
                flash={sp.flash}
                restoreAction={restoreAction}
                hardDeleteAction={hardDeleteAction}
                restoreHardDeleteAction={restoreHardDeleteAction}
                purgeDeleteLogAction={purgeDeleteLogAction}
                lang={lang}
            />
        </MerchantPageShell>
    );
}
