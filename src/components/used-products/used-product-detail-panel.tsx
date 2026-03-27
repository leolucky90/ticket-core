import { ArrowLeft, Pencil, Store, Wrench, Archive } from "lucide-react";
import { Card } from "@/components/ui/card";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { UsedProductStatusBadge } from "@/components/used-products/used-product-status-badge";
import { usedProductGradeLabel } from "@/components/used-products/used-product-labels";
import type { UsedProduct } from "@/lib/schema";

type UsedProductDetailPanelProps = {
    product: UsedProduct;
    publishAction: (formData: FormData) => Promise<void>;
    unpublishAction: (formData: FormData) => Promise<void>;
    createRefurbishmentCaseAction: (formData: FormData) => Promise<void>;
};

function fieldValue(value?: string | number | null): string {
    if (value === null || value === undefined) return "-";
    const text = String(value).trim();
    return text || "-";
}

function formatMoney(value?: number): string {
    return new Intl.NumberFormat("zh-TW").format(Math.max(0, value ?? 0));
}

export function UsedProductDetailPanel({
    product,
    publishAction,
    unpublishAction,
    createRefurbishmentCaseAction,
}: UsedProductDetailPanelProps) {
    return (
        <div className="grid gap-4">
            <Card className="grid gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <div className="text-lg font-semibold">{product.name}</div>
                        <div className="text-xs text-[rgb(var(--muted))]">{product.brand} / {product.model} / {product.type}</div>
                    </div>
                    <UsedProductStatusBadge
                        product={{
                            grade: product.grade,
                            gradeLabel: product.gradeLabel,
                            isRefurbished: product.isRefurbished,
                            refurbishmentStatus: product.refurbishmentStatus,
                            saleStatus: product.saleStatus,
                        }}
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <IconActionButton href={`/products/used/${encodeURIComponent(product.id)}/edit`} icon={Pencil} label="編輯" tooltip="編輯商品" />
                    <form action={createRefurbishmentCaseAction}>
                        <input type="hidden" name="usedProductId" value={product.id} />
                        <IconActionButton icon={Wrench} type="submit" label="建立案件" tooltip="建立或前往翻新案件" />
                    </form>
                    {product.isPublished ? (
                        <form action={unpublishAction}>
                            <input type="hidden" name="id" value={product.id} />
                            <IconActionButton icon={Archive} type="submit" label="下架" tooltip="下架商品" />
                        </form>
                    ) : (
                        <form action={publishAction}>
                            <input type="hidden" name="id" value={product.id} />
                            <IconActionButton icon={Store} type="submit" label="上架" tooltip="上架銷售" />
                        </form>
                    )}
                    <IconActionButton href="/products/used" icon={ArrowLeft} label="返回列表" tooltip="返回列表" />
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">商品基本資料</div>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                    <div>商品名稱：{fieldValue(product.name)}</div>
                    <div>品牌：{fieldValue(product.brand)}</div>
                    <div>型號：{fieldValue(product.model)}</div>
                    <div>類型：{fieldValue(product.type)}</div>
                    <div>序號：{fieldValue(product.serialNumber)}</div>
                    <div>IMEI：{fieldValue(product.imeiNumber)}</div>
                    <div>商品等級：{usedProductGradeLabel(product.grade, product.gradeLabel)}</div>
                    <div>規格摘要：{fieldValue(product.specifications)}</div>
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">商品規格</div>
                {product.specificationItems.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">尚未設定規格欄位。</div>
                ) : (
                    <div className="grid gap-2 md:grid-cols-2">
                        {product.specificationItems.map((row, index) => (
                            <div key={`${row.key}_${index}`} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">
                                <span className="text-[rgb(var(--muted))]">{fieldValue(row.key)}：</span>
                                <span>{fieldValue(row.value)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">翻新資訊</div>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                    <div>是否翻新：{product.isRefurbished ? "是" : "否"}</div>
                    <div>翻新狀態：{fieldValue(product.refurbishmentStatus)}</div>
                    <div className="md:col-span-2">翻新說明：{fieldValue(product.refurbishmentNote)}</div>
                    <div className="md:col-span-2">關聯案件：{fieldValue(product.refurbishmentCaseId)}</div>
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">收購資訊</div>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                    <div>收購日期：{fieldValue(product.purchaseDate)}</div>
                    <div>收購價格：{formatMoney(product.purchasePrice)}</div>
                    <div className="md:col-span-2">收購來源：{fieldValue(product.sourceNote)}</div>
                    <div className="md:col-span-2">驗機結果：{fieldValue(product.inspectionResult)}</div>
                    <div>經手人員：{fieldValue(product.inspectedBy)}</div>
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">銷售資訊</div>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                    <div>建議售價：{formatMoney(product.suggestedSalePrice)}</div>
                    <div>實際售價：{formatMoney(product.salePrice)}</div>
                    <div>可販售：{product.isSellable ? "是" : "否"}</div>
                    <div>上架狀態：{product.isPublished ? "已上架" : "未上架"}</div>
                    <div>銷售狀態：{fieldValue(product.saleStatus)}</div>
                    <div>售出時間：{fieldValue(product.soldAt)}</div>
                    <div className="md:col-span-2">收據 ID：{fieldValue(product.soldReceiptId)}</div>
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">保固資訊</div>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                    <div>是否啟用：{product.warrantyEnabled ? "是" : "否"}</div>
                    <div>時限：{product.warrantyDuration} {product.warrantyUnit}</div>
                    <div>起算方式：{product.warrantyStartsOn}</div>
                    <div>起始時間：{fieldValue(product.warrantyStartAt)}</div>
                    <div>結束時間：{fieldValue(product.warrantyEndAt)}</div>
                    <div className="md:col-span-2">保固說明：{fieldValue(product.warrantyNote)}</div>
                </div>
            </Card>
        </div>
    );
}
