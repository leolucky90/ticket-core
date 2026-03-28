import "server-only";
import { cache } from "react";
import { listSales } from "@/lib/services/sales";
import { listTickets } from "@/lib/services/ticket";
import { isSaleLinkedToCustomer, isTicketLinkedToCustomer } from "@/lib/services/customerRelationships";
import { listCompanyCustomers } from "@/lib/services/merchant/customer-directory-read-model.service";
import type { CompanyCustomerListRow, CustomerCaseState } from "@/lib/types/customer";
import type { CursorPageResult } from "@/lib/types/pagination";

type CustomerListOrder = "updated_latest" | "updated_earliest" | "created_latest" | "created_earliest" | "name_asc" | "name_desc";
type CustomerPageQuery = {
    keyword?: string;
    caseState?: CustomerCaseState | "all";
    order?: CustomerListOrder;
    pageSize?: number;
    cursor?: string;
};

type CustomerSummaryCursor = {
    orderValue: number | string;
    id: string;
};

function toText(value: unknown, max = 160): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function normalizePageSize(input: number | undefined, fallback = 10): number {
    const value = Number(input);
    if (!Number.isFinite(value)) return fallback;
    if (value <= 10) return 10;
    if (value <= 20) return 20;
    if (value <= 50) return 50;
    return 100;
}

function encodeCursor(cursor: CustomerSummaryCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeCursor(value: string | undefined): CustomerSummaryCursor | null {
    const text = toText(value, 240);
    if (!text) return null;
    try {
        const parsed = JSON.parse(Buffer.from(text, "base64url").toString("utf8")) as Partial<CustomerSummaryCursor>;
        const id = toText(parsed.id, 120);
        const orderValue = typeof parsed.orderValue === "number" || typeof parsed.orderValue === "string" ? parsed.orderValue : null;
        if (!id || orderValue === null) return null;
        return { id, orderValue };
    } catch {
        return null;
    }
}

function matchesKeyword(row: CompanyCustomerListRow, keyword?: string): boolean {
    const q = toText(keyword, 120).toLowerCase();
    if (!q) return true;
    const customer = row.customer;
    return [customer.name, customer.phone, customer.email, customer.address].join(" ").toLowerCase().includes(q);
}

function matchesCaseState(row: CompanyCustomerListRow, caseState?: CustomerCaseState | "all"): boolean {
    if (!caseState || caseState === "all") return true;
    return row.caseState === caseState;
}

function getSortValue(row: CompanyCustomerListRow, order: CustomerListOrder): number | string {
    if (order === "created_latest" || order === "created_earliest") return row.customer.createdAt;
    if (order === "name_asc" || order === "name_desc") return row.customer.name.toLocaleLowerCase("zh-Hant");
    return row.customer.updatedAt;
}

function compareRows(left: CompanyCustomerListRow, right: CompanyCustomerListRow, order: CustomerListOrder): number {
    const leftValue = getSortValue(left, order);
    const rightValue = getSortValue(right, order);

    if (typeof leftValue === "string" && typeof rightValue === "string") {
        const base = leftValue.localeCompare(rightValue, "zh-Hant");
        if (base !== 0) return order === "name_desc" ? -base : base;
    } else if (typeof leftValue === "number" && typeof rightValue === "number" && leftValue !== rightValue) {
        const base = leftValue - rightValue;
        return order === "updated_earliest" || order === "created_earliest" ? base : -base;
    }

    return left.customer.id.localeCompare(right.customer.id, "en");
}

const loadCustomerSummaryRows = cache(async (): Promise<CompanyCustomerListRow[]> => {
    const [customers, tickets, sales] = await Promise.all([listCompanyCustomers(), listTickets(), listSales()]);

    return customers.map((customer) => {
        const customerTickets = tickets.filter((ticket) => isTicketLinkedToCustomer(customer, ticket));
        const customerSales = sales.filter((sale) => isSaleLinkedToCustomer(customer, sale));
        const openCaseCount = customerTickets.filter((ticket) => ticket.status !== "closed").length;
        const closedCaseCount = customerTickets.length - openCaseCount;
        const totalCaseCount = openCaseCount + closedCaseCount;
        const caseState: CustomerCaseState = totalCaseCount === 0 ? "no_case" : openCaseCount > 0 ? "active_case" : "closed_case";

        return {
            customer,
            openCaseCount,
            closedCaseCount,
            caseState,
            activitySpend: customerSales.reduce((sum, sale) => sum + Math.max(0, sale.amount), 0),
        } satisfies CompanyCustomerListRow;
    });
});

export async function listCustomerSummaryRows(params: Omit<CustomerPageQuery, "pageSize" | "cursor"> = {}): Promise<CompanyCustomerListRow[]> {
    const order = params.order ?? "updated_latest";
    const rows = await loadCustomerSummaryRows();
    return rows
        .filter((row) => matchesKeyword(row, params.keyword))
        .filter((row) => matchesCaseState(row, params.caseState))
        .sort((a, b) => compareRows(a, b, order));
}

export async function queryCompanyCustomersPage(params: CustomerPageQuery = {}): Promise<CursorPageResult<CompanyCustomerListRow>> {
    const pageSize = normalizePageSize(params.pageSize, 10);
    const order = params.order ?? "updated_latest";
    const decodedCursor = decodeCursor(params.cursor);
    const rows = await listCustomerSummaryRows(params);
    const startIndex = decodedCursor
        ? Math.max(
              0,
              rows.findIndex((row) => row.customer.id === decodedCursor.id && getSortValue(row, order) === decodedCursor.orderValue) + 1,
          )
        : 0;
    const items = rows.slice(startIndex, startIndex + pageSize);
    const lastItem = items.at(-1);
    const hasNextPage = startIndex + pageSize < rows.length;

    return {
        items,
        pageSize,
        nextCursor: hasNextPage && lastItem ? encodeCursor({ id: lastItem.customer.id, orderValue: getSortValue(lastItem, order) }) : "",
        hasNextPage,
    };
}
