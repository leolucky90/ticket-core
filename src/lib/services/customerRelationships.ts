import type { CustomerProfile } from "@/lib/types/customer";
import type { Sale } from "@/lib/types/sale";
import type { Ticket } from "@/lib/types/ticket";

type ComparableRecord = {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
};

type CustomerLikePurchase = {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
};

function normalizeComparable(value: string | null | undefined): string {
    return (value ?? "").trim().toLowerCase();
}

function isComparableFieldMatched(left: string | null | undefined, right: string | null | undefined): boolean {
    const a = normalizeComparable(left);
    const b = normalizeComparable(right);
    return Boolean(a && b && a === b);
}

export function isCustomerMatchedByIdentity(customer: ComparableRecord, target: ComparableRecord): boolean {
    if (customer.id && target.id && customer.id === target.id) return true;
    if (isComparableFieldMatched(customer.email, target.email)) return true;
    if (isComparableFieldMatched(customer.phone, target.phone)) return true;
    if (isComparableFieldMatched(customer.name, target.name)) return true;
    return false;
}

export function isTicketLinkedToCustomer(customer: CustomerProfile, ticket: Ticket): boolean {
    return isCustomerMatchedByIdentity(customer, {
        id: ticket.customerId,
        name: ticket.customer.name,
        phone: ticket.customer.phone,
        email: ticket.customer.email,
    });
}

export function isActivityPurchaseLinkedToCustomer(customer: CustomerProfile, purchase: CustomerLikePurchase): boolean {
    return isCustomerMatchedByIdentity(customer, {
        name: purchase.customerName,
        phone: purchase.customerPhone,
        email: purchase.customerEmail,
    });
}

export function isSaleLinkedToCustomer(customer: CustomerProfile, sale: Sale): boolean {
    return isCustomerMatchedByIdentity(customer, {
        id: sale.customerId,
        name: sale.customerName,
        phone: sale.customerPhone,
        email: sale.customerEmail,
    });
}

export function listTicketsForCustomer(customer: CustomerProfile, tickets: Ticket[]): Ticket[] {
    return tickets.filter((ticket) => isTicketLinkedToCustomer(customer, ticket));
}

export function listSalesForCustomer(customer: CustomerProfile, sales: Sale[]): Sale[] {
    return sales.filter((sale) => isSaleLinkedToCustomer(customer, sale));
}

export function computeTicketSpendTotal(tickets: Ticket[]): number {
    return tickets.reduce((sum, ticket) => sum + Math.max(0, ticket.repairAmount), 0);
}

export function computeSaleSpendTotal(sales: Sale[]): number {
    return sales.reduce((sum, sale) => sum + Math.max(0, sale.amount), 0);
}
