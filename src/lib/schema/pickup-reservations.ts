// Compatibility barrel for older pluralized imports. Prefer `@/lib/schema/pickupReservation`.
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
