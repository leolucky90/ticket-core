import type { UsedProductGrade, UsedProductRefurbishmentStatus, UsedProductSaleStatus } from "@/lib/schema";

export function usedProductGradeLabel(grade: UsedProductGrade, gradeLabel?: string): string {
    if (grade === "GRADE_A") return "Grade A";
    if (grade === "GRADE_B") return "Grade B";
    if (grade === "GRADE_C") return "Grade C";
    if (grade === "GRADE_D") return "Grade D";
    return gradeLabel?.trim() || "自訂";
}

export function usedProductRefurbishmentLabel(status: UsedProductRefurbishmentStatus): string {
    if (status === "waiting_refurbishment") return "等待翻新";
    if (status === "no_need_refurbishment") return "不須翻新";
    if (status === "refurbishing") return "翻新中";
    return "已翻新";
}

export function usedProductSaleStatusLabel(status: UsedProductSaleStatus): string {
    if (status === "draft") return "草稿";
    if (status === "purchased") return "已收購";
    if (status === "inspecting") return "驗機中";
    if (status === "available") return "可銷售";
    if (status === "reserved") return "已保留";
    if (status === "sold") return "已售出";
    if (status === "returned") return "已退貨";
    return "已封存";
}
