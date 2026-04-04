import { sanitizeText } from "@/lib/schema/company-settings.shared";

export type InvoiceItem = {
    id: string;
    productId: string;
    name: string;
    description: string;
    qty: number;
    unitPrice: number;
    amount: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
};

function toMoney(value: unknown): number {
    const amount = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(amount) || amount < 0) return 0;
    return Math.round(amount * 100) / 100;
}

function toQty(value: unknown): number {
    const qty = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(qty) || qty <= 0) return 1;
    return Math.round(qty * 1000) / 1000;
}

export function normalizeInvoiceItem(input: Partial<InvoiceItem> & { id: string }): InvoiceItem {
    const qty = toQty(input.qty);
    const unitPrice = toMoney(input.unitPrice);
    const amount = toMoney(input.amount || qty * unitPrice);
    const taxAmount = toMoney(input.taxAmount);
    const totalAmount = toMoney(input.totalAmount || amount + taxAmount);

    return {
        id: sanitizeText(input.id, 120),
        productId: sanitizeText(input.productId, 120),
        name: sanitizeText(input.name, 240) || "Untitled item",
        description: sanitizeText(input.description, 500),
        qty,
        unitPrice,
        amount,
        taxAmount,
        totalAmount,
        currency: sanitizeText(input.currency, 16) || "TWD",
    };
}
