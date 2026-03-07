import type { QuoteStatus, TicketStatus } from "@/lib/types/ticket";

export type TicketLabels = {
    pageTitle: string;
    queryTitle: string;
    queryPlaceholder: string;
    queryBtn: string;
    clearBtn: string;
    addBtn: string;
    addWindowTitle: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerEmail: string;
    deviceName: string;
    deviceModel: string;
    repairReason: string;
    repairSuggestion: string;
    note: string;
    repairAmount: string;
    inspectionFee: string;
    pendingFee: string;
    quoteStatus: string;
    submitCreate: string;
    cancelBtn: string;
    closeLabel: string;
    listTitle: string;
    total: string;
    id: string;
    caseNumber: string;
    status: string;
    statusNew: string;
    statusInProgress: string;
    statusWaiting: string;
    statusResolved: string;
    statusClosed: string;
    createdAt: string;
    updatedAt: string;
    device: string;
    updateBtn: string;
    deleteBtn: string;
    detailsHint: string;
    lastQueryAt: string;
    createdOk: string;
    updatedOk: string;
    deletedOk: string;
    invalidInput: string;
    confirmDelete: string;
    editBtn: string;
    cancelEditBtn: string;
    quickUpdateBtn: string;
    quoteInspectionEstimate: string;
    quoteQuoted: string;
    quoteRejected: string;
    quoteAccepted: string;
};

export function getTicketLabels(lang: "zh" | "en", count: number): TicketLabels {
    if (lang === "zh") {
        return {
            pageTitle: "案件管理",
            queryTitle: "查詢案件",
            queryPlaceholder: "輸入客戶姓名、電話、設備、型號或案件 ID",
            queryBtn: "查詢",
            clearBtn: "清除",
            addBtn: "新增",
            addWindowTitle: "建立新案件",
            customerName: "客戶姓名",
            customerPhone: "客戶電話",
            customerAddress: "客戶地址",
            customerEmail: "客戶 Email",
            deviceName: "設備名稱",
            deviceModel: "設備型號",
            repairReason: "送修原因",
            repairSuggestion: "維修建議",
            note: "備註",
            repairAmount: "維修金額",
            inspectionFee: "檢修費用",
            pendingFee: "待收費用",
            quoteStatus: "報價狀態",
            submitCreate: "建立案件",
            cancelBtn: "取消",
            closeLabel: "關閉視窗",
            listTitle: "案件列表",
            total: `目前共有 ${count} 筆結果。`,
            id: "案件編號",
            caseNumber: "案件編號",
            status: "狀態",
            statusNew: "新建",
            statusInProgress: "處理中",
            statusWaiting: "待客戶回覆",
            statusResolved: "已解決",
            statusClosed: "已結案",
            createdAt: "建立時間",
            updatedAt: "最後更新",
            device: "設備",
            updateBtn: "儲存修改",
            deleteBtn: "刪除案件",
            detailsHint: "點擊展開完整資料",
            lastQueryAt: "最後查詢時間",
            createdOk: "新建成功",
            updatedOk: "資料已更新",
            deletedOk: "資料已刪除",
            invalidInput: "輸入資料不正確，請檢查後再試",
            confirmDelete: "確定要刪除這筆案件嗎？",
            editBtn: "修改資料",
            cancelEditBtn: "取消更新",
            quickUpdateBtn: "更新",
            quoteInspectionEstimate: "檢查估價",
            quoteQuoted: "已報價",
            quoteRejected: "拒絕",
            quoteAccepted: "接受報價",
        };
    }

    return {
        pageTitle: "Case Management",
        queryTitle: "Search Cases",
        queryPlaceholder: "Search by customer, phone, device, model or case ID",
        queryBtn: "Search",
        clearBtn: "Clear",
        addBtn: "Create Case",
        addWindowTitle: "Create New Case",
        customerName: "Customer Name",
        customerPhone: "Phone",
        customerAddress: "Address",
        customerEmail: "Email",
        deviceName: "Device Name",
        deviceModel: "Device Model",
        repairReason: "Repair Reason",
        repairSuggestion: "Repair Suggestion",
        note: "Note",
        repairAmount: "Repair Amount",
        inspectionFee: "Inspection Fee",
        pendingFee: "Pending Fee",
        quoteStatus: "Quote Status",
        submitCreate: "Submit Case",
        cancelBtn: "Cancel",
        closeLabel: "Close modal",
        listTitle: "Case List",
        total: `${count} result(s).`,
        id: "Case ID",
        caseNumber: "Case Number",
        status: "Status",
        statusNew: "New",
        statusInProgress: "In Progress",
        statusWaiting: "Waiting Customer",
        statusResolved: "Resolved",
        statusClosed: "Closed",
        createdAt: "Created At",
        updatedAt: "Updated At",
        device: "Device",
        updateBtn: "Save Changes",
        deleteBtn: "Delete Case",
        detailsHint: "Click to expand details",
        lastQueryAt: "Last Query Time",
        createdOk: "Case created successfully",
        updatedOk: "Case updated successfully",
        deletedOk: "Case deleted successfully",
        invalidInput: "Invalid input. Please review and try again.",
        confirmDelete: "Are you sure you want to delete this case?",
        editBtn: "Edit Case",
        cancelEditBtn: "Cancel Edit",
        quickUpdateBtn: "Update",
        quoteInspectionEstimate: "Inspection Estimate",
        quoteQuoted: "Quoted",
        quoteRejected: "Rejected",
        quoteAccepted: "Accepted Quote",
    };
}

export function getStatusText(labels: TicketLabels): Record<TicketStatus, string> {
    return {
        new: labels.statusNew,
        in_progress: labels.statusInProgress,
        waiting_customer: labels.statusWaiting,
        resolved: labels.statusResolved,
        closed: labels.statusClosed,
    };
}

export function getFlowMap(): Record<TicketStatus, TicketStatus[]> {
    return {
        new: ["new", "in_progress", "closed"],
        in_progress: ["in_progress", "waiting_customer", "resolved", "closed"],
        waiting_customer: ["waiting_customer", "in_progress", "resolved", "closed"],
        resolved: ["resolved", "closed", "in_progress"],
        closed: ["closed", "in_progress"],
    };
}

export function getQuoteStatusText(labels: TicketLabels): Record<QuoteStatus, string> {
    return {
        inspection_estimate: labels.quoteInspectionEstimate,
        quoted: labels.quoteQuoted,
        rejected: labels.quoteRejected,
        accepted: labels.quoteAccepted,
    };
}
