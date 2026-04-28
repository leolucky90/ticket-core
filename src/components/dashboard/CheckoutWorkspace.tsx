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
import type { Sale } from "@/lib/types/sale";
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
    initialCaseId?: string;
    initialUsedProductId?: string;
    initialSaleSnapshot?: Sale | null;
    deferredActivitiesUrl?: string;
    deferredUsedProductsUrl?: string;
    deferredReceiptSettingsUrl?: string;
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

function buildPromotionDraftFromActivity(activity: Activity): CheckoutPromotionSelectionDraft {
    return {
        promotionId: activity.id,
        promotionName: activity.name,
        note: activity.message || "",
        effectType: activity.effectType,
        discountMode: activity.discountMode === "percentage" ? "percentage" : "amount",
        scopeType: activity.scopeType === "product" ? "product" : "category",
        entitlementType: activity.entitlementType ?? "replacement",
        categoryId: activity.categoryId ?? "",
        categoryName: activity.categoryName ?? "",
        productId: activity.productId ?? "",
        productName: activity.productName ?? "",
        discountAmount: Math.max(0, Math.round(activity.discountAmount ?? 0)),
        discountPercentage: Math.min(100, Math.max(0, Math.round(activity.discountPercentage ?? 0))),
        bundlePriceDiscount: Math.max(0, Math.round(activity.bundlePriceDiscount ?? 0)),
        giftProductId: activity.giftProductId ?? "",
        giftProductName: activity.giftProductName ?? "",
        giftQty: Math.max(1, Math.round(activity.giftQty ?? 1)),
        entitlementQty: Math.max(1, Math.round(activity.entitlementQty ?? 1)),
        entitlementExpiresAt: activity.entitlementExpiresAt,
        reservationQty: Math.max(0, Math.round(activity.reservationQty ?? 0)),
        reservationExpiresAt: activity.reservationExpiresAt,
    };
}

function findMatchingActivitiesForProduct(product: Product, activities: Activity[]): Activity[] {
    const productName = normalizeComparable(product.name);
    const categoryName = normalizeComparable(product.categoryName ?? "");

    return activities.filter((activity) => {
        const activityProductId = normalizeComparable(activity.productId ?? "");
        const activityProductName = normalizeComparable(activity.productName ?? "");
        const activityCategoryId = normalizeComparable(activity.categoryId ?? "");
        const activityCategoryName = normalizeComparable(activity.categoryName ?? "");

        if (activityProductId && activityProductId === normalizeComparable(product.id)) return true;
        if (activityProductName && activityProductName === productName) return true;
        if (activity.scopeType === "category") {
            if (activityCategoryId && activityCategoryId === normalizeComparable(product.categoryId ?? "")) return true;
            if (activityCategoryName && activityCategoryName === categoryName) return true;
        }
        return false;
    });
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
    initialCaseId,
    initialUsedProductId,
    initialSaleSnapshot,
    deferredActivitiesUrl,
    deferredUsedProductsUrl,
    deferredReceiptSettingsUrl,
}: CheckoutWorkspaceProps) {
    const lang = useUiLanguage();
    const ui = getUiText(lang).checkoutWorkspace;
    const [deferredUsedProducts, setDeferredUsedProducts] = useState<UsedProduct[]>(usedProducts);
    const [deferredActiveActivities, setDeferredActiveActivities] = useState<Activity[]>(activeActivities);
    const [deferredBusinessProfile, setDeferredBusinessProfile] = useState<BusinessProfile | null>(businessProfile);
    const [deferredReceiptSettings, setDeferredReceiptSettings] = useState<RegionalReceiptSettings | null>(regionalReceiptSettings);
    const activitiesLoadingRef = useRef(false);
    const usedProductsLoadingRef = useRef(false);
    const receiptSettingsLoadingRef = useRef(false);
    const activitiesLoadedRef = useRef(activeActivities.length > 0);
    const usedProductsLoadedRef = useRef(usedProducts.length > 0);
    const receiptSettingsLoadedRef = useRef(businessProfile !== null || regionalReceiptSettings !== null);
    const resolvedReceiptSettings = useMemo(
        () =>
            deferredReceiptSettings ??
            createEmptyRegionalReceiptSettings(deferredBusinessProfile?.companyId || "company", "system"),
        [deferredReceiptSettings, deferredBusinessProfile?.companyId],
    );

    const saleInitialCustomerId = initialSaleSnapshot?.customerId && customers.some((item) => item.id === initialSaleSnapshot.customerId)
        ? initialSaleSnapshot.customerId
        : "";
    const resolvedInitialCustomerId = saleInitialCustomerId || initialCustomerId || "";
    const hasInitialCustomer = Boolean(resolvedInitialCustomerId && customers.some((item) => item.id === resolvedInitialCustomerId));
    const initialCustomerQuery = hasInitialCustomer
        ? (() => {
              const hit = customers.find((item) => item.id === resolvedInitialCustomerId) ?? null;
              if (!hit) return "";
              return `${hit.name} / ${hit.phone || "-"} / ${hit.email || "-"}`;
          })()
        : "";
    const [customerMode, setCustomerMode] = useState<CheckoutCustomerMode>(hasInitialCustomer ? "customer" : "walkin");
    const [customerId, setCustomerId] = useState(hasInitialCustomer ? resolvedInitialCustomerId : "");
    const [customerQuery, setCustomerQuery] = useState(initialCustomerQuery);
    const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>(() => {
        const fromSale = (initialSaleSnapshot?.caseRefs ?? []).map((row) => row.caseId).filter((id) => id.length > 0);
        if (fromSale.length > 0) return fromSale;
        return initialCaseId ? [initialCaseId] : [];
    });
    const [selectedPromotions, setSelectedPromotions] = useState<CheckoutPromotionSelectionDraft[]>([]);
    const [closeCase, setCloseCase] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">(initialSaleSnapshot?.paymentMethod === "card" ? "card" : "cash");
    const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "paid" | "deposit" | "installment">(
        initialSaleSnapshot?.paymentStatus === "unpaid" ||
            initialSaleSnapshot?.paymentStatus === "deposit" ||
            initialSaleSnapshot?.paymentStatus === "installment"
            ? initialSaleSnapshot.paymentStatus
            : "paid",
    );
    const [checkoutAt, setCheckoutAt] = useState("");
    const [usedProductQuery, setUsedProductQuery] = useState("");
    const [usedPickerOpen, setUsedPickerOpen] = useState(false);
    const [promotionsPickerOpen, setPromotionsPickerOpen] = useState(false);
    const appendLineNonceRef = useRef(0);
    const [lines, setLines] = useState<CheckoutLineDraft[]>(() => {
        const saleLines = (initialSaleSnapshot?.lineItems ?? [])
            .filter((row) => row.productName && row.qty > 0)
            .map((row, index) => ({
                id: `line_restore_${index}`,
                productId: row.productId || "",
                qty: Math.max(1, row.qty),
                snapshotProductName: row.productName,
                snapshotCategoryId: row.categoryId,
                snapshotCategoryName: row.categoryName,
                snapshotUnitPrice: row.unitPrice,
                activityPromotionId: row.activityPromotionId,
                activityPromotionName: row.activityPromotionName,
                isUsedProduct: row.isUsedProduct === true,
                usedProductId: row.usedProductId,
            }));
        if (saleLines.length > 0) return saleLines;

        if (initialUsedProductId && deferredUsedProducts.some((row) => row.id === initialUsedProductId)) {
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

        return [];
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
        if (flash === "rebuild") window.alert(ui.flashRebuildReady);
        if (flash === "invalid") window.alert(ui.flashInvalid);
    }, [flash, actionTs, ui.flashCreated, ui.flashInvalid, ui.flashRebuildReady]);

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

    const loadDeferredActivities = useCallback(async () => {
        if (!deferredActivitiesUrl) return;
        if (activitiesLoadedRef.current || activitiesLoadingRef.current) return;
        activitiesLoadingRef.current = true;
        try {
            const response = await fetch(deferredActivitiesUrl, { method: "GET", cache: "no-store" });
            if (!response.ok) return;
            const payload = (await response.json()) as { activeActivities?: Activity[] };
            setDeferredActiveActivities(Array.isArray(payload.activeActivities) ? payload.activeActivities : []);
            activitiesLoadedRef.current = true;
        } finally {
            activitiesLoadingRef.current = false;
        }
    }, [deferredActivitiesUrl]);

    const loadDeferredUsedProducts = useCallback(async () => {
        if (!deferredUsedProductsUrl) return;
        if (usedProductsLoadedRef.current || usedProductsLoadingRef.current) return;
        usedProductsLoadingRef.current = true;
        try {
            const response = await fetch(deferredUsedProductsUrl, { method: "GET", cache: "no-store" });
            if (!response.ok) return;
            const payload = (await response.json()) as { usedProducts?: UsedProduct[] };
            setDeferredUsedProducts(Array.isArray(payload.usedProducts) ? payload.usedProducts : []);
            usedProductsLoadedRef.current = true;
        } finally {
            usedProductsLoadingRef.current = false;
        }
    }, [deferredUsedProductsUrl]);

    const loadDeferredReceiptSettings = useCallback(async () => {
        if (!deferredReceiptSettingsUrl) return;
        if (receiptSettingsLoadedRef.current || receiptSettingsLoadingRef.current) return;
        receiptSettingsLoadingRef.current = true;
        try {
            const response = await fetch(deferredReceiptSettingsUrl, { method: "GET", cache: "no-store" });
            if (!response.ok) return;
            const payload = (await response.json()) as {
                businessProfile?: BusinessProfile | null;
                regionalReceiptSettings?: RegionalReceiptSettings | null;
            };
            setDeferredBusinessProfile(payload.businessProfile ?? null);
            setDeferredReceiptSettings(payload.regionalReceiptSettings ?? null);
            receiptSettingsLoadedRef.current = true;
        } finally {
            receiptSettingsLoadingRef.current = false;
        }
    }, [deferredReceiptSettingsUrl]);

    useEffect(() => {
        void loadDeferredReceiptSettings();
    }, [loadDeferredReceiptSettings]);

    useEffect(() => {
        if (!promotionsPickerOpen) return;
        void loadDeferredActivities();
    }, [loadDeferredActivities, promotionsPickerOpen]);

    useEffect(() => {
        if (!usedPickerOpen && !initialUsedProductId) return;
        void loadDeferredUsedProducts();
    }, [initialUsedProductId, loadDeferredUsedProducts, usedPickerOpen]);

    useEffect(() => {
        if (!initialUsedProductId) return;
        const exists = lines.some((line) => line.isUsedProduct && line.usedProductId === initialUsedProductId);
        if (exists) return;
        if (!deferredUsedProducts.some((row) => row.id === initialUsedProductId)) return;
        setLines((prev) => [
            ...prev,
            {
                id: "line_init_used",
                productId: initialUsedProductId,
                qty: 1,
                isUsedProduct: true,
                usedProductId: initialUsedProductId,
            },
        ]);
    }, [deferredUsedProducts, initialUsedProductId, lines]);

    const selectedCustomer = useMemo(() => customers.find((item) => item.id === customerId) ?? null, [customers, customerId]);
    const defaultCompanyCustomer = useMemo(
        () => ({
            name: ui.walkinBuyerName,
            phone: "",
            email: "",
        }),
        [ui.walkinBuyerName],
    );
    const [checkoutDocument, setCheckoutDocument] = useState<CheckoutDocument>(() =>
        createCheckoutDocumentState({
            settings: resolvedReceiptSettings,
            buyerName: hasInitialCustomer
                ? customers.find((item) => item.id === resolvedInitialCustomerId)?.name ?? ""
                : defaultCompanyCustomer.name,
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
    const availableCaseMap = useMemo(() => {
        const map = new Map<string, (typeof availableCases)[number]>();
        for (const item of availableCases) map.set(item.caseId, item);
        return map;
    }, [availableCases]);
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
        for (const product of deferredUsedProducts) map.set(product.id, product);
        return map;
    }, [deferredUsedProducts]);

    const ensurePromotionSelection = useCallback((activity: Activity) => {
        setSelectedPromotions((prev) => {
            if (prev.some((row) => row.promotionId === activity.id)) return prev;
            return [...prev, buildPromotionDraftFromActivity(activity)];
        });
    }, []);

    const removePromotionSelection = useCallback((promotionId: string) => {
        setSelectedPromotions((prev) => prev.filter((row) => row.promotionId !== promotionId));
    }, []);

    const maybeConvertLineToActivity = useCallback(
        (product: Product): Activity | null => {
            const matchedActivities = findMatchingActivitiesForProduct(product, deferredActiveActivities);
            const activity = matchedActivities[0] ?? null;
            if (!activity) return null;
            if (selectedActivityIdSet.has(activity.id)) return activity;

            const confirmed = window.confirm(
                ui.activityConvertPrompt
                    .replace("{product}", product.name)
                    .replace("{activity}", activity.name),
            );
            if (!confirmed) return null;

            ensurePromotionSelection(activity);
            return activity;
        },
        [deferredActiveActivities, ensurePromotionSelection, selectedActivityIdSet, ui.activityConvertPrompt],
    );

    const appendLine = useCallback(
        (productId?: string, options?: { isUsedProduct?: boolean; usedProductId?: string }) => {
            const isManualBlankAdd = !productId && !options;
            if (isManualBlankAdd) {
                const nowTs = Date.now();
                if (nowTs - appendLineNonceRef.current < 220) return;
                appendLineNonceRef.current = nowTs;
            }
            const matchedProduct = !options?.isUsedProduct && productId ? productMap.get(productId) ?? null : null;
            const matchedActivity = matchedProduct ? maybeConvertLineToActivity(matchedProduct) : null;
            setLines((prev) => [
                ...prev,
                {
                    id: `line_${Date.now()}_${prev.length}`,
                    productId: productId ?? "",
                    qty: 1,
                    activityPromotionId: matchedActivity?.id,
                    activityPromotionName: matchedActivity?.name,
                    isUsedProduct: options?.isUsedProduct === true,
                    usedProductId: options?.usedProductId,
                },
            ]);
        },
        [maybeConvertLineToActivity, productMap],
    );

    const appendUsedProductLine = useCallback(
        (usedProductId: string) => {
            const exists = lines.some((line) => line.isUsedProduct && line.usedProductId === usedProductId);
            if (exists) return;
            appendLine(usedProductId, { isUsedProduct: true, usedProductId });
        },
        [appendLine, lines],
    );

    const lineDetails = useMemo(
        () =>
            lines.map((line) => {
                const usedProduct = line.isUsedProduct ? usedProductMap.get(line.usedProductId ?? "") ?? null : null;
                const product = line.isUsedProduct ? null : productMap.get(line.productId) ?? null;
                const unitPrice = line.isUsedProduct
                    ? usedProduct?.salePrice ?? usedProduct?.suggestedSalePrice ?? line.snapshotUnitPrice ?? 0
                    : product?.price ?? line.snapshotUnitPrice ?? 0;
                const qty = line.isUsedProduct ? 1 : Math.max(0, line.qty);
                const subtotal = qty * Math.max(0, unitPrice);
                const resolvedName = usedProduct?.name ?? product?.name ?? line.snapshotProductName ?? "";
                const resolvedId = usedProduct?.id ?? product?.id ?? line.productId ?? "";
                const resolvedCategoryId = product?.categoryId ?? line.snapshotCategoryId ?? "";
                const resolvedCategoryName = product?.categoryName ?? line.snapshotCategoryName ?? "";
                return { line, product, usedProduct, unitPrice, subtotal, resolvedName, resolvedId, resolvedCategoryId, resolvedCategoryName };
            }),
        [lines, productMap, usedProductMap],
    );
    const filteredUsedProducts = useMemo(() => {
        const q = normalizeComparable(usedProductQuery);
        if (!q) return deferredUsedProducts.slice(0, 12);
        return deferredUsedProducts
            .filter((item) =>
                [item.name, item.brand, item.model, item.serialNumber ?? "", item.imeiNumber ?? "", item.grade, item.gradeLabel ?? ""]
                    .join(" ")
                    .toLowerCase()
                    .includes(q),
            )
            .slice(0, 12);
    }, [usedProductQuery, deferredUsedProducts]);

    const extraLineTotal = useMemo(() => lineDetails.reduce((sum, row) => sum + row.subtotal, 0), [lineDetails]);
    const caseQuoteTotal = useMemo(
        () => visibleSelectedCaseIds.reduce((sum, caseId) => sum + Math.max(0, availableCaseMap.get(caseId)?.repairAmount ?? 0), 0),
        [availableCaseMap, visibleSelectedCaseIds],
    );
    const caseInspectionCollectedTotal = useMemo(
        () => visibleSelectedCaseIds.reduce((sum, caseId) => sum + Math.max(0, availableCaseMap.get(caseId)?.inspectionFee ?? 0), 0),
        [availableCaseMap, visibleSelectedCaseIds],
    );
    const totalAmount = useMemo(
        () => Math.max(0, caseQuoteTotal + extraLineTotal - caseInspectionCollectedTotal),
        [caseInspectionCollectedTotal, caseQuoteTotal, extraLineTotal],
    );
    const hasValidLine = useMemo(
        () => lineDetails.some((row) => (row.product || row.usedProduct) && (row.line.isUsedProduct ? 1 : row.line.qty) > 0),
        [lineDetails],
    );
    const canSubmitCheckout = hasValidLine || visibleSelectedCaseIds.length > 0;
    const toggleActivitySelection = (activity: Activity, checked: boolean) => {
        setSelectedPromotions((prev) => {
            if (checked) {
                if (prev.some((row) => row.promotionId === activity.id)) return prev;
                return [...prev, buildPromotionDraftFromActivity(activity)];
            }

            return prev.filter((row) => row.promotionId !== activity.id);
        });
        if (!checked) {
            setLines((prev) =>
                prev.map((row) =>
                    row.activityPromotionId === activity.id
                        ? { ...row, activityPromotionId: undefined, activityPromotionName: undefined }
                        : row,
                ),
            );
        }
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
                        activeActivities={deferredActiveActivities}
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
                        onRemoveLine={(lineId) => {
                            const current = lines.find((row) => row.id === lineId) ?? null;
                            if (current?.activityPromotionId) {
                                const stillLinkedElsewhere = lines.some((row) => row.id !== lineId && row.activityPromotionId === current.activityPromotionId);
                                if (!stillLinkedElsewhere) removePromotionSelection(current.activityPromotionId);
                            }
                            setLines((prev) => prev.filter((row) => row.id !== lineId));
                        }}
                        onLineQtyChange={(lineId, qty) => setLines((prev) => prev.map((row) => (row.id === lineId ? { ...row, qty } : row)))}
                        onLineProductSelect={(lineId, suggestion) => {
                            const matched = resolveProductFromSuggestion(suggestion);
                            if (!matched) return;
                            const current = lines.find((row) => row.id === lineId) ?? null;
                            const matchedActivity = maybeConvertLineToActivity(matched);
                            if (current?.activityPromotionId && current.activityPromotionId !== matchedActivity?.id) {
                                const stillLinkedElsewhere = lines.some((row) => row.id !== lineId && row.activityPromotionId === current.activityPromotionId);
                                if (!stillLinkedElsewhere) removePromotionSelection(current.activityPromotionId);
                            }
                            setLines((prev) =>
                                prev.map((row) =>
                                    row.id === lineId
                                        ? {
                                              ...row,
                                              productId: matched.id,
                                              activityPromotionId: matchedActivity?.id,
                                              activityPromotionName: matchedActivity?.name,
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
                        businessProfile={deferredBusinessProfile}
                        settings={resolvedReceiptSettings}
                        document={checkoutDocument}
                        paymentMethod={paymentMethod}
                        paymentStatus={paymentStatus}
                        totalAmount={totalAmount}
                    />

                    <MerchantSectionCard title={ui.operationSection} description={ui.operationSectionDescription}>
                        <div className="grid gap-2">
                            <div className="text-xs text-[rgb(var(--muted))]">
                                {ui.totalFormulaHint}
                                {" "}
                                ({formatMoney(caseQuoteTotal, lang)} + {formatMoney(extraLineTotal, lang)} - {formatMoney(caseInspectionCollectedTotal, lang)} = {formatMoney(totalAmount, lang)})
                            </div>
                            <div className="flex flex-wrap gap-2">
                            <IconTextActionButton
                                icon={ShoppingCart}
                                type="submit"
                                label={ui.submitCheckout}
                                tooltip={ui.submitCheckoutTooltip}
                                disabled={!canSubmitCheckout}
                            />
                            <IconTextActionButton icon={Eye} href="/dashboard/receipts" label={ui.receiptsHub} tooltip={ui.receiptsHubTooltip} />
                            </div>
                        </div>
                    </MerchantSectionCard>
                </form>
            </MerchantSectionCard>
        </div>
    );
}
