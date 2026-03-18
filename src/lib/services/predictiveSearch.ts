import "server-only";
import { normalizeSearchText } from "@/lib/services/productNaming";
import { getSearchSuggestions } from "@/lib/services/shared/search-suggestion-service";
import type {
    PredictiveSearchResult,
    PredictiveSearchSuggestion,
    PredictiveSearchTarget,
    SearchSuggestionEntity,
    SearchSuggestionItem,
} from "@/lib/types/search";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 40;

type SuggestParams = {
    query: string;
    targets?: PredictiveSearchTarget[];
    limit?: number;
};

function toLimit(value: number | undefined): number {
    if (!value || !Number.isFinite(value)) return DEFAULT_LIMIT;
    return Math.max(1, Math.min(MAX_LIMIT, Math.round(value)));
}

function normalizeTargets(targets: PredictiveSearchTarget[] | undefined): PredictiveSearchTarget[] {
    const fallback: PredictiveSearchTarget[] = ["products", "customers", "tickets", "checkout_items", "inventory"];
    const source = Array.isArray(targets) && targets.length > 0 ? targets : fallback;
    return Array.from(new Set(source.filter((target) => fallback.includes(target))));
}

function toEntitySet(targets: PredictiveSearchTarget[]): SearchSuggestionEntity[] {
    const entities = new Set<SearchSuggestionEntity>();
    if (targets.includes("products")) entities.add("product");
    if (targets.includes("inventory")) entities.add("product");
    if (targets.includes("customers")) entities.add("customer");
    if (targets.includes("tickets")) entities.add("ticket");
    if (targets.includes("checkout_items")) {
        entities.add("checkout-item");
        entities.add("product");
    }
    return [...entities];
}

function pickTarget(item: SearchSuggestionItem, targets: PredictiveSearchTarget[]): PredictiveSearchTarget[] {
    if (item.entity === "customer") return targets.includes("customers") ? ["customers"] : [];
    if (item.entity === "ticket") return targets.includes("tickets") ? ["tickets"] : [];
    if (item.entity === "checkout-item") return targets.includes("checkout_items") ? ["checkout_items"] : [];
    if (item.entity === "product") {
        const out: PredictiveSearchTarget[] = [];
        if (targets.includes("products")) out.push("products");
        if (targets.includes("inventory")) out.push("inventory");
        if (targets.includes("checkout_items")) out.push("checkout_items");
        return out;
    }
    return [];
}

function toPredictiveSuggestion(
    item: SearchSuggestionItem,
    target: PredictiveSearchTarget,
    rank: number,
): PredictiveSearchSuggestion {
    return {
        id: item.id,
        target,
        value: item.title,
        title: item.title,
        subtitle: item.subtitle,
        score: Math.max(1, 100 - rank),
        meta: {
            entity: item.entity,
            matchedBy: item.matchedBy ?? "",
        },
    };
}

export async function getPredictiveSearchSuggestions(params: SuggestParams): Promise<PredictiveSearchResult> {
    const query = normalizeSearchText(params.query);
    if (!query) return { query, suggestions: [] };

    const targets = normalizeTargets(params.targets);
    const limit = toLimit(params.limit);
    const entities = toEntitySet(targets);
    const baseItems = await getSearchSuggestions({
        query,
        entities,
        limit: limit * 2,
    });

    const suggestions: PredictiveSearchSuggestion[] = [];
    for (let index = 0; index < baseItems.length; index += 1) {
        const item = baseItems[index];
        const itemTargets = pickTarget(item, targets);
        for (const target of itemTargets) {
            suggestions.push(toPredictiveSuggestion(item, target, index));
        }
    }

    const deduped = new Map<string, PredictiveSearchSuggestion>();
    for (const suggestion of suggestions) {
        const key = `${suggestion.target}:${suggestion.id}:${suggestion.title}`;
        if (!deduped.has(key)) deduped.set(key, suggestion);
    }

    return {
        query,
        suggestions: [...deduped.values()].slice(0, limit),
    };
}
