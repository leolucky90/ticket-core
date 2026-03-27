import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { DeleteLogsPanel } from "@/components/settings/DeleteLogsPanel";
import { decodeCursorStack, encodeCursorStack, parseListPageSize } from "@/lib/pagination/query-controls";
import { hardDeleteRecord, queryDeleteLogsPage, restoreDeletedRecord } from "@/lib/services/delete-log.service";

type DeleteLogsPageProps = {
    searchParams: Promise<{
        module?: string;
        keyword?: string;
        deletedBy?: string;
        deleteReason?: string;
        dateFrom?: string;
        dateTo?: string;
        status?: string;
        hardDeleted?: string;
        restored?: string;
        flash?: string;
        ts?: string;
        pageSize?: string;
        cursor?: string;
        cursorStack?: string;
    }>;
};

function redirectWith(message: string): never {
    redirect(`/settings/security/delete-logs?flash=${encodeURIComponent(message)}&ts=${Date.now()}`);
}

export default async function DeleteLogsPage({ searchParams }: DeleteLogsPageProps) {
    const sp = await searchParams;
    const currentCursor = (sp.cursor ?? "").trim();
    const currentCursorStack = decodeCursorStack((sp.cursorStack ?? "").trim());
    const deleteLogPage = await queryDeleteLogsPage({
        module: sp.module?.trim() || undefined,
        keyword: sp.keyword?.trim() || undefined,
        deletedBy: sp.deletedBy?.trim() || undefined,
        deleteReason: sp.deleteReason?.trim() || undefined,
        dateFrom: sp.dateFrom?.trim() || undefined,
        dateTo: sp.dateTo?.trim() || undefined,
        status: sp.status === "soft_deleted" || sp.status === "restored" || sp.status === "hard_deleted" ? sp.status : undefined,
        hardDeleted: sp.hardDeleted === "yes" || sp.hardDeleted === "no" ? sp.hardDeleted : undefined,
        restored: sp.restored === "yes" || sp.restored === "no" ? sp.restored : undefined,
        pageSize: parseListPageSize((sp.pageSize ?? "").trim(), "10"),
        cursor: currentCursor || undefined,
    });
    const previousCursor = currentCursorStack.at(-1) ?? "";
    const previousCursorStack = encodeCursorStack(currentCursorStack.slice(0, -1));
    const nextCursorStack = encodeCursorStack(currentCursor ? [...currentCursorStack, currentCursor] : currentCursorStack);

    async function restoreAction(formData: FormData): Promise<void> {
        "use server";
        try {
            await restoreDeletedRecord({
                deleteLogId: String(formData.get("deleteLogId") ?? ""),
                restoreReason: String(formData.get("restoreReason") ?? ""),
            });
            redirectWith("資料已回復");
        } catch (error) {
            redirectWith(error instanceof Error ? error.message : "回復失敗");
        }
    }

    async function hardDeleteAction(formData: FormData): Promise<void> {
        "use server";
        try {
            await hardDeleteRecord({
                deleteLogId: String(formData.get("deleteLogId") ?? ""),
                reason: String(formData.get("reason") ?? ""),
                authorizationPassword: String(formData.get("authorizationPassword") ?? ""),
            });
            redirectWith("資料已永久刪除");
        } catch (error) {
            redirectWith(error instanceof Error ? error.message : "永久刪除失敗");
        }
    }

    return (
        <MerchantPageShell title="Delete Logs" subtitle="刪除紀錄查詢、回復與永久刪除" width="index">
            <DeleteLogsPanel
                logs={deleteLogPage.items}
                filters={{
                    module: sp.module ?? "",
                    keyword: sp.keyword ?? "",
                    deletedBy: sp.deletedBy ?? "",
                    deleteReason: sp.deleteReason ?? "",
                    dateFrom: sp.dateFrom ?? "",
                    dateTo: sp.dateTo ?? "",
                    status: sp.status ?? "",
                    hardDeleted: sp.hardDeleted ?? "",
                    restored: sp.restored ?? "",
                }}
                pageSize={String(deleteLogPage.pageSize)}
                currentCursor={currentCursor}
                previousCursor={previousCursor}
                previousCursorStack={previousCursorStack}
                nextCursor={deleteLogPage.nextCursor}
                nextCursorStack={nextCursorStack}
                hasNextPage={deleteLogPage.hasNextPage}
                flash={sp.flash}
                restoreAction={restoreAction}
                hardDeleteAction={hardDeleteAction}
            />
        </MerchantPageShell>
    );
}
