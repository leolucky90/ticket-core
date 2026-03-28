import type { ProductNamingMode } from "@/lib/types/catalog";

export type EntityId = string;
export type EpochMs = number;

export type OrderLifecycleStatus =
    | "draft"
    | "placed"
    | "accepted"
    | "processing"
    | "ready_for_pickup"
    | "shipped"
    | "completed"
    | "cancelled"
    | "returned"
    | "out_of_stock_pending_change";

export type ShipmentStatus = "pending" | "packed" | "shipped" | "delivered" | "returned" | "cancelled";
export type PickupStatus = "pending" | "ready" | "picked_up" | "cancelled";
export type WarrantyStatus = "active" | "expired" | "void";
export type DiagnosticReportStatus = "draft" | "published" | "archived";
export type PaymentStatus = "pending" | "paid" | "partially_paid" | "refunded" | "cancelled";
export type PaymentMethod = "cash" | "card" | "bank_transfer" | "digital_wallet";
export type InventoryMovementType = "stock_in" | "stock_out" | "sale" | "refund" | "adjustment";
export type CampaignRedemptionStatus = "reserved" | "redeemed" | "expired" | "cancelled";
export type ConsignmentStatus = "active" | "partially_redeemed" | "completed" | "expired" | "cancelled";

export type AuditFields = {
    createdAt: EpochMs;
    updatedAt: EpochMs;
};

export type Company = AuditFields & {
    id: EntityId;
    name: string;
    slug: string;
    subdomain: string;
    ownerUid?: string;
    ownerEmail?: string;
    contactPhone?: string;
    address?: string;
};

export type Subscription = AuditFields & {
    id: EntityId;
    companyId: EntityId;
    planCode: string;
    startedAt: EpochMs;
    endsAt: EpochMs;
    amount: number;
    currency: string;
    active: boolean;
};

export type Customer = AuditFields & {
    id: EntityId;
    companyId: EntityId;
    name: string;
    phone: string;
    email: string;
    address: string;
};

export type CustomerAccount = AuditFields & {
    id: EntityId;
    customerId: EntityId;
    userUid: string;
    email: string;
    active: boolean;
};

export type Ticket = AuditFields & {
    id: EntityId;
    companyId: EntityId;
    customerId?: EntityId;
    title: string;
    status: "new" | "in_progress" | "waiting_customer" | "resolved" | "closed";
    quoteStatus: "inspection_estimate" | "quoted" | "rejected" | "accepted";
    repairAmount: number;
    inspectionFee: number;
    pendingFee: number;
};

export type DiagnosticReport = AuditFields & {
    id: EntityId;
    companyId: EntityId;
    customerId: EntityId;
    ticketId: EntityId;
    reportNo: string;
    summary: string;
    status: DiagnosticReportStatus;
    reportUrl?: string;
    insuranceClaimExportUrl?: string;
};

export type Warranty = AuditFields & {
    id: EntityId;
    companyId: EntityId;
    customerId: EntityId;
    ticketId?: EntityId;
    orderId?: EntityId;
    productName: string;
    expiresAt: EpochMs;
    status: WarrantyStatus;
};

export type Order = AuditFields & {
    id: EntityId;
    companyId: EntityId;
    customerId?: EntityId;
    orderNo: string;
    status: OrderLifecycleStatus;
    fulfillmentType: "pickup" | "shipping";
    subtotalAmount: number;
    discountAmount: number;
    totalAmount: number;
};

export type OrderItem = AuditFields & {
    id: EntityId;
    orderId: EntityId;
    productId: EntityId;
    productName: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
};

export type Shipment = AuditFields & {
    id: EntityId;
    orderId: EntityId;
    status: ShipmentStatus;
    carrier: string;
    trackingNo: string;
    shippedAt?: EpochMs;
    deliveredAt?: EpochMs;
};

export type Pickup = AuditFields & {
    id: EntityId;
    orderId: EntityId;
    status: PickupStatus;
    pickupCode?: string;
    readyAt?: EpochMs;
    pickedUpAt?: EpochMs;
};

export type Receipt = AuditFields & {
    id: EntityId;
    companyId: EntityId;
    customerId?: EntityId;
    orderId?: EntityId;
    ticketId?: EntityId;
    receiptNo: string;
    amount: number;
    issuedAt: EpochMs;
};

export type Payment = AuditFields & {
    id: EntityId;
    companyId: EntityId;
    orderId?: EntityId;
    receiptId?: EntityId;
    customerId?: EntityId;
    method: PaymentMethod;
    status: PaymentStatus;
    amount: number;
    paidAt: EpochMs;
};

export type ProductDoc = AuditFields & {
    id: EntityId;
    companyId: EntityId;
    name: string;
    namingMode: ProductNamingMode;
    categoryId?: EntityId;
    categoryName?: string;
    brandId?: EntityId;
    brandName?: string;
    modelId?: EntityId;
    modelName?: string;
    nameEntryId?: EntityId;
    nameEntryName?: string;
    customLabel?: string;
    aliases?: string[];
    normalizedName?: string;
    sku: string;
    price: number;
    cost: number;
};

export type Product = ProductDoc;

export type Inventory = AuditFields & {
    id: EntityId;
    companyId: EntityId;
    productId: EntityId;
    inStockQty: number;
    reservedQty: number;
};

export type InventoryMovement = AuditFields & {
    id: EntityId;
    companyId: EntityId;
    productId: EntityId;
    movementType: InventoryMovementType;
    qty: number;
    beforeQty: number;
    afterQty: number;
    reason: string;
    referenceId?: EntityId;
};

export type Campaign = AuditFields & {
    id: EntityId;
    companyId: EntityId;
    name: string;
    description: string;
    startsAt: EpochMs;
    endsAt: EpochMs;
    active: boolean;
};

export type CampaignRedemption = AuditFields & {
    id: EntityId;
    companyId: EntityId;
    campaignId: EntityId;
    customerId: EntityId;
    sourceOrderId?: EntityId;
    sourceTicketId?: EntityId;
    status: CampaignRedemptionStatus;
    redeemedQty: number;
};

export type ConsignmentStoredBenefit = AuditFields & {
    id: EntityId;
    companyId: EntityId;
    customerId: EntityId;
    campaignRedemptionId: EntityId;
    productName: string;
    sourceCampaignName: string;
    originalQty: number;
    remainingQty: number;
    activationDate: EpochMs;
    expiryDate?: EpochMs;
    status: ConsignmentStatus;
};
