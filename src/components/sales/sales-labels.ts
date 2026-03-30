import type { PaymentMethod } from "@/lib/types/sale";
import type { UiLanguage } from "@/lib/i18n/ui-text";
import { getUiText } from "@/lib/i18n/ui-text";

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

export function getSalesLabels(lang: UiLanguage, count: number): SalesLabels {
    const t = getUiText(lang).salesManagement;
    return {
        pageTitle: t.pageTitle,
        queryTitle: t.queryTitle,
        queryPlaceholder: t.queryPlaceholder,
        queryBtn: t.queryBtn,
        clearBtn: t.clearBtn,
        addBtn: t.addBtn,
        addWindowTitle: t.addWindowTitle,
        item: t.item,
        amount: t.amount,
        checkoutAt: t.checkoutAt,
        paymentMethod: t.paymentMethod,
        paymentCash: t.paymentCash,
        paymentCard: t.paymentCard,
        submitCreate: t.submitCreate,
        cancelBtn: t.cancelBtn,
        closeLabel: t.closeLabel,
        listTitle: t.listTitle,
        total: t.total.replace("{count}", String(count)),
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        updateBtn: t.updateBtn,
        deleteBtn: t.deleteBtn,
        editBtn: t.editBtn,
        cancelEditBtn: t.cancelEditBtn,
        detailsHint: t.detailsHint,
        lastQueryAt: t.lastQueryAt,
        createdOk: t.createdOk,
        updatedOk: t.updatedOk,
        deletedOk: t.deletedOk,
        invalidInput: t.invalidInput,
        confirmDelete: t.confirmDelete,
    };
}

export function getPaymentMethodText(labels: SalesLabels): Record<PaymentMethod, string> {
    return {
        cash: labels.paymentCash,
        card: labels.paymentCard,
    };
}
