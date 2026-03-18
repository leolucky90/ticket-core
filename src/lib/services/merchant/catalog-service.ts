import "server-only";
import type { BrandDoc, CategoryDoc, CatalogRecordStatus, DimensionPickerBundle, ModelDoc, ProductNameEntryDoc } from "@/lib/types/catalog";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";

const MAX_TEXT = 160;
const MAX_LONG = 800;
const MAX_LIST_SIZE = 400;

type SessionScope = {
    companyId: string;
};

const memory: {
    categoriesByCompany: Record<string, CategoryDoc[]>;
    brandsByCompany: Record<string, BrandDoc[]>;
    modelsByCompany: Record<string, ModelDoc[]>;
    nameEntriesByCompany: Record<string, ProductNameEntryDoc[]>;
} = {
    categoriesByCompany: {},
    brandsByCompany: {},
    modelsByCompany: {},
    nameEntriesByCompany: {},
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

function normalizeCompanyId(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/[/?#]/.test(trimmed)) return null;
    return trimmed;
}

async function resolveSessionScope(): Promise<SessionScope | null> {
    const session = await getSessionUser();
    if (!session) return null;
    const user = await getUserDoc(session.uid);
    if (!user) return null;
    if (toAccountType(user.role) !== "company") return null;
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

function categoriesRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/categories`);
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

function queryByKeyword<T>(list: T[], keyword: string, resolver: (item: T) => string[]): T[] {
    const q = safeText(keyword, 120).toLowerCase();
    if (!q) return list;
    return list.filter((item) => resolver(item).join(" ").toLowerCase().includes(q));
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

async function setCategoryToFirestore(companyId: string, doc: CategoryDoc): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await categoriesRef(db, companyId).doc(doc.id).set(doc, { merge: true });
    return true;
}

async function setBrandToFirestore(companyId: string, doc: BrandDoc): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await brandsRef(db, companyId).doc(doc.id).set(doc, { merge: true });
    return true;
}

async function setModelToFirestore(companyId: string, doc: ModelDoc): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await modelsRef(db, companyId).doc(doc.id).set(doc, { merge: true });
    return true;
}

async function setNameEntryToFirestore(companyId: string, doc: ProductNameEntryDoc): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;
    await nameEntriesRef(db, companyId).doc(doc.id).set(doc, { merge: true });
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

export async function listCatalogCategories(keyword = ""): Promise<CategoryDoc[]> {
    const scope = await resolveSessionScope();
    if (!scope) return [];
    let list: CategoryDoc[] = [];
    try {
        const fsList = await listCategoriesFromFirestore(scope.companyId);
        if (fsList) {
            list = fsList;
            replaceMemoryList(memory.categoriesByCompany, scope.companyId, fsList);
        } else {
            list = listFromMemory(memory.categoriesByCompany, scope.companyId);
        }
    } catch {
        list = listFromMemory(memory.categoriesByCompany, scope.companyId);
    }
    return queryByKeyword(
        list.map((item) => normalizeCategory(item)).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "zh-Hant")),
        keyword,
        (item) => [item.name, item.slug, item.description ?? ""],
    );
}

export async function listCatalogBrands(keyword = ""): Promise<BrandDoc[]> {
    const scope = await resolveSessionScope();
    if (!scope) return [];
    let list: BrandDoc[] = [];
    try {
        const fsList = await listBrandsFromFirestore(scope.companyId);
        if (fsList) {
            list = fsList;
            replaceMemoryList(memory.brandsByCompany, scope.companyId, fsList);
        } else {
            list = listFromMemory(memory.brandsByCompany, scope.companyId);
        }
    } catch {
        list = listFromMemory(memory.brandsByCompany, scope.companyId);
    }
    return queryByKeyword(
        list.map((item) => normalizeBrand(item)).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "zh-Hant")),
        keyword,
        (item) => [item.name, item.slug, item.description ?? ""],
    );
}

export async function listCatalogModels(keyword = ""): Promise<ModelDoc[]> {
    const scope = await resolveSessionScope();
    if (!scope) return [];
    let list: ModelDoc[] = [];
    try {
        const fsList = await listModelsFromFirestore(scope.companyId);
        if (fsList) {
            list = fsList;
            replaceMemoryList(memory.modelsByCompany, scope.companyId, fsList);
        } else {
            list = listFromMemory(memory.modelsByCompany, scope.companyId);
        }
    } catch {
        list = listFromMemory(memory.modelsByCompany, scope.companyId);
    }
    return queryByKeyword(
        list.map((item) => normalizeModel(item)).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "zh-Hant")),
        keyword,
        (item) => [item.name, item.slug, item.brandName ?? "", item.categoryName ?? "", item.description ?? ""],
    );
}

export async function listCatalogProductNameEntries(keyword = ""): Promise<ProductNameEntryDoc[]> {
    const scope = await resolveSessionScope();
    if (!scope) return [];
    let list: ProductNameEntryDoc[] = [];
    try {
        const fsList = await listNameEntriesFromFirestore(scope.companyId);
        if (fsList) {
            list = fsList;
            replaceMemoryList(memory.nameEntriesByCompany, scope.companyId, fsList);
        } else {
            list = listFromMemory(memory.nameEntriesByCompany, scope.companyId);
        }
    } catch {
        list = listFromMemory(memory.nameEntriesByCompany, scope.companyId);
    }
    return queryByKeyword(
        list.map((item) => normalizeNameEntry(item)).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "zh-Hant")),
        keyword,
        (item) => [item.name, item.slug, ...(item.aliases ?? []), item.categoryName ?? "", item.description ?? ""],
    );
}

export async function createCatalogCategory(input: Partial<CategoryDoc>): Promise<CategoryDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const ts = nowIso();
    const next = normalizeCategory({ id: id("category"), companyId: scope.companyId, ...input, createdAt: ts, updatedAt: ts });
    try {
        const saved = await setCategoryToFirestore(scope.companyId, next);
        if (!saved) upsertMemory(memory.categoriesByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.categoriesByCompany, scope.companyId, next);
    }
    return next;
}

export async function updateCatalogCategory(categoryId: string, input: Partial<CategoryDoc>): Promise<CategoryDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const current = (await listCatalogCategories()).find((item) => item.id === safeText(categoryId, 120));
    if (!current) return null;
    const next = normalizeCategory({ ...current, ...input, id: current.id, companyId: scope.companyId, updatedAt: nowIso() });
    try {
        const saved = await setCategoryToFirestore(scope.companyId, next);
        if (!saved) upsertMemory(memory.categoriesByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.categoriesByCompany, scope.companyId, next);
    }
    return next;
}

export async function deleteCatalogCategory(categoryId: string): Promise<boolean> {
    const scope = await resolveSessionScope();
    if (!scope) return false;
    const target = safeText(categoryId, 120);
    if (!target) return false;
    try {
        const deleted = await deleteCategoryInFirestore(scope.companyId, target);
        if (deleted === null) removeFromMemory(memory.categoriesByCompany, scope.companyId, target);
    } catch {
        removeFromMemory(memory.categoriesByCompany, scope.companyId, target);
    }
    return true;
}

export async function createCatalogBrand(input: Partial<BrandDoc>): Promise<BrandDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const ts = nowIso();
    const next = normalizeBrand({ id: id("brand"), companyId: scope.companyId, ...input, createdAt: ts, updatedAt: ts });
    try {
        const saved = await setBrandToFirestore(scope.companyId, next);
        if (!saved) upsertMemory(memory.brandsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.brandsByCompany, scope.companyId, next);
    }
    return next;
}

export async function updateCatalogBrand(brandId: string, input: Partial<BrandDoc>): Promise<BrandDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const current = (await listCatalogBrands()).find((item) => item.id === safeText(brandId, 120));
    if (!current) return null;
    const next = normalizeBrand({ ...current, ...input, id: current.id, companyId: scope.companyId, updatedAt: nowIso() });
    try {
        const saved = await setBrandToFirestore(scope.companyId, next);
        if (!saved) upsertMemory(memory.brandsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.brandsByCompany, scope.companyId, next);
    }
    return next;
}

export async function deleteCatalogBrand(brandId: string): Promise<boolean> {
    const scope = await resolveSessionScope();
    if (!scope) return false;
    const target = safeText(brandId, 120);
    if (!target) return false;
    try {
        const deleted = await deleteBrandInFirestore(scope.companyId, target);
        if (deleted === null) removeFromMemory(memory.brandsByCompany, scope.companyId, target);
    } catch {
        removeFromMemory(memory.brandsByCompany, scope.companyId, target);
    }
    return true;
}

export async function createCatalogModel(input: Partial<ModelDoc>): Promise<ModelDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const ts = nowIso();
    const next = normalizeModel({ id: id("model"), companyId: scope.companyId, ...input, createdAt: ts, updatedAt: ts });
    try {
        const saved = await setModelToFirestore(scope.companyId, next);
        if (!saved) upsertMemory(memory.modelsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.modelsByCompany, scope.companyId, next);
    }
    return next;
}

export async function updateCatalogModel(modelId: string, input: Partial<ModelDoc>): Promise<ModelDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const current = (await listCatalogModels()).find((item) => item.id === safeText(modelId, 120));
    if (!current) return null;
    const next = normalizeModel({ ...current, ...input, id: current.id, companyId: scope.companyId, updatedAt: nowIso() });
    try {
        const saved = await setModelToFirestore(scope.companyId, next);
        if (!saved) upsertMemory(memory.modelsByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.modelsByCompany, scope.companyId, next);
    }
    return next;
}

export async function deleteCatalogModel(modelId: string): Promise<boolean> {
    const scope = await resolveSessionScope();
    if (!scope) return false;
    const target = safeText(modelId, 120);
    if (!target) return false;
    try {
        const deleted = await deleteModelInFirestore(scope.companyId, target);
        if (deleted === null) removeFromMemory(memory.modelsByCompany, scope.companyId, target);
    } catch {
        removeFromMemory(memory.modelsByCompany, scope.companyId, target);
    }
    return true;
}

export async function createCatalogProductNameEntry(input: Partial<ProductNameEntryDoc>): Promise<ProductNameEntryDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const ts = nowIso();
    const next = normalizeNameEntry({ id: id("name_entry"), companyId: scope.companyId, ...input, createdAt: ts, updatedAt: ts });
    try {
        const saved = await setNameEntryToFirestore(scope.companyId, next);
        if (!saved) upsertMemory(memory.nameEntriesByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.nameEntriesByCompany, scope.companyId, next);
    }
    return next;
}

export async function updateCatalogProductNameEntry(entryId: string, input: Partial<ProductNameEntryDoc>): Promise<ProductNameEntryDoc | null> {
    const scope = await resolveSessionScope();
    if (!scope) return null;
    const current = (await listCatalogProductNameEntries()).find((item) => item.id === safeText(entryId, 120));
    if (!current) return null;
    const next = normalizeNameEntry({ ...current, ...input, id: current.id, companyId: scope.companyId, updatedAt: nowIso() });
    try {
        const saved = await setNameEntryToFirestore(scope.companyId, next);
        if (!saved) upsertMemory(memory.nameEntriesByCompany, scope.companyId, next);
    } catch {
        upsertMemory(memory.nameEntriesByCompany, scope.companyId, next);
    }
    return next;
}

export async function deleteCatalogProductNameEntry(entryId: string): Promise<boolean> {
    const scope = await resolveSessionScope();
    if (!scope) return false;
    const target = safeText(entryId, 120);
    if (!target) return false;
    try {
        const deleted = await deleteNameEntryInFirestore(scope.companyId, target);
        if (deleted === null) removeFromMemory(memory.nameEntriesByCompany, scope.companyId, target);
    } catch {
        removeFromMemory(memory.nameEntriesByCompany, scope.companyId, target);
    }
    return true;
}

export async function getCatalogDimensionBundle(): Promise<DimensionPickerBundle> {
    const [categories, brands, models, entries] = await Promise.all([
        listCatalogCategories(),
        listCatalogBrands(),
        listCatalogModels(),
        listCatalogProductNameEntries(),
    ]);

    const toOption = (item: { id: string; name: string; slug: string; status: CatalogRecordStatus }) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
    });

    return {
        categories: categories.filter((item) => item.status === "active").map(toOption),
        brands: brands.filter((item) => item.status === "active").map(toOption),
        models: models.filter((item) => item.status === "active").map(toOption),
        nameEntries: entries.filter((item) => item.status === "active").map(toOption),
    };
}
