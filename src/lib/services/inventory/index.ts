import "server-only";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import type { InventoryDocument, InventoryMovementEventType, InventoryMovementLog, InventoryRecord } from "@/lib/schema";
import {
    inventoryCollectionPath,
    inventoryMovementsCollectionPath,
    normalizeInventoryDocument,
    normalizeInventoryMovementDocument,
    recomputeAvailableQty,
} from "@/lib/schema";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";

type SessionScope = {
    companyId: string;
    operatorName: string;
    operatorUserId: string;
};

type AdjustInventoryInput = {
    companyId?: string;
    productId: string;
    eventType: InventoryMovementEventType;
    qty?: number;
    onHandDelta?: number;
    reservedDelta?: number;
    referenceType?: string;
    referenceId?: string;
    note?: string;
    operatorUserId?: string;
    operatorName?: string;
    enforceAvailable?: boolean;
};

type CreateInventoryMovementInput = {
    companyId: string;
    branchId?: string | null;
    productId: string;
    sku: string;
    productName: string;
    eventType: InventoryMovementEventType;
    qtyDelta: number;
    qtyBefore: number;
    qtyAfter: number;
    reservedQtyBefore: number;
    reservedQtyAfter: number;
    referenceType?: string | null;
    referenceId?: string | null;
    note?: string | null;
    operatorUserId?: string | null;
    operatorName?: string | null;
};

const memory: {
    inventoryByCompany: Record<string, Record<string, InventoryRecord>>;
    movementsByCompany: Record<string, InventoryMovementLog[]>;
} = {
    inventoryByCompany: {},
    movementsByCompany: {},
};

function nowIso(): string {
    return new Date().toISOString();
}

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toNullableText(value: unknown, max = 240): string | null {
    const cleaned = toText(value, max);
    return cleaned || null;
}

function toNonNegativeInt(value: unknown, fallback = 0): number {
    const raw = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(raw)) return Math.max(0, Math.round(fallback));
    return Math.max(0, Math.round(raw));
}

function toIsoString(value: unknown, fallbackMs = Date.now()): string {
    if (typeof value === "string") {
        const parsed = Date.parse(value);
        if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
    }
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return new Date(Math.round(value)).toISOString();
    }
    return new Date(fallbackMs).toISOString();
}

function normalizeCompanyId(value: unknown): string | null {
    const cleaned = toText(value, 120);
    if (!cleaned) return null;
    if (/[/?#]/.test(cleaned)) return null;
    return cleaned;
}

function buildMovementId(): string {
    return `inv_move_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeReferenceType(value: string | null | undefined):
    | "receipt"
    | "pickupReservation"
    | "manualAdjustment"
    | "return"
    | "entitlementRedemption"
    | "purchaseOrder"
    | "unknown" {
    const cleaned = toText(value, 80).toLowerCase();
    if (cleaned === "receipt" || cleaned === "sale") return "receipt";
    if (cleaned === "pickupreservation" || cleaned === "pickup_reservation" || cleaned === "pickup_order") return "pickupReservation";
    if (cleaned === "manualadjustment" || cleaned === "manual_adjustment") return "manualAdjustment";
    if (cleaned === "return" || cleaned === "return_in") return "return";
    if (cleaned === "entitlementredemption" || cleaned === "entitlement" || cleaned === "entitlement_redemption") return "entitlementRedemption";
    if (cleaned === "purchaseorder" || cleaned === "purchase_order") return "purchaseOrder";
    return "unknown";
}

async function resolveSessionScope(): Promise<SessionScope | null> {
    const session = await getSessionUser();
    if (!session) return null;

    const user = await getUserDoc(session.uid);
    if (!user) return null;
    if (toAccountType(user.role) !== "company") return null;

    const companyId = normalizeCompanyId(getShowcaseTenantId(user, session.uid));
    if (!companyId) return null;

    return {
        companyId,
        operatorName: toText(session.email?.split("@")[0] ?? "", 120) || "operator",
        operatorUserId: toText(session.uid, 120),
    };
}

async function getFirestoreDb() {
    try {
        const mod = await import("@/lib/firebase-server");
        return mod.fbAdminDb;
    } catch {
        return null;
    }
}

function getMemoryInventory(companyId: string, productId: string): InventoryRecord | null {
    return memory.inventoryByCompany[companyId]?.[productId] ?? null;
}

function setMemoryInventory(companyId: string, doc: InventoryRecord): void {
    const current = memory.inventoryByCompany[companyId] ?? {};
    memory.inventoryByCompany[companyId] = {
        ...current,
        [doc.productId]: doc,
    };
}

function pushMemoryMovement(companyId: string, movement: InventoryMovementLog): void {
    const current = memory.movementsByCompany[companyId] ?? [];
    memory.movementsByCompany[companyId] = [movement, ...current].slice(0, 1200);
}

function normalizeInventoryFromProductDoc(companyId: string, productId: string, row: Record<string, unknown>): InventoryRecord {
    const onHandQty = toNonNegativeInt(row.onHandQty ?? row.stockQty ?? row.stock, 0);
    const reservedQty = toNonNegativeInt(row.reservedQty, 0);
    const availableQty = recomputeAvailableQty(onHandQty, reservedQty);

    return normalizeInventoryDocument({
        productId,
        companyId,
        sku: toText(row.sku, 120),
        productName: toText(row.name) || toText(row.productName) || "Untitled Product",
        categoryId: toNullableText(row.categoryId, 120),
        categoryName: toNullableText(row.categoryName),
        brandId: toNullableText(row.brandId, 120),
        brandName: toNullableText(row.brandName),
        modelId: toNullableText(row.modelId, 120),
        modelName: toNullableText(row.modelName),
        onHandQty,
        reservedQty,
        availableQty,
        lowStockThreshold: toNonNegativeInt(row.lowStockThreshold, 0),
        trackInventory: row.trackInventory !== false,
        status: row.status === "inactive" || row.status === "archived" ? row.status : "active",
        branchId: toNullableText(row.branchId, 120),
        createdAt: toIsoString(row.createdAt),
        updatedAt: toIsoString(row.updatedAt),
        createdBy: toNullableText(row.createdBy, 120),
        updatedBy: toNullableText(row.updatedBy, 120),
    });
}

async function loadInventoryFromFirestore(companyId: string, productId: string): Promise<InventoryRecord | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const inventoryRef = db.collection(inventoryCollectionPath(companyId)).doc(productId);
    const inventorySnap = await inventoryRef.get();
    if (inventorySnap.exists) {
        const row = (inventorySnap.data() ?? {}) as Record<string, unknown>;
        const doc = normalizeInventoryDocument({
            ...row,
            productId,
            companyId,
        });
        return doc;
    }

    const productRef = db.collection(`companies/${companyId}/products`).doc(productId);
    const productSnap = await productRef.get();
    if (!productSnap.exists) return null;

    const doc = normalizeInventoryFromProductDoc(companyId, productId, (productSnap.data() ?? {}) as Record<string, unknown>);
    await inventoryRef.set(doc, { merge: true });
    return doc;
}

async function saveInventory(companyId: string, doc: InventoryDocument): Promise<void> {
    const db = await getFirestoreDb();
    if (!db) {
        setMemoryInventory(companyId, doc);
        return;
    }

    const inventoryRef = db.collection(inventoryCollectionPath(companyId)).doc(doc.productId);
    const productRef = db.collection(`companies/${companyId}/products`).doc(doc.productId);

    await Promise.all([
        inventoryRef.set(doc, { merge: true }),
        productRef.set(
            {
                onHandQty: doc.onHandQty,
                reservedQty: doc.reservedQty,
                availableQty: doc.availableQty,
                stockQty: doc.onHandQty,
                stock: doc.onHandQty,
                lowStockThreshold: doc.lowStockThreshold,
                trackInventory: doc.trackInventory,
                updatedAt: doc.updatedAt,
            },
            { merge: true },
        ),
    ]);

    setMemoryInventory(companyId, doc);
}

export async function getInventoryByProductId(productIdInput: string, companyIdInput?: string): Promise<InventoryRecord | null> {
    const scope = await resolveSessionScope();
    const companyId = normalizeCompanyId(companyIdInput) ?? scope?.companyId ?? null;
    const productId = toText(productIdInput, 120);
    if (!companyId || !productId) return null;

    const fromMemory = getMemoryInventory(companyId, productId);
    if (fromMemory) return fromMemory;

    try {
        const fromFirestore = await loadInventoryFromFirestore(companyId, productId);
        if (fromFirestore) {
            setMemoryInventory(companyId, fromFirestore);
            return fromFirestore;
        }
    } catch {
        return getMemoryInventory(companyId, productId);
    }

    return null;
}

export const getInventoryRecord = getInventoryByProductId;

export async function createInventoryMovement(input: CreateInventoryMovementInput): Promise<InventoryMovementLog> {
    const movement = normalizeInventoryMovementDocument({
        inventoryMovementId: buildMovementId(),
        companyId: input.companyId,
        branchId: input.branchId ?? null,
        productId: input.productId,
        sku: input.sku,
        productName: input.productName,
        eventType: input.eventType,
        qtyDelta: input.qtyDelta,
        qtyBefore: input.qtyBefore,
        qtyAfter: input.qtyAfter,
        reservedQtyBefore: input.reservedQtyBefore,
        reservedQtyAfter: input.reservedQtyAfter,
        referenceType: normalizeReferenceType(input.referenceType),
        referenceId: input.referenceId ?? null,
        note: input.note ?? null,
        operatorUserId: input.operatorUserId ?? null,
        operatorName: input.operatorName ?? null,
        createdAt: nowIso(),
    });

    const db = await getFirestoreDb();
    if (!db) {
        pushMemoryMovement(input.companyId, movement);
        return movement;
    }

    await db.collection(inventoryMovementsCollectionPath(input.companyId)).doc(movement.inventoryMovementId).set(movement, { merge: false });
    pushMemoryMovement(input.companyId, movement);
    return movement;
}

export async function listInventoryMovements(limit = 200, companyIdInput?: string): Promise<InventoryMovementLog[]> {
    const scope = await resolveSessionScope();
    const companyId = normalizeCompanyId(companyIdInput) ?? scope?.companyId ?? null;
    if (!companyId) return [];

    const safeLimit = Math.max(1, Math.min(limit, 1200));
    const db = await getFirestoreDb();
    if (!db) return [...(memory.movementsByCompany[companyId] ?? [])].slice(0, safeLimit);

    const snap = await db.collection(inventoryMovementsCollectionPath(companyId)).orderBy("createdAt", "desc").limit(safeLimit).get();
    const rows = snap.docs.map((doc) => {
        const row = (doc.data() ?? {}) as Record<string, unknown>;
        return normalizeInventoryMovementDocument({
            ...row,
            inventoryMovementId: toText(row.inventoryMovementId, 120) || doc.id,
            companyId,
            productId: toText(row.productId, 120),
        });
    });

    memory.movementsByCompany[companyId] = rows;
    return rows;
}

export async function adjustInventory(input: AdjustInventoryInput): Promise<{ inventory: InventoryRecord; movement: InventoryMovementLog } | null> {
    const scope = await resolveSessionScope();
    const companyId = normalizeCompanyId(input.companyId) ?? scope?.companyId ?? null;
    const productId = toText(input.productId, 120);
    if (!companyId || !productId) return null;

    const current = await getInventoryByProductId(productId, companyId);
    if (!current) return null;

    const onHandDelta = Math.round(input.onHandDelta ?? 0);
    const reservedDelta = Math.round(input.reservedDelta ?? 0);
    const nextOnHandQty = Math.max(0, current.onHandQty + onHandDelta);
    const nextReservedQty = Math.max(0, current.reservedQty + reservedDelta);

    if (input.enforceAvailable && nextReservedQty > nextOnHandQty) return null;

    const nextInventory = normalizeInventoryDocument({
        ...current,
        companyId,
        productId,
        onHandQty: nextOnHandQty,
        reservedQty: nextReservedQty,
        availableQty: recomputeAvailableQty(nextOnHandQty, nextReservedQty),
        updatedAt: nowIso(),
        updatedBy: toNullableText(input.operatorUserId, 120) ?? scope?.operatorUserId ?? null,
    });

    await saveInventory(companyId, nextInventory);

    const qtyFallback = Math.max(Math.abs(onHandDelta), Math.abs(reservedDelta), 1);
    const explicitQty = toNonNegativeInt(input.qty, qtyFallback);
    const signedQty = onHandDelta !== 0 ? onHandDelta : reservedDelta !== 0 ? reservedDelta : explicitQty;

    const movement = await createInventoryMovement({
        companyId,
        branchId: nextInventory.branchId,
        productId,
        sku: nextInventory.sku,
        productName: nextInventory.productName,
        eventType: input.eventType,
        qtyDelta: signedQty,
        qtyBefore: current.onHandQty,
        qtyAfter: nextInventory.onHandQty,
        reservedQtyBefore: current.reservedQty,
        reservedQtyAfter: nextInventory.reservedQty,
        referenceType: input.referenceType ?? "unknown",
        referenceId: input.referenceId ?? null,
        note: input.note ?? null,
        operatorUserId: input.operatorUserId ?? scope?.operatorUserId ?? null,
        operatorName: input.operatorName ?? scope?.operatorName ?? null,
    });

    return {
        inventory: nextInventory,
        movement,
    };
}

export const adjustInventoryLevels = adjustInventory;

export async function reserveInventory(productId: string, qtyInput: number, companyIdInput?: string, referenceId?: string): Promise<boolean> {
    const qty = Math.max(1, toNonNegativeInt(qtyInput, 1));
    const current = await getInventoryByProductId(productId, companyIdInput);
    if (!current) return false;
    if (current.availableQty < qty) return false;

    const adjusted = await adjustInventory({
        companyId: companyIdInput,
        productId,
        eventType: "reservation_created",
        qty,
        onHandDelta: 0,
        reservedDelta: qty,
        referenceType: "pickupReservation",
        referenceId: referenceId ?? undefined,
        enforceAvailable: true,
    });

    return Boolean(adjusted);
}

export async function releaseReservedInventory(productId: string, qtyInput: number, companyIdInput?: string, referenceId?: string): Promise<boolean> {
    const qty = Math.max(1, toNonNegativeInt(qtyInput, 1));
    const current = await getInventoryByProductId(productId, companyIdInput);
    if (!current) return false;
    if (current.reservedQty < qty) return false;

    const adjusted = await adjustInventory({
        companyId: companyIdInput,
        productId,
        eventType: "reservation_released",
        qty,
        onHandDelta: 0,
        reservedDelta: -qty,
        referenceType: "pickupReservation",
        referenceId: referenceId ?? undefined,
        enforceAvailable: true,
    });

    return Boolean(adjusted);
}

export async function completeReservedPickup(productId: string, qtyInput: number, companyIdInput?: string, referenceId?: string): Promise<boolean> {
    const qty = Math.max(1, toNonNegativeInt(qtyInput, 1));
    const current = await getInventoryByProductId(productId, companyIdInput);
    if (!current) return false;
    if (current.reservedQty < qty) return false;
    if (current.onHandQty < qty) return false;

    const adjusted = await adjustInventory({
        companyId: companyIdInput,
        productId,
        eventType: "pickup_completed",
        qty,
        onHandDelta: -qty,
        reservedDelta: -qty,
        referenceType: "pickupReservation",
        referenceId: referenceId ?? undefined,
        enforceAvailable: true,
    });

    return Boolean(adjusted);
}

export async function getInventorySummary(companyIdInput?: string): Promise<{
    totalProducts: number;
    totalOnHandQty: number;
    totalReservedQty: number;
    totalAvailableQty: number;
    lowStockProductCount: number;
}> {
    const scope = await resolveSessionScope();
    const companyId = normalizeCompanyId(companyIdInput) ?? scope?.companyId ?? null;
    if (!companyId) {
        return {
            totalProducts: 0,
            totalOnHandQty: 0,
            totalReservedQty: 0,
            totalAvailableQty: 0,
            lowStockProductCount: 0,
        };
    }

    let rows: InventoryRecord[] = [];
    const db = await getFirestoreDb();
    if (db) {
        const snap = await db.collection(inventoryCollectionPath(companyId)).limit(2000).get();
        rows = snap.docs.map((doc) =>
            normalizeInventoryDocument({
                ...(doc.data() as Record<string, unknown>),
                productId: doc.id,
                companyId,
            }),
        );
    } else {
        rows = Object.values(memory.inventoryByCompany[companyId] ?? {});
    }

    return {
        totalProducts: rows.length,
        totalOnHandQty: rows.reduce((sum, row) => sum + row.onHandQty, 0),
        totalReservedQty: rows.reduce((sum, row) => sum + row.reservedQty, 0),
        totalAvailableQty: rows.reduce((sum, row) => sum + row.availableQty, 0),
        lowStockProductCount: rows.filter((row) => row.onHandQty <= row.lowStockThreshold).length,
    };
}

export { recomputeAvailableQty };
