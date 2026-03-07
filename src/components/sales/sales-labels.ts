import type { PaymentMethod } from "@/lib/types/sale";

export type SalesLabels = {
    pageTitle: string;
    queryTitle: string;
    queryPlaceholder: string;
    queryBtn: string;
    clearBtn: string;
    addBtn: string;
    addWindowTitle: string;
    item: string;
    amount: string;
    checkoutAt: string;
    paymentMethod: string;
    paymentCash: string;
    paymentCard: string;
    submitCreate: string;
    cancelBtn: string;
    closeLabel: string;
    listTitle: string;
    total: string;
    createdAt: string;
    updatedAt: string;
    updateBtn: string;
    deleteBtn: string;
    editBtn: string;
    cancelEditBtn: string;
    detailsHint: string;
    lastQueryAt: string;
    createdOk: string;
    updatedOk: string;
    deletedOk: string;
    invalidInput: string;
    confirmDelete: string;
};

export function getSalesLabels(lang: "zh" | "en", count: number): SalesLabels {
    if (lang === "zh") {
        return {
            pageTitle: "銷售管理",
            queryTitle: "查詢銷售",
            queryPlaceholder: "輸入物品、金額或付款方式",
            queryBtn: "查詢",
            clearBtn: "清除",
            addBtn: "新增",
            addWindowTitle: "建立銷售資料",
            item: "物品",
            amount: "金額",
            checkoutAt: "結帳時間",
            paymentMethod: "付款方式",
            paymentCash: "現金",
            paymentCard: "刷卡",
            submitCreate: "建立資料",
            cancelBtn: "取消",
            closeLabel: "關閉視窗",
            listTitle: "銷售列表",
            total: `目前共有 ${count} 筆結果。`,
            createdAt: "建立時間",
            updatedAt: "最後更新",
            updateBtn: "儲存修改",
            deleteBtn: "刪除資料",
            editBtn: "修改資料",
            cancelEditBtn: "取消修改",
            detailsHint: "點擊展開完整資料",
            lastQueryAt: "最後查詢時間",
            createdOk: "新建成功",
            updatedOk: "資料已更新",
            deletedOk: "資料已刪除",
            invalidInput: "輸入資料不正確，請檢查後再試",
            confirmDelete: "確定要刪除這筆資料嗎？",
        };
    }

    return {
        pageTitle: "Sales Management",
        queryTitle: "Search Sales",
        queryPlaceholder: "Search by item, amount or payment method",
        queryBtn: "Search",
        clearBtn: "Clear",
        addBtn: "Create Sale",
        addWindowTitle: "Create Sale Record",
        item: "Item",
        amount: "Amount",
        checkoutAt: "Checkout Time",
        paymentMethod: "Payment Method",
        paymentCash: "Cash",
        paymentCard: "Card",
        submitCreate: "Create",
        cancelBtn: "Cancel",
        closeLabel: "Close modal",
        listTitle: "Sales List",
        total: `${count} result(s).`,
        createdAt: "Created At",
        updatedAt: "Updated At",
        updateBtn: "Save Changes",
        deleteBtn: "Delete",
        editBtn: "Edit",
        cancelEditBtn: "Cancel",
        detailsHint: "Click to expand details",
        lastQueryAt: "Last Query Time",
        createdOk: "Created successfully",
        updatedOk: "Updated successfully",
        deletedOk: "Deleted successfully",
        invalidInput: "Invalid input. Please review and try again.",
        confirmDelete: "Are you sure you want to delete this record?",
    };
}

export function getPaymentMethodText(labels: SalesLabels): Record<PaymentMethod, string> {
    return {
        cash: labels.paymentCash,
        card: labels.paymentCard,
    };
}
