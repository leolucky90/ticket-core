"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Archive, ChevronDown, Eye, Pencil, Plus, Search, Store, Wrench, X } from "lucide-react";
import { useUiLanguage } from "@/components/layout/ui-language-provider";
import { MerchantListShell, MerchantSectionCard, SearchToolbar } from "@/components/merchant/shell";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { cn } from "@/components/ui/cn";
import { Select } from "@/components/ui/select";
import { UsedProductStatusBadge } from "@/components/used-products/used-product-status-badge";
import { getUiText } from "@/lib/i18n/ui-text";
import type { UsedProduct } from "@/lib/schema";
import { USED_PRODUCT_REFURBISHMENT_STATUSES, USED_PRODUCT_SALE_STATUSES } from "@/lib/schema/usedProducts";

type UsedProductsManagementPanelProps = {
    products: UsedProduct[];
    keyword: string;
    /** 與商店營銷「二手商品類型」啟用中類別之名稱對應 `UsedProduct.type`；空字串為全部 */
    usedType: string;
    /** 來自 `listUsedProductTypeSettings` 且 `isActive` 的類型，供下拉顯示 */
    typeFilterOptions: Array<{ id: string; name: string }>;
    saleStatus: string;
    refurbishmentStatus: string;
    publishAction: (formData: FormData) => Promise<void>;
    unpublishAction: (formData: FormData) => Promise<void>;
    createRefurbishmentCaseAction: (formData: FormData) => Promise<void>;
};

function formatMoney(value: number | undefined, locale: string): string {
    return new Intl.NumberFormat(locale).format(Math.max(0, value ?? 0));
}

function formatDate(value: string, locale: string): string {
    const ts = Date.parse(value);
    if (!Number.isFinite(ts)) return "-";
    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(ts);
}

export function UsedProductsManagementPanel({
    products,
    keyword,
    usedType,
    typeFilterOptions,
    saleStatus,
    refurbishmentStatus,
    publishAction,
    unpublishAction,
    createRefurbishmentCaseAction,
}: UsedProductsManagementPanelProps) {
    const lang = useUiLanguage();
    const ui = getUiText(lang).usedProductList;
    const locale = lang === "en" ? "en-US" : "zh-TW";
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const productSuggestions = products.map((product) => ({
        id: product.id,
        value: product.name,
        title: product.name,
        subtitle: [product.brand, product.model, product.serialNumber || product.imeiNumber].filter(Boolean).join(" / ") || undefined,
        keywords: [product.name, product.brand, product.model, product.type, product.serialNumber, product.imeiNumber, product.gradeLabel].filter(
            (value): value is string => Boolean(value),
        ),
    }));

    const clearSearchHref = (() => {
        const params = new URLSearchParams();
        if (usedType) params.set("usedType", usedType);
        if (saleStatus) params.set("saleStatus", saleStatus);
        if (refurbishmentStatus) params.set("refurbishmentStatus", refurbishmentStatus);
        const qs = params.toString();
        return qs ? `/products/used?${qs}` : "/products/used";
    })();

    const toolbar = (
        <SearchToolbar
            searchSlot={
                <form action="/products/used" method="get" className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto_auto]">
                    <div className="relative min-w-0">
                        <MerchantPredictiveSearchInput
                            name="q"
                            defaultValue={keyword}
                            placeholder={ui.searchPlaceholder}
                            localSuggestions={productSuggestions}
                            inputClassName={keyword.trim() ? "pr-10" : undefined}
                        />
                        {keyword.trim() ? (
                            <Link
                                href={clearSearchHref}
                                aria-label={ui.clearSearch}
                                title={ui.clearSearch}
                                className="group absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel2))] hover:text-[rgb(var(--text))]"
                            >
                                <X className="h-4 w-4" aria-hidden="true" />
                                <span className="sr-only">{ui.clearSearch}</span>
                                <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] text-[rgb(var(--text))] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                    {ui.clearSearch}
                                </span>
                            </Link>
                        ) : null}
                    </div>
                    <Select name="usedType" defaultValue={usedType} aria-label={ui.typeAria}>
                        <option value="">{ui.filterAllTypes}</option>
                        {usedType && !typeFilterOptions.some((o) => o.name === usedType) ? (
                            <option value={usedType}>{usedType}</option>
                        ) : null}
                        {typeFilterOptions.map((opt) => (
                            <option key={opt.id} value={opt.name}>
                                {opt.name}
                            </option>
                        ))}
                    </Select>
                    <Select name="saleStatus" defaultValue={saleStatus}>
                        <option value="">{ui.filterAllSaleStatuses}</option>
                        {USED_PRODUCT_SALE_STATUSES.map((code) => (
                            <option key={code} value={code}>
                                {ui.saleStatus[code]}
                            </option>
                        ))}
                    </Select>
                    <Select name="refurbishmentStatus" defaultValue={refurbishmentStatus}>
                        <option value="">{ui.filterAllRefurbishmentStatuses}</option>
                        {USED_PRODUCT_REFURBISHMENT_STATUSES.map((code) => (
                            <option key={code} value={code}>
                                {ui.refurbishmentStatus[code]}
                            </option>
                        ))}
                    </Select>
                    <div className="flex items-center gap-2">
                        <IconActionButton icon={Search} type="submit" label={ui.searchAction} tooltip={ui.searchSubmitTooltip} />
                        <IconActionButton href="/products/used" icon={Archive} label={ui.resetFilters} tooltip={ui.resetFiltersTooltip} />
                    </div>
                </form>
            }
            primaryActionSlot={
                <IconActionButton href="/products/used/new" icon={Plus} label={ui.addUsedProduct} tooltip={ui.addUsedProductTooltip} />
            }
        />
    );

    const list = (
        <MerchantSectionCard
            title={ui.listTitle}
            description={ui.listDescription.replace("{count}", String(products.length))}
            emptyState={
                products.length === 0
                    ? {
                          icon: Search,
                          title: ui.emptyTitle,
                          description: ui.emptyDescription,
                      }
                    : undefined
            }
        >
            {products.length === 0 ? null : (
                <div className="w-full min-w-0">
                    <table className="w-full text-sm">
                        <thead className="bg-[rgb(var(--panel2))] text-[rgb(var(--muted))]">
                            <tr>
                                <th className="px-2 py-2 text-left font-medium">{ui.colName}</th>
                                <th className="px-2 py-2 text-left font-medium">{ui.colSerial}</th>
                                <th className="px-2 py-2 text-left font-medium">{ui.colStatus}</th>
                                <th className="px-2 py-2 text-right font-medium">{ui.colPrice}</th>
                                <th className="px-2 py-2 text-left font-medium">{ui.colWarranty}</th>
                                <th className="px-2 py-2 text-left font-medium">{ui.colCreated}</th>
                                <th className="w-10 px-1 py-2 text-center font-medium">
                                    <span className="sr-only">{ui.expandSr}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((item) => {
                                const open = expandedId === item.id;
                                return (
                                    <Fragment key={item.id}>
                                        <tr
                                            className={cn(
                                                "cursor-pointer border-t border-[rgb(var(--border))] align-top transition-colors hover:bg-[rgb(var(--panel2))]/60",
                                                open && "bg-[rgb(var(--panel2))]/40",
                                            )}
                                            aria-expanded={open}
                                            onClick={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
                                        >
                                            <td
                                                className="px-2 py-2"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        setExpandedId((prev) => (prev === item.id ? null : item.id));
                                                    }
                                                }}
                                            >
                                                <div className="font-medium">{item.name}</div>
                                                {item.specifications ? (
                                                    <div className="text-xs text-[rgb(var(--muted))]">{item.specifications}</div>
                                                ) : null}
                                            </td>
                                            <td className="px-2 py-2">{item.serialNumber || item.imeiNumber || "-"}</td>
                                            <td className="px-2 py-2">
                                                <UsedProductStatusBadge
                                                    product={{
                                                        grade: item.grade,
                                                        gradeLabel: item.gradeLabel,
                                                        isRefurbished: item.isRefurbished,
                                                        refurbishmentStatus: item.refurbishmentStatus,
                                                        saleStatus: item.saleStatus,
                                                    }}
                                                />
                                            </td>
                                            <td className="px-2 py-2 text-right tabular-nums">
                                                {formatMoney(item.salePrice ?? item.suggestedSalePrice, locale)}
                                            </td>
                                            <td className="px-2 py-2">
                                                {item.warrantyEnabled
                                                    ? `${item.warrantyDuration} ${item.warrantyUnit === "day" ? ui.warrantyUnitDay : ui.warrantyUnitMonth}`
                                                    : ui.warrantyDisabled}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-2">{formatDate(item.createdAt, locale)}</td>
                                            <td className="px-1 py-2 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel))] hover:text-[rgb(var(--text))]"
                                                    aria-label={open ? ui.collapse : ui.expand}
                                                    aria-expanded={open}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedId((prev) => (prev === item.id ? null : item.id));
                                                    }}
                                                >
                                                    <ChevronDown
                                                        className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                            </td>
                                        </tr>
                                        {open ? (
                                            <tr className="border-t border-[rgb(var(--border))] bg-[rgb(var(--panel2))]">
                                                <td colSpan={7} className="px-3 py-3">
                                                    <div className="grid gap-2 text-sm sm:grid-cols-3">
                                                        <div>
                                                            <span className="text-[rgb(var(--muted))]">{ui.brand}</span>
                                                            <span className="ml-1">{item.brand || "—"}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[rgb(var(--muted))]">{ui.model}</span>
                                                            <span className="ml-1">{item.model || "—"}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[rgb(var(--muted))]">{ui.type}</span>
                                                            <span className="ml-1">{item.type || "—"}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap gap-1">
                                                        <IconActionButton
                                                            href={`/products/used/${encodeURIComponent(item.id)}`}
                                                            icon={Eye}
                                                            label={ui.viewDetail}
                                                            tooltip={ui.viewDetailTooltip}
                                                        />
                                                        <IconActionButton
                                                            href={`/products/used/${encodeURIComponent(item.id)}/edit`}
                                                            icon={Pencil}
                                                            label={ui.editProduct}
                                                            tooltip={ui.editProductTooltip}
                                                        />
                                                        <form action={createRefurbishmentCaseAction}>
                                                            <input type="hidden" name="usedProductId" value={item.id} />
                                                            <IconActionButton icon={Wrench} type="submit" label={ui.refurbish} tooltip={ui.refurbishTooltip} />
                                                        </form>
                                                        {item.isPublished ? (
                                                            <form action={unpublishAction}>
                                                                <input type="hidden" name="id" value={item.id} />
                                                                <IconActionButton icon={Archive} type="submit" label={ui.unpublish} tooltip={ui.unpublishTooltip} />
                                                            </form>
                                                        ) : (
                                                            <form action={publishAction}>
                                                                <input type="hidden" name="id" value={item.id} />
                                                                <IconActionButton icon={Store} type="submit" label={ui.publish} tooltip={ui.publishTooltip} />
                                                            </form>
                                                        )}
                                                        <IconActionButton
                                                            href={`/dashboard/checkout?usedProductId=${encodeURIComponent(item.id)}`}
                                                            icon={Store}
                                                            label={ui.checkout}
                                                            tooltip={ui.checkoutTooltip}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : null}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </MerchantSectionCard>
    );

    return (
        <MerchantListShell toolbar={toolbar} list={list} />
    );
}
