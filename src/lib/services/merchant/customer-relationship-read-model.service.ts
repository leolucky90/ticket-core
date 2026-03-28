import "server-only";
import { cache } from "react";
import { listActivities } from "@/lib/services/merchant/activity-read-model.service";
import { listActivityPurchases, listCompanyCustomers } from "@/lib/services/merchant/customer-read-model.service";
import { listSales } from "@/lib/services/sales";
import { listTickets } from "@/lib/services/ticket";
import {
    isActivityPurchaseLinkedToCustomer,
    isSaleLinkedToCustomer,
    listTicketsForCustomer,
} from "@/lib/services/customerRelationships";
import type { CustomerProfile } from "@/lib/types/customer";
import type {
    Campaign,
    CampaignRedemption,
    ConsignmentStoredBenefit,
    DiagnosticReport,
    Order,
    OrderItem,
    Payment,
    Pickup,
    Receipt,
    Shipment,
    Warranty,
} from "@/lib/types/entities";
import type { Sale } from "@/lib/types/sale";
import type { Ticket } from "@/lib/types/ticket";

type ActivityPurchase = Awaited<ReturnType<typeof listActivityPurchases>>[number];
type ActivityDoc = Awaited<ReturnType<typeof listActivities>>[number];

export type CustomerRelationshipSnapshot = {
    customerId: string;
    orders: Order[];
    orderItems: OrderItem[];
    shipments: Shipment[];
    pickups: Pickup[];
    receipts: Receipt[];
    payments: Payment[];
    warranties: Warranty[];
    diagnosticReports: DiagnosticReport[];
    campaigns: Campaign[];
    campaignRedemptions: CampaignRedemption[];
    consignments: ConsignmentStoredBenefit[];
};

export type CustomerRelationshipRecord = {
    customer: CustomerProfile;
    repairRecords: Ticket[];
    purchaseRecords: ActivityPurchase[];
    snapshot: CustomerRelationshipSnapshot;
};

type CustomerRelationshipSourceBundle = {
    customers: CustomerProfile[];
    tickets: Ticket[];
    sales: Sale[];
    activities: ActivityDoc[];
    purchases: ActivityPurchase[];
};

function toOrderStatus(paymentStatus: string | undefined): Order["status"] {
    if (paymentStatus === "paid") return "completed";
    if (paymentStatus === "deposit" || paymentStatus === "installment") return "processing";
    if (paymentStatus === "unpaid") return "placed";
    return "draft";
}

function toPaymentStatus(paymentStatus: string | undefined): Payment["status"] {
    if (paymentStatus === "paid") return "paid";
    if (paymentStatus === "deposit" || paymentStatus === "installment") return "partially_paid";
    if (paymentStatus === "unpaid") return "pending";
    return "pending";
}

function toPaymentMethod(method: string | undefined): Payment["method"] {
    if (method === "card") return "card";
    return "cash";
}

function createOrderNo(input: { saleId: string; receiptNo?: string; checkoutAt: number }): string {
    if (input.receiptNo) return `ORD-${input.receiptNo}`;
    const yyyyMmDd = new Date(input.checkoutAt || Date.now()).toISOString().slice(0, 10).replace(/-/g, "");
    const suffix = input.saleId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "000000";
    return `ORD-${yyyyMmDd}-${suffix}`;
}

const loadCustomerRelationshipSourceBundle = cache(async (): Promise<CustomerRelationshipSourceBundle> => {
    const [customers, tickets, sales, activities, purchases] = await Promise.all([
        listCompanyCustomers(),
        listTickets(),
        listSales(),
        listActivities(),
        listActivityPurchases(),
    ]);

    return { customers, tickets, sales, activities, purchases };
});

function buildCustomerRelationshipSnapshot(params: {
    customer: CustomerProfile;
    tickets: Ticket[];
    sales: Sale[];
    activities: ActivityDoc[];
    purchases: ActivityPurchase[];
}): CustomerRelationshipSnapshot {
    const { customer, tickets, sales, activities, purchases } = params;
    const customerTickets = listTicketsForCustomer(customer, tickets);
    const customerSales = sales.filter((sale) => isSaleLinkedToCustomer(customer, sale));
    const customerPurchases = purchases.filter((purchase) => isActivityPurchaseLinkedToCustomer(customer, purchase));

    const orders: Order[] = [];
    const orderItems: OrderItem[] = [];
    const shipments: Shipment[] = [];
    const pickups: Pickup[] = [];
    const receipts: Receipt[] = [];
    const payments: Payment[] = [];

    for (const sale of customerSales) {
        const orderId = `order_${sale.id}`;
        const orderStatus = toOrderStatus(sale.paymentStatus);
        const createdAt = sale.createdAt || sale.checkoutAt;
        const updatedAt = sale.updatedAt || sale.checkoutAt;
        const orderNo = createOrderNo({ saleId: sale.id, receiptNo: sale.receiptNo, checkoutAt: sale.checkoutAt });
        const discountAmount = 0;

        orders.push({
            id: orderId,
            companyId: sale.companyId ?? "",
            customerId: customer.id,
            orderNo,
            status: orderStatus,
            fulfillmentType: "pickup",
            subtotalAmount: Math.max(0, sale.amount),
            discountAmount,
            totalAmount: Math.max(0, sale.amount),
            createdAt,
            updatedAt,
        });

        const lineItems = sale.lineItems && sale.lineItems.length > 0
            ? sale.lineItems
            : [
                  {
                      productId: "",
                      productName: sale.item,
                      qty: 1,
                      unitPrice: sale.amount,
                      subtotal: sale.amount,
                  },
              ];

        for (const line of lineItems) {
            const productName = line.usedSerialOrImei
                ? `${line.productName} / IMEI ${line.usedSerialOrImei}`
                : line.productName;
            orderItems.push({
                id: `order_item_${orderId}_${line.productId || line.productName}`,
                orderId,
                productId: line.productId || "",
                productName,
                qty: Math.max(1, Math.round(line.qty)),
                unitPrice: Math.max(0, line.unitPrice),
                subtotal: Math.max(0, line.subtotal),
                createdAt,
                updatedAt,
            });
        }

        if (sale.source === "checkout") {
            pickups.push({
                id: `pickup_${orderId}`,
                orderId,
                status: orderStatus === "completed" ? "picked_up" : "ready",
                pickupCode: orderNo,
                readyAt: sale.checkoutAt,
                pickedUpAt: orderStatus === "completed" ? sale.checkoutAt : undefined,
                createdAt,
                updatedAt,
            });
        } else {
            shipments.push({
                id: `shipment_${orderId}`,
                orderId,
                status: orderStatus === "completed" ? "delivered" : "pending",
                carrier: "",
                trackingNo: "",
                shippedAt: orderStatus === "completed" ? sale.checkoutAt : undefined,
                deliveredAt: orderStatus === "completed" ? sale.checkoutAt : undefined,
                createdAt,
                updatedAt,
            });
        }

        const receiptId = `receipt_${sale.id}`;
        receipts.push({
            id: receiptId,
            companyId: sale.companyId ?? "",
            customerId: customer.id,
            orderId,
            ticketId: sale.caseId,
            receiptNo: sale.receiptNo || `R-${sale.id.slice(-8).toUpperCase()}`,
            amount: Math.max(0, sale.amount),
            issuedAt: sale.checkoutAt,
            createdAt,
            updatedAt,
        });

        payments.push({
            id: `payment_${sale.id}`,
            companyId: sale.companyId ?? "",
            orderId,
            receiptId,
            customerId: customer.id,
            method: toPaymentMethod(sale.paymentMethod),
            status: toPaymentStatus(sale.paymentStatus),
            amount: Math.max(0, sale.amount),
            paidAt: sale.checkoutAt,
            createdAt,
            updatedAt,
        });
    }

    const warrantyTickets = customerTickets.filter((ticket) => ticket.caseType === "warranty");
    const warranties: Warranty[] = warrantyTickets.map((ticket) => {
        const status: Warranty["status"] = ticket.status === "closed" ? "expired" : "active";
        const expiresAt = ticket.updatedAt + 90 * 24 * 60 * 60 * 1000;
        return {
            id: `warranty_${ticket.id}`,
            companyId: ticket.companyId ?? "",
            customerId: customer.id,
            ticketId: ticket.id,
            productName: `${ticket.device.name} ${ticket.device.model}`.trim() || ticket.title,
            expiresAt,
            status,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
        };
    });

    const diagnosticReports: DiagnosticReport[] = customerTickets.map((ticket) => ({
        id: `diag_${ticket.id}`,
        companyId: ticket.companyId ?? "",
        customerId: customer.id,
        ticketId: ticket.id,
        reportNo: `DG-${ticket.id.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`,
        summary: ticket.repairSuggestion || ticket.repairReason || "",
        status: ticket.status === "closed" ? "published" : "draft",
        reportUrl: undefined,
        insuranceClaimExportUrl: undefined,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
    }));

    const campaigns: Campaign[] = activities.map((activity) => ({
        id: activity.id,
        companyId: "",
        name: activity.name,
        description: activity.message,
        startsAt: activity.startAt,
        endsAt: activity.endAt,
        active: activity.status === "active",
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
    }));

    const campaignRedemptions: CampaignRedemption[] = customerPurchases
        .filter((purchase) => purchase.activityName !== "一般銷售")
        .map((purchase) => {
            const linkedCampaign = activities.find((activity) => activity.name === purchase.activityName);
            const redeemedQty = Math.max(0, purchase.totalQty - purchase.remainingQty);
            return {
                id: `redeem_${purchase.id}`,
                companyId: "",
                campaignId: linkedCampaign?.id ?? `campaign_${purchase.activityName}`,
                customerId: customer.id,
                sourceOrderId: undefined,
                sourceTicketId: undefined,
                status:
                    purchase.status === "ended"
                        ? "expired"
                        : redeemedQty > 0
                          ? "redeemed"
                          : "reserved",
                redeemedQty,
                createdAt: purchase.purchasedAt,
                updatedAt: purchase.purchasedAt,
            };
        });

    const consignments: ConsignmentStoredBenefit[] = customerPurchases
        .filter((purchase) => purchase.checkoutStatus === "stored")
        .map((purchase) => {
            const linkedCampaign = activities.find((activity) => activity.name === purchase.activityName);
            const status: ConsignmentStoredBenefit["status"] =
                purchase.status === "ended"
                    ? "expired"
                    : purchase.remainingQty <= 0
                      ? "completed"
                      : purchase.remainingQty < purchase.totalQty
                        ? "partially_redeemed"
                        : "active";

            return {
                id: `consignment_${purchase.id}`,
                companyId: "",
                customerId: customer.id,
                campaignRedemptionId: `redeem_${purchase.id}`,
                productName: purchase.itemName,
                sourceCampaignName: purchase.activityName,
                originalQty: Math.max(0, purchase.totalQty),
                remainingQty: Math.max(0, purchase.remainingQty),
                activationDate: purchase.purchasedAt,
                expiryDate: linkedCampaign ? linkedCampaign.endAt : undefined,
                status,
                createdAt: purchase.purchasedAt,
                updatedAt: purchase.purchasedAt,
            };
        });

    return {
        customerId: customer.id,
        orders,
        orderItems,
        shipments,
        pickups,
        receipts,
        payments,
        warranties,
        diagnosticReports,
        campaigns,
        campaignRedemptions,
        consignments,
    };
}

function buildCustomerRelationshipRecord(customer: CustomerProfile, source: CustomerRelationshipSourceBundle): CustomerRelationshipRecord {
    const repairRecords = listTicketsForCustomer(customer, source.tickets).sort((a, b) => b.updatedAt - a.updatedAt);
    const purchaseRecords = source.purchases
        .filter((purchase) => isActivityPurchaseLinkedToCustomer(customer, purchase))
        .sort((a, b) => b.purchasedAt - a.purchasedAt);

    return {
        customer,
        repairRecords,
        purchaseRecords,
        snapshot: buildCustomerRelationshipSnapshot({
            customer,
            tickets: source.tickets,
            sales: source.sales,
            activities: source.activities,
            purchases: source.purchases,
        }),
    };
}

export async function listCustomerRelationshipRecords(): Promise<CustomerRelationshipRecord[]> {
    const source = await loadCustomerRelationshipSourceBundle();
    return source.customers.map((customer) => buildCustomerRelationshipRecord(customer, source));
}

export async function getCustomerRelationshipRecord(customerId: string): Promise<CustomerRelationshipRecord | null> {
    const targetId = customerId.trim();
    if (!targetId) return null;

    const source = await loadCustomerRelationshipSourceBundle();
    const customer = source.customers.find((row) => row.id === targetId);
    if (!customer) return null;
    return buildCustomerRelationshipRecord(customer, source);
}

export async function getCustomerRelationshipSnapshot(customerId: string): Promise<CustomerRelationshipSnapshot | null> {
    const record = await getCustomerRelationshipRecord(customerId);
    return record?.snapshot ?? null;
}
