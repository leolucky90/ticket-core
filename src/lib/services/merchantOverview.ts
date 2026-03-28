import "server-only";
import { listCompanyCustomers } from "@/lib/services/merchant/customer-read-model.service";
import { getCustomerRelationshipSnapshot } from "@/lib/services/customer360";

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
    const customers = await listCompanyCustomers();
    const snapshots = await Promise.all(customers.map((customer) => getCustomerRelationshipSnapshot(customer.id)));

    return customers
        .map((customer, index): MerchantRelationshipRow | null => {
            const snapshot = snapshots[index];
            if (!snapshot) return null;

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
        .filter((row): row is MerchantRelationshipRow => row !== null)
        .sort((a, b) => a.customerName.localeCompare(b.customerName, "zh-Hant"));
}
