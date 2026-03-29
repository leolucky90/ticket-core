import type { DeleteLog } from "@/lib/schema";
import { formatDisplayPhone } from "@/lib/format/phone-display";

function reasonText(value: string | undefined): string {
    const t = value?.trim();
    return t || "-";
}

export function snapshotName(log: DeleteLog): string {
    const snapshot = log.snapshot ?? {};
    const name = typeof snapshot.name === "string" ? snapshot.name : log.targetLabel;
    return name || "-";
}

export function snapshotPhone(log: DeleteLog): string {
    const snapshot = log.snapshot ?? {};
    const phone = typeof snapshot.phone === "string" ? snapshot.phone : "";
    return formatDisplayPhone(phone);
}

/** 依紀錄狀態只顯示當下有意義的一則原因 */
export function primaryReasonForLog(log: DeleteLog): string {
    if (log.status === "hard_deleted") {
        return reasonText(log.hardDeleteReason);
    }
    if (log.status === "restored") {
        return reasonText(log.restoreReason ?? log.deleteReason);
    }
    return reasonText(log.deleteReason);
}
