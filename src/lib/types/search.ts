export type PredictiveSearchTarget = "products" | "inventory" | "customers" | "tickets" | "checkout_items";

export type PredictiveSearchSuggestion = {
    id: string;
    target: PredictiveSearchTarget;
    value: string;
    title: string;
    subtitle?: string;
    score: number;
    meta?: Record<string, string | number | boolean | null>;
};

export type PredictiveSearchResult = {
    query: string;
    suggestions: PredictiveSearchSuggestion[];
};

export type SearchSuggestionEntity =
    | "product"
    | "customer"
    | "ticket"
    | "checkout-item";

export interface SearchSuggestionItem {
    id: string;
    entity: SearchSuggestionEntity;
    title: string;
    subtitle?: string;
    keywords: string[];
    matchedBy?: "name" | "phone" | "email" | "sku" | "alias" | "model" | "ticketNumber";
}
