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

export type { BusinessProfile } from "@/lib/schema/business-profile.schema";

export {
    businessProfileDocPath,
    createEmptyBusinessProfile,
    isBusinessProfile,
    normalizeBusinessProfile,
} from "@/lib/schema/business-profile.schema";

export type {
    AuReceiptSettings,
    BusinessRegion,
    DocumentMode,
    InvoiceTitleMode,
    RegionalReceiptSettings,
    TwReceiptSettings,
} from "@/lib/schema/regional-receipt-settings.schema";

export {
    BUSINESS_REGIONS,
    createEmptyRegionalReceiptSettings,
    DOCUMENT_MODES,
    getRegionalReceiptDefaults,
    INVOICE_TITLE_MODES,
    isRegionalReceiptSettings,
    normalizeRegionalReceiptSettings,
    regionalReceiptSettingsDocPath,
} from "@/lib/schema/regional-receipt-settings.schema";

export type { ReceiptTemplatePreviewModel } from "@/lib/schema/receipt-template.schema";

export { resolveReceiptTemplatePreviewModel } from "@/lib/schema/receipt-template.schema";

export type { InvoiceItem } from "@/lib/schema/invoice-item.schema";

export { normalizeInvoiceItem } from "@/lib/schema/invoice-item.schema";

export type { InvoiceCarrierRecord, InvoiceCarrierType } from "@/lib/schema/invoice-carrier.schema";

export {
    invoiceCarrierDocPath,
    invoiceCarriersCollectionPath,
    INVOICE_CARRIER_TYPES,
    normalizeInvoiceCarrierRecord,
} from "@/lib/schema/invoice-carrier.schema";

export type {
    InvoiceBuyerType,
    InvoiceIntegrationMode,
    InvoicePlatformStatus,
    InvoiceStatus,
    InvoiceVoidStatus,
    ReceiptDocumentRecord,
    ReceiptDocumentType,
} from "@/lib/schema/receipt-document.schema";

export {
    INVOICE_BUYER_TYPES,
    INVOICE_INTEGRATION_MODES,
    INVOICE_PLATFORM_STATUSES,
    INVOICE_STATUSES,
    INVOICE_VOID_STATUSES,
    normalizeReceiptDocumentRecord,
    RECEIPT_DOCUMENT_TYPES,
    receiptDocumentDocPath,
    receiptDocumentsCollectionPath,
} from "@/lib/schema/receipt-document.schema";

export type { InvoiceRecord } from "@/lib/schema/invoice.schema";

export { invoiceDocPath, invoicesCollectionPath, normalizeInvoiceRecord } from "@/lib/schema/invoice.schema";

export type { InvoiceDraftRecord, InvoiceDraftStatus } from "@/lib/schema/invoice-draft.schema";

export {
    invoiceDraftDocPath,
    invoiceDraftsCollectionPath,
    INVOICE_DRAFT_STATUSES,
    normalizeInvoiceDraftRecord,
} from "@/lib/schema/invoice-draft.schema";

export type { InvoiceVoidRecord } from "@/lib/schema/invoice-void.schema";

export {
    invoiceVoidDocPath,
    invoiceVoidsCollectionPath,
    normalizeInvoiceVoidRecord,
} from "@/lib/schema/invoice-void.schema";

export type { InvoiceLogAction, InvoiceLogLevel, InvoiceLogRecord } from "@/lib/schema/invoice-log.schema";

export {
    invoiceLogDocPath,
    invoiceLogsCollectionPath,
    INVOICE_LOG_ACTIONS,
    INVOICE_LOG_LEVELS,
    normalizeInvoiceLogRecord,
} from "@/lib/schema/invoice-log.schema";

export type { InvoiceSettings } from "@/lib/schema/invoice-settings.schema";

export {
    createEmptyInvoiceSettings,
    invoiceSettingsDocPath,
    normalizeInvoiceSettings,
} from "@/lib/schema/invoice-settings.schema";

export type { InvoiceTrackSetting } from "@/lib/schema/invoice-track-settings.schema";

export {
    invoiceTrackSettingDocPath,
    invoiceTrackSettingsCollectionPath,
    normalizeInvoiceTrackSetting,
} from "@/lib/schema/invoice-track-settings.schema";

export type { CheckoutCaseSelection } from "@/lib/schema/checkout-case-selection.schema";

export {
    createCheckoutCaseSelectionFromTicket,
    normalizeCheckoutCaseSelection,
} from "@/lib/schema/checkout-case-selection.schema";

export type {
    CheckoutBuyerType,
    CheckoutCarrierType,
    CheckoutDocument,
    CheckoutDocumentAuFields,
    CheckoutDocumentMode,
    CheckoutDocumentTwFields,
    CheckoutPrintMode,
} from "@/lib/schema/checkout-document.schema";

export {
    allowedCheckoutDocumentModesForRegion,
    CHECKOUT_BUYER_TYPES,
    CHECKOUT_CARRIER_TYPES,
    CHECKOUT_DOCUMENT_MODES,
    checkoutDocumentModeFromRegionalMode,
    CHECKOUT_PRINT_MODES,
    createDefaultCheckoutDocument,
    normalizeCheckoutDocument,
    resolveCheckoutDocumentModeFromRegionalSettings,
} from "@/lib/schema/checkout-document.schema";

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
