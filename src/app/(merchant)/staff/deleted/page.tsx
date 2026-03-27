import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { MerchantPageShell } from "@/components/merchant/shell";
import { StaffDeletedRecordsPanel } from "@/components/staff/StaffDeletedRecordsPanel";
import { listDeleteLogs } from "@/lib/services/delete-log.service";
import { hardDeleteStaff, restoreStaff } from "@/lib/services/staff.service";

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
    const logs = await listDeleteLogs({
        module: "staff",
        keyword,
    });

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
            redirectWith("員工已恢復");
        } catch (error) {
            redirectWith(error instanceof Error ? error.message : "恢復失敗");
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
            redirectWith("員工已永久刪除");
        } catch (error) {
            redirectWith(error instanceof Error ? error.message : "永久刪除失敗");
        }
    }

    return (
        <MerchantPageShell title="Deleted Staff Records" subtitle="員工誤刪恢復與復職恢復操作" width="index">
            <StaffDeletedRecordsPanel
                logs={logs}
                keyword={keyword}
                flash={sp.flash}
                restoreAction={restoreAction}
                hardDeleteAction={hardDeleteAction}
                lang={lang}
            />
        </MerchantPageShell>
    );
}
