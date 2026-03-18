import "server-only";
import { listCampaignEntitlements, listCampaigns, listConsignments } from "@/lib/services/merchant/campaign-consignment-service";
import { getInventoryRiskReminders } from "@/lib/services/merchant/inventory-risk-service";

type ConsignmentKpi = {
    activeCount: number;
    remainingQty: number;
    expiringSoonCount: number;
    completedCount: number;
    expiredCount: number;
};

type HotCampaignItem = {
    campaignId: string;
    campaignName: string;
    entitlementCount: number;
    consignmentCount: number;
    redeemedQty: number;
    remainingQty: number;
    lifecycleState: "running" | "ended_pending_redemption" | "fully_closed";
};

type PopularStoredItemType = {
    key: string;
    label: string;
    remainingQty: number;
    customerCount: number;
};

type CampaignClosureStatus = {
    campaignId: string;
    campaignName: string;
    status: "draft" | "active" | "ended" | "archived";
    lifecycleState: "running" | "ended_pending_redemption" | "fully_closed";
    remainingQty: number;
};

type CustomerConsignmentRow = {
    consignmentId: string;
    customerId: string;
    customerName: string;
    customerPhone?: string;
    campaignId?: string;
    campaignName?: string;
    title: string;
    scopeLabel: string;
    remainingQty: number;
    expiresAt?: string;
    status: "active" | "partially_redeemed" | "completed" | "expired" | "cancelled";
};

export type ConsignmentOverviewData = {
    kpi: ConsignmentKpi;
    hotCampaigns: HotCampaignItem[];
    popularStoredItemTypes: PopularStoredItemType[];
    campaignClosures: CampaignClosureStatus[];
    customerRows: CustomerConsignmentRow[];
    riskReminders: Awaited<ReturnType<typeof getInventoryRiskReminders>>;
};

function isExpiringSoon(expiresAt: string | undefined, nowMs: number): boolean {
    if (!expiresAt) return false;
    const ts = Date.parse(expiresAt);
    if (!Number.isFinite(ts)) return false;
    const diff = ts - nowMs;
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

function toScopeLabel(input: {
    categoryName?: string;
    brandScope?: "any" | "specific";
    brandNames?: string[];
    modelScope?: "any" | "specific";
    modelNames?: string[];
    nameEntryNames?: string[];
}): string {
    const parts: string[] = [];
    if (input.categoryName) parts.push(input.categoryName);
    if ((input.brandNames ?? []).length > 0) {
        parts.push(`品牌:${input.brandNames?.join(", ")}`);
    } else if (input.brandScope === "any") {
        parts.push("品牌:不限");
    }
    if ((input.modelNames ?? []).length > 0) {
        parts.push(`型號:${input.modelNames?.join(", ")}`);
    } else if (input.modelScope === "any") {
        parts.push("型號:不限");
    }
    if ((input.nameEntryNames ?? []).length > 0) {
        parts.push(`品名:${input.nameEntryNames?.join(", ")}`);
    }
    return parts.join(" / ") || "通用範圍";
}

export async function getConsignmentOverviewData(): Promise<ConsignmentOverviewData> {
    const nowMs = Date.now();
    const [campaigns, entitlements, consignments, riskReminders] = await Promise.all([
        listCampaigns(),
        listCampaignEntitlements(),
        listConsignments(),
        getInventoryRiskReminders(),
    ]);

    const activeCount = consignments.filter((item) => item.status === "active" || item.status === "partially_redeemed").length;
    const remainingQty = consignments.reduce((sum, item) => sum + Math.max(0, item.remainingQty), 0);
    const expiringSoonCount = consignments.filter((item) => isExpiringSoon(item.expiresAt, nowMs)).length;
    const completedCount = consignments.filter((item) => item.status === "completed").length;
    const expiredCount = consignments.filter((item) => item.status === "expired").length;

    const hotCampaigns = campaigns
        .map((campaign) => {
            const relatedEntitlements = entitlements.filter((item) => item.campaignId === campaign.id);
            const relatedConsignments = consignments.filter((item) => item.campaignId === campaign.id);
            const redeemedQty = relatedEntitlements.reduce((sum, item) => sum + Math.max(0, item.redeemedQty), 0);
            const remaining = relatedEntitlements.reduce((sum, item) => sum + Math.max(0, item.remainingQty), 0);
            return {
                campaignId: campaign.id,
                campaignName: campaign.name,
                entitlementCount: relatedEntitlements.length,
                consignmentCount: relatedConsignments.length,
                redeemedQty,
                remainingQty: remaining,
                lifecycleState: campaign.lifecycleState ?? "running",
            } satisfies HotCampaignItem;
        })
        .sort((a, b) => {
            const aHeat = a.entitlementCount + a.consignmentCount;
            const bHeat = b.entitlementCount + b.consignmentCount;
            if (bHeat !== aHeat) return bHeat - aHeat;
            return b.remainingQty - a.remainingQty;
        })
        .slice(0, 8);

    const popularMap = new Map<string, { label: string; qty: number; customers: Set<string> }>();
    for (const consignment of consignments) {
        const label = consignment.categoryName || consignment.title || "未分類";
        const key = label.toLowerCase();
        const current = popularMap.get(key) ?? { label, qty: 0, customers: new Set<string>() };
        current.qty += Math.max(0, consignment.remainingQty);
        if (consignment.customerId) current.customers.add(consignment.customerId);
        popularMap.set(key, current);
    }
    const popularStoredItemTypes = [...popularMap.entries()]
        .map(([key, value]) => ({
            key,
            label: value.label,
            remainingQty: value.qty,
            customerCount: value.customers.size,
        }))
        .sort((a, b) => b.remainingQty - a.remainingQty)
        .slice(0, 8);

    const campaignClosures = campaigns
        .map((campaign) => {
            const relatedRemaining = entitlements
                .filter((item) => item.campaignId === campaign.id)
                .reduce((sum, item) => sum + Math.max(0, item.remainingQty), 0);
            return {
                campaignId: campaign.id,
                campaignName: campaign.name,
                status: campaign.status,
                lifecycleState: campaign.lifecycleState ?? "running",
                remainingQty: relatedRemaining,
            } satisfies CampaignClosureStatus;
        })
        .sort((a, b) => {
            if (a.lifecycleState !== b.lifecycleState) return a.lifecycleState.localeCompare(b.lifecycleState);
            return b.remainingQty - a.remainingQty;
        });

    const customerRows = consignments
        .map((item) => ({
            consignmentId: item.id,
            customerId: item.customerId,
            customerName: item.customerName,
            customerPhone: item.customerPhone,
            campaignId: item.campaignId,
            campaignName: item.campaignName,
            title: item.title,
            scopeLabel: toScopeLabel({
                categoryName: item.categoryName,
                brandScope: item.brandScope,
                brandNames: item.brandNames,
                modelScope: item.modelScope,
                modelNames: item.modelNames,
                nameEntryNames: item.nameEntryNames,
            }),
            remainingQty: item.remainingQty,
            expiresAt: item.expiresAt,
            status: item.status,
        }))
        .sort((a, b) => {
            if (a.remainingQty !== b.remainingQty) return b.remainingQty - a.remainingQty;
            return a.customerName.localeCompare(b.customerName, "zh-Hant");
        });

    return {
        kpi: {
            activeCount,
            remainingQty,
            expiringSoonCount,
            completedCount,
            expiredCount,
        },
        hotCampaigns,
        popularStoredItemTypes,
        campaignClosures,
        customerRows,
        riskReminders,
    };
}
