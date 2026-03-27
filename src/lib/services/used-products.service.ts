import "server-only";
import {
    normalizeUsedProduct,
    usedProductsCollectionPath,
    type UsedProduct,
    type UsedProductRefurbishmentStatus,
    type UsedProductSaleStatus,
} from "@/lib/schema";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";

const memory: { productsByCompany: Record<string, UsedProduct[]> } = { productsByCompany: {} };

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toMoney(value: unknown, fallback = 0): number {
    const raw = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(raw)) return Math.max(0, Math.round(fallback));
    return Math.max(0, Math.round(raw));
}

function normalizeCompanyId(value: unknown): string | null {
    const text = toText(value, 120);
    if (!text) return null;
    if (/[/?#]/.test(text)) return null;
    return text;
}

function makeId(prefix = "up"): string {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function parseIso(value: unknown, fallback = new Date().toISOString()): string {
    if (typeof value === "string" && value.trim()) {
        const ts = Date.parse(value);
        if (Number.isFinite(ts)) return new Date(ts).toISOString();
    }
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return new Date(Math.round(value)).toISOString();
    }
    return fallback;
}

function listMemory(companyId: string): UsedProduct[] {
    return [...(memory.productsByCompany[companyId] ?? [])].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function upsertMemory(companyId: string, value: UsedProduct): void {
    const current = memory.productsByCompany[companyId] ?? [];
    memory.productsByCompany[companyId] = [value, ...current.filter((row) => row.id !== value.id)];
}

function removeMemory(companyId: string, id: string): void {
    const current = memory.productsByCompany[companyId] ?? [];
    memory.productsByCompany[companyId] = current.filter((row) => row.id !== id);
}

async function resolveScope(): Promise<{ companyId: string; uid: string } | null> {
    const session = await getSessionUser();
    if (!session) return null;

    const user = await getUserDoc(session.uid);
    if (!user || toAccountType(user.role) !== "company") return null;

    const companyId = normalizeCompanyId(getShowcaseTenantId(user, session.uid));
    if (!companyId) return null;

    return {
        companyId,
        uid: session.uid,
    };
}

async function getDb() {
    try {
        const { fbAdminDb } = await import("@/lib/firebase-server");
        return fbAdminDb;
    } catch {
        return null;
    }
}

async function listFromDb(companyId: string): Promise<UsedProduct[] | null> {
    const db = await getDb();
    if (!db) return null;

    const snap = await db.collection(usedProductsCollectionPath(companyId)).orderBy("updatedAt", "desc").limit(500).get();
    return snap.docs.map((doc) =>
        normalizeUsedProduct({
            id: doc.id,
            ...(doc.data() as Partial<UsedProduct>),
        }),
    );
}

function matchesKeyword(item: UsedProduct, keyword: string): boolean {
    if (!keyword) return true;
    const q = keyword.toLowerCase();
    return [
        item.name,
        item.brand,
        item.model,
        item.type,
        item.serialNumber ?? "",
        item.imeiNumber ?? "",
        item.grade,
        item.gradeLabel ?? "",
        item.refurbishmentStatus,
        item.saleStatus,
        item.specifications,
        ...item.specificationItems.map((row) => `${row.key} ${row.value}`),
    ]
        .join(" ")
        .toLowerCase()
        .includes(q);
}

async function patchUsedProduct(
    scope: { companyId: string; uid: string },
    id: string,
    patch: Partial<UsedProduct>,
): Promise<UsedProduct | null> {
    const targetId = toText(id, 120);
    if (!targetId) return null;

    const list = await listUsedProducts();
    const current = list.find((row) => row.id === targetId);
    if (!current) return null;

    const next = normalizeUsedProduct({
        ...current,
        ...patch,
        id: current.id,
        updatedAt: new Date().toISOString(),
        updatedBy: scope.uid,
    });

    upsertMemory(scope.companyId, next);

    const db = await getDb();
    if (!db) return next;

    await db.collection(usedProductsCollectionPath(scope.companyId)).doc(targetId).set(next, { merge: true });
    return next;
}

function mapCaseStatusToRefurbishment(status: string): UsedProductRefurbishmentStatus {
    if (status === "resolved" || status === "closed") return "refurbished";
    if (status === "in_progress" || status === "waiting_customer") return "refurbishing";
    if (status === "new") return "waiting_refurbishment";
    return "waiting_refurbishment";
}

function addWarranty(startAtIso: string, duration: number, unit: UsedProduct["warrantyUnit"]): string {
    const date = new Date(startAtIso);
    if (unit === "day") {
        date.setUTCDate(date.getUTCDate() + Math.max(0, Math.round(duration)));
    } else {
        date.setUTCMonth(date.getUTCMonth() + Math.max(0, Math.round(duration)));
    }
    return date.toISOString();
}

export async function listUsedProducts(filters?: {
    keyword?: string;
    saleStatus?: UsedProductSaleStatus | "";
    refurbishmentStatus?: UsedProductRefurbishmentStatus | "";
    onlyPublished?: boolean;
}): Promise<UsedProduct[]> {
    const scope = await resolveScope();
    if (!scope) return [];

    const fromDb = await listFromDb(scope.companyId);
    const list = fromDb ?? listMemory(scope.companyId);

    const keyword = toText(filters?.keyword, 240).toLowerCase();
    const saleStatus = toText(filters?.saleStatus, 40);
    const refurbishmentStatus = toText(filters?.refurbishmentStatus, 60);

    return list
        .filter((row) => matchesKeyword(row, keyword))
        .filter((row) => (saleStatus ? row.saleStatus === saleStatus : true))
        .filter((row) => (refurbishmentStatus ? row.refurbishmentStatus === refurbishmentStatus : true))
        .filter((row) => (filters?.onlyPublished ? row.isPublished : true));
}

export async function getUsedProductById(id: string): Promise<UsedProduct | null> {
    const scope = await resolveScope();
    if (!scope) return null;

    const targetId = toText(id, 120);
    if (!targetId) return null;

    const db = await getDb();
    if (db) {
        const snap = await db.collection(usedProductsCollectionPath(scope.companyId)).doc(targetId).get();
        if (snap.exists) {
            const product = normalizeUsedProduct({
                id: snap.id,
                ...(snap.data() as Partial<UsedProduct>),
            });
            upsertMemory(scope.companyId, product);
            return product;
        }
    }

    return listMemory(scope.companyId).find((row) => row.id === targetId) ?? null;
}

export async function createUsedProduct(
    input: Partial<Omit<UsedProduct, "id" | "productCondition" | "createdAt" | "createdBy" | "updatedAt" | "updatedBy">>,
): Promise<UsedProduct | null> {
    const scope = await resolveScope();
    if (!scope) return null;

    const nowIso = new Date().toISOString();
    const product = normalizeUsedProduct({
        id: makeId(),
        name: input.name ?? "",
        brand: input.brand ?? "",
        model: input.model ?? "",
        type: input.type ?? "",
        serialNumber: input.serialNumber,
        imeiNumber: input.imeiNumber,
        grade: input.grade,
        gradeLabel: input.gradeLabel,
        conditionNote: input.conditionNote,
        functionalNote: input.functionalNote,
        specifications: input.specifications ?? "",
        specificationItems: input.specificationItems ?? [],
        isRefurbished: input.isRefurbished ?? false,
        refurbishmentStatus: input.refurbishmentStatus ?? "waiting_refurbishment",
        refurbishmentNote: input.refurbishmentNote,
        refurbishmentCaseId: input.refurbishmentCaseId,
        purchaseDate: input.purchaseDate ?? nowIso,
        purchasePrice: input.purchasePrice ?? 0,
        sourceNote: input.sourceNote,
        inspectedBy: input.inspectedBy,
        inspectionResult: input.inspectionResult,
        suggestedSalePrice: input.suggestedSalePrice,
        salePrice: input.salePrice,
        saleStatus: input.saleStatus ?? "draft",
        isSellable: input.isSellable ?? true,
        isPublished: input.isPublished ?? false,
        warrantyEnabled: input.warrantyEnabled ?? true,
        warrantyDuration: input.warrantyDuration ?? 3,
        warrantyUnit: input.warrantyUnit ?? "month",
        warrantyStartAt: input.warrantyStartAt,
        warrantyEndAt: input.warrantyEndAt,
        warrantyNote: input.warrantyNote,
        soldAt: input.soldAt,
        soldReceiptId: input.soldReceiptId,
        soldOrderId: input.soldOrderId,
        soldCustomerId: input.soldCustomerId,
        createdAt: nowIso,
        createdBy: scope.uid,
        updatedAt: nowIso,
        updatedBy: scope.uid,
    });

    upsertMemory(scope.companyId, product);

    const db = await getDb();
    if (!db) return product;

    await db.collection(usedProductsCollectionPath(scope.companyId)).doc(product.id).set(product, { merge: false });
    return product;
}

export async function updateUsedProduct(
    input: Partial<Omit<UsedProduct, "productCondition" | "createdAt" | "createdBy">> & { id: string },
): Promise<UsedProduct | null> {
    const scope = await resolveScope();
    if (!scope) return null;

    return patchUsedProduct(scope, input.id, {
        ...input,
        warrantyStartsOn: "receipt_issued_at",
    });
}

export async function publishUsedProduct(id: string): Promise<UsedProduct | null> {
    const scope = await resolveScope();
    if (!scope) return null;

    return patchUsedProduct(scope, id, {
        isPublished: true,
        saleStatus: "available",
        isSellable: true,
    });
}

export async function unpublishUsedProduct(id: string): Promise<UsedProduct | null> {
    const scope = await resolveScope();
    if (!scope) return null;

    return patchUsedProduct(scope, id, {
        isPublished: false,
        saleStatus: "archived",
        isSellable: false,
    });
}

export function calculateUsedProductWarranty(input: {
    receiptIssuedAt: string | number | Date;
    warrantyDuration: number;
    warrantyUnit: UsedProduct["warrantyUnit"];
}): { warrantyStartAt: string; warrantyEndAt: string } {
    const receiptIssuedAtIso =
        input.receiptIssuedAt instanceof Date
            ? input.receiptIssuedAt.toISOString()
            : parseIso(input.receiptIssuedAt, new Date().toISOString());

    return {
        warrantyStartAt: receiptIssuedAtIso,
        warrantyEndAt: addWarranty(receiptIssuedAtIso, toMoney(input.warrantyDuration, 0), input.warrantyUnit),
    };
}

export async function markUsedProductAsSold(input: {
    id: string;
    receiptIssuedAt: string | number | Date;
    soldReceiptId?: string;
    soldOrderId?: string;
    soldCustomerId?: string;
    salePrice?: number;
}): Promise<UsedProduct | null> {
    const scope = await resolveScope();
    if (!scope) return null;

    const current = await getUsedProductById(input.id);
    if (!current) return null;

    if (current.saleStatus === "sold") return current;

    const soldAt =
        input.receiptIssuedAt instanceof Date
            ? input.receiptIssuedAt.toISOString()
            : parseIso(input.receiptIssuedAt, new Date().toISOString());

    const warranty = current.warrantyEnabled
        ? calculateUsedProductWarranty({
              receiptIssuedAt: soldAt,
              warrantyDuration: current.warrantyDuration,
              warrantyUnit: current.warrantyUnit,
          })
        : {
              warrantyStartAt: "",
              warrantyEndAt: "",
          };

    return patchUsedProduct(scope, current.id, {
        saleStatus: "sold",
        isSellable: false,
        isPublished: false,
        salePrice: input.salePrice === undefined ? current.salePrice : toMoney(input.salePrice, current.salePrice),
        soldAt,
        soldReceiptId: toText(input.soldReceiptId, 120) || current.soldReceiptId,
        soldOrderId: toText(input.soldOrderId, 120) || current.soldOrderId,
        soldCustomerId: toText(input.soldCustomerId, 120) || current.soldCustomerId,
        warrantyStartAt: warranty.warrantyStartAt || undefined,
        warrantyEndAt: warranty.warrantyEndAt || undefined,
    });
}

export async function attachUsedProductToReceipt(input: {
    id: string;
    receiptIssuedAt: string | number | Date;
    receiptId?: string;
    orderId?: string;
    customerId?: string;
    salePrice?: number;
}): Promise<UsedProduct | null> {
    return markUsedProductAsSold({
        id: input.id,
        receiptIssuedAt: input.receiptIssuedAt,
        soldReceiptId: input.receiptId,
        soldOrderId: input.orderId,
        soldCustomerId: input.customerId,
        salePrice: input.salePrice,
    });
}

export async function createRefurbishmentCaseForUsedProduct(input: {
    usedProductId: string;
    repairTechnicianId?: string;
    repairTechnicianName?: string;
    note?: string;
}): Promise<{ caseId: string; usedProduct: UsedProduct } | null> {
    const scope = await resolveScope();
    if (!scope) return null;

    const usedProduct = await getUsedProductById(input.usedProductId);
    if (!usedProduct) return null;

    const caseId = makeId("c");
    const createdAt = Date.now();

    const casePayload = {
        id: caseId,
        title: `翻新 / ${usedProduct.name}`,
        status: "new",
        quoteStatus: "inspection_estimate",
        customer: {
            name: "",
            phone: "",
            address: "",
            email: "",
        },
        device: {
            name: usedProduct.brand || usedProduct.name,
            model: usedProduct.model || usedProduct.type,
        },
        repairReason: "二手商品翻新",
        repairSuggestion: "",
        note: toText(input.note, 1000),
        repairAmount: 0,
        inspectionFee: 0,
        pendingFee: 0,
        companyId: scope.companyId,
        linkedUsedProductId: usedProduct.id,
        linkedUsedProductName: usedProduct.name,
        caseType: "refurbish",
        repairTechnicianId: toText(input.repairTechnicianId, 120) || undefined,
        repairTechnicianName: toText(input.repairTechnicianName, 120) || undefined,
        createdAt,
        updatedAt: createdAt,
    };

    const db = await getDb();
    if (db) {
        await db.collection(`companies/${scope.companyId}/cases`).doc(caseId).set(casePayload, { merge: false });
    }

    const linked = await linkUsedProductToCase({
        usedProductId: usedProduct.id,
        caseId,
        caseTitle: casePayload.title,
    });

    if (!linked) return null;

    return {
        caseId,
        usedProduct: linked,
    };
}

export async function linkUsedProductToCase(input: {
    usedProductId: string;
    caseId: string;
    caseTitle?: string;
}): Promise<UsedProduct | null> {
    const scope = await resolveScope();
    if (!scope) return null;

    const usedProduct = await patchUsedProduct(scope, input.usedProductId, {
        refurbishmentCaseId: toText(input.caseId, 120),
        refurbishmentStatus: "refurbishing",
        refurbishmentNote: input.caseTitle ? `已連結翻新案件：${toText(input.caseTitle, 240)}` : undefined,
    });

    if (!usedProduct) return null;

    const db = await getDb();
    if (db) {
        await db.collection(`companies/${scope.companyId}/cases`).doc(toText(input.caseId, 120)).set(
            {
                linkedUsedProductId: usedProduct.id,
                linkedUsedProductName: usedProduct.name,
                caseType: "refurbish",
                updatedAt: Date.now(),
            },
            { merge: true },
        );
    }

    return usedProduct;
}

export async function syncUsedProductRefurbishmentStatus(input: {
    usedProductId: string;
    caseStatus?: string;
    caseId?: string;
}): Promise<UsedProduct | null> {
    const scope = await resolveScope();
    if (!scope) return null;

    let caseStatus = toText(input.caseStatus, 80);
    if (!caseStatus && input.caseId) {
        const db = await getDb();
        if (db) {
            const caseSnap = await db.collection(`companies/${scope.companyId}/cases`).doc(toText(input.caseId, 120)).get();
            if (caseSnap.exists) {
                caseStatus = toText((caseSnap.data() as Record<string, unknown>).status, 80);
            }
        }
    }

    const nextRefurbishmentStatus = mapCaseStatusToRefurbishment(caseStatus || "new");

    return patchUsedProduct(scope, input.usedProductId, {
        refurbishmentStatus: nextRefurbishmentStatus,
        isRefurbished: nextRefurbishmentStatus === "refurbished",
        saleStatus: nextRefurbishmentStatus === "refurbished" ? "available" : undefined,
    });
}

export async function deleteUsedProduct(id: string): Promise<boolean> {
    const scope = await resolveScope();
    if (!scope) return false;

    const targetId = toText(id, 120);
    if (!targetId) return false;

    removeMemory(scope.companyId, targetId);

    const db = await getDb();
    if (!db) return true;

    await db.collection(usedProductsCollectionPath(scope.companyId)).doc(targetId).delete();
    return true;
}
