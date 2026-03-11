import "server-only";
import type { PaymentMethod, Sale } from "@/lib/types/sale";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";

const memory: { salesByCompany: Record<string, Sale[]> } = { salesByCompany: {} };

const MAX_TEXT = 160;
const MAX_QUERY = 120;
const MAX_MONEY = 100000000;

type SessionScope = {
    companyId: string;
};

function now() {
    return Date.now();
}

function id() {
    return `s_${Math.random().toString(16).slice(2)}_${now()}`;
}

function toStr(v: unknown): string {
    return typeof v === "string" ? v.trim() : "";
}

function safeText(value: string, max: number): string {
    return value.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, max).trim();
}

function normalizeCompanyId(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/[/?#]/.test(trimmed)) return null;
    return trimmed;
}

function parseMoney(v: unknown): number {
    const n = typeof v === "number" ? v : Number(toStr(v).replace(/,/g, ""));
    if (!Number.isFinite(n)) return 0;
    if (n < 0) return 0;
    if (n > MAX_MONEY) return MAX_MONEY;
    return Math.round(n);
}

function parsePaymentMethod(v: unknown): PaymentMethod {
    return v === "card" ? "card" : "cash";
}

function parseCheckoutAt(v: unknown): number {
    const text = toStr(v);
    if (!text) return now();
    const ts = Date.parse(text);
    if (!Number.isFinite(ts)) return now();
    return ts;
}

function normalizeSale(input: Partial<Sale> & { id: string }): Sale {
    const createdAt = typeof input.createdAt === "number" ? input.createdAt : now();
    const checkoutAt = typeof input.checkoutAt === "number" ? input.checkoutAt : createdAt;

    const extra = input as Record<string, unknown>;
    const companyId = safeText(toStr(extra.companyId), 120);

    return {
        id: input.id,
        item: safeText(toStr(input.item), MAX_TEXT) || "Untitled Item",
        amount: parseMoney(input.amount),
        checkoutAt,
        paymentMethod: parsePaymentMethod(input.paymentMethod),
        companyId: companyId || undefined,
        createdAt,
        updatedAt: typeof input.updatedAt === "number" ? input.updatedAt : createdAt,
    };
}

function validateInput(payload: {
    item: string;
    amount: string;
    checkoutAt: string;
    paymentMethod: string;
}): {
    item: string;
    amount: number;
    checkoutAt: number;
    paymentMethod: PaymentMethod;
} | null {
    const item = safeText(payload.item, MAX_TEXT);
    const amount = parseMoney(payload.amount);
    const checkoutAt = parseCheckoutAt(payload.checkoutAt);
    const paymentMethod = parsePaymentMethod(payload.paymentMethod);

    if (!item) return null;
    return { item, amount, checkoutAt, paymentMethod };
}

async function resolveSessionScope(requireCompany = true): Promise<SessionScope | null> {
    const session = await getSessionUser();
    if (!session) return null;

    const user = await getUserDoc(session.uid);
    if (!user) return null;

    const accountType = toAccountType(user.role);
    if (requireCompany && accountType !== "company") return null;

    const companyId = normalizeCompanyId(getShowcaseTenantId(user, session.uid));
    if (!companyId) return null;

    return { companyId };
}

async function getFirestoreDb() {
    try {
        const mod = await import("@/lib/firebase-server");
        return mod.fbAdminDb;
    } catch {
        return null;
    }
}

function companySalesRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/sales`);
}

function listFromMemory(companyId: string): Sale[] {
    return [...(memory.salesByCompany[companyId] ?? [])].sort((a, b) => b.checkoutAt - a.checkoutAt);
}

function upsertMemorySale(companyId: string, sale: Sale): void {
    const list = memory.salesByCompany[companyId] ?? [];
    memory.salesByCompany[companyId] = [sale, ...list.filter((item) => item.id !== sale.id)];
}

function removeMemorySale(companyId: string, saleId: string): boolean {
    const list = memory.salesByCompany[companyId] ?? [];
    const next = list.filter((sale) => sale.id !== saleId);
    const removed = next.length !== list.length;
    memory.salesByCompany[companyId] = next;
    return removed;
}

async function listFromFirebase(companyId: string): Promise<Sale[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const snap = await companySalesRef(db, companyId).orderBy("checkoutAt", "desc").limit(200).get();
    return snap.docs.map((doc) => normalizeSale({ id: doc.id, ...(doc.data() as Partial<Sale>) }));
}

async function createInMemory(
    companyId: string,
    params: {
        item: string;
        amount: number;
        checkoutAt: number;
        paymentMethod: PaymentMethod;
    },
): Promise<Sale> {
    const ts = now();
    const sale: Sale = {
        id: id(),
        item: params.item,
        amount: params.amount,
        checkoutAt: params.checkoutAt,
        paymentMethod: params.paymentMethod,
        companyId,
        createdAt: ts,
        updatedAt: ts,
    };
    upsertMemorySale(companyId, sale);
    return sale;
}

async function createInFirebase(
    companyId: string,
    params: {
        item: string;
        amount: number;
        checkoutAt: number;
        paymentMethod: PaymentMethod;
    },
): Promise<Sale | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const ts = now();
    const docId = id();
    const sale: Sale = {
        id: docId,
        item: params.item,
        amount: params.amount,
        checkoutAt: params.checkoutAt,
        paymentMethod: params.paymentMethod,
        companyId,
        createdAt: ts,
        updatedAt: ts,
    };

    await companySalesRef(db, companyId).doc(docId).set(sale, { merge: false });
    return sale;
}

async function deleteInFirebase(companyId: string, saleId: string): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const ref = companySalesRef(db, companyId).doc(saleId);
    const snap = await ref.get();
    if (!snap.exists) return false;
    await ref.delete();
    return true;
}

async function updateInMemory(
    companyId: string,
    params: {
        id: string;
        item?: string;
        amount?: number;
        checkoutAt?: number;
        paymentMethod?: PaymentMethod;
    },
): Promise<Sale | null> {
    const list = memory.salesByCompany[companyId] ?? [];
    const target = list.find((sale) => sale.id === params.id);
    if (!target) return null;

    if (params.item && params.item.trim()) target.item = params.item.trim();
    if (params.amount !== undefined) target.amount = params.amount;
    if (params.checkoutAt !== undefined) target.checkoutAt = params.checkoutAt;
    if (params.paymentMethod !== undefined) target.paymentMethod = params.paymentMethod;
    target.updatedAt = now();
    upsertMemorySale(companyId, target);
    return target;
}

async function updateInFirebase(
    companyId: string,
    params: {
        id: string;
        item?: string;
        amount?: number;
        checkoutAt?: number;
        paymentMethod?: PaymentMethod;
    },
): Promise<Sale | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const ref = companySalesRef(db, companyId).doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) return null;

    const current = normalizeSale({ id: snap.id, ...(snap.data() as Partial<Sale>) });
    const next: Sale = {
        ...current,
        item: params.item && params.item.trim() ? params.item.trim() : current.item,
        amount: params.amount !== undefined ? params.amount : current.amount,
        checkoutAt: params.checkoutAt !== undefined ? params.checkoutAt : current.checkoutAt,
        paymentMethod: params.paymentMethod !== undefined ? params.paymentMethod : current.paymentMethod,
        companyId,
        updatedAt: now(),
    };

    await ref.set(next, { merge: true });
    return next;
}

function filterSales(sales: Sale[], keyword?: string): Sale[] {
    const q = safeText(keyword ?? "", MAX_QUERY).toLowerCase();
    if (!q) return sales;
    return sales.filter((sale) => {
        const haystack = [
            sale.id,
            sale.item,
            String(sale.amount),
            sale.paymentMethod,
            String(sale.checkoutAt),
            String(sale.updatedAt),
            sale.companyId ?? "",
        ]
            .join(" ")
            .toLowerCase();
        return haystack.includes(q);
    });
}

export async function listSales(): Promise<Sale[]> {
    const scope = await resolveSessionScope(true);
    if (!scope) return [];

    try {
        const firebaseSales = await listFromFirebase(scope.companyId);
        if (firebaseSales) return firebaseSales;
    } catch {
        // fallback to memory
    }

    return listFromMemory(scope.companyId);
}

export async function querySales(keyword?: string): Promise<Sale[]> {
    const sales = await listSales();
    return filterSales(sales, keyword);
}

export async function createSale(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    if (!scope) {
        redirect(`/sales?flash=invalid&ts=${Date.now()}`);
    }

    const validated = validateInput({
        item: toStr(formData.get("item")),
        amount: toStr(formData.get("amount")),
        checkoutAt: toStr(formData.get("checkoutAt")),
        paymentMethod: toStr(formData.get("paymentMethod")),
    });
    if (!validated) {
        redirect(`/sales?flash=invalid&ts=${Date.now()}`);
    }

    try {
        const created = await createInFirebase(scope.companyId, validated);
        if (!created) await createInMemory(scope.companyId, validated);
    } catch {
        await createInMemory(scope.companyId, validated);
    }

    revalidatePath("/sales");
    redirect(`/sales?flash=created&ts=${Date.now()}`);
}

export async function updateSale(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    if (!scope) {
        redirect(`/sales?flash=invalid&ts=${Date.now()}`);
    }

    const saleId = safeText(toStr(formData.get("id")), 80);
    if (!saleId) {
        redirect(`/sales?flash=invalid&ts=${Date.now()}`);
    }

    const payload = {
        id: saleId,
        item: formData.has("item") ? safeText(toStr(formData.get("item")), MAX_TEXT) : undefined,
        amount: formData.has("amount") ? parseMoney(formData.get("amount")) : undefined,
        checkoutAt: formData.has("checkoutAt") ? parseCheckoutAt(formData.get("checkoutAt")) : undefined,
        paymentMethod: formData.has("paymentMethod") ? parsePaymentMethod(formData.get("paymentMethod")) : undefined,
    };

    try {
        const updated = await updateInFirebase(scope.companyId, payload);
        if (!updated) await updateInMemory(scope.companyId, payload);
    } catch {
        await updateInMemory(scope.companyId, payload);
    }

    revalidatePath("/sales");
    redirect(`/sales?flash=updated&ts=${Date.now()}`);
}

export async function deleteSale(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    if (!scope) {
        redirect(`/sales?flash=invalid&ts=${Date.now()}`);
    }

    const saleId = safeText(toStr(formData.get("id")), 80);
    if (!saleId) {
        redirect(`/sales?flash=invalid&ts=${Date.now()}`);
    }

    try {
        const removed = await deleteInFirebase(scope.companyId, saleId);
        if (removed === null) removeMemorySale(scope.companyId, saleId);
    } catch {
        removeMemorySale(scope.companyId, saleId);
    }

    revalidatePath("/sales");
    redirect(`/sales?flash=deleted&ts=${Date.now()}`);
}
