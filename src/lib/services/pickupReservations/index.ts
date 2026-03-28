import "server-only";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { normalizeCompanyId } from "@/lib/tenant-scope";
import type {
    CreatePickupReservationInput,
    InventoryReservationReference,
    PickupReservation,
    PickupReservationLineItem,
    PromotionPickupReservationDraft,
} from "@/lib/schema";
import {
    normalizePickupReservationDocument,
    pickupReservationsCollectionPath,
} from "@/lib/schema";
import {
    completeReservedPickup,
    getInventoryByProductId,
    releaseReservedInventory as releaseInventoryQty,
    reserveInventory as reserveInventoryQty,
} from "@/lib/services/inventory";
import { getUserCompanyId, getUserDoc, toAccountType } from "@/lib/services/user.service";

type SessionScope = {
    companyId: string;
    operatorName: string;
    operatorUserId: string;
};

const memory: {
    reservationsByCompany: Record<string, PickupReservation[]>;
} = {
    reservationsByCompany: {},
};
const READ_CACHE_TTL_MS = 30_000;
const readCacheTouchedAt: Record<string, number> = {};

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

function toIsoStringOrNull(value: unknown): string | null {
    if (typeof value === "string") {
        const parsed = Date.parse(value);
        if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
    }
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return new Date(Math.round(value)).toISOString();
    }
    return null;
}

function toMs(value: string | null | undefined): number {
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function hasFreshReadCache(companyId: string): boolean {
    const touchedAt = readCacheTouchedAt[companyId] ?? 0;
    return touchedAt > 0 && Date.now() - touchedAt <= READ_CACHE_TTL_MS;
}

function touchReadCache(companyId: string): void {
    readCacheTouchedAt[companyId] = Date.now();
}

function createReservationCode(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const serial = String(Date.now()).slice(-6);
    return `PR-${y}${m}${d}-${serial}`;
}

function normalizeLineItem(input: unknown): PickupReservationLineItem | null {
    if (!input || typeof input !== "object") return null;
    const row = input as Record<string, unknown>;
    const productId = toText(row.productId, 120);
    if (!productId) return null;

    const qty = Math.max(1, toNonNegativeInt(row.qty, 1));
    const unitPrice = toNonNegativeInt(row.unitPrice, 0);
    const productSnapshotRaw = row.productSnapshot;
    const productSnapshot =
        productSnapshotRaw && typeof productSnapshotRaw === "object"
            ? {
                  name: toText((productSnapshotRaw as Record<string, unknown>).name) || toText(row.productName) || "Untitled Product",
                  categoryId: toNullableText((productSnapshotRaw as Record<string, unknown>).categoryId, 120),
                  categoryName: toNullableText((productSnapshotRaw as Record<string, unknown>).categoryName),
                  brandId: toNullableText((productSnapshotRaw as Record<string, unknown>).brandId, 120),
                  brandName: toNullableText((productSnapshotRaw as Record<string, unknown>).brandName),
                  modelId: toNullableText((productSnapshotRaw as Record<string, unknown>).modelId, 120),
                  modelName: toNullableText((productSnapshotRaw as Record<string, unknown>).modelName),
              }
            : {
                  name: toText(row.productSnapshot) || toText(row.productName) || "Untitled Product",
                  categoryId: null,
                  categoryName: null,
                  brandId: null,
                  brandName: null,
                  modelId: null,
                  modelName: null,
              };

    return {
        lineId: toText(row.lineId, 120) || `line_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        productId,
        sku: toText(row.sku, 120),
        productSnapshot,
        qty,
        unitPrice,
        lineTotal: toNonNegativeInt(row.lineTotal, qty * unitPrice),
        inventoryTracked: row.inventoryTracked !== false,
    };
}

async function resolveSessionScope(): Promise<SessionScope | null> {
    const session = await getSessionUser();
    if (!session) return null;

    const user = await getUserDoc(session.uid);
    if (!user) return null;
    if (toAccountType(user.role) !== "company") return null;

    const companyId = normalizeCompanyId(getUserCompanyId(user, session.uid));
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

async function saveReservation(companyId: string, row: PickupReservation): Promise<void> {
    const list = memory.reservationsByCompany[companyId] ?? [];
    memory.reservationsByCompany[companyId] = [row, ...list.filter((item) => item.id !== row.id)];
    touchReadCache(companyId);

    const db = await getFirestoreDb();
    if (!db) return;
    await db.collection(pickupReservationsCollectionPath(companyId)).doc(row.pickupReservationId).set(row, { merge: true });
}

async function readReservations(companyId: string): Promise<PickupReservation[]> {
    if (hasFreshReadCache(companyId)) return [...(memory.reservationsByCompany[companyId] ?? [])];

    const db = await getFirestoreDb();
    if (!db) return [...(memory.reservationsByCompany[companyId] ?? [])];

    const snap = await db.collection(pickupReservationsCollectionPath(companyId)).orderBy("updatedAt", "desc").limit(1200).get();
    const rows = snap.docs.map((doc) =>
        normalizePickupReservationDocument({
            ...(doc.data() as Record<string, unknown>),
            pickupReservationId: doc.id,
            companyId,
        }),
    );
    memory.reservationsByCompany[companyId] = rows;
    touchReadCache(companyId);
    return rows;
}

async function getReservationById(companyId: string, reservationIdInput: string): Promise<PickupReservation | null> {
    const reservationId = toText(reservationIdInput, 120);
    if (!reservationId) return null;

    const list = await readReservations(companyId);
    return list.find((row) => row.pickupReservationId === reservationId || row.id === reservationId) ?? null;
}

async function reserveLineItems(companyId: string, reservationId: string, lineItems: PickupReservationLineItem[]): Promise<boolean> {
    const reserved: PickupReservationLineItem[] = [];

    for (const line of lineItems) {
        if (!line.inventoryTracked) continue;

        const ok = await reserveInventoryQty(line.productId, line.qty, companyId, reservationId);
        if (!ok) {
            for (const rollback of reserved) {
                await releaseInventoryQty(rollback.productId, rollback.qty, companyId, reservationId);
            }
            return false;
        }
        reserved.push(line);
    }

    return true;
}

async function releaseLineItems(companyId: string, reservationId: string, lineItems: PickupReservationLineItem[]): Promise<void> {
    for (const line of lineItems) {
        if (!line.inventoryTracked) continue;
        await releaseInventoryQty(line.productId, line.qty, companyId, reservationId);
    }
}

async function completeLineItems(companyId: string, reservationId: string, lineItems: PickupReservationLineItem[]): Promise<boolean> {
    for (const line of lineItems) {
        if (!line.inventoryTracked) continue;
        const inventory = await getInventoryByProductId(line.productId, companyId);
        if (!inventory) return false;
        if (inventory.reservedQty < line.qty) return false;
        if (inventory.onHandQty < line.qty) return false;
    }

    for (const line of lineItems) {
        if (!line.inventoryTracked) continue;
        const ok = await completeReservedPickup(line.productId, line.qty, companyId, reservationId);
        if (!ok) return false;
    }

    return true;
}

function buildUpdatedReservation(
    reservation: PickupReservation,
    patch: Partial<PickupReservation>,
    scope: SessionScope | null,
): PickupReservation {
    return normalizePickupReservationDocument({
        ...reservation,
        ...patch,
        pickupReservationId: reservation.pickupReservationId,
        companyId: reservation.companyId,
        updatedAt: new Date().toISOString(),
        updatedBy: scope?.operatorUserId ?? reservation.updatedBy,
    });
}

export async function listPickupReservations(customerId?: string, companyIdInput?: string): Promise<PickupReservation[]> {
    const scope = await resolveSessionScope();
    const companyId = normalizeCompanyId(companyIdInput) ?? scope?.companyId ?? null;
    if (!companyId) return [];

    const rows = await readReservations(companyId);
    const customerIdFilter = toText(customerId, 120);

    return rows
        .filter((row) => (customerIdFilter ? row.customerId === customerIdFilter : true))
        .sort((a, b) => toMs(b.updatedAt) - toMs(a.updatedAt));
}

export async function createPickupReservation(input: CreatePickupReservationInput, companyIdInput?: string): Promise<PickupReservation | null> {
    const scope = await resolveSessionScope();
    const companyId = normalizeCompanyId(companyIdInput) ?? normalizeCompanyId(input.companyId) ?? scope?.companyId ?? null;
    if (!companyId) return null;

    const lineItems = (Array.isArray(input.lineItems) ? input.lineItems : [])
        .map((item) => normalizeLineItem(item))
        .filter((item): item is PickupReservationLineItem => item !== null)
        .slice(0, 120);
    if (lineItems.length === 0) return null;

    const reservation = normalizePickupReservationDocument({
        pickupReservationId: toText(input.pickupReservationId, 120) || `pickup_res_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        reservationCode: toText(input.reservationCode, 120) || createReservationCode(),
        companyId,
        branchId: toNullableText(input.branchId, 120),
        sourceChannel: input.sourceChannel,
        status: input.status ?? "reserved",
        customerId: toNullableText(input.customerId, 120),
        customerSnapshot: input.customerSnapshot ?? null,
        note: toNullableText(input.note, 800),
        internalNote: toNullableText(input.internalNote, 800),
        lineItems,
        reservedAt: new Date().toISOString(),
        packedAt: toIsoStringOrNull(input.packedAt),
        readyAt: toIsoStringOrNull(input.readyAt),
        pickedUpAt: toIsoStringOrNull(input.pickedUpAt),
        cancelledAt: toIsoStringOrNull(input.cancelledAt),
        expiredAt: toIsoStringOrNull(input.expiredAt),
        expiresAt: toIsoStringOrNull(input.expiresAt),
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
        createdBy: toNullableText(input.createdBy, 120) ?? scope?.operatorUserId ?? null,
        updatedBy: toNullableText(input.updatedBy, 120) ?? scope?.operatorUserId ?? null,
    });

    const reserved = await reserveLineItems(companyId, reservation.pickupReservationId, reservation.lineItems);
    if (!reserved) return null;

    await saveReservation(companyId, reservation);
    return reservation;
}

export async function reserveInventory(
    productId: string,
    qtyInput: number,
    reference: InventoryReservationReference,
    companyIdInput?: string,
): Promise<boolean> {
    const companyId = normalizeCompanyId(companyIdInput);
    return reserveInventoryQty(productId, qtyInput, companyId ?? undefined, reference.referenceId);
}

export async function releaseReservedInventory(
    productId: string,
    qtyInput: number,
    reference: InventoryReservationReference,
    companyIdInput?: string,
): Promise<boolean> {
    const companyId = normalizeCompanyId(companyIdInput);
    return releaseInventoryQty(productId, qtyInput, companyId ?? undefined, reference.referenceId);
}

export async function markReservationPacked(reservationId: string, companyIdInput?: string): Promise<PickupReservation | null> {
    const scope = await resolveSessionScope();
    const companyId = normalizeCompanyId(companyIdInput) ?? scope?.companyId ?? null;
    if (!companyId) return null;

    const current = await getReservationById(companyId, reservationId);
    if (!current) return null;
    if (!(current.status === "pending" || current.status === "reserved")) return current;

    const next = buildUpdatedReservation(
        current,
        {
            status: "packed",
            packedAt: current.packedAt ?? new Date().toISOString(),
        },
        scope,
    );

    await saveReservation(companyId, next);
    return next;
}

export async function markReservationReadyForPickup(reservationId: string, companyIdInput?: string): Promise<PickupReservation | null> {
    const scope = await resolveSessionScope();
    const companyId = normalizeCompanyId(companyIdInput) ?? scope?.companyId ?? null;
    if (!companyId) return null;

    const current = await getReservationById(companyId, reservationId);
    if (!current) return null;
    if (!(current.status === "reserved" || current.status === "packed")) return current;

    const nowIso = new Date().toISOString();
    const next = buildUpdatedReservation(
        current,
        {
            status: "ready_for_pickup",
            packedAt: current.packedAt ?? nowIso,
            readyAt: current.readyAt ?? nowIso,
        },
        scope,
    );

    await saveReservation(companyId, next);
    return next;
}

export async function completePickupReservation(reservationId: string, companyIdInput?: string): Promise<PickupReservation | null> {
    const scope = await resolveSessionScope();
    const companyId = normalizeCompanyId(companyIdInput) ?? scope?.companyId ?? null;
    if (!companyId) return null;

    const current = await getReservationById(companyId, reservationId);
    if (!current) return null;
    if (current.status === "picked_up") return current;
    if (current.status === "cancelled" || current.status === "expired") return null;

    const completed = await completeLineItems(companyId, current.pickupReservationId, current.lineItems);
    if (!completed) return null;

    const nowIso = new Date().toISOString();
    const next = buildUpdatedReservation(
        current,
        {
            status: "picked_up",
            packedAt: current.packedAt ?? nowIso,
            readyAt: current.readyAt ?? nowIso,
            pickedUpAt: nowIso,
        },
        scope,
    );

    await saveReservation(companyId, next);
    return next;
}

export async function cancelPickupReservation(reservationId: string, companyIdInput?: string): Promise<PickupReservation | null> {
    const scope = await resolveSessionScope();
    const companyId = normalizeCompanyId(companyIdInput) ?? scope?.companyId ?? null;
    if (!companyId) return null;

    const current = await getReservationById(companyId, reservationId);
    if (!current) return null;
    if (current.status === "cancelled" || current.status === "expired") return current;
    if (current.status === "picked_up") return null;

    await releaseLineItems(companyId, current.pickupReservationId, current.lineItems);

    const next = buildUpdatedReservation(
        current,
        {
            status: "cancelled",
            cancelledAt: current.cancelledAt ?? new Date().toISOString(),
        },
        scope,
    );

    await saveReservation(companyId, next);
    return next;
}

export async function expirePickupReservation(reservationId: string, companyIdInput?: string): Promise<PickupReservation | null> {
    const scope = await resolveSessionScope();
    const companyId = normalizeCompanyId(companyIdInput) ?? scope?.companyId ?? null;
    if (!companyId) return null;

    const current = await getReservationById(companyId, reservationId);
    if (!current) return null;
    if (current.status === "expired" || current.status === "cancelled") return current;
    if (current.status === "picked_up") return null;

    await releaseLineItems(companyId, current.pickupReservationId, current.lineItems);

    const next = buildUpdatedReservation(
        current,
        {
            status: "expired",
            expiredAt: current.expiredAt ?? new Date().toISOString(),
        },
        scope,
    );

    await saveReservation(companyId, next);
    return next;
}

export async function createPickupReservationsFromPromotionDrafts(input: {
    customerId: string;
    drafts: PromotionPickupReservationDraft[];
    sourceId: string;
    companyId?: string;
}): Promise<PickupReservation[]> {
    const customerId = toText(input.customerId, 120);
    if (!customerId) return [];

    const created: PickupReservation[] = [];
    for (const draft of input.drafts) {
        const reservation = await createPickupReservation(
            {
                companyId: toText(input.companyId, 120),
                reservationCode: createReservationCode(),
                sourceChannel: draft.sourceChannel,
                customerId,
                customerSnapshot: null,
                note: draft.note || `${draft.promotionName} / ${draft.promotionId} / ${input.sourceId}`,
                internalNote: null,
                lineItems: [
                    {
                        lineId: `line_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                        productId: draft.productId,
                        sku: "",
                        productSnapshot: {
                            name: draft.productName || "Untitled Product",
                            categoryId: null,
                            categoryName: null,
                            brandId: null,
                            brandName: null,
                            modelId: null,
                            modelName: null,
                        },
                        qty: Math.max(1, toNonNegativeInt(draft.qty, 1)),
                        unitPrice: Math.max(0, toNonNegativeInt(draft.unitPrice, 0)),
                        lineTotal: Math.max(0, toNonNegativeInt(draft.qty, 1) * toNonNegativeInt(draft.unitPrice, 0)),
                        inventoryTracked: true,
                    },
                ],
                reservedAt: null,
                packedAt: null,
                readyAt: null,
                pickedUpAt: null,
                cancelledAt: null,
                expiredAt: null,
                expiresAt: typeof draft.expiresAt === "number" && Number.isFinite(draft.expiresAt) && draft.expiresAt > 0 ? new Date(draft.expiresAt).toISOString() : null,
                createdBy: null,
                updatedBy: null,
            },
            input.companyId,
        );

        if (reservation) created.push(reservation);
    }

    return created;
}

// Backward-compatible names
export const markPacked = markReservationPacked;
export const markReadyForPickup = markReservationReadyForPickup;
export const completePickup = completePickupReservation;
export const cancelReservation = cancelPickupReservation;
export const expireReservation = expirePickupReservation;
