"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, ShoppingCart } from "lucide-react";
import { CheckoutCaseSelectorCard } from "@/components/dashboard/checkout/CheckoutCaseSelectorCard";
import { CheckoutCustomerCard } from "@/components/dashboard/checkout/CheckoutCustomerCard";
import { CheckoutDocumentSettingsCard } from "@/components/dashboard/checkout/CheckoutDocumentSettingsCard";
import { CheckoutItemsCard } from "@/components/dashboard/checkout/CheckoutItemsCard";
import { CheckoutReceiptPreviewCard } from "@/components/dashboard/checkout/CheckoutReceiptPreviewCard";
import type {
    CheckoutCustomerMode,
    CheckoutLineDraft,
    CheckoutPromotionSelectionDraft,
} from "@/components/dashboard/checkout/checkout-workspace.types";
import { MerchantSectionCard } from "@/components/merchant/shell";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { getUiText, uiLocale, type UiLanguage } from "@/lib/i18n/ui-text";
import { useUiLanguage } from "@/components/layout/ui-language-provider";
import {
    createCheckoutDocumentState,
    syncCheckoutDocumentWithCustomer,
} from "@/lib/services/checkout/document-service";
import { getCheckoutEligibleCasesForCustomer } from "@/lib/services/merchant/checkout-case-selector.service";
import type { CustomerProfile } from "@/lib/types/customer";
import type { Product } from "@/lib/types/merchant-product";
import type { Activity } from "@/lib/types/promotion";
import type { Ticket } from "@/lib/types/ticket";
import type { PredictiveSearchSuggestion } from "@/lib/types/search";
import {
    createEmptyRegionalReceiptSettings,
    type BusinessProfile,
    type CheckoutDocument,
    type RegionalReceiptSettings,
    type UsedProduct,
} from "@/lib/schema";

type CheckoutWorkspaceProps = {
    customers: CustomerProfile[];
    tickets: Ticket[];
    products: Product[];
    usedProducts: UsedProduct[];
    businessProfile: BusinessProfile | null;
    regionalReceiptSettings: RegionalReceiptSettings | null;
    activeActivities: Activity[];
    createCheckoutAction: (formData: FormData) => Promise<void>;
    flash: string;
    actionTs: string;
    initialCustomerId?: string;
    initialUsedProductId?: string;
};

function formatDateTimeLocal(ts: number): string {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${hh}:${mm}`;
}

function formatMoney(value: number, lang: UiLanguage) {
    return new Intl.NumberFormat(uiLocale(lang)).format(value);
}

function formatDateOnly(ts: number): string {
    if (!Number.isFinite(ts) || ts <= 0) return "-";
    const d = new Date(ts);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function normalizeComparable(value: string): string {
    return value.trim().toLowerCase();
}

function activityEffectText(effectType: Activity["effectType"], ui: ReturnType<typeof getUiText>["checkoutWorkspace"]): string {
    if (effectType === "bundle_price") return ui.effectBundlePrice;
    if (effectType === "gift_item") return ui.effectGift;
    if (effectType === "create_entitlement") return ui.effectEntitlement;
    if (effectType === "create_pickup_reservation") return ui.effectPickupReservation;
    return ui.effectDiscount;
}

export function CheckoutWorkspace({
    customers,
    tickets,
    products,
    usedProducts,
    businessProfile,
    regionalReceiptSettings,
    activeActivities,
    createCheckoutAction,
    flash,
    actionTs,
    initialCustomerId,
    initialUsedProductId,
}: CheckoutWorkspaceProps) {
    const lang = useUiLanguage();
    const ui = getUiText(lang).checkoutWorkspace;
    const resolvedReceiptSettings = useMemo(
        () =>
            regionalReceiptSettings ??
            createEmptyRegionalReceiptSettings(businessProfile?.companyId || "company", "system"),
        [regionalReceiptSettings, businessProfile?.companyId],
    );

    const hasInitialCustomer = Boolean(initialCustomerId && customers.some((item) => item.id === initialCustomerId));
    const initialCustomerQuery = hasInitialCustomer
        ? (() => {
              const hit = customers.find((item) => item.id === initialCustomerId) ?? null;
              if (!hit) return "";
              return `${hit.name} / ${hit.phone || "-"} / ${hit.email || "-"}`;
          })()
        : "";
    const [customerMode, setCustomerMode] = useState<CheckoutCustomerMode>(hasInitialCustomer ? "customer" : "walkin");
    const [customerId, setCustomerId] = useState(hasInitialCustomer ? initialCustomerId ?? "" : "");
    const [customerQuery, setCustomerQuery] = useState(initialCustomerQuery);
    const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
    const [selectedPromotions, setSelectedPromotions] = useState<CheckoutPromotionSelectionDraft[]>([]);
    const [closeCase, setCloseCase] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
    const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "paid" | "deposit" | "installment">("paid");
    const [checkoutAt, setCheckoutAt] = useState("");
    const [usedProductQuery, setUsedProductQuery] = useState("");
    const [usedPickerOpen, setUsedPickerOpen] = useState(false);
    const [promotionsPickerOpen, setPromotionsPickerOpen] = useState(false);
    const [lines, setLines] = useState<CheckoutLineDraft[]>(() => {
        if (initialUsedProductId && usedProducts.some((row) => row.id === initialUsedProductId)) {
            return [
                {
                    id: "line_init_used",
                    productId: initialUsedProductId,
                    qty: 1,
                    isUsedProduct: true,
                    usedProductId: initialUsedProductId,
                },
            ];
        }

        return [
            {
                id: "line_init_0",
                productId: products[0]?.id ?? "",
                qty: 1,
                isUsedProduct: false,
                usedProductId: undefined,
            },
        ];
    });
    const [casesLoading, setCasesLoading] = useState(false);
    const caseLoadingTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (!flash) return;
        const key = `checkout-flash:${flash}:${actionTs || "no-ts"}`;
        const seen = window.sessionStorage.getItem(key);
        if (seen === "1") return;
        window.sessionStorage.setItem(key, "1");
        if (flash === "created") window.alert(ui.flashCreated);
        if (flash === "invalid") window.alert(ui.flashInvalid);
    }, [flash, actionTs, ui.flashCreated, ui.flashInvalid]);

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            setCheckoutAt((prev) => (prev ? prev : formatDateTimeLocal(Date.now())));
        });
        return () => window.cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        if (!usedPickerOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setUsedPickerOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [usedPickerOpen]);

    useEffect(() => {
        if (!promotionsPickerOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setPromotionsPickerOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [promotionsPickerOpen]);

    useEffect(() => {
        return () => {
            if (caseLoadingTimeoutRef.current !== null) {
                window.clearTimeout(caseLoadingTimeoutRef.current);
            }
        };
    }, []);

    const selectedCustomer = useMemo(() => customers.find((item) => item.id === customerId) ?? null, [customers, customerId]);
    const defaultCompanyCustomer = useMemo(
        () => ({
            name: businessProfile?.displayName || businessProfile?.companyName || ui.walkin,
            phone: businessProfile?.phone || "",
            email: businessProfile?.email || "",
        }),
        [businessProfile, ui.walkin],
    );
    const [checkoutDocument, setCheckoutDocument] = useState<CheckoutDocument>(() =>
        createCheckoutDocumentState({
            settings: resolvedReceiptSettings,
            buyerName: hasInitialCustomer ? customers.find((item) => item.id === initialCustomerId)?.name ?? "" : defaultCompanyCustomer.name,
        }),
    );

    const filteredCustomers = useMemo(() => {
        const q = normalizeComparable(customerQuery);
        if (!q) return [];
        return customers
            .filter((customer) =>
                [customer.name, customer.phone, customer.email]
                    .filter((value) => !!value)
                    .some((value) => normalizeComparable(value).includes(q)),
            )
            .slice(0, 20);
    }, [customers, customerQuery]);
    const shouldShowCustomerSuggestions = customerMode === "customer" && customerId === "" && normalizeComparable(customerQuery).length > 0;

    const availableCases = useMemo(
        () =>
            getCheckoutEligibleCasesForCustomer({
                customer: customerMode === "customer" ? selectedCustomer : null,
                tickets,
            }),
        [customerMode, selectedCustomer, tickets],
    );
    const availableCaseIdSet = useMemo(() => new Set(availableCases.map((ticket) => ticket.caseId)), [availableCases]);
    const hasCheckoutEligibleCases = availableCases.length > 0;
    const visibleSelectedCaseIds = useMemo(
        () => selectedCaseIds.filter((caseId) => availableCaseIdSet.has(caseId)),
        [availableCaseIdSet, selectedCaseIds],
    );
    const selectedActivityIdSet = useMemo(() => new Set(selectedPromotions.map((activity) => activity.promotionId)), [selectedPromotions]);
    const clearSelectedCases = useCallback(() => {
        setSelectedCaseIds([]);
        setCloseCase(false);
    }, []);
    const triggerCaseLoading = useCallback((enabled: boolean) => {
        if (caseLoadingTimeoutRef.current !== null) {
            window.clearTimeout(caseLoadingTimeoutRef.current);
            caseLoadingTimeoutRef.current = null;
        }
        if (!enabled) {
            setCasesLoading(false);
            return;
        }
        setCasesLoading(true);
        caseLoadingTimeoutRef.current = window.setTimeout(() => {
            setCasesLoading(false);
            caseLoadingTimeoutRef.current = null;
        }, 180);
    }, []);
    const syncDocumentBuyerName = useCallback(
        (buyerName: string) => {
            setCheckoutDocument((current) =>
                syncCheckoutDocumentWithCustomer({
                    document: current,
                    settings: resolvedReceiptSettings,
                    buyerName,
                }),
            );
        },
        [resolvedReceiptSettings],
    );
    const appendLine = (productId?: string, options?: { isUsedProduct?: boolean; usedProductId?: string }) => {
        setLines((prev) => [
            ...prev,
            {
                id: `line_${Date.now()}_${prev.length}`,
                productId: productId ?? products[0]?.id ?? "",
                qty: 1,
                isUsedProduct: options?.isUsedProduct === true,
                usedProductId: options?.usedProductId,
            },
        ]);
    };
    const appendUsedProductLine = (usedProductId: string) => {
        const exists = lines.some((line) => line.isUsedProduct && line.usedProductId === usedProductId);
        if (exists) return;
        appendLine(usedProductId, { isUsedProduct: true, usedProductId });
    };

    const resolveProductFromSuggestion = useCallback(
        (item: PredictiveSearchSuggestion): Product | null => {
            const metaProductId = typeof item.meta?.productId === "string" ? item.meta.productId : "";
            const exactNameMatches = products.filter((product) => product.name === item.value || product.name === item.title);
            return (
                products.find((product) => product.id === metaProductId) ??
                products.find((product) => product.id === item.id) ??
                (exactNameMatches.length === 1 ? exactNameMatches[0] : null) ??
                null
            );
        },
        [products],
    );

    const productMap = useMemo(() => {
        const map = new Map<string, Product>();
        for (const product of products) map.set(product.id, product);
        return map;
    }, [products]);
    const usedProductMap = useMemo(() => {
        const map = new Map<string, UsedProduct>();
        for (const product of usedProducts) map.set(product.id, product);
        return map;
    }, [usedProducts]);

    const lineDetails = useMemo(
        () =>
            lines.map((line) => {
                const usedProduct = line.isUsedProduct ? usedProductMap.get(line.usedProductId ?? "") ?? null : null;
                const product = line.isUsedProduct ? null : productMap.get(line.productId) ?? null;
                const unitPrice = line.isUsedProduct ? usedProduct?.salePrice ?? usedProduct?.suggestedSalePrice ?? 0 : product?.price ?? 0;
                const qty = line.isUsedProduct ? 1 : Math.max(0, line.qty);
                const subtotal = qty * Math.max(0, unitPrice);
                return { line, product, usedProduct, unitPrice, subtotal };
            }),
        [lines, productMap, usedProductMap],
    );
    const filteredUsedProducts = useMemo(() => {
        const q = normalizeComparable(usedProductQuery);
        if (!q) return usedProducts.slice(0, 12);
        return usedProducts
            .filter((item) =>
                [item.name, item.brand, item.model, item.serialNumber ?? "", item.imeiNumber ?? "", item.grade, item.gradeLabel ?? ""]
                    .join(" ")
                    .toLowerCase()
                    .includes(q),
            )
            .slice(0, 12);
    }, [usedProductQuery, usedProducts]);

    const totalAmount = useMemo(() => lineDetails.reduce((sum, row) => sum + row.subtotal, 0), [lineDetails]);
    const hasValidLine = useMemo(
        () => lineDetails.some((row) => (row.product || row.usedProduct) && (row.line.isUsedProduct ? 1 : row.line.qty) > 0),
        [lineDetails],
    );
    const toggleActivitySelection = (activity: Activity, checked: boolean) => {
        setSelectedPromotions((prev) => {
            if (checked) {
                if (prev.some((row) => row.promotionId === activity.id)) return prev;
                return [
                    ...prev,
                    {
                        promotionId: activity.id,
                        promotionName: activity.name,
                        note: activity.message || "",
                        effectType: activity.effectType,
                        scopeType: activity.scopeType === "product" ? "product" : "category",
                        entitlementType: activity.entitlementType ?? "replacement",
                        categoryId: activity.categoryId ?? "",
                        categoryName: activity.categoryName ?? "",
                        productId: activity.productId ?? "",
                        productName: activity.productName ?? "",
                        discountAmount: Math.max(0, Math.round(activity.discountAmount ?? 0)),
                        bundlePriceDiscount: Math.max(0, Math.round(activity.bundlePriceDiscount ?? 0)),
                        giftProductId: activity.giftProductId ?? "",
                        giftProductName: activity.giftProductName ?? "",
                        giftQty: Math.max(1, Math.round(activity.giftQty ?? 1)),
                        entitlementQty: Math.max(1, Math.round(activity.entitlementQty ?? 1)),
                        entitlementExpiresAt: activity.entitlementExpiresAt,
                        reservationQty: Math.max(1, Math.round(activity.reservationQty ?? 1)),
                        reservationExpiresAt: activity.reservationExpiresAt,
                    },
                ];
            }

            return prev.filter((row) => row.promotionId !== activity.id);
        });
    };
    const updateSelectedPromotion = (
        promotionId: string,
        updater: (row: CheckoutPromotionSelectionDraft) => CheckoutPromotionSelectionDraft,
    ) => {
        setSelectedPromotions((prev) => prev.map((row) => (row.promotionId === promotionId ? updater(row) : row)));
    };

    const shouldShowCaseSelector = customerMode === "customer" && Boolean(selectedCustomer) && (casesLoading || hasCheckoutEligibleCases);

    return (
        <div className="space-y-4">
            <MerchantSectionCard
                title={ui.heroTitle}
                description={ui.heroDescription}
                actions={
                    <IconTextActionButton
                        icon={ShoppingCart}
                        href="/dashboard?tab=inventory"
                        label={ui.goInventory}
                        tooltip={ui.goInventoryTooltip}
                    />
                }
                bodyClassName="space-y-3"
            >
                <form action={createCheckoutAction} className="grid gap-4">
                    <div className="grid gap-3 md:grid-cols-3">
                        <FormField label={ui.checkoutTime}>
                            <Input type="datetime-local" name="checkoutAt" value={checkoutAt} onChange={(event) => setCheckoutAt(event.target.value)} required />
                        </FormField>
                        <FormField label={ui.paymentMethod}>
                            <Select name="paymentMethod" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as "cash" | "card")}>
                                <option value="cash">{ui.paymentCash}</option>
                                <option value="card">{ui.paymentCard}</option>
                            </Select>
                        </FormField>
                        <FormField label={ui.paymentStatus}>
                            <Select
                                name="paymentStatus"
                                value={paymentStatus}
                                onChange={(event) => setPaymentStatus(event.target.value as "unpaid" | "paid" | "deposit" | "installment")}
                            >
                                <option value="unpaid">{ui.statusUnpaid}</option>
                                <option value="paid">{ui.statusPaid}</option>
                                <option value="deposit">{ui.statusDeposit}</option>
                                <option value="installment">{ui.statusInstallment}</option>
                            </Select>
                        </FormField>
                    </div>

                    <CheckoutCustomerCard
                        ui={ui}
                        customerMode={customerMode}
                        customerId={customerId}
                        customerQuery={customerQuery}
                        selectedCustomer={selectedCustomer}
                        defaultCustomer={defaultCompanyCustomer}
                        shouldShowSuggestions={shouldShowCustomerSuggestions}
                        suggestions={filteredCustomers}
                        onModeChange={(nextMode) => {
                            setCustomerMode(nextMode);
                            if (nextMode === "walkin") {
                                setCustomerId("");
                                setCustomerQuery("");
                                clearSelectedCases();
                                triggerCaseLoading(false);
                                syncDocumentBuyerName(defaultCompanyCustomer.name);
                            }
                        }}
                        onQueryChange={(value) => {
                            setCustomerQuery(value);
                            setCustomerId("");
                            clearSelectedCases();
                            triggerCaseLoading(false);
                            syncDocumentBuyerName("");
                        }}
                        onCustomerSelect={(customer) => {
                            setCustomerId(customer.id);
                            setCustomerQuery(`${customer.name} / ${customer.phone || "-"} / ${customer.email || "-"}`);
                            clearSelectedCases();
                            triggerCaseLoading(true);
                            syncDocumentBuyerName(customer.name);
                        }}
                    />

                    {shouldShowCaseSelector ? (
                        <CheckoutCaseSelectorCard
                            ui={ui}
                            cases={availableCases}
                            selectedCaseIds={visibleSelectedCaseIds}
                            closeCase={closeCase && visibleSelectedCaseIds.length > 0}
                            loading={casesLoading}
                            onToggleCase={(caseId, checked) => {
                                setSelectedCaseIds((prev) => {
                                    const next = checked ? [...prev, caseId] : prev.filter((id) => id !== caseId);
                                    if (!checked && next.length === 0) {
                                        setCloseCase(false);
                                    }
                                    return next;
                                });
                            }}
                            onCloseCaseChange={setCloseCase}
                        />
                    ) : null}
                    <input type="hidden" name="closeCase" value={closeCase && visibleSelectedCaseIds.length > 0 ? "1" : "0"} />

                    <CheckoutItemsCard
                        ui={ui}
                        lang={lang}
                        activeActivities={activeActivities}
                        lineDetails={lineDetails}
                        filteredUsedProducts={filteredUsedProducts}
                        selectedPromotions={selectedPromotions}
                        selectedActivityIdSet={selectedActivityIdSet}
                        usedProductQuery={usedProductQuery}
                        usedPickerOpen={usedPickerOpen}
                        promotionsPickerOpen={promotionsPickerOpen}
                        onUsedProductQueryChange={setUsedProductQuery}
                        onUsedPickerOpenChange={setUsedPickerOpen}
                        onPromotionsPickerOpenChange={setPromotionsPickerOpen}
                        onAppendLine={appendLine}
                        onAppendUsedProductLine={appendUsedProductLine}
                        onRemoveLine={(lineId) => setLines((prev) => prev.filter((row) => row.id !== lineId))}
                        onLineQtyChange={(lineId, qty) => setLines((prev) => prev.map((row) => (row.id === lineId ? { ...row, qty } : row)))}
                        onLineProductSelect={(lineId, suggestion) => {
                            const matched = resolveProductFromSuggestion(suggestion);
                            if (!matched) return;
                            setLines((prev) =>
                                prev.map((row) =>
                                    row.id === lineId
                                        ? {
                                              ...row,
                                              productId: matched.id,
                                              isUsedProduct: false,
                                              usedProductId: undefined,
                                          }
                                        : row,
                                ),
                            );
                        }}
                        onResolveProductFromSuggestion={resolveProductFromSuggestion}
                        onToggleActivitySelection={toggleActivitySelection}
                        onUpdateSelectedPromotion={updateSelectedPromotion}
                        formatMoney={formatMoney}
                        formatDateOnly={formatDateOnly}
                        activityEffectText={(effectType) => activityEffectText(effectType, ui)}
                    />

                    <CheckoutDocumentSettingsCard
                        ui={ui}
                        settings={resolvedReceiptSettings}
                        document={checkoutDocument}
                        onChange={(updater) => setCheckoutDocument((current) => updater(current))}
                    />

                    <CheckoutReceiptPreviewCard
                        ui={ui}
                        locale={resolvedReceiptSettings.locale || uiLocale(lang)}
                        businessProfile={businessProfile}
                        settings={resolvedReceiptSettings}
                        document={checkoutDocument}
                        paymentMethod={paymentMethod}
                        paymentStatus={paymentStatus}
                        totalAmount={totalAmount}
                    />

                    <MerchantSectionCard title={ui.operationSection} description={ui.operationSectionDescription}>
                        <div className="flex flex-wrap gap-2">
                            <IconTextActionButton
                                icon={ShoppingCart}
                                type="submit"
                                label={ui.submitCheckout}
                                tooltip={ui.submitCheckoutTooltip}
                                disabled={!hasValidLine}
                            />
                            <IconTextActionButton icon={Eye} href="/dashboard/receipts" label={ui.receiptsHub} tooltip={ui.receiptsHubTooltip} />
                        </div>
                    </MerchantSectionCard>
                </form>
            </MerchantSectionCard>
        </div>
    );
}
