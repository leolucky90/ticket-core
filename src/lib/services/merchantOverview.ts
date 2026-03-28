import "server-only";
import { listCustomerRelationshipRecords } from "@/lib/services/merchant/customer-relationship-read-model.service";

export type MerchantRelationshipRow = {
    customerId: string;
    customerName: string;
    customerPhone: string;
    orderCount: number;
    receiptCount: number;
    warrantyCount: number;
    diagnosticCount: number;
    activeConsignmentCount: number;
    totalConsignmentRemainingQty: number;
};

export async function getMerchantRelationshipOverview(): Promise<MerchantRelationshipRow[]> {
    const records = await listCustomerRelationshipRecords();

    return records
        .map(({ customer, snapshot }): MerchantRelationshipRow => {
            const activeConsignments = snapshot.consignments.filter(
                (consignment) =>
                    consignment.status === "active" ||
                    consignment.status === "partially_redeemed",
            );

            return {
                customerId: customer.id,
                customerName: customer.name,
                customerPhone: customer.phone,
                orderCount: snapshot.orders.length,
                receiptCount: snapshot.receipts.length,
                warrantyCount: snapshot.warranties.length,
                diagnosticCount: snapshot.diagnosticReports.length,
                activeConsignmentCount: activeConsignments.length,
                totalConsignmentRemainingQty: activeConsignments.reduce(
                    (sum, row) => sum + row.remainingQty,
                    0,
                ),
            };
        })
        .sort((a, b) => a.customerName.localeCompare(b.customerName, "zh-Hant"));
}
