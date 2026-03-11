export type PaymentMethod = "cash" | "card";

export type Sale = {
    id: string;
    item: string;
    amount: number;
    checkoutAt: number;
    paymentMethod: PaymentMethod;
    companyId?: string;
    createdAt: number;
    updatedAt: number;
};
