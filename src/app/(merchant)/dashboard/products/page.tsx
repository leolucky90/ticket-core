import { ProductManagementWorkspace } from "@/components/dashboard/ProductManagementWorkspace";
import { MerchantPageShell } from "@/components/merchant/shell";
import { getCatalogDimensionBundle } from "@/lib/services/merchant/catalog-service";
import { buildDimensionBundleFromProducts, listMerchantProducts } from "@/lib/services/merchant/product-service";
import { createProduct, deleteProduct, listProducts, updateProduct } from "@/lib/services/commerce";
import type { Product } from "@/lib/types/commerce";

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
    }>;
};

function parseOptionalNumber(text: string): number | null {
    if (!text) return null;
    const value = Number.parseInt(text, 10);
    if (!Number.isFinite(value) || value < 0) return null;
    return value;
}

function matchesKeyword(product: Product, keyword: string): boolean {
    if (!keyword) return true;
    const q = keyword.toLowerCase();
    return [
        product.name,
        product.sku,
        product.supplier,
        product.categoryName,
        product.brandName,
        product.modelName,
        product.nameEntryName,
        product.customLabel,
    ]
        .join(" ")
        .toLowerCase()
        .includes(q);
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

    const minStock = parseOptionalNumber(minStockInput);
    const maxStock = parseOptionalNumber(maxStockInput);
    const minPrice = parseOptionalNumber(minPriceInput);
    const maxPrice = parseOptionalNumber(maxPriceInput);

    const allProducts = await listProducts();
    const products = allProducts.filter((product) => {
        if (!matchesKeyword(product, productKeyword)) return false;
        if (supplierFilter && product.supplier !== supplierFilter) return false;
        if (statusFilter && (product.status ?? "active") !== statusFilter) return false;
        if (categoryFilter && (product.categoryId || "") !== categoryFilter) return false;
        if (brandFilter && (product.brandId || "") !== brandFilter) return false;
        if (modelFilter && (product.modelId || "") !== modelFilter) return false;
        if (minStock !== null && product.stock < minStock) return false;
        if (maxStock !== null && product.stock > maxStock) return false;
        if (minPrice !== null && product.price < minPrice) return false;
        if (maxPrice !== null && product.price > maxPrice) return false;
        return true;
    });
    const supplierOptions = Array.from(
        new Set(
            allProducts
                .map((product) => product.supplier.trim())
                .filter((supplier) => supplier.length > 0),
        ),
    ).sort((a, b) => a.localeCompare(b, "zh-Hant"));
    const [catalogBundle, merchantProducts] = await Promise.all([getCatalogDimensionBundle(), listMerchantProducts()]);
    const fallbackBundle = buildDimensionBundleFromProducts(merchantProducts);
    const dimensionBundle = {
        categories: catalogBundle.categories.length > 0 ? catalogBundle.categories : fallbackBundle.categories,
        brands: catalogBundle.brands.length > 0 ? catalogBundle.brands : fallbackBundle.brands,
        models: catalogBundle.models.length > 0 ? catalogBundle.models : fallbackBundle.models,
        nameEntries: catalogBundle.nameEntries.length > 0 ? catalogBundle.nameEntries : fallbackBundle.nameEntries,
    };

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
                products={products}
                productKeyword={productKeyword}
                supplierOptions={supplierOptions}
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
                createProductAction={createProduct}
                updateProductAction={updateProduct}
                deleteProductAction={deleteProduct}
            />
        </MerchantPageShell>
    );
}
