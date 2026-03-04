export type PaymentMethod = "cash" | "card";

export type Sale = {
    id: string;
    item: string;
    amount: number;
    checkoutAt: number;
    paymentMethod: PaymentMethod;
    createdAt: number;
    updatedAt: number;
};
