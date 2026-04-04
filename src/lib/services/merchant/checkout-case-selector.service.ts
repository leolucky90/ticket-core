import { isTicketLinkedToCustomer } from "@/lib/services/customerRelationships";
import { createCheckoutCaseSelectionFromTicket, type CheckoutCaseSelection } from "@/lib/schema/checkout-case-selection.schema";
import type { CustomerProfile } from "@/lib/types/customer";
import type { Ticket } from "@/lib/types/ticket";

const CHECKOUT_ELIGIBLE_STATUSES = new Set(["new", "in_progress", "waiting_customer", "resolved"]);

export function isCheckoutEligibleCase(ticket: Ticket): boolean {
    return CHECKOUT_ELIGIBLE_STATUSES.has(ticket.status);
}

export function getCheckoutEligibleCasesForCustomer(input: {
    customer: CustomerProfile | null;
    tickets: Ticket[];
}): CheckoutCaseSelection[] {
    const customer = input.customer;
    if (!customer) return [];
    return input.tickets
        .filter((ticket) => isTicketLinkedToCustomer(customer, ticket))
        .filter((ticket) => isCheckoutEligibleCase(ticket))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((ticket) => createCheckoutCaseSelectionFromTicket(ticket));
}

export function hasCheckoutEligibleCases(input: {
    customer: CustomerProfile | null;
    tickets: Ticket[];
}): boolean {
    return getCheckoutEligibleCasesForCustomer(input).length > 0;
}
