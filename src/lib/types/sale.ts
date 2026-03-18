export type PaymentMethod = "cash" | "card";
export type PaymentStatus = "unpaid" | "paid" | "deposit" | "installment";
export type SalePromotionEffectType = "discount" | "bundle_price" | "gift_item" | "create_entitlement" | "create_pickup_reservation";

export type SaleLineItem = {
    productId: string;
    productName: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
};

export type SaleCaseRef = {
    caseId: string;
    caseNo: string;
    caseTitle: string;
};

export type SaleActivityRef = {
    activityId: string;
    activityName: string;
    activityContent?: string;
    checkoutStatus?: "stored" | "settled";
    storeQty?: number;
    effectType?: SalePromotionEffectType;
    note?: string;
};

export type SaleAppliedPromotionRef = {
    promotionId: string;
    promotionName: string;
    effectType: SalePromotionEffectType;
};

export type SalePricingAdjustment = {
    promotionId: string;
    promotionName: string;
    effectType: "discount" | "bundle_price";
    amount: number;
};

export type SaleGiftItem = {
    promotionId: string;
    promotionName: string;
    productId: string;
    productName: string;
    qty: number;
};

export type SaleCreatedEntitlementRef = {
    entitlementId: string;
    entitlementType: "replacement" | "gift" | "discount" | "service";
    scopeType: "category" | "product";
    categoryName?: string;
    productName?: string;
    remainingQty: number;
    expiresAt?: number;
};

export type SaleCreatedPickupReservationRef = {
    reservationId: string;
    status: "pending" | "reserved" | "packed" | "ready_for_pickup" | "picked_up" | "cancelled" | "expired";
    lineItemCount: number;
    expiresAt?: number;
};

export type Sale = {
    id: string;
    item: string;
    amount: number;
    checkoutAt: number;
    paymentMethod: PaymentMethod;
    paymentStatus?: PaymentStatus;
    source?: "sales" | "checkout";
    receiptNo?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    caseId?: string;
    caseTitle?: string;
    caseRefs?: SaleCaseRef[];
    activityRefs?: SaleActivityRef[];
    appliedPromotions?: SaleAppliedPromotionRef[];
    pricingAdjustments?: SalePricingAdjustment[];
    giftItems?: SaleGiftItem[];
    createdEntitlements?: SaleCreatedEntitlementRef[];
    createdPickupReservations?: SaleCreatedPickupReservationRef[];
    lineItems?: SaleLineItem[];
    companyId?: string;
    createdAt: number;
    updatedAt: number;
};
