import "server-only";
import { cache } from "react";
import { getCustomerRelationshipRecord } from "@/lib/services/merchant/customer-relationship-read-model.service";
import { listCustomerEntitlements, listEntitlementRedemptions } from "@/lib/services/entitlements";
import { listPickupReservations } from "@/lib/services/pickupReservations";

export type MerchantCustomerDetailReadModel = {
    relationshipRecord: NonNullable<Awaited<ReturnType<typeof getCustomerRelationshipRecord>>>;
    entitlements: Awaited<ReturnType<typeof listCustomerEntitlements>>;
    redemptions: Awaited<ReturnType<typeof listEntitlementRedemptions>>;
    pickupReservations: Awaited<ReturnType<typeof listPickupReservations>>;
};

const loadCustomerDetail = cache(async (customerId: string): Promise<MerchantCustomerDetailReadModel | null> => {
    const targetId = customerId.trim();
    if (!targetId) return null;

    const [relationshipRecord, entitlements, redemptions, pickupReservations] = await Promise.all([
        getCustomerRelationshipRecord(targetId),
        listCustomerEntitlements(targetId),
        listEntitlementRedemptions(targetId),
        listPickupReservations(targetId),
    ]);
    if (!relationshipRecord) return null;

    return {
        relationshipRecord,
        entitlements,
        redemptions,
        pickupReservations,
    };
});

export async function getMerchantCustomerDetail(customerId: string): Promise<MerchantCustomerDetailReadModel | null> {
    return loadCustomerDetail(customerId);
}
