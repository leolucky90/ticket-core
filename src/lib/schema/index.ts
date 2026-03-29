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

export type { SoftDeleteMeta, SoftDeleteStatus } from "@/lib/schema/softDelete";

export {
    createSoftDeleteMeta,
    normalizeSoftDeleteMeta,
    SOFT_DELETE_STATUSES,
    withHardDeleted,
    withRestored,
    withSoftDeleted,
} from "@/lib/schema/softDelete";

export type {
    PermissionLevel,
    PermissionLevelNumber,
} from "@/lib/schema/permissionLevels";

export {
    createDefaultPermissionLevel,
    normalizePermissionLevel,
    permissionLevelDocPath,
    permissionLevelsCollectionPath,
    PERMISSION_LEVEL_DEFAULT_NAMES,
    PERMISSION_LEVEL_RANGE,
} from "@/lib/schema/permissionLevels";

export type { SecuritySettings } from "@/lib/schema/securitySettings";

export {
    createDefaultSecuritySettings,
    normalizeSecuritySettings,
    securitySettingsDocPath,
} from "@/lib/schema/securitySettings";

export type {
    DeleteLog,
    DeleteLogStatus,
} from "@/lib/schema/deleteLogs";

export {
    deleteLogsCollectionPath,
    DELETE_LOG_STATUSES,
    normalizeDeleteLog,
} from "@/lib/schema/deleteLogs";

export type { AuditLog } from "@/lib/schema/auditLogs";

export { auditLogsCollectionPath, normalizeAuditLog } from "@/lib/schema/auditLogs";

export type {
    CompanyProfile,
} from "@/lib/schema/companyProfile";

export {
    companyProfileDocPath,
    isCompanyProfile,
    normalizeCompanyProfile,
} from "@/lib/schema/companyProfile";

export type {
    CaseRecord,
    CaseType,
    TicketCaseRecord,
    TicketCaseType,
} from "@/lib/schema/cases";

export { normalizeCaseRecord, normalizeTicketCaseRecord } from "@/lib/schema/cases";

export type {
    StaffMember,
    StaffMemberStatus,
} from "@/lib/schema/staffMembers";

export {
    normalizeStaffMember,
    staffMembersCollectionPath,
    STAFF_MEMBER_STATUSES,
} from "@/lib/schema/staffMembers";

export type {
    UsedProduct,
    UsedProductGrade,
    UsedProductRefurbishmentStatus,
    UsedProductSaleStatus,
    UsedProductSpecificationItem,
    UsedProductWarrantyUnit,
} from "@/lib/schema/usedProducts";

export {
    isUsedProduct,
    normalizeUsedProduct,
    USED_PRODUCT_GRADES,
    USED_PRODUCT_REFURBISHMENT_STATUSES,
    USED_PRODUCT_SALE_STATUSES,
    USED_PRODUCT_WARRANTY_UNITS,
    usedProductsCollectionPath,
} from "@/lib/schema/usedProducts";

export type {
    UsedProductTypeSetting,
    UsedProductTypeSpecificationInputType,
    UsedProductTypeSpecificationTemplate,
} from "@/lib/schema/usedProductTypeSettings";

export {
    isUsedProductTypeSetting,
    normalizeUsedProductTypeSetting,
    usedProductTypeSettingsCollectionPath,
} from "@/lib/schema/usedProductTypeSettings";

export type { MerchantStore, MerchantStoreStatus } from "@/lib/schema/merchant-store";

export {
    MERCHANT_STORE_STATUSES,
    normalizeMerchantStore,
    storesCollectionPath,
} from "@/lib/schema/merchant-store";

export type { Warehouse } from "@/lib/schema/warehouse";

export { normalizeWarehouse, warehousesCollectionPath } from "@/lib/schema/warehouse";

export type { WarehouseInventoryRow } from "@/lib/schema/warehouse-inventory";

export {
    normalizeWarehouseInventoryRow,
    warehouseInventoryCollectionPath,
    warehouseInventoryDocId,
} from "@/lib/schema/warehouse-inventory";

export type { StockItem, StockItemStatus } from "@/lib/schema/stock-item";

export { normalizeStockItem, stockItemsCollectionPath, STOCK_ITEM_STATUSES } from "@/lib/schema/stock-item";

export type { InventoryLog, WarehouseInventoryLog, WarehouseInventoryLogType } from "@/lib/schema/inventory-log";

export {
    inventoryLogsCollectionPath,
    normalizeWarehouseInventoryLog,
    WAREHOUSE_INVENTORY_LOG_TYPES,
} from "@/lib/schema/inventory-log";

export type { InventoryTransfer, InventoryTransferLine, InventoryTransferStatus } from "@/lib/schema/inventory-transfer";

export {
    INVENTORY_TRANSFER_STATUSES,
    normalizeInventoryTransfer,
    transfersCollectionPath,
} from "@/lib/schema/inventory-transfer";

export type { PoDraft } from "@/lib/schema/ai/po-draft";

export { poDraftItemSchema, poDraftSchema } from "@/lib/schema/ai/po-draft";

export type { PoDraftProductSearchHit } from "@/lib/schema/poDraftProduct";

export type { IntakeDocumentStatus } from "@/lib/schema/receiptPoIntake";

export {
    intakeDocumentDocPath,
    intakeDocumentsCollectionPath,
    ocrResultDocPath,
    ocrResultsCollectionPath,
    poDraftDocPath,
    poDraftsCollectionPath,
    purchaseOrderDocPath,
    purchaseOrdersCollectionPath,
} from "@/lib/schema/receiptPoIntake";
