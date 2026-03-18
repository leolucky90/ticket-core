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

export type {
    InventoryDocument,
    InventoryKey,
    InventoryRecord,
    InventoryStatus,
} from "@/lib/schema/inventory";

export {
    INVENTORY_KEYS,
    INVENTORY_STATUSES,
    inventoryCollectionPath,
    isInventoryDocument,
    normalizeInventoryDocument,
    recomputeAvailableQty,
} from "@/lib/schema/inventory";

export type {
    InventoryMovementDocument,
    InventoryMovementEventType,
    InventoryMovementKey,
    InventoryMovementLog,
    InventoryMovementReferenceType,
} from "@/lib/schema/inventoryMovement";

export {
    INVENTORY_MOVEMENT_EVENT_TYPES,
    INVENTORY_MOVEMENT_KEYS,
    INVENTORY_MOVEMENT_REFERENCE_TYPES,
    inventoryMovementsCollectionPath,
    isInventoryMovementDocument,
    normalizeInventoryMovementDocument,
} from "@/lib/schema/inventoryMovement";

export type {
    CreatePickupReservationInput,
    InventoryReservationReference,
    PickupReservation,
    PickupReservationCustomerSnapshot,
    PickupReservationDocument,
    PickupReservationKey,
    PickupReservationLineItem,
    PickupReservationLineItemProductSnapshot,
    PickupReservationSourceChannel,
    PickupReservationStatus,
} from "@/lib/schema/pickupReservation";

export {
    PICKUP_RESERVATION_KEYS,
    PICKUP_RESERVATION_SOURCE_CHANNELS,
    PICKUP_RESERVATION_STATUSES,
    isPickupReservationDocument,
    normalizePickupReservationDocument,
    pickupReservationsCollectionPath,
} from "@/lib/schema/pickupReservation";

export type {
    CheckoutPromotionSelection,
    PromotionEffectType,
    PromotionEntitlementDraft,
    PromotionEvaluationResult,
    PromotionGiftItem,
    PromotionPickupReservationDraft,
    PromotionPricingAdjustment,
    PromotionRecommendation,
    PromotionType,
} from "@/lib/schema/promotions";

export { PROMOTION_EFFECT_TYPES, PROMOTION_TYPES } from "@/lib/schema/promotions";
