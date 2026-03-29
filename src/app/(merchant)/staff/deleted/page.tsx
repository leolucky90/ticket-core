import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { MerchantPageShell } from "@/components/merchant/shell";
import { StaffDeletedRecordsPanel } from "@/components/staff/StaffDeletedRecordsPanel";
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
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";
    const sp = await searchParams;
    const keyword = (sp.keyword ?? "").trim();
    const title = lang === "zh" ? "員工刪除紀錄" : "Deleted Staff Records";
    const subtitle =
        lang === "zh"
            ? "待處理清單、歷史紀錄與（Lv9）永久刪除後處理。"
            : "Pending queue, history, and Lv9 hard-delete archive.";

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
        try {
            await restoreStaff({
                deleteLogId: String(formData.get("deleteLogId") ?? ""),
                restoreReason: String(formData.get("restoreReason") ?? ""),
                restoreMode: formData.get("restoreMode") === "inactive" ? "inactive" : "active",
                resetPassword: formData.get("resetPassword") === "on",
                requirePasswordChange: formData.get("requirePasswordChange") === "on",
            });
            redirectWith(lang === "zh" ? "員工已恢復" : "Staff member restored.");
        } catch (error) {
            if (isRedirectError(error)) throw error;
            redirectWith(error instanceof Error ? error.message : lang === "zh" ? "恢復失敗" : "Restore failed");
        }
    }

    async function hardDeleteAction(formData: FormData): Promise<void> {
        "use server";
        try {
            await hardDeleteStaff({
                deleteLogId: String(formData.get("deleteLogId") ?? ""),
                reason: String(formData.get("reason") ?? ""),
                authorizationPassword: String(formData.get("authorizationPassword") ?? ""),
            });
            redirectWith(lang === "zh" ? "員工已永久刪除" : "Staff member permanently deleted.");
        } catch (error) {
            if (isRedirectError(error)) throw error;
            redirectWith(error instanceof Error ? error.message : lang === "zh" ? "永久刪除失敗" : "Hard delete failed");
        }
    }

    async function restoreHardDeleteAction(formData: FormData): Promise<void> {
        "use server";
        try {
            await restoreStaffFromHardDeletedLog({
                deleteLogId: String(formData.get("deleteLogId") ?? ""),
                restoreReason: String(formData.get("restoreReason") ?? ""),
                restoreMode: formData.get("restoreMode") === "inactive" ? "inactive" : "active",
            });
            redirectWith(lang === "zh" ? "已從永久刪除存檔復原員工資料" : "Staff data restored from hard-delete archive.");
        } catch (error) {
            if (isRedirectError(error)) throw error;
            redirectWith(error instanceof Error ? error.message : lang === "zh" ? "復原失敗" : "Recovery failed");
        }
    }

    async function purgeDeleteLogAction(formData: FormData): Promise<void> {
        "use server";
        try {
            await purgeStaffDeleteLog(String(formData.get("deleteLogId") ?? ""));
            redirectWith(lang === "zh" ? "已從資料庫移除該筆刪除紀錄" : "Delete log entry removed.");
        } catch (error) {
            if (isRedirectError(error)) throw error;
            redirectWith(error instanceof Error ? error.message : lang === "zh" ? "移除失敗" : "Purge failed");
        }
    }

    return (
        <MerchantPageShell title={title} subtitle={subtitle} width="index">
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
