"use client";

import { useUiLanguage } from "@/components/layout/ui-language-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { getUiText } from "@/lib/i18n/ui-text";
import { usedProductGradeLabel } from "@/components/used-products/used-product-labels";
import type { UsedProduct } from "@/lib/schema";

type UsedProductStatusBadgeProps = {
    product: Pick<UsedProduct, "grade" | "gradeLabel" | "isRefurbished" | "refurbishmentStatus" | "saleStatus">;
};

export function UsedProductStatusBadge({ product }: UsedProductStatusBadgeProps) {
    const lang = useUiLanguage();
    const ui = getUiText(lang).usedProductList;

    const gradeTone = product.grade === "GRADE_A" ? "success" : product.grade === "GRADE_D" ? "danger" : "neutral";
    const refurbTone = product.refurbishmentStatus === "refurbished" ? "success" : product.refurbishmentStatus === "refurbishing" ? "warning" : "neutral";
    const saleTone = product.saleStatus === "sold" ? "danger" : product.saleStatus === "available" ? "success" : "neutral";

    const saleLabel = ui.saleStatus[product.saleStatus];
    const refurbLabel = ui.refurbishmentStatus[product.refurbishmentStatus];

    return (
        <div className="flex flex-wrap items-center gap-1">
            <StatusBadge label={usedProductGradeLabel(product.grade, product.gradeLabel)} tone={gradeTone} />
            <StatusBadge label={refurbLabel} tone={refurbTone} />
            <StatusBadge label={saleLabel} tone={saleTone} />
        </div>
    );
}
