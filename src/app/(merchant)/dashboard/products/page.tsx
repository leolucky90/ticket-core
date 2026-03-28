import { ProductManagementWorkspace } from "@/components/dashboard/ProductManagementWorkspace";
import { MerchantPageShell } from "@/components/merchant/shell";
import { decodeCursorStack, encodeCursorStack, parseListPageSize } from "@/lib/pagination/query-controls";
import { getCatalogDimensionBundle, listCatalogSuppliers } from "@/lib/services/merchant/catalog-service";
import { listRepairBrands, queryProductsPage } from "@/lib/services/merchant/inventory-read-model.service";
import { createProduct, deleteProduct, updateProduct } from "@/lib/services/merchant/product-write.service";
import type { DimensionOption } from "@/lib/types/catalog";

type ProductManagementPageProps = {
    searchParams: Promise<{
        flash?: string;
        ts?: string;
        productQ?: string;
        supplier?: string;
        categoryId?: string;
        brandId?: string;
        modelId?: string;
        status?: string;
        minStock?: string;
        maxStock?: string;
        minPrice?: string;
        maxPrice?: string;
        pageSize?: string;
        cursor?: string;
        cursorStack?: string;
    }>;
};

function parseOptionalNumber(text: string): number | null {
    if (!text) return null;
    const value = Number.parseInt(text, 10);
    if (!Number.isFinite(value) || value < 0) return null;
    return value;
}

function dedupeDimensionOptions(items: DimensionOption[]): DimensionOption[] {
    const seen = new Set<string>();
    const out: DimensionOption[] = [];

    for (const item of items) {
        const id = (item.id ?? "").trim();
        const name = (item.name ?? "").trim();
        const brandId = (item.brandId ?? "").trim();
        const brandName = (item.brandName ?? "").trim();
        const categoryId = (item.categoryId ?? "").trim();
        const categoryName = (item.categoryName ?? "").trim();
        if (!id && !name) continue;
        const normalized: DimensionOption = {
            id: id || name,
            name: name || id,
            slug: item.slug,
            brandId: brandId || undefined,
            brandName: brandName || undefined,
            categoryId: categoryId || undefined,
            categoryName: categoryName || undefined,
        };
        const key = `${normalized.id}::${normalized.name}::${brandId}::${categoryId}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(normalized);
    }

    return out.sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
}

export default async function ProductManagementPage({ searchParams }: ProductManagementPageProps) {
    const sp = await searchParams;
    const productKeyword = (sp.productQ ?? "").trim();
    const supplierFilter = (sp.supplier ?? "").trim();
    const categoryFilter = (sp.categoryId ?? "").trim();
    const brandFilter = (sp.brandId ?? "").trim();
    const modelFilter = (sp.modelId ?? "").trim();
    const statusFilter = (sp.status ?? "").trim();
    const minStockInput = (sp.minStock ?? "").trim();
    const maxStockInput = (sp.maxStock ?? "").trim();
    const minPriceInput = (sp.minPrice ?? "").trim();
    const maxPriceInput = (sp.maxPrice ?? "").trim();
    const currentCursor = (sp.cursor ?? "").trim();
    const currentCursorStack = decodeCursorStack((sp.cursorStack ?? "").trim());
    const pageSize = parseListPageSize((sp.pageSize ?? "").trim(), "20");

    const minStock = parseOptionalNumber(minStockInput);
    const maxStock = parseOptionalNumber(maxStockInput);
    const minPrice = parseOptionalNumber(minPriceInput);
    const maxPrice = parseOptionalNumber(maxPriceInput);

    const [productPage, catalogBundle, supplierRecords] = await Promise.all([
        queryProductsPage({
            keyword: productKeyword,
            supplier: supplierFilter || undefined,
            categoryId: categoryFilter || undefined,
            brandId: brandFilter || undefined,
            modelId: modelFilter || undefined,
            status: statusFilter || undefined,
            minStock,
            maxStock,
            minPrice,
            maxPrice,
            pageSize,
            cursor: currentCursor || undefined,
        }),
        getCatalogDimensionBundle(),
        listCatalogSuppliers(),
    ]);
    const needsRepairFallback = catalogBundle.brands.length === 0 || catalogBundle.models.length === 0;
    const repairBrands = needsRepairFallback ? await listRepairBrands() : [];
    const fallbackBrandOptions = dedupeDimensionOptions(repairBrands.map((brand) => ({ id: brand.id, name: brand.name })));
    const fallbackModelOptions = dedupeDimensionOptions(
        repairBrands.flatMap((brand) =>
            brand.models.map((modelName) => ({
                id: modelName,
                name: modelName,
                brandId: brand.id,
                brandName: brand.name,
            })),
        ),
    );
    const dimensionBundle = {
        categories: catalogBundle.categories,
        brands: catalogBundle.brands.length > 0 ? catalogBundle.brands : fallbackBrandOptions,
        models: catalogBundle.models.length > 0 ? catalogBundle.models : fallbackModelOptions,
    };
    const previousCursor = currentCursorStack.at(-1) ?? "";
    const previousCursorStack = encodeCursorStack(currentCursorStack.slice(0, -1));
    const nextCursorStack = encodeCursorStack(currentCursor ? [...currentCursorStack, currentCursor] : currentCursorStack);

    return (
        <MerchantPageShell
            title="產品管理"
            subtitle="營運型清單頁，集中處理搜尋、篩選與產品維護。"
            width="index"
            tabs={[
                { id: "inventory-stock", label: "庫存", href: "/dashboard?tab=inventory&inventoryView=stock" },
                { id: "inventory-settings", label: "庫存設置", href: "/dashboard?tab=inventory&inventoryView=settings" },
                { id: "inventory-stock-in", label: "入庫", href: "/dashboard?tab=inventory&inventoryView=stock-in" },
                { id: "inventory-stock-out", label: "出庫", href: "/dashboard?tab=inventory&inventoryView=stock-out" },
                { id: "inventory-products", label: "產品管理", href: "/dashboard/products" },
            ]}
        >
            <ProductManagementWorkspace
                products={productPage.items}
                productKeyword={productKeyword}
                supplierItems={supplierRecords.map((supplier) => ({ id: supplier.id, name: supplier.name, status: supplier.status }))}
                supplierFilter={supplierFilter}
                categoryFilter={categoryFilter}
                brandFilter={brandFilter}
                modelFilter={modelFilter}
                statusFilter={statusFilter}
                minStock={minStockInput}
                maxStock={maxStockInput}
                minPrice={minPriceInput}
                maxPrice={maxPriceInput}
                dimensionBundle={dimensionBundle}
                flash={(sp.flash ?? "").trim()}
                actionTs={(sp.ts ?? "").trim()}
                pageSize={String(productPage.pageSize)}
                currentCursor={currentCursor}
                currentCursorStack={encodeCursorStack(currentCursorStack)}
                previousCursor={previousCursor}
                previousCursorStack={previousCursorStack}
                nextCursor={productPage.nextCursor}
                nextCursorStack={nextCursorStack}
                hasNextPage={productPage.hasNextPage}
                createProductAction={createProduct}
                updateProductAction={updateProduct}
                deleteProductAction={deleteProduct}
            />
        </MerchantPageShell>
    );
}
