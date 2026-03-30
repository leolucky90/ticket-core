import { ArrowLeft, Pencil, Store, Wrench, Archive } from "lucide-react";
import { useUiLanguage } from "@/components/layout/ui-language-provider";
import { Card } from "@/components/ui/card";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { UsedProductStatusBadge } from "@/components/used-products/used-product-status-badge";
import { usedProductGradeLabel } from "@/components/used-products/used-product-labels";
import { getUiText } from "@/lib/i18n/ui-text";
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
    const lang = useUiLanguage();
    const ui = getUiText(lang).usedProductDetail;
    const listUi = getUiText(lang).usedProductList;
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
                    <IconActionButton href={`/products/used/${encodeURIComponent(product.id)}/edit`} icon={Pencil} label={ui.edit} tooltip={ui.editTooltip} />
                    <form action={createRefurbishmentCaseAction}>
                        <input type="hidden" name="usedProductId" value={product.id} />
                        <IconActionButton icon={Wrench} type="submit" label={ui.createCase} tooltip={ui.createCaseTooltip} />
                    </form>
                    {product.isPublished ? (
                        <form action={unpublishAction}>
                            <input type="hidden" name="id" value={product.id} />
                            <IconActionButton icon={Archive} type="submit" label={ui.unpublish} tooltip={ui.unpublishTooltip} />
                        </form>
                    ) : (
                        <form action={publishAction}>
                            <input type="hidden" name="id" value={product.id} />
                            <IconActionButton icon={Store} type="submit" label={ui.publish} tooltip={ui.publishTooltip} />
                        </form>
                    )}
                    <IconActionButton href="/products/used" icon={ArrowLeft} label={ui.backToList} tooltip={ui.backToListTooltip} />
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">{ui.basicInfo}</div>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                    <div>{ui.productName}：{fieldValue(product.name)}</div>
                    <div>{ui.brand}：{fieldValue(product.brand)}</div>
                    <div>{ui.model}：{fieldValue(product.model)}</div>
                    <div>{ui.type}：{fieldValue(product.type)}</div>
                    <div>{ui.serialOrImei}：{fieldValue(product.serialNumber || product.imeiNumber)}</div>
                    <div>{ui.grade}：{usedProductGradeLabel(product.grade, product.gradeLabel)}</div>
                    <div>{ui.specifications}：{fieldValue(product.specifications)}</div>
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">{ui.specificationInfo}</div>
                {product.specificationItems.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--muted))]">{ui.noSpecifications}</div>
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
                <div className="text-sm font-semibold">{ui.refurbishmentInfo}</div>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                    <div>{ui.needsRefurbishment}：{product.refurbishmentStatus !== "no_need_refurbishment" ? ui.yes : ui.no}</div>
                    <div>{ui.refurbishmentStatus}：{listUi.refurbishmentStatus[product.refurbishmentStatus]}</div>
                    <div className="md:col-span-2">{ui.refurbishmentNote}：{fieldValue(product.refurbishmentNote)}</div>
                    <div className="md:col-span-2">{ui.refurbishmentCaseId}：{fieldValue(product.refurbishmentCaseId)}</div>
                    <div className="md:col-span-2">{ui.refurbishmentCaseHistory}：{fieldValue((product.refurbishmentCaseIds ?? []).join("、"))}</div>
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">{ui.purchaseInfo}</div>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                    <div>{ui.purchaseDate}：{fieldValue(product.purchaseDate)}</div>
                    <div>{ui.purchasePrice}：{formatMoney(product.purchasePrice)}</div>
                    <div className="md:col-span-2">{ui.sourceNote}：{fieldValue(product.sourceNote)}</div>
                    <div className="md:col-span-2">{ui.inspectionResult}：{fieldValue(product.inspectionResult)}</div>
                    <div>{ui.inspectedBy}：{fieldValue(product.inspectedBy)}</div>
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">{ui.salesInfo}</div>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                    <div>{ui.suggestedSalePrice}：{formatMoney(product.suggestedSalePrice)}</div>
                    <div>{ui.salePrice}：{formatMoney(product.salePrice)}</div>
                    <div>{ui.isSellable}：{product.isSellable ? ui.yes : ui.no}</div>
                    <div>{ui.isPublished}：{product.isPublished ? ui.yes : ui.no}</div>
                    <div>{ui.saleStatus}：{listUi.saleStatus[product.saleStatus]}</div>
                    <div>{ui.soldAt}：{fieldValue(product.soldAt)}</div>
                    <div className="md:col-span-2">{ui.soldReceiptId}：{fieldValue(product.soldReceiptId)}</div>
                </div>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-semibold">{ui.warrantyInfo}</div>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                    <div>{ui.warrantyEnabled}：{product.warrantyEnabled ? ui.yes : ui.no}</div>
                    <div>{ui.warrantyDuration}：{product.warrantyDuration} {product.warrantyUnit}</div>
                    <div>{ui.warrantyStartsOn}：{product.warrantyStartsOn}</div>
                    <div>{ui.warrantyStartAt}：{fieldValue(product.warrantyStartAt)}</div>
                    <div>{ui.warrantyEndAt}：{fieldValue(product.warrantyEndAt)}</div>
                    <div className="md:col-span-2">{ui.warrantyNote}：{fieldValue(product.warrantyNote)}</div>
                </div>
            </Card>
        </div>
    );
}
