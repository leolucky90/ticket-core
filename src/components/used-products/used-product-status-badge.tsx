import { StatusBadge } from "@/components/ui/status-badge";
import { usedProductGradeLabel, usedProductRefurbishmentLabel, usedProductSaleStatusLabel } from "@/components/used-products/used-product-labels";
import type { UsedProduct } from "@/lib/schema";

type UsedProductStatusBadgeProps = {
    product: Pick<UsedProduct, "grade" | "gradeLabel" | "isRefurbished" | "refurbishmentStatus" | "saleStatus">;
};

export function UsedProductStatusBadge({ product }: UsedProductStatusBadgeProps) {
    const gradeTone = product.grade === "GRADE_A" ? "success" : product.grade === "GRADE_D" ? "danger" : "neutral";
    const refurbTone = product.refurbishmentStatus === "refurbished" ? "success" : product.refurbishmentStatus === "refurbishing" ? "warning" : "neutral";
    const saleTone = product.saleStatus === "sold" ? "danger" : product.saleStatus === "available" ? "success" : "neutral";

    return (
        <div className="flex flex-wrap items-center gap-1">
            <StatusBadge label={usedProductGradeLabel(product.grade, product.gradeLabel)} tone={gradeTone} />
            <StatusBadge label={usedProductRefurbishmentLabel(product.refurbishmentStatus)} tone={refurbTone} />
            <StatusBadge label={usedProductSaleStatusLabel(product.saleStatus)} tone={saleTone} />
            <StatusBadge label={product.isRefurbished ? "已翻新" : "未翻新"} tone={product.isRefurbished ? "success" : "neutral"} />
        </div>
    );
}
