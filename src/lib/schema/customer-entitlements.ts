// Compatibility barrel for older pluralized imports. Prefer `@/lib/schema/customerEntitlement`.
export type {
    CreateCustomerEntitlementInput,
    CustomerEntitlement,
    CustomerEntitlementDocument,
    CustomerEntitlementStatus,
    EntitlementScopeType,
    EntitlementSourceType,
    EntitlementType,
    RedeemEntitlementInput,
} from "@/lib/schema/customerEntitlement";

export {
    CUSTOMER_ENTITLEMENT_KEYS,
    customerEntitlementsCollectionPath,
    evaluateCustomerEntitlementStatus,
    isCustomerEntitlementDocument,
    normalizeCustomerEntitlementDocument,
} from "@/lib/schema/customerEntitlement";

export type {
    EntitlementRedemption,
    EntitlementRedemptionDocument,
    EntitlementRedemptionProductSnapshot,
} from "@/lib/schema/entitlementRedemption";

export {
    ENTITLEMENT_REDEMPTION_KEYS,
    entitlementRedemptionsCollectionPath,
    isEntitlementRedemptionDocument,
    normalizeEntitlementRedemptionDocument,
} from "@/lib/schema/entitlementRedemption";
