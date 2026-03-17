export type PaymentMethod = "cash" | "card";
export type PaymentStatus = "unpaid" | "paid" | "deposit" | "installment";

export type SaleLineItem = {
    productId: string;
    productName: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
};

export type SaleCaseRef = {
    caseId: string;
    caseNo: string;
    caseTitle: string;
};

export type SaleActivityRef = {
    activityId: string;
    activityName: string;
    activityContent?: string;
    checkoutStatus?: "stored" | "settled";
    storeQty?: number;
};

export type Sale = {
    id: string;
    item: string;
    amount: number;
    checkoutAt: number;
    paymentMethod: PaymentMethod;
    paymentStatus?: PaymentStatus;
    source?: "sales" | "checkout";
    receiptNo?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    caseId?: string;
    caseTitle?: string;
    caseRefs?: SaleCaseRef[];
    activityRefs?: SaleActivityRef[];
    lineItems?: SaleLineItem[];
    companyId?: string;
    createdAt: number;
    updatedAt: number;
};
