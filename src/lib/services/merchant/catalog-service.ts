import "server-only";
import type { BrandDoc, CategoryDoc, CatalogRecordStatus, DimensionPickerBundle, ModelDoc, ProductNameEntryDoc, SupplierDoc } from "@/lib/types/catalog";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { normalizeCompanyId } from "@/lib/tenant-scope";
import { getUserCompanyId, getUserDoc, toAccountType } from "@/lib/services/user.service";

const MAX_TEXT = 160;
const MAX_LONG = 800;
const MAX_LIST_SIZE = 400;
const READ_CACHE_TTL_MS = 30_000;

type SessionScope = {
    companyId: string;
};

type CatalogCollectionKey = "categories" | "suppliers";

const memory: {
    categoriesByCompany: Record<string, CategoryDoc[]>;
    brandsByCompany: Record<string, BrandDoc[]>;
    modelsByCompany: Record<string, ModelDoc[]>;
    nameEntriesByCompany: Record<string, ProductNameEntryDoc[]>;
    suppliersByCompany: Record<string, SupplierDoc[]>;
} = {
    categoriesByCompany: {},
    brandsByCompany: {},
    modelsByCompany: {},
    nameEntriesByCompany: {},
    suppliersByCompany: {},
};

const readCacheTouchedAt: {
    categoriesByCompany: Record<string, number>;
    brandsByCompany: Record<string, number>;
    modelsByCompany: Record<string, number>;
    nameEntriesByCompany: Record<string, number>;
    suppliersByCompany: Record<string, number>;
} = {
    categoriesByCompany: {},
    brandsByCompany: {},
    modelsByCompany: {},
    nameEntriesByCompany: {},
    suppliersByCompany: {},
};

function nowIso(): string {
    return new Date().toISOString();
}

function id(prefix: string): string {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function toText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function safeText(value: unknown, max = MAX_TEXT): string {
    return toText(value).replace(/[\u0000-\u001F\u007F]/g, "").slice(0, max).trim();
}

function toList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const item of value) {
        const text = safeText(item, MAX_TEXT);
        if (!text) continue;
        const key = text.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(text);
    }
    return out;
}

function slugify(value: string): string {
    const normalized = value
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return normalized || "item";
}

function toStatus(value: unknown): CatalogRecordStatus {
    return value === "inactive" ? "inactive" : "active";
}

async function resolveSessionScope(): Promise<SessionScope | null> {
    const session = await getSessionUser();
    if (!session) return null;
    const user = await getUserDoc(session.uid);
    if (!user) return null;
    if (toAccountType(user.role) !== "company") return null;
    const companyId = normalizeCompanyId(getUserCompanyId(user, session.uid));
    if (!companyId) return null;
    return { companyId };
}

async function resolveCompanyId(companyIdOverride?: string): Promise<string | null> {
    const normalized = normalizeCompanyId(companyIdOverride);
    if (normalized) return normalized;
    const scope = await resolveSessionScope();
    return scope?.companyId ?? null;
}

async function resolveCompanyIdOrThrow(companyIdOverride: string | undefined, source: string): Promise<string> {
    const companyId = await resolveCompanyId(companyIdOverride);
    if (!companyId) {
        throw new Error(`[catalog-service] Missing companyId at ${source}`);
    }
    return companyId;
}

function catalogCollectionPath(companyId: string, key: CatalogCollectionKey): string {
    return `companies/${companyId}/${key}`;
}

function toErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message;
    return String(error);
}

function debugCatalogLog(event: string, payload: Record<string, unknown>) {
    if (process.env.NODE_ENV === "production") return;
    console.info(`[catalog-service] ${event}`, payload);
}

async function getFirestoreDb() {
    try {
        const mod = await import("@/lib/firebase-server");
        return mod.fbAdminDb;
    } catch {
        return null;
    }
}

function categoriesRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(catalogCollectionPath(companyId, "categories"));
}

function brandsRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/brands`);
}

function modelsRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/models`);
}

function nameEntriesRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/productNameEntries`);
}

function suppliersRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(catalogCollectionPath(companyId, "suppliers"));
}

function listFromMemory<T>(store: Record<string, T[]>, companyId: string): T[] {
    return [...(store[companyId] ?? [])];
}

function replaceMemoryList<T>(store: Record<string, T[]>, companyId: string, next: T[]) {
    store[companyId] = [...next];
}

function upsertMemory<T extends { id: string }>(store: Record<string, T[]>, companyId: string, next: T) {
    const current = store[companyId] ?? [];
    store[companyId] = [next, ...current.filter((item) => item.id !== next.id)];
}

function removeFromMemory<T extends { id: string }>(store: Record<string, T[]>, companyId: string, itemId: string) {
    const current = store[companyId] ?? [];
    store[companyId] = current.filter((item) => item.id !== itemId);
}

function hasFreshReadCache(store: Record<string, number>, companyId: string): boolean {
    const touchedAt = store[companyId] ?? 0;
    return touchedAt > 0 && Date.now() - touchedAt <= READ_CACHE_TTL_MS;
}

function touchReadCache(store: Record<string, number>, companyId: string) {
    store[companyId] = Date.now();
}

function queryByKeyword<T>(list: T[], keyword: string, resolver: (item: T) => string[]): T[] {
    const q = safeText(keyword, 120).toLowerCase();
    if (!q) return list;
    return list.filter((item) => resolver(item).join(" ").toLowerCase().includes(q));
}

function stripUndefinedFields(input: object): Record<string, unknown> {
    return Object.fromEntries(Object.entries(input as Record<string, unknown>).filter(([, value]) => value !== undefined));
}

function normalizeCategory(input: Partial<CategoryDoc> & { id: string; companyId: string }): CategoryDoc {
    const name = safeText(input.name) || "未命名分類";
    const createdAt = safeText(input.createdAt, 40) || nowIso();
    return {
        id: safeText(input.id, 120) || id("category"),
        companyId: safeText(input.companyId, 120),
        name,
        slug: safeText(input.slug, 120) || slugify(name),
        description: safeText(input.description, MAX_LONG) || undefined,
        sortOrder: Number.isFinite(Number(input.sortOrder)) ? Math.round(Number(input.sortOrder)) : 0,
        status: toStatus(input.status),
        createdAt,
        updatedAt: safeText(input.updatedAt, 40) || createdAt,
    };
}

function normalizeBrand(input: Partial<BrandDoc> & { id: string; companyId: string }): BrandDoc {
    const name = safeText(input.name) || "未命名品牌";
    const createdAt = safeText(input.createdAt, 40) || nowIso();
    return {
        id: safeText(input.id, 120) || id("brand"),
        companyId: safeText(input.companyId, 120),
        name,
        slug: safeText(input.slug, 120) || slugify(name),
        description: safeText(input.description, MAX_LONG) || undefined,
        linkedCategoryNames: toList(input.linkedCategoryNames),
        productTypes: toList(input.productTypes),
        usedProductTypes: toList(input.usedProductTypes),
        sortOrder: Number.isFinite(Number(input.sortOrder)) ? Math.round(Number(input.sortOrder)) : 0,
        status: toStatus(input.status),
        createdAt,
        updatedAt: safeText(input.updatedAt, 40) || createdAt,
    };
}

function normalizeModel(input: Partial<ModelDoc> & { id: string; companyId: string }): ModelDoc {
    const name = safeText(input.name) || "未命名型號";
    const createdAt = safeText(input.createdAt, 40) || nowIso();
    return {
        id: safeText(input.id, 120) || id("model"),
        companyId: safeText(input.companyId, 120),
        name,
        slug: safeText(input.slug, 120) || slugify(name),
        brandId: safeText(input.brandId, 120) || undefined,
        brandName: safeText(input.brandName) || undefined,
        categoryId: safeText(input.categoryId, 120) || undefined,
        categoryName: safeText(input.categoryName) || undefined,
        isUniversal: Boolean(input.isUniversal),
        description: safeText(input.description, MAX_LONG) || undefined,
        sortOrder: Number.isFinite(Number(input.sortOrder)) ? Math.round(Number(input.sortOrder)) : 0,
        status: toStatus(input.status),
        createdAt,
        updatedAt: safeText(input.updatedAt, 40) || createdAt,
    };
}

function normalizeNameEntry(input: Partial<ProductNameEntryDoc> & { id: string; companyId: string }): ProductNameEntryDoc {
    const name = safeText(input.name) || "未命名品名詞條";
    const createdAt = safeText(input.createdAt, 40) || nowIso();
    return {
        id: safeText(input.id, 120) || id("name_entry"),
        companyId: safeText(input.companyId, 120),
        name,
        slug: safeText(input.slug, 120) || slugify(name),
        aliases: toList(input.aliases),
        categoryId: safeText(input.categoryId, 120) || undefined,
        categoryName: safeText(input.categoryName) || undefined,
        description: safeText(input.description, MAX_LONG) || undefined,
        sortOrder: Number.isFinite(Number(input.sortOrder)) ? Math.round(Number(input.sortOrder)) : 0,
        status: toStatus(input.status),
        createdAt,
        updatedAt: safeText(input.updatedAt, 40) || createdAt,
    };
}

function normalizeSupplier(input: Partial<SupplierDoc> & { id: string; companyId: string }): SupplierDoc {
    const name = safeText(input.name) || "未命名供應商";
    const createdAt = safeText(input.createdAt, 40) || nowIso();
    return {
        id: safeText(input.id, 120) || id("supplier"),
        companyId: safeText(input.companyId, 120),
        name,
        slug: safeText(input.slug, 120) || slugify(name),
        contactName: safeText(input.contactName) || undefined,
        phone: safeText(input.phone, 40) || undefined,
        email: safeText(input.email, 160).toLowerCase() || undefined,
        description: safeText(input.description, MAX_LONG) || undefined,
        sortOrder: Number.isFinite(Number(input.sortOrder)) ? Math.round(Number(input.sortOrder)) : 0,
        status: toStatus(input.status),
        createdAt,
        updatedAt: safeText(input.updatedAt, 40) || createdAt,
    };
}

async function listCategoriesFromFirestore(companyId: string): Promise<CategoryDoc[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    const snap = await categoriesRef(db, companyId).orderBy("updatedAt", "desc").limit(MAX_LIST_SIZE).get();
    return snap.docs.map((doc) => normalizeCategory({ id: doc.id, companyId, ...(doc.data() as Partial<CategoryDoc>) }));
}

async function listBrandsFromFirestore(companyId: string): Promise<BrandDoc[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    const snap = await brandsRef(db, companyId).orderBy("updatedAt", "desc").limit(MAX_LIST_SIZE).get();
    return snap.docs.map((doc) => normalizeBrand({ id: doc.id, companyId, ...(doc.data() as Partial<BrandDoc>) }));
}

async function listModelsFromFirestore(companyId: string): Promise<ModelDoc[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    const snap = await modelsRef(db, companyId).orderBy("updatedAt", "desc").limit(MAX_LIST_SIZE).get();
    return snap.docs.map((doc) => normalizeModel({ id: doc.id, companyId, ...(doc.data() as Partial<ModelDoc>) }));
}

async function listNameEntriesFromFirestore(companyId: string): Promise<ProductNameEntryDoc[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    const snap = await nameEntriesRef(db, companyId).orderBy("updatedAt", "desc").limit(MAX_LIST_SIZE).get();
    return snap.docs.map((doc) => normalizeNameEntry({ id: doc.id, companyId, ...(doc.data() as Partial<ProductNameEntryDoc>) }));
}

async function listSuppliersFromFirestore(companyId: string): Promise<SupplierDoc[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    const snap = await suppliersRef(db, companyId).orderBy("updatedAt", "desc").limit(MAX_LIST_SIZE).get();
    return snap.docs.map((doc) => normalizeSupplier({ id: doc.id, companyId, ...(doc.data() as Partial<SupplierDoc>) }));
}

async function setCategoryToFirestore(companyId: string, doc: CategoryDoc): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await categoriesRef(db, companyId).doc(doc.id).set(stripUndefinedFields(doc), { merge: true });
    return true;
}

async function setBrandToFirestore(companyId: string, doc: BrandDoc): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await brandsRef(db, companyId).doc(doc.id).set(stripUndefinedFields(doc), { merge: true });
    return true;
}

async function setModelToFirestore(companyId: string, doc: ModelDoc): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await modelsRef(db, companyId).doc(doc.id).set(stripUndefinedFields(doc), { merge: true });
    return true;
}

async function setNameEntryToFirestore(companyId: string, doc: ProductNameEntryDoc): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await nameEntriesRef(db, companyId).doc(doc.id).set(stripUndefinedFields(doc), { merge: true });
    return true;
}

async function setSupplierToFirestore(companyId: string, doc: SupplierDoc): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await suppliersRef(db, companyId).doc(doc.id).set(stripUndefinedFields(doc), { merge: true });
    return true;
}

async function deleteCategoryInFirestore(companyId: string, itemId: string): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await categoriesRef(db, companyId).doc(itemId).delete();
    return true;
}

async function deleteBrandInFirestore(companyId: string, itemId: string): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await brandsRef(db, companyId).doc(itemId).delete();
    return true;
}

async function deleteModelInFirestore(companyId: string, itemId: string): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await modelsRef(db, companyId).doc(itemId).delete();
    return true;
}

async function deleteNameEntryInFirestore(companyId: string, itemId: string): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await nameEntriesRef(db, companyId).doc(itemId).delete();
    return true;
}

async function deleteSupplierInFirestore(companyId: string, itemId: string): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await suppliersRef(db, companyId).doc(itemId).delete();
    return true;
}

export async function listCatalogCategories(keyword = "", companyIdOverride?: string): Promise<CategoryDoc[]> {
    const companyId = await resolveCompanyIdOrThrow(companyIdOverride, "listCatalogCategories");
    const path = catalogCollectionPath(companyId, "categories");
    debugCatalogLog("list_categories:start", { companyId, path, keyword });
    let list: CategoryDoc[] = [];
    if (hasFreshReadCache(readCacheTouchedAt.categoriesByCompany, companyId)) {
        list = listFromMemory(memory.categoriesByCompany, companyId);
        debugCatalogLog("list_categories:warm_cache", { companyId, path, fetchedCount: list.length });
    } else {
        try {
            const fsList = await listCategoriesFromFirestore(companyId);
            if (fsList) {
                list = fsList;
                replaceMemoryList(memory.categoriesByCompany, companyId, fsList);
                touchReadCache(readCacheTouchedAt.categoriesByCompany, companyId);
                debugCatalogLog("list_categories:firestore", { companyId, path, fetchedCount: fsList.length });
            } else {
                list = listFromMemory(memory.categoriesByCompany, companyId);
                debugCatalogLog("list_categories:memory_no_firestore", { companyId, path, fetchedCount: list.length });
            }
        } catch (error) {
            list = listFromMemory(memory.categoriesByCompany, companyId);
            debugCatalogLog("list_categories:fallback", {
                companyId,
                path,
                fetchedCount: list.length,
                error: toErrorMessage(error),
            });
        }
    }
    return queryByKeyword(
        list.map((item) => normalizeCategory(item)).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "zh-Hant")),
        keyword,
        (item) => [item.name, item.slug, item.description ?? ""],
    );
}

export async function listCatalogBrands(keyword = "", companyIdOverride?: string): Promise<BrandDoc[]> {
    const companyId = await resolveCompanyIdOrThrow(companyIdOverride, "listCatalogBrands");
    let list: BrandDoc[] = [];
    if (hasFreshReadCache(readCacheTouchedAt.brandsByCompany, companyId)) {
        list = listFromMemory(memory.brandsByCompany, companyId);
    } else {
        try {
            const fsList = await listBrandsFromFirestore(companyId);
            if (fsList) {
                list = fsList;
                replaceMemoryList(memory.brandsByCompany, companyId, fsList);
                touchReadCache(readCacheTouchedAt.brandsByCompany, companyId);
            } else {
                list = listFromMemory(memory.brandsByCompany, companyId);
            }
        } catch {
            list = listFromMemory(memory.brandsByCompany, companyId);
        }
    }
    return queryByKeyword(
        list.map((item) => normalizeBrand(item)).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "zh-Hant")),
        keyword,
        (item) => [item.name, item.slug, ...(item.linkedCategoryNames ?? []), ...(item.productTypes ?? []), item.description ?? ""],
    );
}

export async function listCatalogModels(keyword = "", companyIdOverride?: string): Promise<ModelDoc[]> {
    const companyId = await resolveCompanyIdOrThrow(companyIdOverride, "listCatalogModels");
    let list: ModelDoc[] = [];
    if (hasFreshReadCache(readCacheTouchedAt.modelsByCompany, companyId)) {
        list = listFromMemory(memory.modelsByCompany, companyId);
    } else {
        try {
            const fsList = await listModelsFromFirestore(companyId);
            if (fsList) {
                list = fsList;
                replaceMemoryList(memory.modelsByCompany, companyId, fsList);
                touchReadCache(readCacheTouchedAt.modelsByCompany, companyId);
            } else {
                list = listFromMemory(memory.modelsByCompany, companyId);
            }
        } catch {
            list = listFromMemory(memory.modelsByCompany, companyId);
        }
    }
    return queryByKeyword(
        list.map((item) => normalizeModel(item)).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "zh-Hant")),
        keyword,
        (item) => [item.name, item.slug, item.brandName ?? "", item.categoryName ?? "", item.description ?? ""],
    );
}

export async function listCatalogProductNameEntries(keyword = "", companyIdOverride?: string): Promise<ProductNameEntryDoc[]> {
    const companyId = await resolveCompanyIdOrThrow(companyIdOverride, "listCatalogProductNameEntries");
    let list: ProductNameEntryDoc[] = [];
    if (hasFreshReadCache(readCacheTouchedAt.nameEntriesByCompany, companyId)) {
        list = listFromMemory(memory.nameEntriesByCompany, companyId);
    } else {
        try {
            const fsList = await listNameEntriesFromFirestore(companyId);
            if (fsList) {
                list = fsList;
                replaceMemoryList(memory.nameEntriesByCompany, companyId, fsList);
                touchReadCache(readCacheTouchedAt.nameEntriesByCompany, companyId);
            } else {
                list = listFromMemory(memory.nameEntriesByCompany, companyId);
            }
        } catch {
            list = listFromMemory(memory.nameEntriesByCompany, companyId);
        }
    }
    return queryByKeyword(
        list.map((item) => normalizeNameEntry(item)).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "zh-Hant")),
        keyword,
        (item) => [item.name, item.slug, ...(item.aliases ?? []), item.categoryName ?? "", item.description ?? ""],
    );
}

export async function listCatalogSuppliers(keyword = "", companyIdOverride?: string): Promise<SupplierDoc[]> {
    const companyId = await resolveCompanyIdOrThrow(companyIdOverride, "listCatalogSuppliers");
    const path = catalogCollectionPath(companyId, "suppliers");
    debugCatalogLog("list_suppliers:start", { companyId, path, keyword });
    let list: SupplierDoc[] = [];
    if (hasFreshReadCache(readCacheTouchedAt.suppliersByCompany, companyId)) {
        list = listFromMemory(memory.suppliersByCompany, companyId);
        debugCatalogLog("list_suppliers:warm_cache", { companyId, path, fetchedCount: list.length });
    } else {
        try {
            const fsList = await listSuppliersFromFirestore(companyId);
            if (fsList) {
                list = fsList;
                replaceMemoryList(memory.suppliersByCompany, companyId, fsList);
                touchReadCache(readCacheTouchedAt.suppliersByCompany, companyId);
                debugCatalogLog("list_suppliers:firestore", { companyId, path, fetchedCount: fsList.length });
            } else {
                list = listFromMemory(memory.suppliersByCompany, companyId);
                debugCatalogLog("list_suppliers:memory_no_firestore", { companyId, path, fetchedCount: list.length });
            }
        } catch (error) {
            list = listFromMemory(memory.suppliersByCompany, companyId);
            debugCatalogLog("list_suppliers:fallback", {
                companyId,
                path,
                fetchedCount: list.length,
                error: toErrorMessage(error),
            });
        }
    }
    return queryByKeyword(
        list.map((item) => normalizeSupplier(item)).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "zh-Hant")),
        keyword,
        (item) => [item.name, item.slug, item.contactName ?? "", item.phone ?? "", item.email ?? "", item.description ?? ""],
    );
}

export async function createCatalogCategory(input: Partial<CategoryDoc>, companyIdOverride?: string): Promise<CategoryDoc | null> {
    const companyId = await resolveCompanyIdOrThrow(companyIdOverride, "createCatalogCategory");
    const path = catalogCollectionPath(companyId, "categories");
    const ts = nowIso();
    const next = normalizeCategory({ id: id("category"), companyId, ...input, createdAt: ts, updatedAt: ts });
    debugCatalogLog("create_category:start", {
        companyId,
        path,
        payload: { name: next.name, slug: next.slug, status: next.status },
    });
    try {
        const saved = await setCategoryToFirestore(companyId, next);
        if (!saved) {
            debugCatalogLog("create_category:db_unavailable", { companyId, path });
            return null;
        }
    } catch (error) {
        debugCatalogLog("create_category:failed", { companyId, path, error: toErrorMessage(error) });
        return null;
    }
    upsertMemory(memory.categoriesByCompany, companyId, next);
    touchReadCache(readCacheTouchedAt.categoriesByCompany, companyId);
    debugCatalogLog("create_category:success", { companyId, path, recordId: next.id });
    return next;
}

export async function updateCatalogCategory(categoryId: string, input: Partial<CategoryDoc>, companyIdOverride?: string): Promise<CategoryDoc | null> {
    const companyId = await resolveCompanyIdOrThrow(companyIdOverride, "updateCatalogCategory");
    const path = catalogCollectionPath(companyId, "categories");
    const current = (await listCatalogCategories("", companyId)).find((item) => item.id === safeText(categoryId, 120));
    if (!current) return null;
    const next = normalizeCategory({ ...current, ...input, id: current.id, companyId, updatedAt: nowIso() });
    debugCatalogLog("update_category:start", {
        companyId,
        path,
        recordId: current.id,
        payload: { name: next.name, slug: next.slug, status: next.status },
    });
    try {
        const saved = await setCategoryToFirestore(companyId, next);
        if (!saved) {
            debugCatalogLog("update_category:db_unavailable", { companyId, path, recordId: current.id });
            return null;
        }
    } catch (error) {
        debugCatalogLog("update_category:failed", { companyId, path, recordId: current.id, error: toErrorMessage(error) });
        return null;
    }
    upsertMemory(memory.categoriesByCompany, companyId, next);
    touchReadCache(readCacheTouchedAt.categoriesByCompany, companyId);
    debugCatalogLog("update_category:success", { companyId, path, recordId: next.id });
    return next;
}

export async function deleteCatalogCategory(categoryId: string, companyIdOverride?: string): Promise<boolean> {
    const companyId = await resolveCompanyIdOrThrow(companyIdOverride, "deleteCatalogCategory");
    const path = catalogCollectionPath(companyId, "categories");
    const target = safeText(categoryId, 120);
    if (!target) return false;
    debugCatalogLog("delete_category:start", { companyId, path, recordId: target });
    try {
        const deleted = await deleteCategoryInFirestore(companyId, target);
        if (!deleted) {
            debugCatalogLog("delete_category:db_unavailable", { companyId, path, recordId: target });
            return false;
        }
    } catch (error) {
        debugCatalogLog("delete_category:failed", { companyId, path, recordId: target, error: toErrorMessage(error) });
        return false;
    }
    removeFromMemory(memory.categoriesByCompany, companyId, target);
    touchReadCache(readCacheTouchedAt.categoriesByCompany, companyId);
    debugCatalogLog("delete_category:success", { companyId, path, recordId: target });
    return true;
}

export async function createCatalogBrand(input: Partial<BrandDoc>): Promise<BrandDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const ts = nowIso();
    const next = normalizeBrand({ id: id("brand"), companyId: scope.companyId, ...input, createdAt: ts, updatedAt: ts });
    try {
        await setBrandToFirestore(scope.companyId, next);
    } catch {
        // fall back to warm memory when Firestore is unavailable
    }
    upsertMemory(memory.brandsByCompany, scope.companyId, next);
    touchReadCache(readCacheTouchedAt.brandsByCompany, scope.companyId);
    return next;
}

export async function updateCatalogBrand(brandId: string, input: Partial<BrandDoc>): Promise<BrandDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const current = (await listCatalogBrands("", scope.companyId)).find((item) => item.id === safeText(brandId, 120));
    if (!current) return null;
    const next = normalizeBrand({ ...current, ...input, id: current.id, companyId: scope.companyId, updatedAt: nowIso() });
    try {
        await setBrandToFirestore(scope.companyId, next);
    } catch {
        // fall back to warm memory when Firestore is unavailable
    }
    upsertMemory(memory.brandsByCompany, scope.companyId, next);
    touchReadCache(readCacheTouchedAt.brandsByCompany, scope.companyId);
    return next;
}

export async function deleteCatalogBrand(brandId: string): Promise<boolean> {
    const scope = await resolveSessionScope();
    if (!scope) return false;
    const target = safeText(brandId, 120);
    if (!target) return false;
    try {
        await deleteBrandInFirestore(scope.companyId, target);
    } catch {
        // fall back to warm memory when Firestore is unavailable
    }
    removeFromMemory(memory.brandsByCompany, scope.companyId, target);
    touchReadCache(readCacheTouchedAt.brandsByCompany, scope.companyId);
    return true;
}

export async function createCatalogModel(input: Partial<ModelDoc>): Promise<ModelDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const ts = nowIso();
    const next = normalizeModel({ id: id("model"), companyId: scope.companyId, ...input, createdAt: ts, updatedAt: ts });
    try {
        await setModelToFirestore(scope.companyId, next);
    } catch {
        // fall back to warm memory when Firestore is unavailable
    }
    upsertMemory(memory.modelsByCompany, scope.companyId, next);
    touchReadCache(readCacheTouchedAt.modelsByCompany, scope.companyId);
    return next;
}

export async function updateCatalogModel(modelId: string, input: Partial<ModelDoc>): Promise<ModelDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const current = (await listCatalogModels("", scope.companyId)).find((item) => item.id === safeText(modelId, 120));
    if (!current) return null;
    const next = normalizeModel({ ...current, ...input, id: current.id, companyId: scope.companyId, updatedAt: nowIso() });
    try {
        await setModelToFirestore(scope.companyId, next);
    } catch {
        // fall back to warm memory when Firestore is unavailable
    }
    upsertMemory(memory.modelsByCompany, scope.companyId, next);
    touchReadCache(readCacheTouchedAt.modelsByCompany, scope.companyId);
    return next;
}

export async function deleteCatalogModel(modelId: string): Promise<boolean> {
    const scope = await resolveSessionScope();
    if (!scope) return false;
    const target = safeText(modelId, 120);
    if (!target) return false;
    try {
        await deleteModelInFirestore(scope.companyId, target);
    } catch {
        // fall back to warm memory when Firestore is unavailable
    }
    removeFromMemory(memory.modelsByCompany, scope.companyId, target);
    touchReadCache(readCacheTouchedAt.modelsByCompany, scope.companyId);
    return true;
}

export async function createCatalogProductNameEntry(input: Partial<ProductNameEntryDoc>): Promise<ProductNameEntryDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const ts = nowIso();
    const next = normalizeNameEntry({ id: id("name_entry"), companyId: scope.companyId, ...input, createdAt: ts, updatedAt: ts });
    try {
        await setNameEntryToFirestore(scope.companyId, next);
    } catch {
        // fall back to warm memory when Firestore is unavailable
    }
    upsertMemory(memory.nameEntriesByCompany, scope.companyId, next);
    touchReadCache(readCacheTouchedAt.nameEntriesByCompany, scope.companyId);
    return next;
}

export async function createCatalogSupplier(input: Partial<SupplierDoc>, companyIdOverride?: string): Promise<SupplierDoc | null> {
    const companyId = await resolveCompanyIdOrThrow(companyIdOverride, "createCatalogSupplier");
    const path = catalogCollectionPath(companyId, "suppliers");
    const ts = nowIso();
    const next = normalizeSupplier({ id: id("supplier"), companyId, ...input, createdAt: ts, updatedAt: ts });
    debugCatalogLog("create_supplier:start", {
        companyId,
        path,
        payload: { name: next.name, slug: next.slug, status: next.status },
    });
    try {
        const saved = await setSupplierToFirestore(companyId, next);
        if (!saved) {
            debugCatalogLog("create_supplier:db_unavailable", { companyId, path });
            return null;
        }
    } catch (error) {
        debugCatalogLog("create_supplier:failed", { companyId, path, error: toErrorMessage(error) });
        return null;
    }
    upsertMemory(memory.suppliersByCompany, companyId, next);
    touchReadCache(readCacheTouchedAt.suppliersByCompany, companyId);
    debugCatalogLog("create_supplier:success", { companyId, path, recordId: next.id });
    return next;
}

export async function updateCatalogSupplier(supplierId: string, input: Partial<SupplierDoc>, companyIdOverride?: string): Promise<SupplierDoc | null> {
    const companyId = await resolveCompanyIdOrThrow(companyIdOverride, "updateCatalogSupplier");
    const path = catalogCollectionPath(companyId, "suppliers");
    const current = (await listCatalogSuppliers("", companyId)).find((item) => item.id === safeText(supplierId, 120));
    if (!current) return null;
    const next = normalizeSupplier({ ...current, ...input, id: current.id, companyId, updatedAt: nowIso() });
    debugCatalogLog("update_supplier:start", {
        companyId,
        path,
        recordId: current.id,
        payload: { name: next.name, slug: next.slug, status: next.status },
    });
    try {
        const saved = await setSupplierToFirestore(companyId, next);
        if (!saved) {
            debugCatalogLog("update_supplier:db_unavailable", { companyId, path, recordId: current.id });
            return null;
        }
    } catch (error) {
        debugCatalogLog("update_supplier:failed", { companyId, path, recordId: current.id, error: toErrorMessage(error) });
        return null;
    }
    upsertMemory(memory.suppliersByCompany, companyId, next);
    touchReadCache(readCacheTouchedAt.suppliersByCompany, companyId);
    debugCatalogLog("update_supplier:success", { companyId, path, recordId: next.id });
    return next;
}

export async function deleteCatalogSupplier(supplierId: string, companyIdOverride?: string): Promise<boolean> {
    const companyId = await resolveCompanyIdOrThrow(companyIdOverride, "deleteCatalogSupplier");
    const path = catalogCollectionPath(companyId, "suppliers");
    const target = safeText(supplierId, 120);
    if (!target) return false;
    debugCatalogLog("delete_supplier:start", { companyId, path, recordId: target });
    try {
        const deleted = await deleteSupplierInFirestore(companyId, target);
        if (!deleted) {
            debugCatalogLog("delete_supplier:db_unavailable", { companyId, path, recordId: target });
            return false;
        }
    } catch (error) {
        debugCatalogLog("delete_supplier:failed", { companyId, path, recordId: target, error: toErrorMessage(error) });
        return false;
    }
    removeFromMemory(memory.suppliersByCompany, companyId, target);
    touchReadCache(readCacheTouchedAt.suppliersByCompany, companyId);
    debugCatalogLog("delete_supplier:success", { companyId, path, recordId: target });
    return true;
}

export async function updateCatalogProductNameEntry(entryId: string, input: Partial<ProductNameEntryDoc>): Promise<ProductNameEntryDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const current = (await listCatalogProductNameEntries("", scope.companyId)).find((item) => item.id === safeText(entryId, 120));
    if (!current) return null;
    const next = normalizeNameEntry({ ...current, ...input, id: current.id, companyId: scope.companyId, updatedAt: nowIso() });
    try {
        await setNameEntryToFirestore(scope.companyId, next);
    } catch {
        // fall back to warm memory when Firestore is unavailable
    }
    upsertMemory(memory.nameEntriesByCompany, scope.companyId, next);
    touchReadCache(readCacheTouchedAt.nameEntriesByCompany, scope.companyId);
    return next;
}

export async function deleteCatalogProductNameEntry(entryId: string): Promise<boolean> {
    const scope = await resolveSessionScope();
    if (!scope) return false;
    const target = safeText(entryId, 120);
    if (!target) return false;
    try {
        await deleteNameEntryInFirestore(scope.companyId, target);
    } catch {
        // fall back to warm memory when Firestore is unavailable
    }
    removeFromMemory(memory.nameEntriesByCompany, scope.companyId, target);
    touchReadCache(readCacheTouchedAt.nameEntriesByCompany, scope.companyId);
    return true;
}

export async function getCatalogDimensionBundle(companyIdOverride?: string): Promise<DimensionPickerBundle> {
    const [categories, brands, models] = await Promise.all([
        listCatalogCategories("", companyIdOverride),
        listCatalogBrands("", companyIdOverride),
        listCatalogModels("", companyIdOverride),
    ]);

    const toOption = (item: { id: string; name: string; slug: string; status: CatalogRecordStatus }) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
    });
    const toBrandOption = (item: BrandDoc) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        categoryNames: item.linkedCategoryNames ?? [],
    });
    const toModelOption = (item: ModelDoc) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        brandId: item.brandId,
        brandName: item.brandName,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
    });

    return {
        categories: categories.filter((item) => item.status === "active").map(toOption),
        brands: brands.filter((item) => item.status === "active").map(toBrandOption),
        models: models.filter((item) => item.status === "active").map(toModelOption),
    };
}
