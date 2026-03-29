import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { fbAdminDb } from "@/lib/firebase-server";
import { recomputeAvailableQty } from "@/lib/schema/inventory";
import { transfersCollectionPath } from "@/lib/schema/inventory-transfer";
import {
    warehouseInventoryCollectionPath,
    warehouseInventoryDocId,
    normalizeWarehouseInventoryRow,
    type WarehouseInventoryRow,
} from "@/lib/schema/warehouse-inventory";
import { warehousesCollectionPath } from "@/lib/schema/warehouse";
import { createDoc } from "@/lib/services/db/firestore";
import { logInventory } from "@/lib/services/inventory/timeline-service";

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

async function readWarehouseCompany(companyId: string, warehouseId: string): Promise<string | null> {
    const path = `${warehousesCollectionPath(companyId)}/${toText(warehouseId, 120)}`;
    const snap = await fbAdminDb.doc(path).get();
    if (!snap.exists) return null;
    const row = snap.data() as Record<string, unknown> | undefined;
    return row ? toText(row.companyId, 120) : null;
}

async function readWarehouseInventoryRow(companyId: string, warehouseId: string, productId: string): Promise<WarehouseInventoryRow> {
    const docId = warehouseInventoryDocId(warehouseId, productId);
    const path = `${warehouseInventoryCollectionPath(companyId)}/${docId}`;
    const snap = await fbAdminDb.doc(path).get();
    if (!snap.exists) {
        return normalizeWarehouseInventoryRow({
            companyId,
            warehouseId: toText(warehouseId, 120),
            productId: toText(productId, 120),
            onHandQty: 0,
            reservedQty: 0,
        });
    }
    const row = (snap.data() ?? {}) as Record<string, unknown>;
    const onHandRaw = row.onHandQty ?? row.stock ?? 0;
    const reservedRaw = row.reservedQty ?? row.reserved ?? 0;
    return normalizeWarehouseInventoryRow({
        companyId,
        warehouseId: toText(warehouseId, 120),
        productId: toText(productId, 120),
        onHandQty: typeof onHandRaw === "number" ? onHandRaw : Number(onHandRaw),
        reservedQty: typeof reservedRaw === "number" ? reservedRaw : Number(reservedRaw),
    });
}

export type TransferStockParams = {
    companyId: string;
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    qty: number;
    userId: string;
    /** 寫入 transfers 集合並帶入 refId（若省略則仍寫 log，不建立 transfers 單） */
    createTransferDoc?: boolean;
};

/**
 * 跨倉調貨：來源倉扣量、目的倉加量，並各寫一筆 transfer_out / transfer_in 時間軸。
 */
export async function transferStock(params: TransferStockParams): Promise<{ transferId: string | null }> {
    const companyId = toText(params.companyId, 120);
    const productId = toText(params.productId, 120);
    const fromWarehouseId = toText(params.fromWarehouseId, 120);
    const toWarehouseId = toText(params.toWarehouseId, 120);
    const userId = toText(params.userId, 120);
    const qty = Math.max(0, Math.round(params.qty));

    if (!companyId || !productId || !fromWarehouseId || !toWarehouseId || !userId) {
        throw new Error("Invalid transfer parameters");
    }
    if (fromWarehouseId === toWarehouseId) {
        throw new Error("fromWarehouse and toWarehouse must differ");
    }
    if (qty <= 0) {
        throw new Error("qty must be positive");
    }

    const [fromCompany, toCompany] = await Promise.all([
        readWarehouseCompany(companyId, fromWarehouseId),
        readWarehouseCompany(companyId, toWarehouseId),
    ]);
    if (fromCompany !== companyId || toCompany !== companyId) {
        throw new Error("Warehouse not found or company mismatch");
    }

    const fromRef = fbAdminDb.doc(`${warehouseInventoryCollectionPath(companyId)}/${warehouseInventoryDocId(fromWarehouseId, productId)}`);
    const toRef = fbAdminDb.doc(`${warehouseInventoryCollectionPath(companyId)}/${warehouseInventoryDocId(toWarehouseId, productId)}`);

    await fbAdminDb.runTransaction(async (tx) => {
        const fromSnap = await tx.get(fromRef);
        const toSnap = await tx.get(toRef);

        const fromData = (fromSnap.data() ?? {}) as Record<string, unknown>;
        const toData = (toSnap.data() ?? {}) as Record<string, unknown>;

        const fromOnHand = Math.max(0, Math.round(Number(fromData.onHandQty ?? fromData.stock ?? 0)));
        const fromReserved = Math.max(0, Math.round(Number(fromData.reservedQty ?? fromData.reserved ?? 0)));
        const toOnHand = Math.max(0, Math.round(Number(toData.onHandQty ?? toData.stock ?? 0)));
        const toReserved = Math.max(0, Math.round(Number(toData.reservedQty ?? toData.reserved ?? 0)));

        if (fromOnHand < qty) {
            throw new Error("Not enough stock");
        }

        const nextFromOn = fromOnHand - qty;
        const nextToOn = toOnHand + qty;

        tx.set(
            fromRef,
            {
                companyId,
                warehouseId: fromWarehouseId,
                productId,
                onHandQty: nextFromOn,
                reservedQty: fromReserved,
                availableQty: recomputeAvailableQty(nextFromOn, fromReserved),
                updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
        );

        tx.set(
            toRef,
            {
                companyId,
                warehouseId: toWarehouseId,
                productId,
                onHandQty: nextToOn,
                reservedQty: toReserved,
                availableQty: recomputeAvailableQty(nextToOn, toReserved),
                updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
        );
    });

    const transferRefId =
        params.createTransferDoc === true
            ? await createDoc(transfersCollectionPath(companyId), {
                  companyId,
                  fromWarehouseId,
                  toWarehouseId,
                  items: [{ productId, qty }],
                  status: "completed",
                  createdBy: userId,
              })
            : null;

    await logInventory({
        companyId,
        productId,
        warehouseId: fromWarehouseId,
        type: "transfer_out",
        qty,
        refId: transferRefId ?? undefined,
        createdBy: userId,
    });

    await logInventory({
        companyId,
        productId,
        warehouseId: toWarehouseId,
        type: "transfer_in",
        qty,
        refId: transferRefId ?? undefined,
        createdBy: userId,
    });

    return { transferId: transferRefId };
}

/**
 * 讀取用：取得某倉某品項之倉別庫存列（無則回零）。
 */
export async function getWarehouseInventoryRow(
    companyId: string,
    warehouseId: string,
    productId: string,
): Promise<WarehouseInventoryRow> {
    return readWarehouseInventoryRow(companyId, warehouseId, productId);
}
