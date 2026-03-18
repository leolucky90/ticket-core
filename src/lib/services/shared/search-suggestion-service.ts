import "server-only";
import { listCompanyCustomers, listProducts } from "@/lib/services/commerce";
import { buildProductSearchKeywords, normalizeSearchText } from "@/lib/services/productNaming";
import { queryCheckoutSales } from "@/lib/services/sales";
import { listTickets } from "@/lib/services/ticket";
import type { SearchSuggestionEntity, SearchSuggestionItem } from "@/lib/types/search";
import type { Product } from "@/lib/types/commerce";
import type { Ticket } from "@/lib/types/ticket";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 60;

type SearchSuggestionParams = {
    query: string;
    entities?: SearchSuggestionEntity[];
    limit?: number;
};

function toLimit(value: number | undefined): number {
    if (!value || !Number.isFinite(value)) return DEFAULT_LIMIT;
    return Math.max(1, Math.min(MAX_LIMIT, Math.round(value)));
}

function toTicketNumber(ticket: Ticket): string {
    const d = new Date(ticket.createdAt > 0 ? ticket.createdAt : Date.now());
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const suffix = ticket.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "0000";
    return `CASE-${yyyy}${mm}${dd}-${suffix}`;
}

function score(query: string, keyword: string): number {
    const q = normalizeSearchText(query);
    const target = normalizeSearchText(keyword);
    if (!q || !target) return 0;
    if (target === q) return 120;
    if (target.startsWith(q)) return 100;
    if (target.includes(q)) return 80;
    return 0;
}

function bestMatch(query: string, keywords: string[]): { score: number; matchedBy: SearchSuggestionItem["matchedBy"] } {
    let best = 0;
    let matchedBy: SearchSuggestionItem["matchedBy"] | undefined;

    for (const keyword of keywords) {
        const current = score(query, keyword);
        if (current <= best) continue;
        best = current;

        const lower = keyword.toLowerCase();
        if (/^case-\d{8}/.test(lower)) {
            matchedBy = "ticketNumber";
        } else if (lower.includes("@")) {
            matchedBy = "email";
        } else if (/^[0-9+\-()\s]{6,24}$/.test(lower.replace(/\s+/g, ""))) {
            matchedBy = "phone";
        } else if (lower.includes("sku")) {
            matchedBy = "sku";
        } else {
            matchedBy = "name";
        }
    }

    return { score: best, matchedBy };
}

function normalizeEntities(entities: SearchSuggestionEntity[] | undefined): SearchSuggestionEntity[] {
    const all: SearchSuggestionEntity[] = ["product", "customer", "ticket", "checkout-item"];
    if (!entities || entities.length === 0) return all;
    return Array.from(new Set(entities.filter((entity) => all.includes(entity))));
}

function productSubtitle(product: Product): string {
    const parts = [
        product.sku ? `SKU ${product.sku}` : "",
        product.categoryName || "",
        product.brandName || "",
        product.modelName || "",
    ].filter((item) => item.length > 0);
    return parts.join(" | ");
}

function buildProductItems(query: string, products: Product[]): Array<SearchSuggestionItem & { score: number }> {
    const out: Array<SearchSuggestionItem & { score: number }> = [];
    for (const product of products) {
        const keywords = buildProductSearchKeywords(product);
        const hit = bestMatch(query, keywords);
        if (hit.score <= 0) continue;
        out.push({
            id: product.id,
            entity: "product",
            title: product.name,
            subtitle: productSubtitle(product),
            keywords,
            matchedBy: hit.matchedBy ?? "name",
            score: hit.score,
        });
    }
    return out;
}

function buildCustomerItems(
    query: string,
    customers: Array<{ id: string; name: string; phone: string; email: string }>,
): Array<SearchSuggestionItem & { score: number }> {
    const out: Array<SearchSuggestionItem & { score: number }> = [];
    for (const customer of customers) {
        const keywords = [customer.name, customer.phone, customer.email].filter((item) => item.length > 0);
        const hit = bestMatch(query, keywords);
        if (hit.score <= 0) continue;
        out.push({
            id: customer.id,
            entity: "customer",
            title: customer.name || customer.phone || customer.email,
            subtitle: [customer.phone, customer.email].filter((item) => item.length > 0).join(" | "),
            keywords,
            matchedBy: hit.matchedBy ?? "name",
            score: hit.score,
        });
    }
    return out;
}

function buildTicketItems(query: string, tickets: Ticket[]): Array<SearchSuggestionItem & { score: number }> {
    const out: Array<SearchSuggestionItem & { score: number }> = [];
    for (const ticket of tickets) {
        const ticketNumber = toTicketNumber(ticket);
        const keywords = [
            ticket.customer.name,
            ticket.customer.phone,
            ticket.device.name,
            ticket.device.model,
            ticketNumber,
            ticket.id,
        ].filter((item) => item.length > 0);
        const hit = bestMatch(query, keywords);
        if (hit.score <= 0) continue;
        out.push({
            id: ticket.id,
            entity: "ticket",
            title: `${ticketNumber} ${ticket.customer.name}`.trim(),
            subtitle: [ticket.customer.phone, ticket.device.name, ticket.device.model].filter((item) => item.length > 0).join(" | "),
            keywords,
            matchedBy: hit.matchedBy ?? "ticketNumber",
            score: hit.score,
        });
    }
    return out;
}

async function buildCheckoutItems(query: string): Promise<Array<SearchSuggestionItem & { score: number }>> {
    const sales = await queryCheckoutSales();
    const out: Array<SearchSuggestionItem & { score: number }> = [];
    for (const sale of sales) {
        const lines = sale.lineItems ?? [];
        for (const line of lines) {
            const keywords = [line.productName, line.productId].filter((item) => item.length > 0);
            const hit = bestMatch(query, keywords);
            if (hit.score <= 0) continue;
            out.push({
                id: `${sale.id}:${line.productId || line.productName}`,
                entity: "checkout-item",
                title: line.productName,
                subtitle: [sale.customerName ?? "", sale.receiptNo ?? ""].filter((item) => item.length > 0).join(" | "),
                keywords,
                matchedBy: hit.matchedBy ?? "name",
                score: hit.score,
            });
        }
    }
    return out;
}

export async function getSearchSuggestions(params: SearchSuggestionParams): Promise<SearchSuggestionItem[]> {
    const query = normalizeSearchText(params.query);
    if (!query) return [];
    const limit = toLimit(params.limit);
    const entities = normalizeEntities(params.entities);

    const needsProduct = entities.includes("product");
    const needsCustomer = entities.includes("customer");
    const needsTicket = entities.includes("ticket");
    const needsCheckoutItem = entities.includes("checkout-item");

    const [products, customers, tickets, checkoutItems] = await Promise.all([
        needsProduct ? listProducts() : Promise.resolve([]),
        needsCustomer ? listCompanyCustomers() : Promise.resolve([]),
        needsTicket ? listTickets() : Promise.resolve([]),
        needsCheckoutItem ? buildCheckoutItems(query) : Promise.resolve([]),
    ]);

    const scored: Array<SearchSuggestionItem & { score: number }> = [];
    if (needsProduct) scored.push(...buildProductItems(query, products));
    if (needsCustomer) scored.push(...buildCustomerItems(query, customers));
    if (needsTicket) scored.push(...buildTicketItems(query, tickets));
    if (needsCheckoutItem) scored.push(...checkoutItems);

    const deduped = new Map<string, SearchSuggestionItem & { score: number }>();
    for (const item of scored) {
        const key = `${item.entity}:${item.id}:${item.title}`;
        const current = deduped.get(key);
        if (!current || item.score > current.score) deduped.set(key, item);
    }

    return [...deduped.values()]
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.title.localeCompare(b.title, "zh-Hant");
        })
        .slice(0, limit)
        .map((item) => ({
            id: item.id,
            entity: item.entity,
            title: item.title,
            subtitle: item.subtitle,
            keywords: item.keywords,
            matchedBy: item.matchedBy,
        }));
}
