import { ProductManagementWorkspace } from "@/components/dashboard/ProductManagementWorkspace";
import { Section } from "@/components/ui/section";
import { createProduct, deleteProduct, listProducts, updateProduct } from "@/lib/services/commerce";
import type { Product } from "@/lib/types/commerce";

type ProductManagementPageProps = {
    searchParams: Promise<{
        flash?: string;
        ts?: string;
        productQ?: string;
        supplier?: string;
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
    return [product.name, product.sku, product.supplier].join(" ").toLowerCase().includes(q);
}

export default async function ProductManagementPage({ searchParams }: ProductManagementPageProps) {
    const sp = await searchParams;
    const productKeyword = (sp.productQ ?? "").trim();
    const supplierFilter = (sp.supplier ?? "").trim();
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

    return (
        <Section title="產品管理">
            <ProductManagementWorkspace
                products={products}
                productKeyword={productKeyword}
                supplierOptions={supplierOptions}
                supplierFilter={supplierFilter}
                minStock={minStockInput}
                maxStock={maxStockInput}
                minPrice={minPriceInput}
                maxPrice={maxPriceInput}
                flash={(sp.flash ?? "").trim()}
                actionTs={(sp.ts ?? "").trim()}
                createProductAction={createProduct}
                updateProductAction={updateProduct}
                deleteProductAction={deleteProduct}
            />
        </Section>
    );
}
