import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import type {
    Activity,
    ActivityItem,
    ActivityStatus,
    BossAdminCompanyRecord,
    CompanyCustomer,
    CompanyDashboardStats,
    InventoryStockLog,
    Product,
    RepairBrand,
    RevenuePoint,
} from "@/lib/types/commerce";
import { buildProductNameSuggestion, buildProductNormalizedName, buildProductSearchKeywords, normalizeAliasList, parseProductNamingMode } from "@/lib/services/productNaming";
import type { Sale } from "@/lib/types/sale";
import type { Ticket } from "@/lib/types/ticket";
import { listSales, queryCheckoutSales } from "@/lib/services/sales";
import { listTickets } from "@/lib/services/ticket";

const MAX_TEXT = 160;
const MAX_LONG_TEXT = 800;
const MAX_LIST_SIZE = 200;
const PHONE_RE = /^[0-9+\-()\s]{6,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const memory: {
    activitiesByCompany: Record<string, Activity[]>;
    productsByCompany: Record<string, Product[]>;
    stockLogsByCompany: Record<string, InventoryStockLog[]>;
    brandsByCompany: Record<string, RepairBrand[]>;
    customersByCompany: Record<string, CompanyCustomer[]>;
} = {
    activitiesByCompany: {},
    productsByCompany: {},
    stockLogsByCompany: {},
    brandsByCompany: {},
    customersByCompany: {},
};

type SessionScope = {
    uid: string;
    companyId: string;
    accountType: "company" | "customer";
    operatorName: string;
    operatorEmail: string;
};

type CompanyDocLike = {
    id?: unknown;
    name?: unknown;
    companyName?: unknown;
    title?: unknown;
    phone?: unknown;
    companyPhone?: unknown;
    mobile?: unknown;
    address?: unknown;
    companyAddress?: unknown;
    paymentInfo?: unknown;
    payment?: unknown;
    paymentMethod?: unknown;
    subscriptionStartAt?: unknown;
    subscriptionStart?: unknown;
    subscriptionEndAt?: unknown;
    subscriptionEnd?: unknown;
    subscriptionAmount?: unknown;
    monthlyFee?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
};

function now() {
    return Date.now();
}

function id(prefix: string) {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${now()}`;
}

function toStr(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function safeText(value: unknown, max = MAX_TEXT): string {
    return toStr(value).replace(/[\u0000-\u001F\u007F]/g, "").slice(0, max).trim();
}

function toNumber(value: unknown, fallback = 0): number {
    const raw = typeof value === "number" ? value : Number(toStr(value).replace(/,/g, ""));
    if (!Number.isFinite(raw)) return fallback;
    return raw;
}

function toMoney(value: unknown): number {
    const raw = toNumber(value, 0);
    if (raw < 0) return 0;
    if (raw > 1000000000) return 1000000000;
    return Math.round(raw);
}

function toTimestamp(value: unknown, fallback = 0): number {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.round(value);
    const text = toStr(value);
    if (!text) return fallback;
    const parsed = Date.parse(text);
    if (!Number.isFinite(parsed)) return fallback;
    return parsed;
}

function toActivityBoundaryTimestamp(value: unknown, mode: "start" | "end", fallback = 0): number {
    const text = toStr(value);
    if (!text) return fallback;

    const dateOnlyMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
        const year = Number.parseInt(dateOnlyMatch[1], 10);
        const month = Number.parseInt(dateOnlyMatch[2], 10);
        const day = Number.parseInt(dateOnlyMatch[3], 10);
        if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return fallback;
        const boundaryDate =
            mode === "start"
                ? new Date(year, month - 1, day, 0, 0, 0, 0)
                : new Date(year, month - 1, day, 23, 59, 59, 999);
        const ts = boundaryDate.getTime();
        return Number.isFinite(ts) ? ts : fallback;
    }

    return toTimestamp(text, fallback);
}

function normalizeCompanyId(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/[/?#]/.test(trimmed)) return null;
    return trimmed;
}

function computeActivityStatus(startAt: number, endAt: number, forced?: ActivityStatus): ActivityStatus {
    if (forced === "cancelled") return "cancelled";
    const ts = now();
    if (ts < startAt) return "upcoming";
    if (ts > endAt) return "ended";
    return "active";
}

function parsePromotionEffectType(value: unknown): Activity["effectType"] {
    if (value === "bundle_price") return "bundle_price";
    if (value === "gift_item") return "gift_item";
    if (value === "create_entitlement") return "create_entitlement";
    if (value === "create_pickup_reservation") return "create_pickup_reservation";
    return "discount";
}

function normalizeActivityItem(input: Partial<ActivityItem> | null | undefined): ActivityItem {
    const candidate = input ?? {};
    const totalQty = Math.max(0, Math.round(toNumber(candidate.totalQty, 0)));
    const unitPrice = toMoney(candidate.unitPrice);
    const unitCost = toMoney(candidate.unitCost);
    const amount = toMoney(candidate.amount ?? totalQty * unitPrice);
    const cost = toMoney(candidate.cost ?? totalQty * unitCost);
    return {
        id: safeText(candidate.id, 90) || id("act_item"),
        itemName: safeText(candidate.itemName) || "未命名品項",
        totalQty,
        unitPrice,
        unitCost,
        amount,
        cost,
    };
}

function normalizeActivity(input: Partial<Activity> & { id: string }): Activity {
    const createdAt = toTimestamp(input.createdAt, now());
    const startAt = toTimestamp(input.startAt, createdAt);
    const endAt = toTimestamp(input.endAt, startAt + 24 * 60 * 60 * 1000);
    const items = Array.isArray(input.items)
        ? input.items
              .slice(0, 18)
              .map((item) => normalizeActivityItem(item))
              .filter((item) => item.itemName.trim().length > 0)
        : [];

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const totalCost = items.reduce((sum, item) => sum + item.cost, 0);
    const effectType = parsePromotionEffectType(input.effectType);
    const discountAmount = toMoney(input.discountAmount);
    const bundlePriceDiscount = toMoney(input.bundlePriceDiscount);
    const giftQty = Math.max(1, Math.round(toNumber(input.giftQty, 1)));
    const entitlementQty = Math.max(1, Math.round(toNumber(input.entitlementQty, 1)));
    const reservationQty = Math.max(1, Math.round(toNumber(input.reservationQty, 1)));

    return {
        id: safeText(input.id, 120) || id("act"),
        name: safeText(input.name) || "未命名活動",
        startAt,
        endAt: Math.max(endAt, startAt),
        status: computeActivityStatus(startAt, Math.max(endAt, startAt), input.status),
        message: safeText(input.message, MAX_LONG_TEXT),
        effectType,
        discountAmount,
        bundlePriceDiscount,
        giftProductId: safeText(input.giftProductId, 120) || undefined,
        giftProductName: safeText(input.giftProductName) || undefined,
        giftQty,
        entitlementType:
            input.entitlementType === "gift" || input.entitlementType === "discount" || input.entitlementType === "service"
                ? input.entitlementType
                : "replacement",
        scopeType: input.scopeType === "product" ? "product" : "category",
        categoryId: safeText(input.categoryId, 120) || undefined,
        categoryName: safeText(input.categoryName) || undefined,
        productId: safeText(input.productId, 120) || undefined,
        productName: safeText(input.productName) || undefined,
        entitlementQty,
        entitlementExpiresAt: toTimestamp(input.entitlementExpiresAt, 0) || undefined,
        reservationQty,
        reservationExpiresAt: toTimestamp(input.reservationExpiresAt, 0) || undefined,
        defaultStoreQty: Math.max(0, Math.round(toNumber(input.defaultStoreQty, 0))),
        items,
        totalAmount: toMoney(input.totalAmount ?? totalAmount),
        totalCost: toMoney(input.totalCost ?? totalCost),
        createdAt,
        updatedAt: toTimestamp(input.updatedAt, createdAt),
    };
}

function normalizeProduct(input: Partial<Product> & { id: string }): Product {
    const createdAt = toTimestamp(input.createdAt, now());
    const namingMode = parseProductNamingMode(input.namingMode);
    const categoryId = safeText(input.categoryId, 120);
    const categoryName = safeText(input.categoryName);
    const brandId = safeText(input.brandId, 120);
    const brandName = safeText(input.brandName);
    const modelId = safeText(input.modelId, 120);
    const modelName = safeText(input.modelName);
    const nameEntryId = safeText(input.nameEntryId, 120);
    const nameEntryName = safeText(input.nameEntryName);
    const customLabel = safeText(input.customLabel);
    const aliases = normalizeAliasList(input.aliases);
    const suggestedName = buildProductNameSuggestion({
        namingMode,
        categoryName,
        brandName,
        modelName,
        nameEntryName,
        customLabel,
    });
    const safeName = safeText(input.name) || suggestedName || "未命名產品";

    const sellPrice = toMoney(input.sellPrice ?? input.price);
    const costPrice = toMoney(input.costPrice ?? input.cost);
    const onHandQty = Math.max(0, Math.round(toNumber(input.onHandQty ?? input.stockQty ?? input.stock, 0)));
    const reservedQty = Math.max(0, Math.round(toNumber(input.reservedQty, 0)));
    const availableQty = Math.max(0, Math.round(toNumber(input.availableQty, onHandQty - reservedQty)));

    return {
        id: safeText(input.id, 120) || id("prd"),
        companyId: safeText(input.companyId, 120),
        name: safeName,
        namingMode,
        categoryId,
        categoryName,
        brandId,
        brandName,
        modelId,
        modelName,
        nameEntryId,
        nameEntryName,
        customLabel,
        aliases,
        normalizedName:
            buildProductNormalizedName({
                name: input.normalizedName || safeName,
                aliases,
                categoryName,
                brandName,
                modelName,
                nameEntryName,
                customLabel,
            }) || buildProductNormalizedName({ name: safeName }),
        price: sellPrice,
        cost: costPrice,
        supplier: safeText(input.supplier),
        sku: safeText(input.sku, 120),
        stock: onHandQty,
        onHandQty,
        reservedQty,
        availableQty,
        sellPrice,
        costPrice,
        stockQty: onHandQty,
        lowStockThreshold: Math.max(0, Math.round(toNumber(input.lowStockThreshold, 0))),
        stockDeductionMode: input.stockDeductionMode === "redeem_only" ? "redeem_only" : "immediate",
        status: input.status === "inactive" ? "inactive" : "active",
        createdAt,
        updatedAt: toTimestamp(input.updatedAt, createdAt),
    };
}

function normalizeBrand(input: Partial<RepairBrand> & { id: string }): RepairBrand {
    const createdAt = toTimestamp(input.createdAt, now());
    const rawModels = Array.isArray(input.models) ? input.models : [];
    const models = rawModels
        .map((model) => safeText(model, 80))
        .filter((model) => model.length > 0)
        .slice(0, 120);

    return {
        id: safeText(input.id, 120) || id("brand"),
        name: safeText(input.name) || "未命名品牌",
        models,
        createdAt,
        updatedAt: toTimestamp(input.updatedAt, createdAt),
    };
}

function normalizeCustomer(input: Partial<CompanyCustomer> & { id: string }): CompanyCustomer {
    const createdAt = toTimestamp(input.createdAt, now());
    return {
        id: safeText(input.id, 120) || id("cus"),
        name: safeText(input.name) || "未命名客戶",
        phone: safeText(input.phone),
        email: safeText(input.email),
        address: safeText(input.address, 260),
        createdAt,
        updatedAt: toTimestamp(input.updatedAt, createdAt),
    };
}

function normalizeBossCompany(idValue: string, input: CompanyDocLike): BossAdminCompanyRecord {
    const createdAt = toTimestamp(input.createdAt, 0);
    const subscriptionStartAt = toTimestamp(input.subscriptionStartAt ?? input.subscriptionStart, createdAt);
    const subscriptionEndAt = toTimestamp(
        input.subscriptionEndAt ?? input.subscriptionEnd,
        subscriptionStartAt > 0 ? subscriptionStartAt + 30 * 24 * 60 * 60 * 1000 : 0,
    );

    return {
        id: idValue,
        name: safeText(input.name ?? input.companyName ?? input.title) || idValue,
        phone: safeText(input.phone ?? input.companyPhone ?? input.mobile),
        address: safeText(input.address ?? input.companyAddress, 260),
        paymentInfo: safeText(input.paymentInfo ?? input.payment ?? input.paymentMethod, 260),
        subscriptionStartAt,
        subscriptionEndAt,
        subscriptionAmount: toMoney(input.subscriptionAmount ?? input.monthlyFee),
        createdAt,
        updatedAt: toTimestamp(input.updatedAt, createdAt),
    };
}

function getDayStart(ts: number): number {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

function getMonthStart(ts: number): number {
    const d = new Date(ts);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

function toDayLabel(ts: number): string {
    const d = new Date(ts);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${month}/${day}`;
}

function toMonthLabel(ts: number): string {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildPointsByDay(records: Array<{ ts: number; amount: number }>, days: number): RevenuePoint[] {
    const start = getDayStart(now()) - (days - 1) * 24 * 60 * 60 * 1000;
    const buckets: RevenuePoint[] = Array.from({ length: days }, (_, index) => {
        const bucketTs = start + index * 24 * 60 * 60 * 1000;
        return {
            label: toDayLabel(bucketTs),
            revenue: 0,
            count: 0,
        };
    });

    for (const record of records) {
        if (record.ts < start) continue;
        const index = Math.floor((getDayStart(record.ts) - start) / (24 * 60 * 60 * 1000));
        if (index < 0 || index >= buckets.length) continue;
        buckets[index].revenue += toMoney(record.amount);
        buckets[index].count += 1;
    }

    return buckets;
}

function buildPointsByMonth(records: Array<{ ts: number; amount: number }>, months: number): RevenuePoint[] {
    const n = now();
    const d = new Date(n);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);

    const starts: number[] = [];
    for (let index = months - 1; index >= 0; index -= 1) {
        const cursor = new Date(d);
        cursor.setMonth(cursor.getMonth() - index);
        starts.push(cursor.getTime());
    }

    const buckets: RevenuePoint[] = starts.map((ts) => ({ label: toMonthLabel(ts), revenue: 0, count: 0 }));

    for (const record of records) {
        const monthStart = getMonthStart(record.ts);
        const index = starts.findIndex((value) => value === monthStart);
        if (index === -1) continue;
        buckets[index].revenue += toMoney(record.amount);
        buckets[index].count += 1;
    }

    return buckets;
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

    return {
        uid: session.uid,
        companyId,
        accountType,
        operatorName: safeText(session.email?.split("@")[0] ?? "", 120) || "未知操作者",
        operatorEmail: safeText(session.email ?? "", 160).toLowerCase(),
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

function companyActivityRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/campaigns`);
}

function companyProductRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/products`);
}

function companyBrandRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/repair_brands`);
}

function companyCustomerRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/customers`);
}

function companyStockLogRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/inventory_logs`);
}

function listFromMemory<T>(store: Record<string, T[]>, companyId: string): T[] {
    return [...(store[companyId] ?? [])];
}

function upsertMemory<T extends { id: string }>(store: Record<string, T[]>, companyId: string, value: T) {
    const list = store[companyId] ?? [];
    store[companyId] = [value, ...list.filter((item) => item.id !== value.id)];
}

function replaceMemoryList<T>(store: Record<string, T[]>, companyId: string, next: T[]) {
    store[companyId] = [...next];
}

function removeFromMemory<T extends { id: string }>(store: Record<string, T[]>, companyId: string, idValue: string) {
    const list = store[companyId] ?? [];
    store[companyId] = list.filter((item) => item.id !== idValue);
}

async function listActivitiesFromFirebase(companyId: string): Promise<Activity[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const snap = await companyActivityRef(db, companyId).orderBy("updatedAt", "desc").limit(MAX_LIST_SIZE).get();
    return snap.docs.map((doc) => normalizeActivity({ id: doc.id, ...(doc.data() as Partial<Activity>) }));
}

async function listProductsFromFirebase(companyId: string): Promise<Product[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const snap = await companyProductRef(db, companyId).orderBy("updatedAt", "desc").limit(MAX_LIST_SIZE).get();
    return snap.docs.map((doc) => normalizeProduct({ id: doc.id, ...(doc.data() as Partial<Product>) }));
}

async function listBrandsFromFirebase(companyId: string): Promise<RepairBrand[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const snap = await companyBrandRef(db, companyId).orderBy("updatedAt", "desc").limit(MAX_LIST_SIZE).get();
    return snap.docs.map((doc) => normalizeBrand({ id: doc.id, ...(doc.data() as Partial<RepairBrand>) }));
}

async function listCustomersFromFirebase(companyId: string): Promise<CompanyCustomer[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const snap = await companyCustomerRef(db, companyId).orderBy("updatedAt", "desc").limit(MAX_LIST_SIZE).get();
    return snap.docs.map((doc) => normalizeCustomer({ id: doc.id, ...(doc.data() as Partial<CompanyCustomer>) }));
}

function normalizeInventoryStockLog(input: Partial<InventoryStockLog> & { id: string }): InventoryStockLog {
    const createdAt = toTimestamp(input.createdAt, now());
    const action = input.action === "stock_out" ? "stock_out" : "stock_in";
    const beforeStock = Math.max(0, Math.round(toNumber(input.beforeStock, 0)));
    const qty = Math.max(0, Math.round(toNumber(input.qty, 0)));
    const afterStock = Math.max(0, Math.round(toNumber(input.afterStock, action === "stock_in" ? beforeStock + qty : beforeStock - qty)));

    return {
        id: safeText(input.id, 120) || id("stock_log"),
        productId: safeText(input.productId, 120),
        productName: safeText(input.productName) || "未命名產品",
        action,
        qty,
        beforeStock,
        afterStock,
        operatorName: safeText(input.operatorName, 120) || "未知操作者",
        operatorEmail: safeText(input.operatorEmail, 160).toLowerCase(),
        createdAt,
        updatedAt: toTimestamp(input.updatedAt, createdAt),
    };
}

async function listStockLogsFromFirebase(companyId: string): Promise<InventoryStockLog[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const snap = await companyStockLogRef(db, companyId).orderBy("createdAt", "desc").limit(MAX_LIST_SIZE).get();
    return snap.docs.map((doc) => normalizeInventoryStockLog({ id: doc.id, ...(doc.data() as Partial<InventoryStockLog>) }));
}

async function createStockLogInFirebase(companyId: string, stockLog: InventoryStockLog): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    await companyStockLogRef(db, companyId).doc(stockLog.id).set(stockLog, { merge: false });
    return true;
}

async function setActivityToFirebase(companyId: string, activity: Activity) {
    const db = await getFirestoreDb();
    if (!db) return false;

    await companyActivityRef(db, companyId).doc(activity.id).set(activity, { merge: true });
    return true;
}

async function setProductToFirebase(companyId: string, product: Product) {
    const db = await getFirestoreDb();
    if (!db) return false;

    await companyProductRef(db, companyId).doc(product.id).set(product, { merge: true });
    return true;
}

async function setBrandToFirebase(companyId: string, brand: RepairBrand) {
    const db = await getFirestoreDb();
    if (!db) return false;

    await companyBrandRef(db, companyId).doc(brand.id).set(brand, { merge: true });
    return true;
}

async function setCustomerToFirebase(companyId: string, customer: CompanyCustomer) {
    const db = await getFirestoreDb();
    if (!db) return false;

    await companyCustomerRef(db, companyId)
        .doc(customer.id)
        .set(
            {
                ...customer,
                companyId,
                emailLower: customer.email.toLowerCase(),
            },
            { merge: true },
        );
    return true;
}

async function deleteActivityInFirebase(companyId: string, activityId: string): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    await companyActivityRef(db, companyId).doc(activityId).delete();
    return true;
}

async function deleteProductInFirebase(companyId: string, productId: string): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    await companyProductRef(db, companyId).doc(productId).delete();
    return true;
}

async function deleteBrandInFirebase(companyId: string, brandId: string): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    await companyBrandRef(db, companyId).doc(brandId).delete();
    return true;
}

function queryByKeyword<T>(list: T[], keyword: string, resolver: (item: T) => string[]): T[] {
    const q = safeText(keyword, 120).toLowerCase();
    if (!q) return list;
    return list.filter((item) => resolver(item).join(" ").toLowerCase().includes(q));
}

function getRedirectTab(formData: FormData, fallback: string): string {
    const tab = safeText(formData.get("tab"), 40);
    return tab || fallback;
}

type InventoryView = "stock" | "settings" | "stock-in" | "stock-out" | "product-management";
type ProductRedirectPath = "" | "/dashboard/products";

function getRedirectInventoryView(formData: FormData, fallback: InventoryView = "stock"): InventoryView {
    const raw = safeText(formData.get("inventoryView"), 40);
    if (raw === "settings") return "settings";
    if (raw === "stock-in") return "stock-in";
    if (raw === "stock-out") return "stock-out";
    if (raw === "product-management") return "product-management";
    if (raw === "stock") return "stock";
    return fallback;
}

function getProductRedirectPath(formData: FormData): ProductRedirectPath {
    const raw = safeText(formData.get("redirectPath"), 120);
    return raw === "/dashboard/products" ? "/dashboard/products" : "";
}

function dashboardRedirect(tab: string, flash: string, options?: { inventoryView?: InventoryView; redirectPath?: ProductRedirectPath }): never {
    const query = new URLSearchParams();
    query.set("flash", flash);
    query.set("ts", String(Date.now()));
    if (options?.redirectPath) {
        redirect(`${options.redirectPath}?${query.toString()}`);
    }
    query.set("tab", tab);
    if (tab === "inventory" && options?.inventoryView) {
        query.set("inventoryView", options.inventoryView);
    }
    const target = `/dashboard?${query.toString()}`;
    redirect(target);
}

function parseActivityItems(formData: FormData): ActivityItem[] {
    const nameList = formData.getAll("activityItemName[]");
    const qtyList = formData.getAll("activityItemQty[]");
    const priceList = formData.getAll("activityItemPrice[]");
    const costList = formData.getAll("activityItemCost[]");

    const size = Math.min(nameList.length, qtyList.length, priceList.length, costList.length, 24);
    const items: ActivityItem[] = [];

    for (let index = 0; index < size; index += 1) {
        const itemName = safeText(nameList[index]);
        const totalQty = Math.max(0, Math.round(toNumber(qtyList[index], 0)));
        const unitPrice = toMoney(priceList[index]);
        const unitCost = toMoney(costList[index]);
        if (!itemName) continue;
        items.push({
            id: id("act_item"),
            itemName,
            totalQty,
            unitPrice,
            unitCost,
            amount: toMoney(totalQty * unitPrice),
            cost: toMoney(totalQty * unitCost),
        });
    }

    return items;
}

type ActivityEffectFields = {
    effectType: Activity["effectType"];
    discountAmount: number;
    bundlePriceDiscount: number;
    giftProductId?: string;
    giftProductName?: string;
    giftQty: number;
    entitlementType: "replacement" | "gift" | "discount" | "service";
    scopeType: "category" | "product";
    categoryId?: string;
    categoryName?: string;
    productId?: string;
    productName?: string;
    entitlementQty: number;
    entitlementExpiresAt?: number;
    reservationQty: number;
    reservationExpiresAt?: number;
};

function parseActivityEffectFields(formData: FormData): ActivityEffectFields {
    const effectType = parsePromotionEffectType(formData.get("activityEffectType"));
    return {
        effectType,
        discountAmount: toMoney(formData.get("activityDiscountAmount")),
        bundlePriceDiscount: toMoney(formData.get("activityBundlePriceDiscount")),
        giftProductId: safeText(formData.get("activityGiftProductId"), 120) || undefined,
        giftProductName: safeText(formData.get("activityGiftProductName")) || undefined,
        giftQty: Math.max(1, Math.round(toNumber(formData.get("activityGiftQty"), 1))),
        entitlementType:
            formData.get("activityEntitlementType") === "gift" ||
            formData.get("activityEntitlementType") === "discount" ||
            formData.get("activityEntitlementType") === "service"
                ? (formData.get("activityEntitlementType") as "gift" | "discount" | "service")
                : "replacement",
        scopeType: formData.get("activityScopeType") === "product" ? "product" : "category",
        categoryId: safeText(formData.get("activityCategoryId"), 120) || undefined,
        categoryName: safeText(formData.get("activityCategoryName")) || undefined,
        productId: safeText(formData.get("activityProductId"), 120) || undefined,
        productName: safeText(formData.get("activityProductName")) || undefined,
        entitlementQty: Math.max(1, Math.round(toNumber(formData.get("activityEntitlementQty"), 1))),
        entitlementExpiresAt: toTimestamp(formData.get("activityEntitlementExpiresAt"), 0) || undefined,
        reservationQty: Math.max(1, Math.round(toNumber(formData.get("activityReservationQty"), 1))),
        reservationExpiresAt: toTimestamp(formData.get("activityReservationExpiresAt"), 0) || undefined,
    };
}

function isActivityEffectValid(effect: ActivityEffectFields): boolean {
    if (effect.effectType === "create_entitlement") {
        if (effect.entitlementQty <= 0) return false;
        if (effect.scopeType === "product") return Boolean(effect.productId || effect.productName);
        return Boolean(effect.categoryId || effect.categoryName);
    }
    if (effect.effectType === "gift_item") {
        return Boolean(effect.giftProductId || effect.giftProductName);
    }
    if (effect.effectType === "create_pickup_reservation") {
        return Boolean(effect.productId || effect.productName) && effect.reservationQty > 0;
    }
    return true;
}

function parseDimensionRef(value: unknown): { id: string; name: string } {
    const raw = safeText(value, 320);
    if (!raw) return { id: "", name: "" };
    const [idPart, namePart] = raw.split("::");
    const idValue = safeText(idPart, 120);
    const nameValue = safeText(namePart);
    if (!nameValue && !idValue) return { id: "", name: "" };
    return {
        id: idValue,
        name: nameValue || idValue,
    };
}

type ProductFormFields = {
    name: string;
    namingMode: Product["namingMode"];
    categoryId: string;
    categoryName: string;
    brandId: string;
    brandName: string;
    modelId: string;
    modelName: string;
    nameEntryId: string;
    nameEntryName: string;
    customLabel: string;
    aliases: string[];
    stockDeductionMode: "immediate" | "redeem_only";
    status: "active" | "inactive";
};

function readProductFormFields(formData: FormData): ProductFormFields {
    const namingMode = parseProductNamingMode(formData.get("namingMode"));
    const categoryRef = parseDimensionRef(formData.get("categoryRef"));
    const brandRef = parseDimensionRef(formData.get("brandRef"));
    const modelRef = parseDimensionRef(formData.get("modelRef"));
    const nameEntryRef = parseDimensionRef(formData.get("nameEntryRef"));
    const categoryId = categoryRef.id || safeText(formData.get("categoryId"), 120);
    const categoryName = categoryRef.name || safeText(formData.get("categoryName"));
    const brandId = brandRef.id || safeText(formData.get("brandId"), 120);
    const brandName = brandRef.name || safeText(formData.get("brandName"));
    const modelId = modelRef.id || safeText(formData.get("modelId"), 120);
    const modelName = modelRef.name || safeText(formData.get("modelName"));
    const nameEntryId = nameEntryRef.id || safeText(formData.get("nameEntryId"), 120);
    const nameEntryName = nameEntryRef.name || safeText(formData.get("nameEntryName"));
    const customLabel = safeText(formData.get("customLabel"));
    const aliases = normalizeAliasList([...formData.getAll("aliases[]"), formData.get("aliases"), formData.get("aliasText")]);
    const suggestedName = buildProductNameSuggestion({
        namingMode,
        categoryName,
        brandName,
        modelName,
        nameEntryName,
        customLabel,
    });
    const name = safeText(formData.get("name")) || suggestedName;

    const stockDeductionMode: "immediate" | "redeem_only" =
        formData.get("stockDeductionMode") === "redeem_only" ? "redeem_only" : "immediate";
    const status: "active" | "inactive" = formData.get("status") === "inactive" ? "inactive" : "active";

    return {
        name,
        namingMode,
        categoryId,
        categoryName,
        brandId,
        brandName,
        modelId,
        modelName,
        nameEntryId,
        nameEntryName,
        customLabel,
        aliases,
        stockDeductionMode,
        status,
    };
}

function buildCustomerListByTickets(tickets: Ticket[]): CompanyCustomer[] {
    const map = new Map<string, CompanyCustomer>();

    for (const ticket of tickets) {
        const key = (ticket.customer.email || ticket.customer.phone || ticket.customer.name || ticket.id).toLowerCase();
        if (!key) continue;
        const current = map.get(key);
        const draft: CompanyCustomer = {
            id: ticket.customerId || key,
            name: ticket.customer.name,
            phone: ticket.customer.phone,
            email: ticket.customer.email,
            address: ticket.customer.address,
            createdAt: current?.createdAt ?? ticket.createdAt,
            updatedAt: Math.max(current?.updatedAt ?? 0, ticket.updatedAt),
        };
        map.set(key, normalizeCustomer(draft));
    }

    return [...map.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function buildRevenueStatsFromSales(sales: Sale[]): CompanyDashboardStats {
    const tsNow = now();
    const dayStart = getDayStart(tsNow);
    const monthStart = getMonthStart(tsNow);

    const todaySales = sales.filter((sale) => sale.checkoutAt >= dayStart);
    const monthSales = sales.filter((sale) => sale.checkoutAt >= monthStart);

    const records = sales.map((sale) => ({ ts: sale.checkoutAt, amount: sale.amount }));

    return {
        todayRevenue: todaySales.reduce((sum, sale) => sum + toMoney(sale.amount), 0),
        monthRevenue: monthSales.reduce((sum, sale) => sum + toMoney(sale.amount), 0),
        todaySubscriptionCount: todaySales.length,
        monthSubscriptionCount: monthSales.length,
        pointsByDay: buildPointsByDay(records, 14),
        pointsByMonth: buildPointsByMonth(records, 12),
    };
}

export function buildRevenueStatsFromSubscriptions(records: BossAdminCompanyRecord[]): CompanyDashboardStats {
    const tsNow = now();
    const dayStart = getDayStart(tsNow);
    const monthStart = getMonthStart(tsNow);

    const data = records
        .filter((record) => record.subscriptionStartAt > 0)
        .map((record) => ({ ts: record.subscriptionStartAt, amount: record.subscriptionAmount }));

    const today = data.filter((record) => record.ts >= dayStart);
    const month = data.filter((record) => record.ts >= monthStart);

    return {
        todayRevenue: today.reduce((sum, item) => sum + toMoney(item.amount), 0),
        monthRevenue: month.reduce((sum, item) => sum + toMoney(item.amount), 0),
        todaySubscriptionCount: today.length,
        monthSubscriptionCount: month.length,
        pointsByDay: buildPointsByDay(data, 14),
        pointsByMonth: buildPointsByMonth(data, 12),
    };
}

export async function listActivities(keyword = ""): Promise<Activity[]> {
    const scope = await resolveSessionScope(true);
    if (!scope) return [];

    let list: Activity[] = [];

    try {
        const firebaseList = await listActivitiesFromFirebase(scope.companyId);
        if (firebaseList) {
            list = firebaseList;
            replaceMemoryList(memory.activitiesByCompany, scope.companyId, firebaseList);
        } else {
            list = listFromMemory(memory.activitiesByCompany, scope.companyId);
        }
    } catch {
        list = listFromMemory(memory.activitiesByCompany, scope.companyId);
    }

    const normalized = list
        .map((item) => normalizeActivity(item))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_LIST_SIZE);

    return queryByKeyword(normalized, keyword, (item) => [item.name, item.message, item.items.map((card) => card.itemName).join(" ")]);
}

export async function listProducts(keyword = ""): Promise<Product[]> {
    const scope = await resolveSessionScope(true);
    if (!scope) return [];

    let list: Product[] = [];

    try {
        const firebaseList = await listProductsFromFirebase(scope.companyId);
        if (firebaseList) {
            list = firebaseList;
            replaceMemoryList(memory.productsByCompany, scope.companyId, firebaseList);
        } else {
            list = listFromMemory(memory.productsByCompany, scope.companyId);
        }
    } catch {
        list = listFromMemory(memory.productsByCompany, scope.companyId);
    }

    const normalized = list
        .map((item) => normalizeProduct(item))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_LIST_SIZE);

    return queryByKeyword(normalized, keyword, (item) => buildProductSearchKeywords(item));
}

export async function listInventoryStockLogs(keyword = ""): Promise<InventoryStockLog[]> {
    const scope = await resolveSessionScope(true);
    if (!scope) return [];

    let list: InventoryStockLog[] = [];
    try {
        const firebaseList = await listStockLogsFromFirebase(scope.companyId);
        if (firebaseList) {
            list = firebaseList;
            replaceMemoryList(memory.stockLogsByCompany, scope.companyId, firebaseList);
        } else {
            list = listFromMemory(memory.stockLogsByCompany, scope.companyId);
        }
    } catch {
        list = listFromMemory(memory.stockLogsByCompany, scope.companyId);
    }

    const normalized = list
        .map((item) => normalizeInventoryStockLog(item))
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, MAX_LIST_SIZE);

    return queryByKeyword(normalized, keyword, (item) => [
        item.productName,
        item.productId,
        item.action,
        item.operatorName,
        item.operatorEmail,
        String(item.qty),
        String(item.beforeStock),
        String(item.afterStock),
    ]);
}

export async function listRepairBrands(keyword = ""): Promise<RepairBrand[]> {
    const scope = await resolveSessionScope(true);
    if (!scope) return [];

    let list: RepairBrand[] = [];

    try {
        const firebaseList = await listBrandsFromFirebase(scope.companyId);
        if (firebaseList) {
            list = firebaseList;
            replaceMemoryList(memory.brandsByCompany, scope.companyId, firebaseList);
        } else {
            list = listFromMemory(memory.brandsByCompany, scope.companyId);
        }
    } catch {
        list = listFromMemory(memory.brandsByCompany, scope.companyId);
    }

    const normalized = list
        .map((item) => normalizeBrand(item))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_LIST_SIZE);

    return queryByKeyword(normalized, keyword, (item) => [item.name, item.models.join(" ")]);
}

export async function listCompanyCustomers(keyword = ""): Promise<CompanyCustomer[]> {
    const scope = await resolveSessionScope(true);
    if (!scope) return [];

    try {
        const firebaseCustomers = await listCustomersFromFirebase(scope.companyId);
        if (firebaseCustomers && firebaseCustomers.length > 0) {
            replaceMemoryList(memory.customersByCompany, scope.companyId, firebaseCustomers);
        }
        if (firebaseCustomers && firebaseCustomers.length > 0) {
            const normalized = firebaseCustomers
                .map((item) => normalizeCustomer(item))
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .slice(0, MAX_LIST_SIZE);
            return queryByKeyword(normalized, keyword, (item) => [item.name, item.phone, item.email]);
        }
    } catch {
        // fallback to ticket-derived customers
    }

    const memoryCustomers = listFromMemory(memory.customersByCompany, scope.companyId)
        .map((item) => normalizeCustomer(item))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_LIST_SIZE);
    if (memoryCustomers.length > 0) {
        return queryByKeyword(memoryCustomers, keyword, (item) => [item.name, item.phone, item.email]);
    }

    const tickets = await listTickets();
    const derived = buildCustomerListByTickets(tickets);
    return queryByKeyword(derived, keyword, (item) => [item.name, item.phone, item.email]);
}

export async function listActivityPurchases(): Promise<
    Array<{
        id: string;
        activityName: string;
        activityContent: string;
        checkoutStatus: "stored" | "settled";
        itemName: string;
        totalQty: number;
        remainingQty: number;
        salesAmount: number;
        purchasedAt: number;
        customerName: string;
        customerPhone: string;
        customerEmail: string;
        status: "ongoing" | "ended";
    }>
> {
    const checkoutSales = await queryCheckoutSales();

    return checkoutSales
        .slice(0, MAX_LIST_SIZE)
        .flatMap((sale, index) => {
            const boundActivities = sale.activityRefs && sale.activityRefs.length > 0
                ? sale.activityRefs
                : [{ activityId: "", activityName: "一般銷售", activityContent: "", checkoutStatus: "settled", storeQty: 0, effectType: "discount" as const }];
            const rows = boundActivities.flatMap((activity, activityIndex) =>
                (sale.lineItems ?? []).map((item, itemIndex) => {
                    const effectType = parsePromotionEffectType(
                        activity.effectType ?? (activity.checkoutStatus === "stored" ? "create_entitlement" : "discount"),
                    );
                    const checkoutStatus: "stored" | "settled" = effectType === "create_entitlement" ? "stored" : "settled";
                    const remainingQty = effectType === "create_entitlement" ? Math.max(1, toNumber(activity.storeQty, 0)) : 0;
                    const status: "ongoing" | "ended" = remainingQty > 0 ? "ongoing" : "ended";
                    return {
                        id: `purchase_${sale.id}_${index}_${activityIndex}_${itemIndex}`,
                        activityName: activity.activityName || "一般銷售",
                        activityContent: safeText(activity.activityContent, MAX_LONG_TEXT),
                        checkoutStatus,
                        itemName: item.productName || sale.item,
                        totalQty: Math.max(1, item.qty),
                        remainingQty,
                        salesAmount: toMoney(item.subtotal || item.unitPrice * item.qty),
                        purchasedAt: sale.checkoutAt,
                        customerName: sale.customerName || "-",
                        customerPhone: sale.customerPhone || "-",
                        customerEmail: sale.customerEmail || "-",
                        status,
                    };
                }),
            );

            if (rows.length > 0) return rows;
            const fallback = sale.activityRefs?.[0];
            const fallbackEffectType = parsePromotionEffectType(
                fallback?.effectType ?? (fallback?.checkoutStatus === "stored" ? "create_entitlement" : "discount"),
            );
            const checkoutStatus: "stored" | "settled" = fallbackEffectType === "create_entitlement" ? "stored" : "settled";
            const remainingQty = fallbackEffectType === "create_entitlement" ? Math.max(1, toNumber(fallback?.storeQty, 0)) : 0;
            const status: "ongoing" | "ended" = remainingQty > 0 ? "ongoing" : "ended";
            const fallbackActivity = fallback?.activityName || "一般銷售";
            return [
                {
                    id: `purchase_${sale.id}_${index}_fallback`,
                    activityName: fallbackActivity,
                    activityContent: safeText(fallback?.activityContent, MAX_LONG_TEXT),
                    checkoutStatus,
                    itemName: sale.item,
                    totalQty: 1,
                    remainingQty,
                    salesAmount: toMoney(sale.amount),
                    purchasedAt: sale.checkoutAt,
                    customerName: sale.customerName || "-",
                    customerPhone: sale.customerPhone || "-",
                    customerEmail: sale.customerEmail || "-",
                    status,
                },
            ];
        });
}

export async function createCompanyCustomer(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "customers");
    if (!scope) dashboardRedirect(tab, "invalid");

    const name = safeText(formData.get("customerName"));
    const phone = safeText(formData.get("customerPhone"), 40);
    const email = safeText(formData.get("customerEmail"), 160).toLowerCase();
    const address = safeText(formData.get("customerAddress"), 260);

    if (!name || !phone || !PHONE_RE.test(phone) || (email && !EMAIL_RE.test(email))) {
        dashboardRedirect(tab, "invalid");
    }

    const ts = now();
    const existing = (await listCompanyCustomers()).find((item) => {
        const sameEmail = email && item.email.toLowerCase() === email;
        const samePhoneAndName = item.phone === phone && item.name === name;
        return sameEmail || samePhoneAndName;
    });
    const reusableId = existing?.id && !/[/?#]/.test(existing.id) ? existing.id : "";

    const customer = normalizeCustomer({
        id: reusableId || id("cus"),
        name,
        phone,
        email: email || existing?.email || "",
        address: address || existing?.address || "",
        createdAt: existing?.createdAt ?? ts,
        updatedAt: ts,
    });

    try {
        const saved = await setCustomerToFirebase(scope.companyId, customer);
        if (!saved) upsertMemory(memory.customersByCompany, scope.companyId, customer);
    } catch {
        upsertMemory(memory.customersByCompany, scope.companyId, customer);
    }

    revalidatePath("/dashboard");
    dashboardRedirect(tab, "customer_created");
}

export async function updateCompanyCustomer(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "customers");
    if (!scope) dashboardRedirect(tab, "invalid");

    const customerId = safeText(formData.get("customerId"), 120);
    const name = safeText(formData.get("customerName"));
    const phone = safeText(formData.get("customerPhone"), 40);
    const email = safeText(formData.get("customerEmail"), 160).toLowerCase();
    const address = safeText(formData.get("customerAddress"), 260);

    if (!customerId || !name || !phone || !PHONE_RE.test(phone) || (email && !EMAIL_RE.test(email))) {
        dashboardRedirect(tab, "invalid");
    }

    const current = (await listCompanyCustomers()).find((item) => item.id === customerId);
    if (!current) dashboardRedirect(tab, "invalid");

    const next = normalizeCustomer({
        ...current,
        id: customerId,
        name,
        phone,
        email,
        address,
        updatedAt: now(),
    });

    const hasSafeId = !/[/?#]/.test(customerId);
    try {
        const saved = hasSafeId ? await setCustomerToFirebase(scope.companyId, next) : false;
        if (!saved) upsertMemory(memory.customersByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.customersByCompany, scope.companyId, next);
    }

    revalidatePath("/dashboard");
    dashboardRedirect(tab, "customer_updated");
}

export async function createActivity(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "activities");
    if (!scope) dashboardRedirect(tab, "invalid");

    const name = safeText(formData.get("activityName"));
    const startAt = toActivityBoundaryTimestamp(formData.get("activityStartAt"), "start", 0);
    const endAt = toActivityBoundaryTimestamp(formData.get("activityEndAt"), "end", 0);
    const message = safeText(formData.get("activityMessage"), MAX_LONG_TEXT);
    const defaultStoreQty = Math.max(0, Math.round(toNumber(formData.get("activityDefaultStoreQty"), 0)));
    const items = parseActivityItems(formData);
    const effect = parseActivityEffectFields(formData);

    if (!name || startAt <= 0 || endAt <= 0 || endAt < startAt || items.length === 0 || !isActivityEffectValid(effect)) {
        dashboardRedirect(tab, "invalid");
    }

    const ts = now();
    const draft = normalizeActivity({
        id: id("act"),
        name,
        startAt,
        endAt,
        message,
        defaultStoreQty,
        effectType: effect.effectType,
        discountAmount: effect.discountAmount,
        bundlePriceDiscount: effect.bundlePriceDiscount,
        giftProductId: effect.giftProductId,
        giftProductName: effect.giftProductName,
        giftQty: effect.giftQty,
        entitlementType: effect.entitlementType,
        scopeType: effect.scopeType,
        categoryId: effect.categoryId,
        categoryName: effect.categoryName,
        productId: effect.productId,
        productName: effect.productName,
        entitlementQty: effect.entitlementQty,
        entitlementExpiresAt: effect.entitlementExpiresAt,
        reservationQty: effect.reservationQty,
        reservationExpiresAt: effect.reservationExpiresAt,
        items,
        status: computeActivityStatus(startAt, endAt),
        createdAt: ts,
        updatedAt: ts,
    });

    try {
        const saved = await setActivityToFirebase(scope.companyId, draft);
        if (!saved) upsertMemory(memory.activitiesByCompany, scope.companyId, draft);
    } catch {
        upsertMemory(memory.activitiesByCompany, scope.companyId, draft);
    }

    revalidatePath("/dashboard");
    dashboardRedirect(tab, "activity_created");
}

export async function updateActivity(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "activities");
    if (!scope) dashboardRedirect(tab, "invalid");

    const activityId = safeText(formData.get("activityId"), 120);
    const name = safeText(formData.get("activityName"));
    const startAt = toActivityBoundaryTimestamp(formData.get("activityStartAt"), "start", 0);
    const endAt = toActivityBoundaryTimestamp(formData.get("activityEndAt"), "end", 0);
    const message = safeText(formData.get("activityMessage"), MAX_LONG_TEXT);
    const defaultStoreQty = Math.max(0, Math.round(toNumber(formData.get("activityDefaultStoreQty"), 0)));
    const items = parseActivityItems(formData);
    const effect = parseActivityEffectFields(formData);

    if (!activityId || !name || startAt <= 0 || endAt <= 0 || endAt < startAt || items.length === 0 || !isActivityEffectValid(effect)) {
        dashboardRedirect(tab, "invalid");
    }

    const currentList = await listActivities();
    const current = currentList.find((item) => item.id === activityId);
    if (!current) dashboardRedirect(tab, "invalid");

    const next = normalizeActivity({
        ...current,
        id: activityId,
        name,
        startAt,
        endAt,
        message,
        defaultStoreQty,
        effectType: effect.effectType,
        discountAmount: effect.discountAmount,
        bundlePriceDiscount: effect.bundlePriceDiscount,
        giftProductId: effect.giftProductId,
        giftProductName: effect.giftProductName,
        giftQty: effect.giftQty,
        entitlementType: effect.entitlementType,
        scopeType: effect.scopeType,
        categoryId: effect.categoryId,
        categoryName: effect.categoryName,
        productId: effect.productId,
        productName: effect.productName,
        entitlementQty: effect.entitlementQty,
        entitlementExpiresAt: effect.entitlementExpiresAt,
        reservationQty: effect.reservationQty,
        reservationExpiresAt: effect.reservationExpiresAt,
        items,
        status: current?.status === "cancelled" ? "cancelled" : computeActivityStatus(startAt, endAt),
        updatedAt: now(),
    });

    try {
        const saved = await setActivityToFirebase(scope.companyId, next);
        if (!saved) upsertMemory(memory.activitiesByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.activitiesByCompany, scope.companyId, next);
    }

    revalidatePath("/dashboard");
    dashboardRedirect(tab, "activity_updated");
}

export async function cancelActivity(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "activities");
    if (!scope) dashboardRedirect(tab, "invalid");

    const activityId = safeText(formData.get("activityId"), 120);
    if (!activityId) dashboardRedirect(tab, "invalid");

    const list = await listActivities();
    const current = list.find((item) => item.id === activityId);
    if (!current) dashboardRedirect(tab, "invalid");

    const next = normalizeActivity({
        ...current,
        status: "cancelled",
        updatedAt: now(),
    });

    try {
        const saved = await setActivityToFirebase(scope.companyId, next);
        if (!saved) upsertMemory(memory.activitiesByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.activitiesByCompany, scope.companyId, next);
    }

    revalidatePath("/dashboard");
    dashboardRedirect(tab, "activity_cancelled");
}

export async function deleteActivity(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "activities");
    if (!scope) dashboardRedirect(tab, "invalid");

    const activityId = safeText(formData.get("activityId"), 120);
    if (!activityId) dashboardRedirect(tab, "invalid");

    try {
        const deleted = await deleteActivityInFirebase(scope.companyId, activityId);
        if (deleted === null) removeFromMemory(memory.activitiesByCompany, scope.companyId, activityId);
    } catch {
        removeFromMemory(memory.activitiesByCompany, scope.companyId, activityId);
    }

    revalidatePath("/dashboard");
    dashboardRedirect(tab, "activity_deleted");
}

export async function createProduct(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "inventory");
    const inventoryView = getRedirectInventoryView(formData, "settings");
    const redirectPath = getProductRedirectPath(formData);
    if (!scope) dashboardRedirect(tab, "invalid", { inventoryView, redirectPath });

    const productDraft = readProductFormFields(formData);
    const price = toMoney(formData.get("price"));
    const cost = toMoney(formData.get("cost"));
    const supplier = safeText(formData.get("supplier"));
    const sku = safeText(formData.get("sku"), 120);
    const stock = Math.max(0, Math.round(toNumber(formData.get("stock"), 0)));

    if (!productDraft.name) dashboardRedirect(tab, "invalid", { inventoryView, redirectPath });

    const ts = now();
    const product = normalizeProduct({
        id: id("prd"),
        name: productDraft.name,
        namingMode: productDraft.namingMode,
        categoryId: productDraft.categoryId,
        categoryName: productDraft.categoryName,
        brandId: productDraft.brandId,
        brandName: productDraft.brandName,
        modelId: productDraft.modelId,
        modelName: productDraft.modelName,
        nameEntryId: productDraft.nameEntryId,
        nameEntryName: productDraft.nameEntryName,
        customLabel: productDraft.customLabel,
        aliases: productDraft.aliases,
        stockDeductionMode: productDraft.stockDeductionMode,
        status: productDraft.status,
        lowStockThreshold: Math.max(0, Math.round(toNumber(formData.get("lowStockThreshold"), 0))),
        price,
        cost,
        supplier,
        sku,
        stock,
        createdAt: ts,
        updatedAt: ts,
    });

    try {
        const saved = await setProductToFirebase(scope.companyId, product);
        if (!saved) upsertMemory(memory.productsByCompany, scope.companyId, product);
    } catch {
        upsertMemory(memory.productsByCompany, scope.companyId, product);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    dashboardRedirect(tab, "product_created", { inventoryView, redirectPath });
}

export async function updateProduct(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "inventory");
    const inventoryView = getRedirectInventoryView(formData, "settings");
    const redirectPath = getProductRedirectPath(formData);
    if (!scope) dashboardRedirect(tab, "invalid", { inventoryView, redirectPath });

    const productId = safeText(formData.get("productId"), 120);
    const productDraft = readProductFormFields(formData);
    if (!productId || !productDraft.name) dashboardRedirect(tab, "invalid", { inventoryView, redirectPath });

    const current = (await listProducts()).find((product) => product.id === productId);
    if (!current) dashboardRedirect(tab, "invalid", { inventoryView, redirectPath });

    const next = normalizeProduct({
        ...current,
        id: productId,
        name: productDraft.name,
        namingMode: productDraft.namingMode,
        categoryId: productDraft.categoryId,
        categoryName: productDraft.categoryName,
        brandId: productDraft.brandId,
        brandName: productDraft.brandName,
        modelId: productDraft.modelId,
        modelName: productDraft.modelName,
        nameEntryId: productDraft.nameEntryId,
        nameEntryName: productDraft.nameEntryName,
        customLabel: productDraft.customLabel,
        aliases: productDraft.aliases,
        stockDeductionMode: productDraft.stockDeductionMode,
        status: productDraft.status,
        lowStockThreshold: Math.max(0, Math.round(toNumber(formData.get("lowStockThreshold"), current.lowStockThreshold ?? 0))),
        price: toMoney(formData.get("price")),
        cost: toMoney(formData.get("cost")),
        supplier: safeText(formData.get("supplier")),
        sku: safeText(formData.get("sku"), 120),
        stock: Math.max(0, Math.round(toNumber(formData.get("stock"), 0))),
        updatedAt: now(),
    });

    try {
        const saved = await setProductToFirebase(scope.companyId, next);
        if (!saved) upsertMemory(memory.productsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.productsByCompany, scope.companyId, next);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    dashboardRedirect(tab, "product_updated", { inventoryView, redirectPath });
}

export async function deleteProduct(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "inventory");
    const inventoryView = getRedirectInventoryView(formData, "settings");
    const redirectPath = getProductRedirectPath(formData);
    if (!scope) dashboardRedirect(tab, "invalid", { inventoryView, redirectPath });

    const productId = safeText(formData.get("productId"), 120);
    if (!productId) dashboardRedirect(tab, "invalid", { inventoryView, redirectPath });

    try {
        const deleted = await deleteProductInFirebase(scope.companyId, productId);
        if (deleted === null) removeFromMemory(memory.productsByCompany, scope.companyId, productId);
    } catch {
        removeFromMemory(memory.productsByCompany, scope.companyId, productId);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    dashboardRedirect(tab, "product_deleted", { inventoryView, redirectPath });
}

export async function createStockIn(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "inventory");
    const inventoryView = getRedirectInventoryView(formData, "stock-in");
    if (!scope) dashboardRedirect(tab, "invalid", { inventoryView });

    const productId = safeText(formData.get("productId"), 120);
    const qty = Math.max(0, Math.round(toNumber(formData.get("qty"), 0)));
    if (!productId || qty <= 0) dashboardRedirect(tab, "invalid", { inventoryView });

    const current = (await listProducts()).find((product) => product.id === productId);
    if (!current) dashboardRedirect(tab, "invalid", { inventoryView });
    const beforeStock = Math.max(0, current.onHandQty ?? current.stock);
    const afterStock = beforeStock + qty;
    const reservedQty = Math.max(0, current.reservedQty ?? 0);

    const next = normalizeProduct({
        ...current,
        id: productId,
        stock: afterStock,
        onHandQty: afterStock,
        availableQty: Math.max(afterStock - reservedQty, 0),
        updatedAt: now(),
    });
    const stockLog = normalizeInventoryStockLog({
        id: id("stock_log"),
        productId: current.id,
        productName: current.name,
        action: "stock_in",
        qty,
        beforeStock,
        afterStock,
        operatorName: scope.operatorName,
        operatorEmail: scope.operatorEmail,
        createdAt: now(),
        updatedAt: now(),
    });

    try {
        const saved = await setProductToFirebase(scope.companyId, next);
        if (!saved) upsertMemory(memory.productsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.productsByCompany, scope.companyId, next);
    }
    try {
        const savedLog = await createStockLogInFirebase(scope.companyId, stockLog);
        if (savedLog === null) upsertMemory(memory.stockLogsByCompany, scope.companyId, stockLog);
    } catch {
        upsertMemory(memory.stockLogsByCompany, scope.companyId, stockLog);
    }

    revalidatePath("/dashboard");
    dashboardRedirect(tab, "product_stock_in", { inventoryView });
}

export async function createStockOut(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "inventory");
    const inventoryView = getRedirectInventoryView(formData, "stock-out");
    if (!scope) dashboardRedirect(tab, "invalid", { inventoryView });

    const productId = safeText(formData.get("productId"), 120);
    const qty = Math.max(0, Math.round(toNumber(formData.get("qty"), 0)));
    if (!productId || qty <= 0) dashboardRedirect(tab, "invalid", { inventoryView });

    const current = (await listProducts()).find((product) => product.id === productId);
    const currentOnHand = Math.max(0, current?.onHandQty ?? current?.stock ?? 0);
    const currentReserved = Math.max(0, current?.reservedQty ?? 0);
    const currentAvailable = Math.max(0, current?.availableQty ?? currentOnHand - currentReserved);
    if (!current || qty > currentAvailable) dashboardRedirect(tab, "invalid", { inventoryView });
    const beforeStock = currentOnHand;
    const afterStock = Math.max(0, beforeStock - qty);

    const next = normalizeProduct({
        ...current,
        id: productId,
        stock: afterStock,
        onHandQty: afterStock,
        availableQty: Math.max(afterStock - currentReserved, 0),
        updatedAt: now(),
    });
    const stockLog = normalizeInventoryStockLog({
        id: id("stock_log"),
        productId: current.id,
        productName: current.name,
        action: "stock_out",
        qty,
        beforeStock,
        afterStock,
        operatorName: scope.operatorName,
        operatorEmail: scope.operatorEmail,
        createdAt: now(),
        updatedAt: now(),
    });

    try {
        const saved = await setProductToFirebase(scope.companyId, next);
        if (!saved) upsertMemory(memory.productsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.productsByCompany, scope.companyId, next);
    }
    try {
        const savedLog = await createStockLogInFirebase(scope.companyId, stockLog);
        if (savedLog === null) upsertMemory(memory.stockLogsByCompany, scope.companyId, stockLog);
    } catch {
        upsertMemory(memory.stockLogsByCompany, scope.companyId, stockLog);
    }

    revalidatePath("/dashboard");
    dashboardRedirect(tab, "product_stock_out", { inventoryView });
}

export async function createRepairBrand(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const name = safeText(formData.get("brandName"));
    if (!name) dashboardRedirect(tab, "invalid");

    const ts = now();
    const brand = normalizeBrand({
        id: id("brand"),
        name,
        models: [],
        createdAt: ts,
        updatedAt: ts,
    });

    try {
        const saved = await setBrandToFirebase(scope.companyId, brand);
        if (!saved) upsertMemory(memory.brandsByCompany, scope.companyId, brand);
    } catch {
        upsertMemory(memory.brandsByCompany, scope.companyId, brand);
    }

    revalidatePath("/dashboard");
    dashboardRedirect(tab, "brand_created");
}

export async function updateRepairBrand(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const brandId = safeText(formData.get("brandId"), 120);
    const name = safeText(formData.get("brandName"));
    if (!brandId || !name) dashboardRedirect(tab, "invalid");

    const current = (await listRepairBrands()).find((brand) => brand.id === brandId);
    if (!current) dashboardRedirect(tab, "invalid");

    const next = normalizeBrand({
        ...current,
        id: brandId,
        name,
        updatedAt: now(),
    });

    try {
        const saved = await setBrandToFirebase(scope.companyId, next);
        if (!saved) upsertMemory(memory.brandsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.brandsByCompany, scope.companyId, next);
    }

    revalidatePath("/dashboard");
    dashboardRedirect(tab, "brand_updated");
}

export async function deleteRepairBrand(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const brandId = safeText(formData.get("brandId"), 120);
    if (!brandId) dashboardRedirect(tab, "invalid");

    try {
        const deleted = await deleteBrandInFirebase(scope.companyId, brandId);
        if (deleted === null) removeFromMemory(memory.brandsByCompany, scope.companyId, brandId);
    } catch {
        removeFromMemory(memory.brandsByCompany, scope.companyId, brandId);
    }

    revalidatePath("/dashboard");
    dashboardRedirect(tab, "brand_deleted");
}

export async function createRepairModel(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const brandId = safeText(formData.get("brandId"), 120);
    const modelName = safeText(formData.get("modelName"), 80);
    if (!brandId || !modelName) dashboardRedirect(tab, "invalid");

    const current = (await listRepairBrands()).find((brand) => brand.id === brandId);
    if (!current) dashboardRedirect(tab, "invalid");

    const exists = current.models.some((item) => item.toLowerCase() === modelName.toLowerCase());
    const next = normalizeBrand({
        ...current,
        models: exists ? current.models : [...current.models, modelName],
        updatedAt: now(),
    });

    try {
        const saved = await setBrandToFirebase(scope.companyId, next);
        if (!saved) upsertMemory(memory.brandsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.brandsByCompany, scope.companyId, next);
    }

    revalidatePath("/dashboard");
    dashboardRedirect(tab, "model_created");
}

export async function updateRepairModel(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const brandId = safeText(formData.get("brandId"), 120);
    const oldModel = safeText(formData.get("oldModel"), 80);
    const modelName = safeText(formData.get("modelName"), 80);
    if (!brandId || !oldModel || !modelName) dashboardRedirect(tab, "invalid");

    const current = (await listRepairBrands()).find((brand) => brand.id === brandId);
    if (!current) dashboardRedirect(tab, "invalid");

    const nextModels = current.models.map((item) => (item === oldModel ? modelName : item));
    const next = normalizeBrand({
        ...current,
        models: nextModels,
        updatedAt: now(),
    });

    try {
        const saved = await setBrandToFirebase(scope.companyId, next);
        if (!saved) upsertMemory(memory.brandsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.brandsByCompany, scope.companyId, next);
    }

    revalidatePath("/dashboard");
    dashboardRedirect(tab, "model_updated");
}

export async function deleteRepairModel(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const brandId = safeText(formData.get("brandId"), 120);
    const modelName = safeText(formData.get("modelName"), 80);
    if (!brandId || !modelName) dashboardRedirect(tab, "invalid");

    const current = (await listRepairBrands()).find((brand) => brand.id === brandId);
    if (!current) dashboardRedirect(tab, "invalid");

    const next = normalizeBrand({
        ...current,
        models: current.models.filter((item) => item !== modelName),
        updatedAt: now(),
    });

    try {
        const saved = await setBrandToFirebase(scope.companyId, next);
        if (!saved) upsertMemory(memory.brandsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.brandsByCompany, scope.companyId, next);
    }

    revalidatePath("/dashboard");
    dashboardRedirect(tab, "model_deleted");
}

export async function getDashboardBundle(params?: {
    customerKeyword?: string;
    caseKeyword?: string;
    caseStatus?: string;
    caseOrder?: "latest" | "earliest";
    activityKeyword?: string;
    productKeyword?: string;
    brandKeyword?: string;
}) {
    const scope = await resolveSessionScope(true);
    if (!scope) {
        return {
            companyId: null,
            sales: [] as Sale[],
            tickets: [] as Ticket[],
            customers: [] as CompanyCustomer[],
            activities: [] as Activity[],
            products: [] as Product[],
            brands: [] as RepairBrand[],
            purchases: [] as Awaited<ReturnType<typeof listActivityPurchases>>,
            stockLogs: [] as InventoryStockLog[],
            stats: buildRevenueStatsFromSales([]),
        };
    }

    const [sales, tickets, customers, activities, products, brands, purchases, stockLogs] = await Promise.all([
        listSales(),
        listTickets(),
        listCompanyCustomers(params?.customerKeyword ?? ""),
        listActivities(params?.activityKeyword ?? ""),
        listProducts(params?.productKeyword ?? ""),
        listRepairBrands(params?.brandKeyword ?? ""),
        listActivityPurchases(),
        listInventoryStockLogs(params?.productKeyword ?? ""),
    ]);

    const caseStatus = safeText(params?.caseStatus);
    const caseOrder = params?.caseOrder === "earliest" ? "earliest" : "latest";
    const caseKeyword = safeText(params?.caseKeyword);

    const filteredTickets = queryByKeyword(tickets, caseKeyword, (ticket) => [
        ticket.customer.name,
        ticket.customer.phone,
        ticket.device.name,
        ticket.device.model,
        ticket.id,
    ])
        .filter((ticket) => {
            if (!caseStatus || caseStatus === "all") return true;
            return ticket.status === caseStatus;
        })
        .sort((a, b) => (caseOrder === "latest" ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt));

    return {
        companyId: scope.companyId,
        sales,
        tickets: filteredTickets,
        customers,
        activities,
        products,
        brands,
        purchases,
        stockLogs,
        stats: buildRevenueStatsFromSales(sales),
    };
}

export async function listBossAdminCompanies(): Promise<BossAdminCompanyRecord[]> {
    const db = await getFirestoreDb();
    if (!db) return [];

    const snap = await db.collection("companies").limit(600).get();
    return snap.docs
        .map((doc) => normalizeBossCompany(doc.id, (doc.data() ?? {}) as CompanyDocLike))
        .sort((a, b) => b.subscriptionStartAt - a.subscriptionStartAt);
}

export async function listPublicProductsByTenant(tenantId: string): Promise<Product[]> {
    const normalizedTenantId = normalizeCompanyId(tenantId);
    if (!normalizedTenantId) return [];

    try {
        const db = await getFirestoreDb();
        if (!db) return listFromMemory(memory.productsByCompany, normalizedTenantId).map((item) => normalizeProduct(item));
        const snap = await companyProductRef(db, normalizedTenantId).orderBy("updatedAt", "desc").limit(MAX_LIST_SIZE).get();
        return snap.docs.map((doc) => normalizeProduct({ id: doc.id, ...(doc.data() as Partial<Product>) }));
    } catch {
        return listFromMemory(memory.productsByCompany, normalizedTenantId).map((item) => normalizeProduct(item));
    }
}
