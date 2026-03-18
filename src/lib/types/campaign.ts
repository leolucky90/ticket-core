export type CampaignStatus = "draft" | "active" | "ended" | "archived";
export type CampaignLifecycleState =
    | "running"
    | "ended_pending_redemption"
    | "fully_closed";

export interface CampaignDoc {
    id: string;
    companyId: string;

    name: string;
    slug: string;
    description?: string;

    categoryId?: string;
    categoryName?: string;

    brandScope?: "any" | "specific";
    brandIds?: string[];
    brandNames?: string[];

    modelScope?: "any" | "specific";
    modelIds?: string[];
    modelNames?: string[];

    nameEntryIds?: string[];
    nameEntryNames?: string[];

    allowsCustomItem: boolean;
    stockDeductionTiming: "checkout" | "redeem";

    startAt?: string;
    endAt?: string;

    status: CampaignStatus;
    lifecycleState?: CampaignLifecycleState;

    createdAt: string;
    updatedAt: string;
}

export type CampaignEntitlementStatus =
    | "active"
    | "partially_redeemed"
    | "completed"
    | "expired"
    | "cancelled";

export interface CampaignEntitlementDoc {
    id: string;
    companyId: string;

    campaignId: string;
    campaignName: string;

    customerId: string;
    customerName: string;
    customerPhone?: string;

    sourceReceiptId?: string;
    sourceOrderId?: string;
    sourceTicketId?: string;

    entitledQty: number;
    redeemedQty: number;
    remainingQty: number;

    categoryId?: string;
    categoryName?: string;

    brandScope?: "any" | "specific";
    brandIds?: string[];
    brandNames?: string[];

    modelScope?: "any" | "specific";
    modelIds?: string[];
    modelNames?: string[];

    nameEntryIds?: string[];
    nameEntryNames?: string[];

    allowsCustomItem: boolean;
    isConsignment: boolean;

    activatedAt: string;
    expiresAt?: string;

    status: CampaignEntitlementStatus;

    createdAt: string;
    updatedAt: string;
}
