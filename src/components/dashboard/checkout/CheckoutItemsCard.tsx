"use client";

import { CirclePlus, Eye, PackagePlus, ShoppingCart, Tag, Trash2 } from "lucide-react";
import { MerchantSectionCard } from "@/components/merchant/shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import { UsedProductStatusBadge } from "@/components/used-products";
import type { Activity } from "@/lib/types/promotion";
import type { PredictiveSearchSuggestion } from "@/lib/types/search";
import type { Product } from "@/lib/types/merchant-product";
import type { UsedProduct } from "@/lib/schema";
import type { UiLanguage } from "@/lib/i18n/ui-text";
import type { CheckoutLineDraft, CheckoutPromotionSelectionDraft } from "@/components/dashboard/checkout/checkout-workspace.types";

type CheckoutItemsCardProps = {
    ui: ReturnType<typeof import("@/lib/i18n/ui-text").getUiText>["checkoutWorkspace"];
    lang: UiLanguage;
    activeActivities: Activity[];
    lineDetails: Array<{
        line: CheckoutLineDraft;
        product: Product | null;
        usedProduct: UsedProduct | null;
        unitPrice: number;
        subtotal: number;
    }>;
    filteredUsedProducts: UsedProduct[];
    selectedPromotions: CheckoutPromotionSelectionDraft[];
    selectedActivityIdSet: Set<string>;
    usedProductQuery: string;
    usedPickerOpen: boolean;
    promotionsPickerOpen: boolean;
    onUsedProductQueryChange: (value: string) => void;
    onUsedPickerOpenChange: (open: boolean) => void;
    onPromotionsPickerOpenChange: (open: boolean) => void;
    onAppendLine: (productId?: string, options?: { isUsedProduct?: boolean; usedProductId?: string }) => void;
    onAppendUsedProductLine: (usedProductId: string) => void;
    onRemoveLine: (lineId: string) => void;
    onLineQtyChange: (lineId: string, qty: number) => void;
    onLineProductSelect: (lineId: string, suggestion: PredictiveSearchSuggestion) => void;
    onResolveProductFromSuggestion: (item: PredictiveSearchSuggestion) => Product | null;
    onToggleActivitySelection: (activity: Activity, checked: boolean) => void;
    onUpdateSelectedPromotion: (promotionId: string, updater: (row: CheckoutPromotionSelectionDraft) => CheckoutPromotionSelectionDraft) => void;
    formatMoney: (value: number, lang: UiLanguage) => string;
    formatDateOnly: (ts: number) => string;
    activityEffectText: (effectType: Activity["effectType"]) => string;
};

export function CheckoutItemsCard({
    ui,
    lang,
    activeActivities,
    lineDetails,
    filteredUsedProducts,
    selectedPromotions,
    selectedActivityIdSet,
    usedProductQuery,
    usedPickerOpen,
    promotionsPickerOpen,
    onUsedProductQueryChange,
    onUsedPickerOpenChange,
    onPromotionsPickerOpenChange,
    onAppendLine,
    onAppendUsedProductLine,
    onRemoveLine,
    onLineQtyChange,
    onLineProductSelect,
    onResolveProductFromSuggestion,
    onToggleActivitySelection,
    onUpdateSelectedPromotion,
    formatMoney,
    formatDateOnly,
    activityEffectText,
}: CheckoutItemsCardProps) {
    return (
        <MerchantSectionCard
            title={ui.linesSection}
            description={ui.linesSectionDescription}
            actions={
                <>
                    <IconTextActionButton icon={CirclePlus} type="button" label={ui.addLine} tooltip={ui.addLineTooltip} onClick={() => onAppendLine()} />
                    <IconTextActionButton
                        icon={PackagePlus}
                        type="button"
                        label={ui.addUsedLine}
                        tooltip={ui.addUsedLineTooltip}
                        onClick={() => onUsedPickerOpenChange(true)}
                    />
                    <IconTextActionButton
                        icon={Tag}
                        type="button"
                        label={ui.openPromotionsPicker}
                        tooltip={ui.openPromotionsPickerTooltip}
                        onClick={() => onPromotionsPickerOpenChange(true)}
                    />
                </>
            }
            bodyClassName="grid gap-3"
        >
            <MerchantPredictiveSearchInput
                placeholder={ui.productSearchPlaceholder}
                targets={["checkout_items"]}
                onSelect={(item) => {
                    const matched = onResolveProductFromSuggestion(item);
                    if (!matched) return;
                    onAppendLine(matched.id);
                }}
            />

            {usedPickerOpen ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="checkout-used-picker-title">
                    <button type="button" className="absolute inset-0 bg-[rgb(var(--text))]/25" aria-label={ui.usedModalClose} onClick={() => onUsedPickerOpenChange(false)} />
                    <div className="relative z-10 flex max-h-[min(640px,88vh)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] shadow-lg">
                        <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border))] px-4 py-3">
                            <h3 id="checkout-used-picker-title" className="text-base font-semibold text-[rgb(var(--text))]">{ui.usedModalTitle}</h3>
                            <button type="button" className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-1.5 text-sm text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel))]" onClick={() => onUsedPickerOpenChange(false)}>
                                {ui.usedModalClose}
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto p-4">
                            <div className="grid gap-3">
                                <Input value={usedProductQuery} onChange={(event) => onUsedProductQueryChange(event.currentTarget.value)} placeholder={ui.usedSearchPlaceholder} className="h-10" />
                                {filteredUsedProducts.length === 0 ? (
                                    <div className="text-sm text-[rgb(var(--muted))]">{ui.noSellableUsed}</div>
                                ) : (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {filteredUsedProducts.map((item) => (
                                            <div key={`used-modal-${item.id}`} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                                <div className="mb-2 flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <div className="truncate font-medium text-[rgb(var(--text))]">{item.name}</div>
                                                        <div className="text-xs text-[rgb(var(--muted))]">{item.brand} / {item.model} / {item.serialNumber || item.imeiNumber || "-"}</div>
                                                    </div>
                                                    <UsedProductStatusBadge
                                                        product={{
                                                            grade: item.grade,
                                                            gradeLabel: item.gradeLabel,
                                                            isRefurbished: item.isRefurbished,
                                                            refurbishmentStatus: item.refurbishmentStatus,
                                                            saleStatus: item.saleStatus,
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="text-sm">{ui.salePrice}{formatMoney(item.salePrice ?? item.suggestedSalePrice ?? 0, lang)}</div>
                                                    <div className="flex gap-1">
                                                        <IconActionButton href={`/products/used/${encodeURIComponent(item.id)}`} icon={Eye} label={ui.viewUsedProduct} tooltip={ui.viewUsedProductTooltip} />
                                                        <IconActionButton
                                                            icon={ShoppingCart}
                                                            label={ui.addToCart}
                                                            tooltip={ui.addToCartTooltip}
                                                            onClick={() => {
                                                                onAppendUsedProductLine(item.id);
                                                                onUsedPickerOpenChange(false);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {promotionsPickerOpen ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="checkout-promotions-picker-title">
                    <button type="button" className="absolute inset-0 bg-[rgb(var(--text))]/25" aria-label={ui.promotionsModalClose} onClick={() => onPromotionsPickerOpenChange(false)} />
                    <div className="relative z-10 flex max-h-[min(720px,90vh)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] shadow-lg">
                        <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border))] px-4 py-3">
                            <h3 id="checkout-promotions-picker-title" className="text-base font-semibold text-[rgb(var(--text))]">{ui.promotionsModalTitle}</h3>
                            <button type="button" className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-1.5 text-sm text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel))]" onClick={() => onPromotionsPickerOpenChange(false)}>
                                {ui.promotionsModalClose}
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                            {activeActivities.length === 0 ? (
                                <div className="text-sm text-[rgb(var(--muted))]">{ui.noActiveActivities}</div>
                            ) : (
                                <div className="grid gap-2">
                                    {activeActivities.map((activity) => {
                                        const checked = selectedActivityIdSet.has(activity.id);
                                        return (
                                            <label
                                                key={activity.id}
                                                className={[
                                                    "flex items-start gap-2 rounded-lg border p-3 text-sm",
                                                    checked ? "border-[rgb(var(--accent))] bg-[rgb(var(--panel2))]" : "border-[rgb(var(--border))]",
                                                ].join(" ")}
                                            >
                                                <input type="checkbox" checked={checked} onChange={(event) => onToggleActivitySelection(activity, event.target.checked)} className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]" />
                                                <div className="grid gap-1">
                                                    <div className="font-medium">{activity.name}</div>
                                                    <div className="text-xs text-[rgb(var(--muted))]">{ui.activityPeriod} {formatDateOnly(activity.startAt)} ~ {formatDateOnly(activity.endAt)}</div>
                                                    <div className="text-xs text-[rgb(var(--muted))]">{ui.activityEffectLabel} {activityEffectText(activity.effectType)}</div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {selectedPromotions.length > 0 ? (
                                <div className="grid gap-2 border-t border-[rgb(var(--border))] pt-3">
                                    <div className="text-xs text-[rgb(var(--muted))]">{ui.promotionDetailsHint}</div>
                                    {selectedPromotions.map((activity) => (
                                        <details key={activity.promotionId} open className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                            <summary className="cursor-pointer text-sm font-medium">{activity.promotionName} / {activityEffectText(activity.effectType)}</summary>
                                            <div className="mt-2 grid gap-2 md:grid-cols-2">
                                                <label className="grid gap-1 text-sm">
                                                    <span className="text-xs text-[rgb(var(--muted))]">{ui.activityName}</span>
                                                    <Input value={activity.promotionName} onChange={(event) => onUpdateSelectedPromotion(activity.promotionId, (current) => ({ ...current, promotionName: event.target.value }))} />
                                                </label>
                                                <label className="grid gap-1 text-sm md:col-span-2">
                                                    <span className="text-xs text-[rgb(var(--muted))]">{ui.activityNote}</span>
                                                    <Textarea rows={3} value={activity.note} placeholder={ui.activityNotePlaceholder} onChange={(event) => onUpdateSelectedPromotion(activity.promotionId, (current) => ({ ...current, note: event.target.value }))} />
                                                </label>
                                                {activity.effectType === "discount" || activity.effectType === "bundle_price" ? (
                                                    <label className="grid gap-1 text-sm">
                                                        <span className="text-xs text-[rgb(var(--muted))]">{activity.effectType === "bundle_price" ? ui.bundleDiscountAmount : ui.discountAmount}</span>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            value={activity.effectType === "bundle_price" ? activity.bundlePriceDiscount : activity.discountAmount}
                                                            onChange={(event) => {
                                                                const value = Math.max(0, Number.parseInt(event.target.value || "0", 10));
                                                                onUpdateSelectedPromotion(activity.promotionId, (current) =>
                                                                    current.effectType === "bundle_price" ? { ...current, bundlePriceDiscount: value } : { ...current, discountAmount: value },
                                                                );
                                                            }}
                                                        />
                                                    </label>
                                                ) : null}
                                                {activity.effectType === "gift_item" ? (
                                                    <>
                                                        <div className="grid gap-1 text-sm">
                                                            <span className="text-xs text-[rgb(var(--muted))]">{ui.giftLine}</span>
                                                            <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2 text-sm">
                                                                {activity.giftProductName || activity.giftProductId || ui.giftNotSet}
                                                            </div>
                                                        </div>
                                                        <label className="grid gap-1 text-sm">
                                                            <span className="text-xs text-[rgb(var(--muted))]">{ui.giftQty}</span>
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                value={activity.giftQty}
                                                                onChange={(event) => {
                                                                    const value = Math.max(1, Number.parseInt(event.target.value || "1", 10));
                                                                    onUpdateSelectedPromotion(activity.promotionId, (current) => ({ ...current, giftQty: value }));
                                                                }}
                                                            />
                                                        </label>
                                                    </>
                                                ) : null}
                                                {activity.effectType === "create_entitlement" ? (
                                                    <>
                                                        <label className="grid gap-1 text-sm">
                                                            <span className="text-xs text-[rgb(var(--muted))]">{ui.entitlementQty}</span>
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                value={activity.entitlementQty}
                                                                onChange={(event) => {
                                                                    const value = Math.max(1, Number.parseInt(event.target.value || "1", 10));
                                                                    onUpdateSelectedPromotion(activity.promotionId, (current) => ({ ...current, entitlementQty: value }));
                                                                }}
                                                            />
                                                        </label>
                                                        <div className="grid gap-1 text-sm">
                                                            <span className="text-xs text-[rgb(var(--muted))]">{ui.scope}</span>
                                                            <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2 text-sm">
                                                                {activity.scopeType === "product"
                                                                    ? `${ui.scopeProduct}${activity.productName || activity.productId || ui.notSet}`
                                                                    : `${ui.scopeCategory}${activity.categoryName || activity.categoryId || ui.notSet}`}
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : null}
                                                {activity.effectType === "create_pickup_reservation" ? (
                                                    <label className="grid gap-1 text-sm">
                                                        <span className="text-xs text-[rgb(var(--muted))]">{ui.pickupQty}</span>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            value={activity.reservationQty}
                                                            onChange={(event) => {
                                                                const value = Math.max(1, Number.parseInt(event.target.value || "1", 10));
                                                                onUpdateSelectedPromotion(activity.promotionId, (current) => ({ ...current, reservationQty: value }));
                                                            }}
                                                        />
                                                    </label>
                                                ) : null}
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="hidden" aria-hidden="true">
                {selectedPromotions.map((activity) => (
                    <input
                        key={`promotionSelection_${activity.promotionId}`}
                        type="hidden"
                        name="promotionSelection[]"
                        value={JSON.stringify(activity)}
                    />
                ))}
            </div>

            <div className="grid gap-3">
                {lineDetails.map(({ line, product, usedProduct, unitPrice, subtotal }, index) => {
                    const resolvedName = usedProduct?.name ?? product?.name ?? "";
                    const resolvedId = usedProduct?.id ?? product?.id ?? "";
                    return (
                        <div key={line.id} className="grid gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-4 md:grid-cols-[minmax(0,2fr)_100px_120px_120px_auto]">
                            <label className="grid gap-1 text-sm">
                                <span className="text-xs text-[rgb(var(--muted))]">{ui.lineProduct.replace("{n}", String(index + 1))}</span>
                                {line.isUsedProduct ? (
                                    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2">
                                        <div className="font-medium">{usedProduct?.name ?? ui.delistedUsed}</div>
                                        <div className="text-xs text-[rgb(var(--muted))]">{ui.usedTag} / {usedProduct?.brand || "-"} / {usedProduct?.model || "-"} / {usedProduct?.serialNumber || usedProduct?.imeiNumber || "-"}</div>
                                    </div>
                                ) : (
                                    <MerchantPredictiveSearchInput
                                        key={`${line.id}-${line.productId}`}
                                        defaultValue={product?.name ?? ""}
                                        placeholder={ui.lineProductSearchPlaceholder}
                                        targets={["checkout_items"]}
                                        inputClassName="h-10 w-full"
                                        onSelect={(item) => onLineProductSelect(line.id, item)}
                                    />
                                )}
                            </label>
                            <label className="grid gap-1 text-sm">
                                <span className="text-xs text-[rgb(var(--muted))]">{ui.qty}</span>
                                <Input type="number" min={1} value={line.isUsedProduct ? 1 : line.qty} disabled={line.isUsedProduct} onChange={(event) => onLineQtyChange(line.id, Math.max(1, Number.parseInt(event.target.value || "1", 10)))} />
                            </label>
                            <div className="grid gap-1 text-sm">
                                <span className="text-xs text-[rgb(var(--muted))]">{ui.unitPrice}</span>
                                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2">{formatMoney(unitPrice, lang)}</div>
                            </div>
                            <div className="grid gap-1 text-sm">
                                <span className="text-xs text-[rgb(var(--muted))]">{ui.subtotal}</span>
                                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2">{formatMoney(subtotal, lang)}</div>
                            </div>
                            <div className="flex items-end justify-end gap-1">
                                {line.isUsedProduct && usedProduct ? <IconActionButton href={`/products/used/${encodeURIComponent(usedProduct.id)}`} icon={Eye} label={ui.view} tooltip={ui.viewUsedShortTooltip} /> : null}
                                <IconActionButton icon={Trash2} label={ui.remove} tooltip={ui.removeLineTooltip} onClick={() => onRemoveLine(line.id)} />
                            </div>

                            <input type="hidden" name="lineProductId[]" value={resolvedId} />
                            <input type="hidden" name="lineProductName[]" value={resolvedName} />
                            <input type="hidden" name="lineQty[]" value={String(line.isUsedProduct ? 1 : Math.max(1, line.qty))} />
                            <input type="hidden" name="lineUnitPrice[]" value={String(unitPrice)} />
                            <input type="hidden" name="lineIsUsedProduct[]" value={line.isUsedProduct ? "1" : "0"} />
                            <input type="hidden" name="lineUsedProductId[]" value={line.usedProductId ?? ""} />
                            <input type="hidden" name="lineUsedBrand[]" value={usedProduct?.brand ?? ""} />
                            <input type="hidden" name="lineUsedModel[]" value={usedProduct?.model ?? ""} />
                            <input type="hidden" name="lineUsedGrade[]" value={usedProduct?.gradeLabel || usedProduct?.grade || ""} />
                            <input type="hidden" name="lineUsedSerialOrImei[]" value={usedProduct?.serialNumber || usedProduct?.imeiNumber || ""} />
                        </div>
                    );
                })}
            </div>
        </MerchantSectionCard>
    );
}
