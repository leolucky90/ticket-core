import "server-only";
// Compatibility-heavy merchant CRUD/read-model service.
// New read-side callers should prefer focused modules under `@/lib/services/merchant/*`
// or `@/lib/services/platform/*`, while Phase 1 continues shrinking this surface area.
import { FieldPath } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { normalizeCompanyId } from "@/lib/tenant-scope";
import { createDeleteLog } from "@/lib/services/delete-log.service";
import { syncUsedProductTypeSettings } from "@/lib/services/used-product-type-settings.service";
import { getUserCompanyId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import {
    createCatalogBrand,
    createCatalogCategory,
    createCatalogModel,
    createCatalogSupplier,
    listCatalogBrands,
    listCatalogCategories,
    listCatalogModels,
    listCatalogSuppliers,
    updateCatalogBrand,
    updateCatalogCategory,
    updateCatalogModel,
    updateCatalogSupplier,
} from "@/lib/services/merchant/catalog-service";
import type { CursorPageResult } from "@/lib/types/pagination";
import type { CompanyCustomer, CompanyCustomerListRow, CustomerCaseState } from "@/lib/types/customer";
import type { InventoryStockLog } from "@/lib/types/inventory";
import type { Product } from "@/lib/types/merchant-product";
import type { Activity, ActivityItem, ActivityStatus } from "@/lib/types/promotion";
import type { RepairBrand, RepairBrandModelGroup } from "@/lib/types/repair-brand";
import type { BossAdminCompanyRecord, CompanyDashboardStats, RevenuePoint } from "@/lib/types/reporting";
import { buildProductNameSuggestion, buildProductNormalizedName, buildProductSearchKeywords, normalizeAliasList, parseProductNamingMode } from "@/lib/services/productNaming";
import type { Sale } from "@/lib/types/sale";
import type { Ticket } from "@/lib/types/ticket";
import { listSales, queryCheckoutSales } from "@/lib/services/sales";
import { listTickets } from "@/lib/services/ticket";
import { normalizeSecuritySettings, securitySettingsDocPath, type SecuritySettings } from "@/lib/schema";

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

function normalizeTextArray(values: unknown[], maxItems = 40, maxText = 80): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const value of values) {
        const text = safeText(value, maxText);
        if (!text) continue;
        const key = text.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(text);
        if (out.length >= maxItems) break;
    }
    return out;
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
    const modelsByType = normalizeBrandModelGroups(input.modelsByType);
    const linkedCategoryNames = normalizeTextArray(Array.isArray(input.linkedCategoryNames) ? input.linkedCategoryNames : [], 80, 120);
    const productTypes = normalizeTextArray(
        [...(Array.isArray(input.productTypes) ? input.productTypes : []), ...modelsByType.map((group) => group.typeName)],
        40,
        120,
    );
    const models = normalizeTextArray(
        [...(Array.isArray(input.models) ? input.models : []), ...modelsByType.flatMap((group) => group.models)],
        120,
        80,
    );
    const usedProductTypes = normalizeTextArray(Array.isArray(input.usedProductTypes) ? input.usedProductTypes : [], 40, 120);

    return {
        id: safeText(input.id, 120) || id("brand"),
        name: safeText(input.name) || "未命名品牌",
        linkedCategoryNames,
        productTypes,
        modelsByType,
        models,
        usedProductTypes,
        createdAt,
        updatedAt: toTimestamp(input.updatedAt, createdAt),
    };
}

function normalizeBrandModelGroups(input: unknown): RepairBrandModelGroup[] {
    if (!Array.isArray(input)) return [];

    const groups: RepairBrandModelGroup[] = [];
    for (const value of input) {
        if (!value || typeof value !== "object") continue;
        const candidate = value as Partial<RepairBrandModelGroup>;
        const typeName = safeText(candidate.typeName, 120);
        if (!typeName) continue;

        const models = normalizeTextArray(Array.isArray(candidate.models) ? candidate.models : [], 120, 80);
        const matchedIndex = groups.findIndex((group) => group.typeName.toLowerCase() === typeName.toLowerCase());
        if (matchedIndex < 0) {
            groups.push({ typeName, models });
            continue;
        }

        groups[matchedIndex] = {
            typeName: groups[matchedIndex].typeName,
            models: normalizeTextArray([...groups[matchedIndex].models, ...models], 120, 80),
        };
    }

    return groups;
}

function getRepairBrandTypeNames(brand: Pick<RepairBrand, "productTypes" | "modelsByType" | "usedProductTypes">): string[] {
    return normalizeTextArray(
        [...(Array.isArray(brand.productTypes) ? brand.productTypes : []), ...(brand.modelsByType ?? []).map((group) => group.typeName), ...(Array.isArray(brand.usedProductTypes) ? brand.usedProductTypes : [])],
        40,
        120,
    );
}

function removeBrandModelsForType(groups: RepairBrandModelGroup[], typeName: string): RepairBrandModelGroup[] {
    const requestedTypeName = safeText(typeName, 120);
    if (!requestedTypeName) return normalizeBrandModelGroups(groups);
    return normalizeBrandModelGroups(groups).filter((group) => group.typeName.toLowerCase() !== requestedTypeName.toLowerCase());
}

function renameBrandModelsForType(groups: RepairBrandModelGroup[], oldTypeName: string, nextTypeName: string): RepairBrandModelGroup[] {
    const requestedOldTypeName = safeText(oldTypeName, 120);
    const requestedNextTypeName = safeText(nextTypeName, 120);
    if (!requestedOldTypeName || !requestedNextTypeName) return normalizeBrandModelGroups(groups);

    const existingModels = getBrandModelsForType({ models: [], modelsByType: groups, productTypes: [], usedProductTypes: [] }, requestedOldTypeName);
    const remainingGroups = removeBrandModelsForType(groups, requestedOldTypeName);
    const mergedModels = normalizeTextArray(
        [...getBrandModelsForType({ models: [], modelsByType: remainingGroups, productTypes: [], usedProductTypes: [] }, requestedNextTypeName), ...existingModels],
        120,
        80,
    );

    return replaceBrandModelsForType(remainingGroups, requestedNextTypeName, mergedModels);
}

function resolveBrandModelTypeName(brand: Pick<RepairBrand, "productTypes" | "modelsByType" | "usedProductTypes">, value: unknown): string {
    const requestedTypeName = safeText(value, 120);
    const brandTypeNames = getRepairBrandTypeNames(brand);
    const matched = brandTypeNames.find((typeName) => typeName.toLowerCase() === requestedTypeName.toLowerCase());
    if (matched) return matched;
    if (!requestedTypeName && brandTypeNames.length === 1) return brandTypeNames[0];
    return requestedTypeName;
}

function getBrandModelsForType(brand: Pick<RepairBrand, "models" | "modelsByType" | "productTypes" | "usedProductTypes">, typeName: string): string[] {
    const requestedTypeName = safeText(typeName, 120);
    const normalizedGroups = normalizeBrandModelGroups(brand.modelsByType);
    if (!requestedTypeName) return normalizeTextArray(Array.isArray(brand.models) ? brand.models : [], 120, 80);

    const matchedGroup = normalizedGroups.find((group) => group.typeName.toLowerCase() === requestedTypeName.toLowerCase()) ?? null;
    if (matchedGroup) return matchedGroup.models;
    if (normalizedGroups.length === 0) return normalizeTextArray(Array.isArray(brand.models) ? brand.models : [], 120, 80);

    const brandTypeNames = getRepairBrandTypeNames(brand);
    if (brandTypeNames.length <= 1) return normalizeTextArray(Array.isArray(brand.models) ? brand.models : [], 120, 80);
    return [];
}

function replaceBrandModelsForType(groups: RepairBrandModelGroup[], typeName: string, nextModels: string[]): RepairBrandModelGroup[] {
    const requestedTypeName = safeText(typeName, 120);
    if (!requestedTypeName) return normalizeBrandModelGroups(groups);

    const normalizedGroups = normalizeBrandModelGroups(groups);
    const normalizedModels = normalizeTextArray(nextModels, 120, 80);
    let matched = false;

    const nextGroups = normalizedGroups.flatMap((group) => {
        if (group.typeName.toLowerCase() !== requestedTypeName.toLowerCase()) return [group];
        matched = true;
        if (normalizedModels.length === 0) return [];
        return [{ typeName: group.typeName, models: normalizedModels }];
    });

    if (!matched && normalizedModels.length > 0) {
        nextGroups.push({ typeName: requestedTypeName, models: normalizedModels });
    }

    return nextGroups;
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

    const companyId = normalizeCompanyId(getUserCompanyId(user, session.uid));
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

function isSoftDeletedRow(value: unknown): boolean {
    if (!value || typeof value !== "object") return false;
    const row = value as Record<string, unknown>;
    if (row.isDeleted === true) return true;
    return row.deleteStatus === "soft_deleted" || row.deleteStatus === "hard_deleted";
}

async function getDeleteSecuritySettings(companyId: string): Promise<SecuritySettings> {
    const db = await getFirestoreDb();
    if (!db) return normalizeSecuritySettings(null, "system");
    const snap = await db.doc(securitySettingsDocPath(companyId)).get();
    return normalizeSecuritySettings(snap.exists ? (snap.data() as Partial<SecuritySettings>) : null, "system");
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

function companySalesRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/sales`);
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
    return snap.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() as Partial<Activity>) }))
        .filter((row) => !isSoftDeletedRow(row))
        .map((row) => normalizeActivity(row));
}

async function listProductsFromFirebase(companyId: string): Promise<Product[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const snap = await companyProductRef(db, companyId).orderBy("updatedAt", "desc").limit(MAX_LIST_SIZE).get();
    return snap.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() as Partial<Product>) }))
        .filter((row) => !isSoftDeletedRow(row))
        .map((row) => normalizeProduct(row));
}

async function listProductsPageFromFirebase(companyId: string, params: ProductPageQuery): Promise<CursorPageResult<Product> | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const pageSize = normalizePageSize(params.pageSize, 20);
    const batchSize = Math.max(pageSize * 3, 40);
    const decodedCursor = decodeProductCursorValue(params.cursor);
    const buildBaseQuery = () => {
        let query = companyProductRef(db, companyId).orderBy("updatedAt", "desc").orderBy(FieldPath.documentId(), "desc");
        if (params.status) query = query.where("status", "==", params.status);
        if (params.categoryId) query = query.where("categoryId", "==", params.categoryId);
        if (params.brandId) query = query.where("brandId", "==", params.brandId);
        if (params.modelId) query = query.where("modelId", "==", params.modelId);
        if (params.supplier) query = query.where("supplier", "==", params.supplier);
        return query;
    };

    let query = buildBaseQuery();
    if (decodedCursor) query = query.startAfter(decodedCursor.updatedAt, decodedCursor.id);

    const items: Product[] = [];

    for (let round = 0; round < 8; round += 1) {
        const snap = await query.limit(batchSize).get();
        if (snap.empty) break;

        const docs = snap.docs;
        let lastCursorInBatch: ProductCursor | null = null;

        for (let index = 0; index < docs.length; index += 1) {
            const doc = docs[index];
            const product = normalizeProduct({ id: doc.id, ...(doc.data() as Partial<Product>) });
            lastCursorInBatch = { updatedAt: product.updatedAt, id: product.id };
            if (isSoftDeletedRow(product)) continue;
            if (!matchesProductPageQuery(product, params)) continue;
            items.push(product);
            if (items.length >= pageSize) {
                const hasNextPage = index < docs.length - 1 || docs.length === batchSize;
                return {
                    items,
                    pageSize,
                    nextCursor: hasNextPage ? encodeProductCursorValue(lastCursorInBatch) : "",
                    hasNextPage,
                };
            }
        }

        if (!lastCursorInBatch || docs.length < batchSize) break;
        query = buildBaseQuery().startAfter(lastCursorInBatch.updatedAt, lastCursorInBatch.id);
    }

    return {
        items,
        pageSize,
        nextCursor: "",
        hasNextPage: false,
    };
}

async function listBrandsFromFirebase(companyId: string): Promise<RepairBrand[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const snap = await companyBrandRef(db, companyId).orderBy("updatedAt", "desc").limit(MAX_LIST_SIZE).get();
    return snap.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() as Partial<RepairBrand>) }))
        .filter((row) => !isSoftDeletedRow(row))
        .map((row) => normalizeBrand(row));
}

async function listCustomersFromFirebase(companyId: string): Promise<CompanyCustomer[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const snap = await companyCustomerRef(db, companyId).orderBy("updatedAt", "desc").limit(MAX_LIST_SIZE).get();
    return snap.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() as Partial<CompanyCustomer>) }))
        .filter((row) => !isSoftDeletedRow(row))
        .map((row) => normalizeCustomer(row));
}

function listProductsPageFromMemory(companyId: string, params: ProductPageQuery): CursorPageResult<Product> {
    const pageSize = normalizePageSize(params.pageSize, 20);
    const currentCursor = decodeProductCursorValue(params.cursor);
    const ordered = listFromMemory(memory.productsByCompany, companyId)
        .filter((item) => !isSoftDeletedRow(item))
        .map((item) => normalizeProduct(item))
        .sort((a, b) => (b.updatedAt === a.updatedAt ? b.id.localeCompare(a.id) : b.updatedAt - a.updatedAt))
        .filter((product) => matchesProductPageQuery(product, params));
    const startIndex = currentCursor
        ? Math.max(
              0,
              ordered.findIndex((item) => item.updatedAt === currentCursor.updatedAt && item.id === currentCursor.id) + 1,
          )
        : 0;
    const items = ordered.slice(startIndex, startIndex + pageSize);
    const lastItem = items.at(-1);
    const hasNextPage = startIndex + pageSize < ordered.length;
    return {
        items,
        pageSize,
        nextCursor: hasNextPage && lastItem ? encodeProductCursorValue({ updatedAt: lastItem.updatedAt, id: lastItem.id }) : "",
        hasNextPage,
    };
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

function queryByKeyword<T>(list: T[], keyword: string, resolver: (item: T) => string[]): T[] {
    const q = safeText(keyword, 120).toLowerCase();
    if (!q) return list;
    return list.filter((item) => resolver(item).join(" ").toLowerCase().includes(q));
}

function normalizePageSize(input: number | undefined, fallback = 20): number {
    const value = Number(input);
    if (!Number.isFinite(value)) return fallback;
    if (value <= 10) return 10;
    if (value <= 20) return 20;
    if (value <= 50) return 50;
    return 100;
}

function normalizeDashboardPageSize(input: number | undefined, fallback = 10): number {
    const value = Number(input);
    if (!Number.isFinite(value)) return fallback;
    if (value <= 5) return 5;
    if (value <= 10) return 10;
    if (value <= 15) return 15;
    return 20;
}

function encodeProductCursorValue(cursor: ProductCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeProductCursorValue(value: string | undefined): ProductCursor | null {
    const text = safeText(value ?? "", 240);
    if (!text) return null;
    try {
        const parsed = JSON.parse(Buffer.from(text, "base64url").toString("utf8")) as Partial<ProductCursor>;
        const updatedAt = Number(parsed.updatedAt);
        const idValue = safeText(parsed.id, 120);
        if (!Number.isFinite(updatedAt) || updatedAt <= 0 || !idValue) return null;
        return { updatedAt: Math.round(updatedAt), id: idValue };
    } catch {
        return null;
    }
}

function encodeCustomerCursorValue(cursor: CustomerCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeCustomerCursorValue(value: string | undefined): CustomerCursor | null {
    const text = safeText(value ?? "", 240);
    if (!text) return null;
    try {
        const parsed = JSON.parse(Buffer.from(text, "base64url").toString("utf8")) as Partial<CustomerCursor>;
        const idValue = safeText(parsed.id, 120);
        const orderValue = typeof parsed.orderValue === "number" ? Math.round(parsed.orderValue) : safeText(parsed.orderValue, 240);
        if (!idValue) return null;
        if (typeof orderValue !== "number" && !orderValue) return null;
        return { id: idValue, orderValue };
    } catch {
        return null;
    }
}

function encodeActivityCursorValue(cursor: ActivityCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeActivityCursorValue(value: string | undefined): ActivityCursor | null {
    const text = safeText(value ?? "", 240);
    if (!text) return null;
    try {
        const parsed = JSON.parse(Buffer.from(text, "base64url").toString("utf8")) as Partial<ActivityCursor>;
        const idValue = safeText(parsed.id, 120);
        const orderValue = Number(parsed.orderValue);
        if (!idValue || !Number.isFinite(orderValue) || orderValue <= 0) return null;
        return { id: idValue, orderValue: Math.round(orderValue) };
    } catch {
        return null;
    }
}

function getCustomerPageSort(order?: CustomerListOrder): {
    field: "updatedAt" | "createdAt" | "name";
    direction: "asc" | "desc";
    getValue: (customer: CompanyCustomer) => number | string;
} {
    if (order === "updated_earliest") return { field: "updatedAt", direction: "asc", getValue: (customer) => customer.updatedAt };
    if (order === "created_latest") return { field: "createdAt", direction: "desc", getValue: (customer) => customer.createdAt };
    if (order === "created_earliest") return { field: "createdAt", direction: "asc", getValue: (customer) => customer.createdAt };
    if (order === "name_asc") return { field: "name", direction: "asc", getValue: (customer) => customer.name };
    if (order === "name_desc") return { field: "name", direction: "desc", getValue: (customer) => customer.name };
    return { field: "updatedAt", direction: "desc", getValue: (customer) => customer.updatedAt };
}

function getActivityPageSort(order?: ActivityListOrder): {
    field: "updatedAt" | "startAt";
    direction: "asc" | "desc";
    getValue: (activity: Activity) => number;
} {
    if (order === "updated_earliest") return { field: "updatedAt", direction: "asc", getValue: (activity) => activity.updatedAt };
    if (order === "start_latest") return { field: "startAt", direction: "desc", getValue: (activity) => activity.startAt };
    if (order === "start_earliest") return { field: "startAt", direction: "asc", getValue: (activity) => activity.startAt };
    return { field: "updatedAt", direction: "desc", getValue: (activity) => activity.updatedAt };
}

function matchesCustomerKeyword(customer: CompanyCustomer, keyword?: string): boolean {
    const q = safeText(keyword ?? "", 120).toLowerCase();
    if (!q) return true;
    return [customer.name, customer.phone, customer.email, customer.address].join(" ").toLowerCase().includes(q);
}

function matchesCustomerCaseFilter(row: CompanyCustomerListRow, caseState?: CustomerCaseState | "all"): boolean {
    if (!caseState || caseState === "all") return true;
    return row.caseState === caseState;
}

function matchesActivityPageQuery(activity: Activity, params: ActivityPageQuery): boolean {
    if (params.status && params.status !== "all" && activity.status !== params.status) return false;
    const keyword = safeText(params.keyword ?? "", 120).toLowerCase();
    if (!keyword) return true;
    const haystack = [
        activity.name,
        activity.message,
        activity.productName ?? "",
        activity.categoryName ?? "",
        ...activity.items.map((item) => item.itemName),
    ]
        .join(" ")
        .toLowerCase();
    return haystack.includes(keyword);
}

async function buildCustomerListRows(companyId: string, customers: CompanyCustomer[]): Promise<CompanyCustomerListRow[]> {
    if (customers.length === 0) return [];
    const ids = customers.map((customer) => customer.id).filter(Boolean);
    const caseCounts = new Map<string, { open: number; closed: number }>();
    const spendByCustomer = new Map<string, number>();
    const db = await getFirestoreDb();

    if (db) {
        for (let index = 0; index < ids.length; index += 10) {
            const batchIds = ids.slice(index, index + 10);
            const [caseSnap, salesSnap] = await Promise.all([
                db.collection(`companies/${companyId}/cases`).where("customerId", "in", batchIds).get(),
                companySalesRef(db, companyId).where("customerId", "in", batchIds).get(),
            ]);

            for (const doc of caseSnap.docs) {
                const raw = (doc.data() ?? {}) as Record<string, unknown>;
                const customerId = safeText(raw.customerId, 120);
                if (!customerId) continue;
                const current = caseCounts.get(customerId) ?? { open: 0, closed: 0 };
                const status = safeText(raw.status, 40);
                if (status === "closed") current.closed += 1;
                else current.open += 1;
                caseCounts.set(customerId, current);
            }

            for (const doc of salesSnap.docs) {
                const raw = (doc.data() ?? {}) as Record<string, unknown>;
                const customerId = safeText(raw.customerId, 120);
                if (!customerId) continue;
                spendByCustomer.set(customerId, (spendByCustomer.get(customerId) ?? 0) + toMoney(raw.amount));
            }
        }
    } else {
        const [ticketList, salesList] = await Promise.all([listTickets(), listSales()]);
        for (const ticket of ticketList) {
            const customerId = safeText(ticket.customerId, 120);
            if (!customerId || !ids.includes(customerId)) continue;
            const current = caseCounts.get(customerId) ?? { open: 0, closed: 0 };
            if (ticket.status === "closed") current.closed += 1;
            else current.open += 1;
            caseCounts.set(customerId, current);
        }
        for (const sale of salesList) {
            const customerId = safeText(sale.customerId, 120);
            if (!customerId || !ids.includes(customerId)) continue;
            spendByCustomer.set(customerId, (spendByCustomer.get(customerId) ?? 0) + toMoney(sale.amount));
        }
    }

    return customers.map((customer) => {
        const counts = caseCounts.get(customer.id) ?? { open: 0, closed: 0 };
        const totalCaseCount = counts.open + counts.closed;
        const caseState: CustomerCaseState = totalCaseCount === 0 ? "no_case" : counts.open > 0 ? "active_case" : "closed_case";
        return {
            customer,
            openCaseCount: counts.open,
            closedCaseCount: counts.closed,
            caseState,
            activitySpend: spendByCustomer.get(customer.id) ?? 0,
        };
    });
}

function matchesProductPageQuery(product: Product, params: ProductPageQuery): boolean {
    const keyword = safeText(params.keyword ?? "", 120).toLowerCase();
    if (keyword) {
        const haystack = buildProductSearchKeywords(product).join(" ").toLowerCase();
        if (!haystack.includes(keyword)) return false;
    }
    if (params.supplier && product.supplier !== params.supplier) return false;
    if (params.status && (product.status ?? "active") !== params.status) return false;
    if (params.categoryId && (product.categoryId || "") !== params.categoryId) return false;
    if (params.brandId && (product.brandId || "") !== params.brandId) return false;
    if (params.modelId && (product.modelId || "") !== params.modelId) return false;
    if (params.minStock !== null && params.minStock !== undefined && product.stock < params.minStock) return false;
    if (params.maxStock !== null && params.maxStock !== undefined && product.stock > params.maxStock) return false;
    if (params.minPrice !== null && params.minPrice !== undefined && product.price < params.minPrice) return false;
    if (params.maxPrice !== null && params.maxPrice !== undefined && product.price > params.maxPrice) return false;
    return true;
}

function getRedirectTab(formData: FormData, fallback: string): string {
    const tab = safeText(formData.get("tab"), 40);
    return tab || fallback;
}

function parseBrandTypeNames(formData: FormData): string[] {
    return normalizeTextArray(formData.getAll("brandTypeNames"), 40, 120);
}

function parseUsedProductTypeNames(formData: FormData): string[] {
    return normalizeTextArray(formData.getAll("usedProductTypeNames"), 40, 120);
}

function parseBrandCategoryNames(formData: FormData): string[] {
    return normalizeTextArray(formData.getAll("brandCategoryNames"), 80, 120);
}

type InventoryView = "stock" | "settings" | "stock-in" | "stock-out" | "product-management";
type ProductRedirectPath = string;
type ProductCursor = {
    updatedAt: number;
    id: string;
};
type CustomerListOrder = "updated_latest" | "updated_earliest" | "created_latest" | "created_earliest" | "name_asc" | "name_desc";
type CustomerCursor = {
    orderValue: number | string;
    id: string;
};
type CustomerPageQuery = {
    keyword?: string;
    caseState?: CustomerCaseState | "all";
    order?: CustomerListOrder;
    pageSize?: number;
    cursor?: string;
};
type ActivityListOrder = "updated_latest" | "updated_earliest" | "start_latest" | "start_earliest";
type ActivityCursor = {
    orderValue: number;
    id: string;
};
type ActivityPageQuery = {
    keyword?: string;
    status?: Activity["status"] | "all";
    order?: ActivityListOrder;
    pageSize?: number;
    cursor?: string;
};
type ProductPageQuery = {
    keyword?: string;
    supplier?: string;
    categoryId?: string;
    brandId?: string;
    modelId?: string;
    status?: string;
    minStock?: number | null;
    maxStock?: number | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    pageSize?: number;
    cursor?: string;
};

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
    const raw = safeText(formData.get("redirectPath"), 400);
    if (!raw.startsWith("/dashboard/products")) return "";
    if (raw.includes("://")) return "";
    return raw;
}

function catalogCategoryCollectionPath(companyId: string): string {
    return `companies/${companyId}/categories`;
}

function catalogSupplierCollectionPath(companyId: string): string {
    return `companies/${companyId}/suppliers`;
}

function toErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message;
    return String(error);
}

function toRawString(value: unknown): string {
    return typeof value === "string" ? value : "";
}

async function verifyEmailPassword(email: string, password: string): Promise<boolean> {
    const accountEmail = safeText(email, 160).toLowerCase();
    const apiKey = safeText(process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "", 200);
    if (!accountEmail || !password || !apiKey) return false;
    const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`;
    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                email: accountEmail,
                password,
                returnSecureToken: false,
            }),
            cache: "no-store",
        });
        return res.ok;
    } catch {
        return false;
    }
}

async function enforceDeletePassword(
    formData: FormData,
    scope: SessionScope,
    tab: string,
    options?: { inventoryView?: InventoryView; redirectPath?: ProductRedirectPath },
): Promise<{ reason: string; settings: SecuritySettings }> {
    const settings = await getDeleteSecuritySettings(scope.companyId);
    const reason = safeText(formData.get("deleteReason"), MAX_LONG_TEXT);
    if (settings.requireReasonOnDelete && !reason) {
        dashboardRedirect(tab, "delete_reason_required", options);
    }

    const password = toRawString(formData.get("confirmPassword"));
    const shouldVerifyPassword = !settings.deleteButtonEnabled && settings.requirePasswordWhenDeleteDisabled;
    if (shouldVerifyPassword) {
        if (!password) {
            dashboardRedirect(tab, "delete_auth_required", options);
        }
        const verified = await verifyEmailPassword(scope.operatorEmail, password);
        if (!verified) {
            dashboardRedirect(tab, "delete_auth_failed", options);
        }
    }
    return { reason, settings };
}

function debugMarketingAction(event: string, payload: Record<string, unknown>) {
    if (process.env.NODE_ENV === "production") return;
    console.info(`[commerce:marketing] ${event}`, payload);
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
    const categoryRef = parseDimensionRef(formData.get("categoryRef"));
    const brandRef = parseDimensionRef(formData.get("brandRef"));
    const modelRef = parseDimensionRef(formData.get("modelRef"));
    const categoryId = categoryRef.id || safeText(formData.get("categoryId"), 120);
    const categoryName = categoryRef.name || safeText(formData.get("categoryName"));
    const brandId = brandRef.id || safeText(formData.get("brandId"), 120);
    const brandName = brandRef.name || safeText(formData.get("brandName"));
    const modelId = modelRef.id || safeText(formData.get("modelId"), 120);
    const modelName = modelRef.name || safeText(formData.get("modelName"));
    const namingMode: Product["namingMode"] = categoryName || brandName || modelName ? "structured" : "custom";
    const nameEntryId = "";
    const nameEntryName = "";
    const customLabel = "";
    const aliases: string[] = [];
    const suggestedName = buildProductNameSuggestion({
        namingMode,
        categoryName,
        brandName,
        modelName,
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
        .filter((item) => !isSoftDeletedRow(item))
        .map((item) => normalizeActivity(item))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_LIST_SIZE);

    return queryByKeyword(normalized, keyword, (item) => [item.name, item.message, item.items.map((card) => card.itemName).join(" ")]);
}

export async function queryActivitiesPage(params: ActivityPageQuery = {}): Promise<CursorPageResult<Activity>> {
    const scope = await resolveSessionScope(true);
    const pageSize = normalizeDashboardPageSize(params.pageSize, 10);
    if (!scope) {
        return {
            items: [],
            pageSize,
            nextCursor: "",
            hasNextPage: false,
        };
    }

    const sort = getActivityPageSort(params.order);
    const decodedCursor = decodeActivityCursorValue(params.cursor);
    const db = await getFirestoreDb();

    if (db) {
        const batchSize = Math.max(pageSize * 3, 30);
        const buildBaseQuery = () => {
            let query = companyActivityRef(db, scope.companyId).orderBy(sort.field, sort.direction).orderBy(FieldPath.documentId(), sort.direction);
            if (params.status && params.status !== "all") query = query.where("status", "==", params.status);
            return query;
        };

        let query = buildBaseQuery();
        if (decodedCursor) query = query.startAfter(decodedCursor.orderValue, decodedCursor.id);
        const items: Activity[] = [];

        for (let round = 0; round < 8; round += 1) {
            const snap = await query.limit(batchSize).get();
            if (snap.empty) break;

            const docs = snap.docs;
            let lastCursorInBatch: ActivityCursor | null = null;

            for (let index = 0; index < docs.length; index += 1) {
                const doc = docs[index];
                const raw = (doc.data() ?? {}) as Partial<Activity>;
                if (isSoftDeletedRow(raw)) continue;
                const activity = normalizeActivity({ id: doc.id, ...raw });
                lastCursorInBatch = { orderValue: sort.getValue(activity), id: activity.id };
                if (!matchesActivityPageQuery(activity, params)) continue;
                items.push(activity);
                if (items.length >= pageSize) {
                    const hasNextPage = index < docs.length - 1 || docs.length === batchSize;
                    return {
                        items,
                        pageSize,
                        nextCursor: hasNextPage && lastCursorInBatch ? encodeActivityCursorValue(lastCursorInBatch) : "",
                        hasNextPage,
                    };
                }
            }

            if (!lastCursorInBatch || docs.length < batchSize) break;
            query = buildBaseQuery().startAfter(lastCursorInBatch.orderValue, lastCursorInBatch.id);
        }

        return {
            items,
            pageSize,
            nextCursor: "",
            hasNextPage: false,
        };
    }

    const ordered = listFromMemory(memory.activitiesByCompany, scope.companyId)
        .filter((item) => !isSoftDeletedRow(item))
        .map((item) => normalizeActivity(item))
        .filter((activity) => matchesActivityPageQuery(activity, params))
        .sort((left, right) => {
            const leftValue = sort.getValue(left);
            const rightValue = sort.getValue(right);
            if (leftValue === rightValue) return sort.direction === "desc" ? right.id.localeCompare(left.id) : left.id.localeCompare(right.id);
            return sort.direction === "desc" ? Number(rightValue) - Number(leftValue) : Number(leftValue) - Number(rightValue);
        });
    const startIndex = decodedCursor
        ? Math.max(
              0,
              ordered.findIndex((item) => item.id === decodedCursor.id) + 1,
          )
        : 0;
    const items = ordered.slice(startIndex, startIndex + pageSize);
    const lastItem = items.at(-1);
    const hasNextPage = startIndex + pageSize < ordered.length;
    return {
        items,
        pageSize,
        nextCursor: hasNextPage && lastItem ? encodeActivityCursorValue({ orderValue: sort.getValue(lastItem), id: lastItem.id }) : "",
        hasNextPage,
    };
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
        .filter((item) => !isSoftDeletedRow(item))
        .map((item) => normalizeProduct(item))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_LIST_SIZE);

    return queryByKeyword(normalized, keyword, (item) => buildProductSearchKeywords(item));
}

export async function queryProductsPage(params: ProductPageQuery = {}): Promise<CursorPageResult<Product>> {
    const scope = await resolveSessionScope(true);
    if (!scope) {
        return {
            items: [],
            pageSize: normalizePageSize(params.pageSize, 20),
            nextCursor: "",
            hasNextPage: false,
        };
    }

    try {
        const firebasePage = await listProductsPageFromFirebase(scope.companyId, params);
        if (firebasePage) return firebasePage;
    } catch {
        // fallback to memory
    }

    return listProductsPageFromMemory(scope.companyId, params);
}

export async function queryCompanyCustomersPage(params: CustomerPageQuery = {}): Promise<CursorPageResult<CompanyCustomerListRow>> {
    const scope = await resolveSessionScope(true);
    const pageSize = normalizeDashboardPageSize(params.pageSize, 10);
    if (!scope) {
        return {
            items: [],
            pageSize,
            nextCursor: "",
            hasNextPage: false,
        };
    }

    const sort = getCustomerPageSort(params.order);
    const decodedCursor = decodeCustomerCursorValue(params.cursor);
    const db = await getFirestoreDb();

    if (db) {
        const batchSize = Math.max(pageSize * 3, 30);
        const buildBaseQuery = () => companyCustomerRef(db, scope.companyId).orderBy(sort.field, sort.direction).orderBy(FieldPath.documentId(), sort.direction);
        let query = buildBaseQuery();
        if (decodedCursor) query = query.startAfter(decodedCursor.orderValue, decodedCursor.id);
        const items: CompanyCustomerListRow[] = [];

        for (let round = 0; round < 8; round += 1) {
            const snap = await query.limit(batchSize).get();
            if (snap.empty) break;

            const docs = snap.docs;
            let lastCursorInBatch: CustomerCursor | null = null;
            const batchCustomers: CompanyCustomer[] = [];

            for (const doc of docs) {
                const raw = (doc.data() ?? {}) as Partial<CompanyCustomer>;
                if (isSoftDeletedRow(raw)) continue;
                const customer = normalizeCustomer({ id: doc.id, ...raw });
                lastCursorInBatch = { orderValue: sort.getValue(customer), id: customer.id };
                if (!matchesCustomerKeyword(customer, params.keyword)) continue;
                batchCustomers.push(customer);
            }

            const enrichedRows = await buildCustomerListRows(scope.companyId, batchCustomers);
            for (const row of enrichedRows) {
                if (!matchesCustomerCaseFilter(row, params.caseState)) continue;
                items.push(row);
                if (items.length >= pageSize) {
                    const hasNextPage = docs.length === batchSize;
                    return {
                        items,
                        pageSize,
                        nextCursor: hasNextPage && lastCursorInBatch ? encodeCustomerCursorValue(lastCursorInBatch) : "",
                        hasNextPage,
                    };
                }
            }

            if (!lastCursorInBatch || docs.length < batchSize) break;
            query = buildBaseQuery().startAfter(lastCursorInBatch.orderValue, lastCursorInBatch.id);
        }

        return {
            items,
            pageSize,
            nextCursor: "",
            hasNextPage: false,
        };
    }

    const allCustomers = listFromMemory(memory.customersByCompany, scope.companyId)
        .filter((item) => !isSoftDeletedRow(item))
        .map((item) => normalizeCustomer(item))
        .filter((customer) => matchesCustomerKeyword(customer, params.keyword))
        .sort((left, right) => {
            const leftValue = sort.getValue(left);
            const rightValue = sort.getValue(right);
            if (leftValue === rightValue) return sort.direction === "desc" ? right.id.localeCompare(left.id) : left.id.localeCompare(right.id);
            if (typeof leftValue === "string" || typeof rightValue === "string") {
                return sort.direction === "desc"
                    ? String(rightValue).localeCompare(String(leftValue), "zh-Hant")
                    : String(leftValue).localeCompare(String(rightValue), "zh-Hant");
            }
            return sort.direction === "desc" ? Number(rightValue) - Number(leftValue) : Number(leftValue) - Number(rightValue);
        });
    const enrichedRows = (await buildCustomerListRows(scope.companyId, allCustomers)).filter((row) => matchesCustomerCaseFilter(row, params.caseState));
    const startIndex = decodedCursor
        ? Math.max(
              0,
              enrichedRows.findIndex((row) => row.customer.id === decodedCursor.id) + 1,
          )
        : 0;
    const items = enrichedRows.slice(startIndex, startIndex + pageSize);
    const lastItem = items.at(-1);
    const hasNextPage = startIndex + pageSize < enrichedRows.length;
    return {
        items,
        pageSize,
        nextCursor:
            hasNextPage && lastItem
                ? encodeCustomerCursorValue({ orderValue: sort.getValue(lastItem.customer), id: lastItem.customer.id })
                : "",
        hasNextPage,
    };
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

    const catalogBrands = await listCatalogBrands();
    const catalogModels = await listCatalogModels();
    if (catalogBrands.length > 0 || catalogModels.length > 0) {
        let existingBrandMappings: RepairBrand[] = [];
        try {
            const firebaseList = await listBrandsFromFirebase(scope.companyId);
            if (firebaseList) {
                existingBrandMappings = firebaseList;
                replaceMemoryList(memory.brandsByCompany, scope.companyId, firebaseList);
            } else {
                existingBrandMappings = listFromMemory(memory.brandsByCompany, scope.companyId);
            }
        } catch {
            existingBrandMappings = listFromMemory(memory.brandsByCompany, scope.companyId);
        }
        const usedTypeByBrandId = new Map<string, string[]>();
        const usedTypeByBrandName = new Map<string, string[]>();
        const productTypeByBrandId = new Map<string, string[]>();
        const productTypeByBrandName = new Map<string, string[]>();
        const linkedCategoryByBrandId = new Map<string, string[]>();
        const linkedCategoryByBrandName = new Map<string, string[]>();
        for (const row of existingBrandMappings) {
            const mappedProductTypes = getRepairBrandTypeNames(row);
            if (mappedProductTypes.length > 0) {
                productTypeByBrandId.set(row.id, mappedProductTypes);
                productTypeByBrandName.set(row.name.trim().toLowerCase(), mappedProductTypes);
            }
            const mappedCategories = normalizeTextArray(row.linkedCategoryNames ?? [], 80, 120);
            if (mappedCategories.length > 0) {
                linkedCategoryByBrandId.set(row.id, mappedCategories);
                linkedCategoryByBrandName.set(row.name.trim().toLowerCase(), mappedCategories);
            }
            const mapped = normalizeTextArray(row.usedProductTypes ?? [], 40, 120);
            if (mapped.length === 0) continue;
            usedTypeByBrandId.set(row.id, mapped);
            usedTypeByBrandName.set(row.name.trim().toLowerCase(), mapped);
        }

        const byId = new Map<string, RepairBrand>();
        const byName = new Map<string, RepairBrand>();

        for (const item of catalogBrands) {
            if (item.status !== "active") continue;
            const catalogProductTypes = normalizeTextArray(item.productTypes ?? [], 40, 120);
            const catalogMappedTypes = normalizeTextArray(item.usedProductTypes ?? [], 40, 120);
            const catalogLinkedCategories = normalizeTextArray(item.linkedCategoryNames ?? [], 80, 120);
            const existingMapping =
                existingBrandMappings.find((row) => row.id === item.id) ??
                existingBrandMappings.find((row) => row.name.trim().toLowerCase() === item.name.trim().toLowerCase()) ??
                null;
            const mappedCategories =
                catalogLinkedCategories.length > 0
                    ? catalogLinkedCategories
                    : linkedCategoryByBrandId.get(item.id) ??
                      linkedCategoryByBrandName.get(item.name.trim().toLowerCase()) ??
                      [];
            const mappedProductTypes =
                catalogProductTypes.length > 0
                    ? catalogProductTypes
                    : productTypeByBrandId.get(item.id) ??
                      productTypeByBrandName.get(item.name.trim().toLowerCase()) ??
                      [];
            const mappedTypes =
                catalogMappedTypes.length > 0
                    ? catalogMappedTypes
                    : usedTypeByBrandId.get(item.id) ??
                      usedTypeByBrandName.get(item.name.trim().toLowerCase()) ??
                      [];
            const brand = normalizeBrand({
                id: item.id,
                name: item.name,
                linkedCategoryNames: mappedCategories,
                productTypes: mappedProductTypes,
                models: existingMapping?.models ?? [],
                modelsByType: existingMapping?.modelsByType ?? [],
                usedProductTypes: mappedTypes,
                createdAt: toTimestamp(item.createdAt, now()),
                updatedAt: toTimestamp(item.updatedAt, now()),
            });
            byId.set(brand.id, brand);
            byName.set(brand.name.toLowerCase(), brand);
        }

        for (const model of catalogModels) {
            if (model.status !== "active") continue;
            const modelName = safeText(model.name, 80);
            if (!modelName) continue;
            const owner =
                (model.brandId ? byId.get(model.brandId) : null) ??
                (model.brandName ? byName.get(model.brandName.toLowerCase()) : null) ??
                null;
            if (!owner) continue;
            if (!owner.models.some((row) => row.toLowerCase() === modelName.toLowerCase())) {
                owner.models = [...owner.models, modelName];
            }
            const inferredTypeName = safeText(model.categoryName, 120) || (owner.usedProductTypes.length === 1 ? owner.usedProductTypes[0] : "");
            if (inferredTypeName) {
                owner.modelsByType = replaceBrandModelsForType(owner.modelsByType, inferredTypeName, [...getBrandModelsForType(owner, inferredTypeName), modelName]);
            }
            owner.updatedAt = Math.max(owner.updatedAt, toTimestamp(model.updatedAt, owner.updatedAt));
        }

        const normalized = [...byId.values()]
            .map((item) =>
                normalizeBrand({
                    ...item,
                    models: [...item.models].sort((a, b) => a.localeCompare(b, "zh-Hant")),
                    modelsByType: item.modelsByType
                        .map((group) => ({
                            typeName: group.typeName,
                            models: [...group.models].sort((a, b) => a.localeCompare(b, "zh-Hant")),
                        }))
                        .sort((a, b) => a.typeName.localeCompare(b.typeName, "zh-Hant")),
                }),
            )
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, MAX_LIST_SIZE);

        return queryByKeyword(normalized, keyword, (item) => [
            item.name,
            item.models.join(" "),
            item.linkedCategoryNames.join(" "),
            item.productTypes.join(" "),
            item.usedProductTypes.join(" "),
        ]);
    }

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
        .filter((item) => !isSoftDeletedRow(item))
        .map((item) => normalizeBrand(item))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_LIST_SIZE);

    return queryByKeyword(normalized, keyword, (item) => [
        item.name,
        item.models.join(" "),
        item.linkedCategoryNames.join(" "),
        item.productTypes.join(" "),
        item.usedProductTypes.join(" "),
    ]);
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
                .filter((item) => !isSoftDeletedRow(item))
                .map((item) => normalizeCustomer(item))
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .slice(0, MAX_LIST_SIZE);
            return queryByKeyword(normalized, keyword, (item) => [item.name, item.phone, item.email]);
        }
    } catch {
        // fallback to ticket-derived customers
    }

    const memoryCustomers = listFromMemory(memory.customersByCompany, scope.companyId)
        .filter((item) => !isSoftDeletedRow(item))
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
    const current = (await listActivities()).find((item) => item.id === activityId);
    if (!current) dashboardRedirect(tab, "invalid");
    const deleteGuard = await enforceDeletePassword(formData, scope, tab);

    try {
        const db = await getFirestoreDb();
        if (db) {
            await companyActivityRef(db, scope.companyId)
                .doc(activityId)
                .set(
                    {
                        isDeleted: true,
                        deleteStatus: "soft_deleted",
                        deletedAt: new Date().toISOString(),
                        deletedBy: scope.uid,
                        deletedReason: deleteGuard.reason || undefined,
                        updatedAt: now(),
                    },
                    { merge: true },
                );
        } else {
            removeFromMemory(memory.activitiesByCompany, scope.companyId, activityId);
        }
    } catch {
        removeFromMemory(memory.activitiesByCompany, scope.companyId, activityId);
    }

    await createDeleteLog({
        module: "campaigns",
        targetId: current.id,
        targetType: "activity",
        targetLabel: current.name,
        snapshot: current as unknown as Record<string, unknown>,
        deleteReason: deleteGuard.reason,
        deletedBy: scope.uid,
        deletedByName: scope.operatorName,
        canRestore: deleteGuard.settings.restoreEnabled,
        canHardDelete: !deleteGuard.settings.softDeleteOnly && deleteGuard.settings.hardDeleteEnabled,
    });

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
    const current = (await listProducts()).find((product) => product.id === productId);
    if (!current) dashboardRedirect(tab, "invalid", { inventoryView, redirectPath });
    const deleteGuard = await enforceDeletePassword(formData, scope, tab, { inventoryView, redirectPath });

    try {
        const db = await getFirestoreDb();
        if (db) {
            await companyProductRef(db, scope.companyId)
                .doc(productId)
                .set(
                    {
                        isDeleted: true,
                        deleteStatus: "soft_deleted",
                        deletedAt: new Date().toISOString(),
                        deletedBy: scope.uid,
                        deletedReason: deleteGuard.reason || undefined,
                        updatedAt: now(),
                    },
                    { merge: true },
                );
        } else {
            removeFromMemory(memory.productsByCompany, scope.companyId, productId);
        }
    } catch {
        removeFromMemory(memory.productsByCompany, scope.companyId, productId);
    }

    await createDeleteLog({
        module: "products",
        targetId: current.id,
        targetType: "product",
        targetLabel: current.name,
        snapshot: current as unknown as Record<string, unknown>,
        deleteReason: deleteGuard.reason,
        deletedBy: scope.uid,
        deletedByName: scope.operatorName,
        canRestore: deleteGuard.settings.restoreEnabled,
        canHardDelete: !deleteGuard.settings.softDeleteOnly && deleteGuard.settings.hardDeleteEnabled,
    });

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
    const linkedCategoryNames = parseBrandCategoryNames(formData);
    const productTypes = parseBrandTypeNames(formData);
    const usedProductTypes = parseUsedProductTypeNames(formData).filter((typeName) =>
        productTypes.some((row) => row.toLowerCase() === typeName.toLowerCase()),
    );
    if (!name) dashboardRedirect(tab, "invalid");

    const existingCatalogBrand = (await listCatalogBrands()).find((item) => item.name.toLowerCase() === name.toLowerCase());
    if (!existingCatalogBrand) {
        await createCatalogBrand({
            name,
            linkedCategoryNames,
            productTypes,
            usedProductTypes,
            status: "active",
        });
    } else if (linkedCategoryNames.length > 0 || productTypes.length > 0 || usedProductTypes.length > 0) {
        await updateCatalogBrand(existingCatalogBrand.id, {
            linkedCategoryNames,
            productTypes,
            usedProductTypes,
            status: "active",
        });
    }

    const ts = now();
    const brand = normalizeBrand({
        id: id("brand"),
        name,
        linkedCategoryNames,
        productTypes,
        modelsByType: [],
        models: [],
        usedProductTypes,
        createdAt: ts,
        updatedAt: ts,
    });

    try {
        const saved = await setBrandToFirebase(scope.companyId, brand);
        if (!saved) upsertMemory(memory.brandsByCompany, scope.companyId, brand);
    } catch {
        upsertMemory(memory.brandsByCompany, scope.companyId, brand);
    }

    const nextBrandList = [...(await listRepairBrands()), brand];
    await syncUsedProductTypeSettings(nextBrandList.flatMap((row) => row.usedProductTypes ?? []));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    dashboardRedirect(tab, "brand_created");
}

export async function updateRepairBrand(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const brandId = safeText(formData.get("brandId"), 120);
    const name = safeText(formData.get("brandName"));
    const brandTypesMode = safeText(formData.get("brandTypesMode"), 40);
    const requestedCategoryNames = parseBrandCategoryNames(formData);
    const requestedTypes = normalizeTextArray(
        [...parseBrandTypeNames(formData), safeText(formData.get("newBrandTypeName"), 120)],
        40,
        120,
    );
    const requestedUsedTypes = parseUsedProductTypeNames(formData).filter((typeName) =>
        requestedTypes.some((row) => row.toLowerCase() === typeName.toLowerCase()),
    );
    if (!brandId || !name) dashboardRedirect(tab, "invalid");

    const current = (await listRepairBrands()).find((brand) => brand.id === brandId);
    if (!current) dashboardRedirect(tab, "invalid");
    const nextLinkedCategoryNames = requestedCategoryNames;
    const nextProductTypes = brandTypesMode === "sync" ? requestedTypes : current.productTypes;
    const nextUsedTypes = brandTypesMode === "sync" ? requestedUsedTypes : current.usedProductTypes;

    await updateCatalogBrand(brandId, {
        name,
        linkedCategoryNames: nextLinkedCategoryNames,
        productTypes: nextProductTypes,
        usedProductTypes: nextUsedTypes,
        status: "active",
    });

    const next = normalizeBrand({
        ...current,
        id: brandId,
        name,
        linkedCategoryNames: nextLinkedCategoryNames,
        productTypes: nextProductTypes,
        usedProductTypes: nextUsedTypes,
        updatedAt: now(),
    });

    try {
        const saved = await setBrandToFirebase(scope.companyId, next);
        if (!saved) upsertMemory(memory.brandsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.brandsByCompany, scope.companyId, next);
    }

    const nextBrandList = [...(await listRepairBrands()).filter((brand) => brand.id !== brandId), next];
    await syncUsedProductTypeSettings(nextBrandList.flatMap((brand) => brand.usedProductTypes ?? []));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    dashboardRedirect(tab, "brand_updated");
}

export async function renameRepairBrandType(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const brandId = safeText(formData.get("brandId"), 120);
    const oldTypeName = safeText(formData.get("oldTypeName"), 120);
    const nextTypeName = safeText(formData.get("nextTypeName"), 120);
    if (!brandId || !oldTypeName || !nextTypeName) dashboardRedirect(tab, "invalid");

    const current = (await listRepairBrands()).find((brand) => brand.id === brandId);
    if (!current) dashboardRedirect(tab, "invalid");

    const nextProductTypes = normalizeTextArray(
        current.productTypes.map((typeName) => (typeName.toLowerCase() === oldTypeName.toLowerCase() ? nextTypeName : typeName)),
        40,
        120,
    );
    const nextUsedTypes = normalizeTextArray(
        current.usedProductTypes.map((typeName) => (typeName.toLowerCase() === oldTypeName.toLowerCase() ? nextTypeName : typeName)),
        40,
        120,
    );
    const nextModelsByType = renameBrandModelsForType(current.modelsByType, oldTypeName, nextTypeName);
    const renamedModels = getBrandModelsForType(current, oldTypeName);

    await updateCatalogBrand(brandId, {
        name: current.name,
        linkedCategoryNames: current.linkedCategoryNames,
        productTypes: nextProductTypes,
        usedProductTypes: nextUsedTypes,
        status: "active",
    });

    await Promise.all(
        (await listCatalogModels())
            .filter((item) => item.brandId === brandId && renamedModels.some((modelName) => modelName.toLowerCase() === item.name.toLowerCase()))
            .map((item) =>
                updateCatalogModel(item.id, {
                    brandId,
                    brandName: current.name,
                    categoryName: nextTypeName,
                    status: "active",
                }),
            ),
    );

    const next = normalizeBrand({
        ...current,
        id: brandId,
        productTypes: nextProductTypes,
        modelsByType: nextModelsByType,
        usedProductTypes: nextUsedTypes,
        updatedAt: now(),
    });

    try {
        const saved = await setBrandToFirebase(scope.companyId, next);
        if (!saved) upsertMemory(memory.brandsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.brandsByCompany, scope.companyId, next);
    }

    const nextBrandList = [...(await listRepairBrands()).filter((brand) => brand.id !== brandId), next];
    await syncUsedProductTypeSettings(nextBrandList.flatMap((brand) => brand.usedProductTypes ?? []));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    dashboardRedirect(tab, "brand_type_updated");
}

export async function deleteRepairBrandType(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const brandId = safeText(formData.get("brandId"), 120);
    const oldTypeName = safeText(formData.get("oldTypeName"), 120);
    if (!brandId || !oldTypeName) dashboardRedirect(tab, "invalid");

    const current = (await listRepairBrands()).find((brand) => brand.id === brandId);
    if (!current) dashboardRedirect(tab, "invalid");

    const removedModels = getBrandModelsForType(current, oldTypeName);
    const nextProductTypes = current.productTypes.filter((typeName) => typeName.toLowerCase() !== oldTypeName.toLowerCase());
    const nextUsedTypes = current.usedProductTypes.filter((typeName) => typeName.toLowerCase() !== oldTypeName.toLowerCase());
    const nextModelsByType = removeBrandModelsForType(current.modelsByType, oldTypeName);
    const nextModels = current.models.filter((modelName) => !removedModels.some((row) => row.toLowerCase() === modelName.toLowerCase()));

    await updateCatalogBrand(brandId, {
        name: current.name,
        linkedCategoryNames: current.linkedCategoryNames,
        productTypes: nextProductTypes,
        usedProductTypes: nextUsedTypes,
        status: "active",
    });

    await Promise.all(
        (await listCatalogModels())
            .filter((item) => item.brandId === brandId && removedModels.some((modelName) => modelName.toLowerCase() === item.name.toLowerCase()))
            .map((item) => updateCatalogModel(item.id, { status: "inactive" })),
    );

    const next = normalizeBrand({
        ...current,
        id: brandId,
        productTypes: nextProductTypes,
        modelsByType: nextModelsByType,
        models: nextModels,
        usedProductTypes: nextUsedTypes,
        updatedAt: now(),
    });

    try {
        const saved = await setBrandToFirebase(scope.companyId, next);
        if (!saved) upsertMemory(memory.brandsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.brandsByCompany, scope.companyId, next);
    }

    const nextBrandList = [...(await listRepairBrands()).filter((brand) => brand.id !== brandId), next];
    await syncUsedProductTypeSettings(nextBrandList.flatMap((brand) => brand.usedProductTypes ?? []));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    dashboardRedirect(tab, "brand_type_deleted");
}

export async function deleteRepairBrand(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const brandId = safeText(formData.get("brandId"), 120);
    if (!brandId) dashboardRedirect(tab, "invalid");
    const current = (await listRepairBrands()).find((brand) => brand.id === brandId);
    if (!current) dashboardRedirect(tab, "invalid");
    const deleteGuard = await enforceDeletePassword(formData, scope, tab);

    await updateCatalogBrand(brandId, { status: "inactive" });
    const catalogModels = await listCatalogModels();
    await Promise.all(
        catalogModels
            .filter((item) => item.brandId === brandId)
            .map((item) => updateCatalogModel(item.id, { status: "inactive" })),
    );

    try {
        const db = await getFirestoreDb();
        if (db) {
            await companyBrandRef(db, scope.companyId)
                .doc(brandId)
                .set(
                    {
                        isDeleted: true,
                        deleteStatus: "soft_deleted",
                        deletedAt: new Date().toISOString(),
                        deletedBy: scope.uid,
                        deletedReason: deleteGuard.reason || undefined,
                        updatedAt: now(),
                    },
                    { merge: true },
                );
        } else {
            removeFromMemory(memory.brandsByCompany, scope.companyId, brandId);
        }
    } catch {
        removeFromMemory(memory.brandsByCompany, scope.companyId, brandId);
    }

    const remainingBrands = (await listRepairBrands()).filter((brand) => brand.id !== brandId);
    await syncUsedProductTypeSettings(remainingBrands.flatMap((brand) => brand.usedProductTypes ?? []));

    await createDeleteLog({
        module: "settings",
        targetId: current.id,
        targetType: "repair_brand",
        targetLabel: current.name,
        snapshot: current as unknown as Record<string, unknown>,
        deleteReason: deleteGuard.reason,
        deletedBy: scope.uid,
        deletedByName: scope.operatorName,
        canRestore: deleteGuard.settings.restoreEnabled,
        canHardDelete: !deleteGuard.settings.softDeleteOnly && deleteGuard.settings.hardDeleteEnabled,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    dashboardRedirect(tab, "brand_deleted");
}

export async function createRepairModel(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const brandId = safeText(formData.get("brandId"), 120);
    const modelName = safeText(formData.get("modelName"), 80);
    const modelTypeNameInput = safeText(formData.get("modelTypeName"), 120);
    if (!brandId || !modelName) dashboardRedirect(tab, "invalid");

    const current = (await listRepairBrands()).find((brand) => brand.id === brandId);
    if (!current) dashboardRedirect(tab, "invalid");
    const modelTypeName = resolveBrandModelTypeName(current, modelTypeNameInput);

    const existingCatalogModel = (await listCatalogModels()).find(
        (item) => item.brandId === brandId && item.name.toLowerCase() === modelName.toLowerCase(),
    );
    if (!existingCatalogModel) {
        await createCatalogModel({
            name: modelName,
            brandId,
            brandName: current.name,
            categoryName: modelTypeName || undefined,
            status: "active",
            isUniversal: false,
        });
    } else if (modelTypeName) {
        await updateCatalogModel(existingCatalogModel.id, {
            brandId,
            brandName: current.name,
            categoryName: modelTypeName,
            status: "active",
        });
    }

    const exists = current.models.some((item) => item.toLowerCase() === modelName.toLowerCase());
    const currentTypeModels = getBrandModelsForType(current, modelTypeName);
    const next = normalizeBrand({
        ...current,
        modelsByType: modelTypeName
            ? replaceBrandModelsForType(current.modelsByType, modelTypeName, exists ? currentTypeModels : [...currentTypeModels, modelName])
            : current.modelsByType,
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
    revalidatePath("/dashboard/products");
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
    const modelTypeNameInput = safeText(formData.get("modelTypeName"), 120);
    if (!brandId || !oldModel || !modelName) dashboardRedirect(tab, "invalid");

    const current = (await listRepairBrands()).find((brand) => brand.id === brandId);
    if (!current) dashboardRedirect(tab, "invalid");
    const modelTypeName = resolveBrandModelTypeName(current, modelTypeNameInput);

    const targetCatalogModels = (await listCatalogModels()).filter(
        (item) =>
            item.brandId === brandId &&
            item.name.toLowerCase() === oldModel.toLowerCase() &&
            (!modelTypeName || !safeText(item.categoryName, 120) || safeText(item.categoryName, 120).toLowerCase() === modelTypeName.toLowerCase()),
    );
    await Promise.all(
        targetCatalogModels.map((item) =>
            updateCatalogModel(item.id, {
                name: modelName,
                brandId,
                brandName: current.name,
                categoryName: modelTypeName || undefined,
                status: "active",
            }),
        ),
    );

    const nextModels = current.models.map((item) => (item === oldModel ? modelName : item));
    const currentTypeModels = getBrandModelsForType(current, modelTypeName);
    const nextTypeModels = currentTypeModels.map((item) => (item === oldModel ? modelName : item));
    const next = normalizeBrand({
        ...current,
        modelsByType: modelTypeName ? replaceBrandModelsForType(current.modelsByType, modelTypeName, nextTypeModels) : current.modelsByType,
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
    revalidatePath("/dashboard/products");
    dashboardRedirect(tab, "model_updated");
}

export async function deleteRepairModel(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const brandId = safeText(formData.get("brandId"), 120);
    const modelName = safeText(formData.get("modelName"), 80);
    const modelTypeNameInput = safeText(formData.get("modelTypeName"), 120);
    if (!brandId || !modelName) dashboardRedirect(tab, "invalid");
    const deleteGuard = await enforceDeletePassword(formData, scope, tab);

    const current = (await listRepairBrands()).find((brand) => brand.id === brandId);
    if (!current) dashboardRedirect(tab, "invalid");
    const modelTypeName = resolveBrandModelTypeName(current, modelTypeNameInput);

    const targetCatalogModels = (await listCatalogModels()).filter(
        (item) =>
            item.brandId === brandId &&
            item.name.toLowerCase() === modelName.toLowerCase() &&
            (!modelTypeName || !safeText(item.categoryName, 120) || safeText(item.categoryName, 120).toLowerCase() === modelTypeName.toLowerCase()),
    );
    await Promise.all(targetCatalogModels.map((item) => updateCatalogModel(item.id, { status: "inactive" })));

    const currentTypeModels = getBrandModelsForType(current, modelTypeName);
    const next = normalizeBrand({
        ...current,
        modelsByType: modelTypeName
            ? replaceBrandModelsForType(
                  current.modelsByType,
                  modelTypeName,
                  currentTypeModels.filter((item) => item !== modelName),
              )
            : current.modelsByType,
        models: current.models.filter((item) => item !== modelName),
        updatedAt: now(),
    });

    try {
        const saved = await setBrandToFirebase(scope.companyId, next);
        if (!saved) upsertMemory(memory.brandsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.brandsByCompany, scope.companyId, next);
    }

    await createDeleteLog({
        module: "settings",
        targetId: `${brandId}:${modelName}`,
        targetType: "repair_model",
        targetLabel: `${current.name} / ${modelName}`,
        snapshot: { brandId, brandName: current.name, modelName },
        deleteReason: deleteGuard.reason,
        deletedBy: scope.uid,
        deletedByName: scope.operatorName,
        canRestore: deleteGuard.settings.restoreEnabled,
        canHardDelete: !deleteGuard.settings.softDeleteOnly && deleteGuard.settings.hardDeleteEnabled,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    dashboardRedirect(tab, "model_deleted");
}

export async function createProductCategory(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const categoryName = safeText(formData.get("categoryName"));
    if (!categoryName) dashboardRedirect(tab, "invalid");

    const companyId = scope.companyId;
    const path = catalogCategoryCollectionPath(companyId);
    debugMarketingAction("create_category:start", {
        companyId,
        path,
        payload: { name: categoryName, status: "active" },
    });

    try {
        let categoryList: Awaited<ReturnType<typeof listCatalogCategories>> = [];
        try {
            categoryList = await listCatalogCategories("", companyId);
        } catch (listError) {
            debugMarketingAction("create_category:list_failed", {
                companyId,
                path,
                error: toErrorMessage(listError),
            });
        }
        debugMarketingAction("create_category:before_fetch", {
            companyId,
            path,
            fetchedCount: categoryList.length,
        });

        const existingCategory = categoryList.find((item) => item.name.toLowerCase() === categoryName.toLowerCase());
        let writeResultId = "";

        if (!existingCategory) {
            const createdCategory = await createCatalogCategory(
                {
                    name: categoryName,
                    status: "active",
                },
                companyId,
            );
            if (!createdCategory?.id) throw new Error("Category write failed: missing created record id");
            writeResultId = createdCategory.id;
        } else if (existingCategory.status !== "active") {
            const updatedCategory = await updateCatalogCategory(
                existingCategory.id,
                {
                    name: categoryName,
                    status: "active",
                },
                companyId,
            );
            if (!updatedCategory?.id) throw new Error("Category write failed: missing updated record id");
            writeResultId = updatedCategory.id;
        } else {
            debugMarketingAction("create_category:duplicate_active", {
                companyId,
                path,
                existingId: existingCategory.id,
            });
            throw new Error("duplicate_active_category");
        }

        debugMarketingAction("create_category:write_success", {
            companyId,
            path,
            writeResultId,
        });
        try {
            const refreshedCategoryList = await listCatalogCategories("", companyId);
            debugMarketingAction("create_category:after_fetch", {
                companyId,
                path,
                fetchedCount: refreshedCategoryList.length,
            });
        } catch (refreshError) {
            debugMarketingAction("create_category:after_fetch_failed", {
                companyId,
                path,
                error: toErrorMessage(refreshError),
            });
        }
    } catch (error) {
        const message = toErrorMessage(error);
        debugMarketingAction("create_category:failed", {
            companyId,
            path,
            error: message,
        });
        if (message === "duplicate_active_category") dashboardRedirect(tab, "invalid");
        dashboardRedirect(tab, "error");
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    dashboardRedirect(tab, "category_created");
}

export async function createProductSupplier(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const supplierName = safeText(formData.get("supplierName"));
    if (!supplierName) dashboardRedirect(tab, "invalid");

    const companyId = scope.companyId;
    const path = catalogSupplierCollectionPath(companyId);
    debugMarketingAction("create_supplier:start", {
        companyId,
        path,
        payload: { name: supplierName, status: "active" },
    });

    try {
        let supplierList: Awaited<ReturnType<typeof listCatalogSuppliers>> = [];
        try {
            supplierList = await listCatalogSuppliers("", companyId);
        } catch (listError) {
            debugMarketingAction("create_supplier:list_failed", {
                companyId,
                path,
                error: toErrorMessage(listError),
            });
        }
        debugMarketingAction("create_supplier:before_fetch", {
            companyId,
            path,
            fetchedCount: supplierList.length,
        });

        const existingSupplier = supplierList.find((item) => item.name.toLowerCase() === supplierName.toLowerCase());
        let writeResultId = "";

        if (!existingSupplier) {
            const createdSupplier = await createCatalogSupplier(
                {
                    name: supplierName,
                    status: "active",
                },
                companyId,
            );
            if (!createdSupplier?.id) throw new Error("Supplier write failed: missing created record id");
            writeResultId = createdSupplier.id;
        } else if (existingSupplier.status !== "active") {
            const updatedSupplier = await updateCatalogSupplier(
                existingSupplier.id,
                {
                    name: supplierName,
                    status: "active",
                },
                companyId,
            );
            if (!updatedSupplier?.id) throw new Error("Supplier write failed: missing updated record id");
            writeResultId = updatedSupplier.id;
        } else {
            debugMarketingAction("create_supplier:duplicate_active", {
                companyId,
                path,
                existingId: existingSupplier.id,
            });
            throw new Error("duplicate_active_supplier");
        }

        debugMarketingAction("create_supplier:write_success", {
            companyId,
            path,
            writeResultId,
        });
        try {
            const refreshedSupplierList = await listCatalogSuppliers("", companyId);
            debugMarketingAction("create_supplier:after_fetch", {
                companyId,
                path,
                fetchedCount: refreshedSupplierList.length,
            });
        } catch (refreshError) {
            debugMarketingAction("create_supplier:after_fetch_failed", {
                companyId,
                path,
                error: toErrorMessage(refreshError),
            });
        }
    } catch (error) {
        const message = toErrorMessage(error);
        debugMarketingAction("create_supplier:failed", {
            companyId,
            path,
            error: message,
        });
        if (message === "duplicate_active_supplier") dashboardRedirect(tab, "invalid");
        dashboardRedirect(tab, "error");
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    dashboardRedirect(tab, "supplier_created");
}

export async function updateProductCategory(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const categoryId = safeText(formData.get("categoryId"), 120);
    const categoryName = safeText(formData.get("categoryName"));
    if (!categoryId || !categoryName) dashboardRedirect(tab, "invalid");

    const companyId = scope.companyId;
    const categoryList = await listCatalogCategories("", companyId);
    const duplicated = categoryList.some((item) => item.id !== categoryId && item.name.toLowerCase() === categoryName.toLowerCase() && item.status === "active");
    if (duplicated) dashboardRedirect(tab, "invalid");

    const updated = await updateCatalogCategory(
        categoryId,
        {
            name: categoryName,
            status: "active",
        },
        companyId,
    );
    if (!updated?.id) dashboardRedirect(tab, "error");

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    dashboardRedirect(tab, "category_updated");
}

export async function deleteProductCategory(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const categoryId = safeText(formData.get("categoryId"), 120);
    if (!categoryId) dashboardRedirect(tab, "invalid");
    const deleteGuard = await enforceDeletePassword(formData, scope, tab);
    const categories = await listCatalogCategories("", scope.companyId);
    const target = categories.find((item) => item.id === categoryId);
    if (!target) dashboardRedirect(tab, "invalid");

    const updated = await updateCatalogCategory(
        categoryId,
        {
            status: "inactive",
        },
        scope.companyId,
    );
    if (!updated) dashboardRedirect(tab, "error");

    await createDeleteLog({
        module: "settings",
        targetId: target.id,
        targetType: "product_category",
        targetLabel: target.name,
        snapshot: target as unknown as Record<string, unknown>,
        deleteReason: deleteGuard.reason,
        deletedBy: scope.uid,
        deletedByName: scope.operatorName,
        canRestore: deleteGuard.settings.restoreEnabled,
        canHardDelete: !deleteGuard.settings.softDeleteOnly && deleteGuard.settings.hardDeleteEnabled,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    dashboardRedirect(tab, "category_deleted");
}

export async function updateProductSupplier(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const supplierId = safeText(formData.get("supplierId"), 120);
    const supplierName = safeText(formData.get("supplierName"));
    if (!supplierId || !supplierName) dashboardRedirect(tab, "invalid");

    const companyId = scope.companyId;
    const supplierList = await listCatalogSuppliers("", companyId);
    const duplicated = supplierList.some((item) => item.id !== supplierId && item.name.toLowerCase() === supplierName.toLowerCase() && item.status === "active");
    if (duplicated) dashboardRedirect(tab, "invalid");

    const updated = await updateCatalogSupplier(
        supplierId,
        {
            name: supplierName,
            status: "active",
        },
        companyId,
    );
    if (!updated?.id) dashboardRedirect(tab, "error");

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    dashboardRedirect(tab, "supplier_updated");
}

export async function deleteProductSupplier(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    const tab = getRedirectTab(formData, "marketing");
    if (!scope) dashboardRedirect(tab, "invalid");

    const supplierId = safeText(formData.get("supplierId"), 120);
    if (!supplierId) dashboardRedirect(tab, "invalid");
    const deleteGuard = await enforceDeletePassword(formData, scope, tab);
    const suppliers = await listCatalogSuppliers("", scope.companyId);
    const target = suppliers.find((item) => item.id === supplierId);
    if (!target) dashboardRedirect(tab, "invalid");

    const updated = await updateCatalogSupplier(
        supplierId,
        {
            status: "inactive",
        },
        scope.companyId,
    );
    if (!updated) dashboardRedirect(tab, "error");

    await createDeleteLog({
        module: "settings",
        targetId: target.id,
        targetType: "product_supplier",
        targetLabel: target.name,
        snapshot: target as unknown as Record<string, unknown>,
        deleteReason: deleteGuard.reason,
        deletedBy: scope.uid,
        deletedByName: scope.operatorName,
        canRestore: deleteGuard.settings.restoreEnabled,
        canHardDelete: !deleteGuard.settings.softDeleteOnly && deleteGuard.settings.hardDeleteEnabled,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    dashboardRedirect(tab, "supplier_deleted");
}

export async function getDashboardBundle(params?: {
    customerKeyword?: string;
    caseKeyword?: string;
    caseStatus?: string;
    caseOrder?: "latest" | "earliest";
    activityKeyword?: string;
    productKeyword?: string;
    brandKeyword?: string;
    scope?: "full" | "inventory" | "marketing" | "basic";
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

    const scopeMode =
        params?.scope === "inventory" || params?.scope === "marketing" || params?.scope === "basic" ? params.scope : "full";
    const needsFullRelations = scopeMode === "full";
    const needsInventoryData = scopeMode === "full" || scopeMode === "inventory";
    const needsMarketingData = scopeMode === "full" || scopeMode === "marketing";

    const [sales, tickets, customers, activities, products, brands, purchases, stockLogs] = await Promise.all([
        needsFullRelations ? listSales() : Promise.resolve([] as Sale[]),
        needsFullRelations ? listTickets() : Promise.resolve([] as Ticket[]),
        needsFullRelations ? listCompanyCustomers(params?.customerKeyword ?? "") : Promise.resolve([] as CompanyCustomer[]),
        needsFullRelations ? listActivities(params?.activityKeyword ?? "") : Promise.resolve([] as Activity[]),
        needsInventoryData ? listProducts(params?.productKeyword ?? "") : Promise.resolve([] as Product[]),
        needsMarketingData ? listRepairBrands(params?.brandKeyword ?? "") : Promise.resolve([] as RepairBrand[]),
        needsFullRelations ? listActivityPurchases() : Promise.resolve([] as Awaited<ReturnType<typeof listActivityPurchases>>),
        needsInventoryData ? listInventoryStockLogs(params?.productKeyword ?? "") : Promise.resolve([] as InventoryStockLog[]),
    ]);

    const caseStatus = safeText(params?.caseStatus);
    const caseOrder = params?.caseOrder === "earliest" ? "earliest" : "latest";
    const caseKeyword = safeText(params?.caseKeyword);

    const filteredTickets = needsFullRelations
        ? queryByKeyword(tickets, caseKeyword, (ticket) => [
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
              .sort((a, b) => (caseOrder === "latest" ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt))
        : [];

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
        stats: buildRevenueStatsFromSales(needsFullRelations ? sales : []),
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
