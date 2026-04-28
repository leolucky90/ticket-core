"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getUiText, uiLocale, type UiLanguage } from "@/lib/i18n/ui-text";
import type { Activity } from "@/lib/types/promotion";

type ActivityEntitlementType = "replacement" | "gift" | "discount" | "service";
type ActivityScopeType = "category" | "product";
type ActivityEditorEffectChoice = "discount_amount" | "discount_percentage" | "gift_item" | "bundle_price" | "pickup_reservation" | "entitlement";
type ActivityDateMode = "limited" | "unlimited";

type HiddenField = {
    name: string;
    value: string;
};

export type ActivityFormItemDraft = {
    id: string;
    itemName: string;
    qty: number;
    price: number;
    cost: number;
};

export type ActivityFormValue = {
    name: string;
    startAt: string;
    endAt: string;
    effectType: Activity["effectType"];
    discountMode: "amount" | "percentage";
    discountAmount: number;
    discountPercentage: number;
    bundlePriceDiscount: number;
    giftProductId: string;
    giftProductName: string;
    giftQty: number;
    entitlementType: ActivityEntitlementType;
    scopeType: ActivityScopeType;
    categoryId: string;
    categoryName: string;
    productId: string;
    productName: string;
    entitlementQty: number;
    entitlementExpiresAt: string;
    reservationQty: number;
    reservationExpiresAt: string;
    defaultStoreQty: number;
    message: string;
    items: ActivityFormItemDraft[];
};

type ActivityFormPanelProps = {
    lang: UiLanguage;
    formAction: (formData: FormData) => Promise<void>;
    initialValue: ActivityFormValue;
    submitLabel: string;
    formIdPrefix: string;
    hiddenFields?: HiddenField[];
    messageRows?: number;
};

function toDateInput(ts: number): string {
    if (!Number.isFinite(ts) || ts <= 0) return "";
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function createDraftItem(overrides: Partial<ActivityFormItemDraft> = {}): ActivityFormItemDraft {
    return {
        id: overrides.id ?? `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        itemName: overrides.itemName ?? "",
        qty: overrides.qty ?? 1,
        price: overrides.price ?? 0,
        cost: overrides.cost ?? 0,
    };
}

function toEffectChoice(value: ActivityFormValue): ActivityEditorEffectChoice {
    if (value.effectType === "gift_item") return "gift_item";
    if (value.effectType === "bundle_price") return "bundle_price";
    if (value.effectType === "create_pickup_reservation") return "pickup_reservation";
    if (value.effectType === "create_entitlement") return "entitlement";
    return value.discountMode === "percentage" ? "discount_percentage" : "discount_amount";
}

function applyEffectChoice(current: ActivityFormValue, choice: ActivityEditorEffectChoice): ActivityFormValue {
    if (choice === "discount_percentage") {
        return { ...current, effectType: "discount", discountMode: "percentage" };
    }
    if (choice === "discount_amount") {
        return { ...current, effectType: "discount", discountMode: "amount" };
    }
    if (choice === "gift_item") {
        return { ...current, effectType: "gift_item" };
    }
    if (choice === "bundle_price") {
        return { ...current, effectType: "bundle_price" };
    }
    if (choice === "pickup_reservation") {
        return { ...current, effectType: "create_pickup_reservation", scopeType: "product" };
    }
    return { ...current, effectType: "create_entitlement" };
}

export function createEmptyActivityFormValue(): ActivityFormValue {
    return {
        name: "",
        startAt: "",
        endAt: "",
        effectType: "discount",
        discountMode: "amount",
        discountAmount: 0,
        discountPercentage: 0,
        bundlePriceDiscount: 0,
        giftProductId: "",
        giftProductName: "",
        giftQty: 1,
        entitlementType: "replacement",
        scopeType: "product",
        categoryId: "",
        categoryName: "",
        productId: "",
        productName: "",
        entitlementQty: 1,
        entitlementExpiresAt: "",
        reservationQty: 0,
        reservationExpiresAt: "",
        defaultStoreQty: 0,
        message: "",
        items: [],
    };
}

export function createActivityFormValueFromActivity(activity: Activity, options?: { resetDates?: boolean }): ActivityFormValue {
    const resetDates = options?.resetDates ?? false;

    return {
        name: activity.name,
        startAt: resetDates ? "" : toDateInput(activity.startAt),
        endAt: resetDates ? "" : toDateInput(activity.endAt),
        effectType: activity.effectType,
        discountMode: activity.discountMode === "percentage" ? "percentage" : "amount",
        discountAmount: activity.discountAmount ?? 0,
        discountPercentage: activity.discountPercentage ?? 0,
        bundlePriceDiscount: activity.bundlePriceDiscount ?? 0,
        giftProductId: activity.giftProductId ?? "",
        giftProductName: activity.giftProductName ?? "",
        giftQty: activity.giftQty ?? 1,
        entitlementType: activity.entitlementType ?? "replacement",
        scopeType: activity.scopeType === "category" ? "category" : "product",
        categoryId: activity.categoryId ?? "",
        categoryName: activity.categoryName ?? "",
        productId: activity.productId ?? "",
        productName: activity.productName ?? "",
        entitlementQty: activity.entitlementQty ?? 1,
        entitlementExpiresAt: resetDates ? "" : toDateInput(activity.entitlementExpiresAt ?? 0),
        reservationQty: Math.max(0, activity.reservationQty ?? 0),
        reservationExpiresAt: resetDates ? "" : toDateInput(activity.reservationExpiresAt ?? 0),
        defaultStoreQty: activity.defaultStoreQty ?? 0,
        message: activity.message ?? "",
        items: (activity.items ?? []).map((item) =>
            createDraftItem({
                id: item.id,
                itemName: item.itemName,
                qty: item.totalQty,
                price: item.unitPrice,
                cost: item.unitCost,
            }),
        ),
    };
}

function FieldLabel({ htmlFor, label }: { htmlFor: string; label: string }) {
    return (
        <label htmlFor={htmlFor} className="text-xs font-medium text-[rgb(var(--muted))]">
            {label}
        </label>
    );
}

function openDatePicker(input: HTMLInputElement) {
    if (typeof input.showPicker === "function") input.showPicker();
}

function formatMoney(value: number, lang: UiLanguage) {
    return new Intl.NumberFormat(uiLocale(lang)).format(value);
}

function toActivityDateMode(value: ActivityFormValue): ActivityDateMode {
    if (!value.endAt) return "limited";
    if (value.endAt >= "9999-12-31") return "unlimited";
    return "limited";
}

export function ActivityFormPanel({
    lang,
    formAction,
    initialValue,
    submitLabel,
    formIdPrefix,
    hiddenFields,
    messageRows = 3,
}: ActivityFormPanelProps) {
    const customerCaseUi = getUiText(lang).dashboardCustomerCaseWorkspace;
    const activityUi = customerCaseUi.activities;
    const [formValue, setFormValue] = useState<ActivityFormValue>(initialValue);
    const [dateMode, setDateMode] = useState<ActivityDateMode>(() => toActivityDateMode(initialValue));
    const effectChoice = toEffectChoice(formValue);
    const usesTarget = formValue.effectType !== "gift_item";
    const targetIsCategory = formValue.scopeType === "category";

    const totalPrice = useMemo(
        () => formValue.items.reduce((sum, item) => sum + Math.max(0, item.qty) * Math.max(0, item.price), 0),
        [formValue.items],
    );

    function updateField<K extends Exclude<keyof ActivityFormValue, "items">>(field: K, value: ActivityFormValue[K]) {
        setFormValue((current) => ({ ...current, [field]: value }));
    }

    function updateItem(index: number, field: keyof ActivityFormItemDraft, value: string | number) {
        setFormValue((current) => ({
            ...current,
            items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
        }));
    }

    function addItem() {
        setFormValue((current) => ({
            ...current,
            items: [...current.items, createDraftItem()],
        }));
    }

    function removeItem(index: number) {
        setFormValue((current) => ({
            ...current,
            items: current.items.filter((_, itemIndex) => itemIndex !== index),
        }));
    }

    return (
        <form action={formAction} className="grid gap-3">
            {hiddenFields?.map((field) => <input key={`${field.name}:${field.value}`} type="hidden" name={field.name} value={field.value} />)}
            <input type="hidden" name="activityEffectType" value={formValue.effectType} />
            <input type="hidden" name="activityDiscountMode" value={formValue.discountMode} />
            <input type="hidden" name="activityDateMode" value={dateMode} />
            <div className="grid gap-2 md:grid-cols-3">
                <div className="grid gap-1">
                    <FieldLabel htmlFor={`${formIdPrefix}-activity-name`} label={activityUi.nameLabel} />
                    <Input id={`${formIdPrefix}-activity-name`} name="activityName" value={formValue.name} onChange={(event) => updateField("name", event.target.value)} placeholder={activityUi.namePlaceholder} required />
                </div>
                <div className="grid gap-1">
                    <FieldLabel htmlFor={`${formIdPrefix}-activity-start-at`} label={activityUi.startDateLabel} />
                    <Input
                        id={`${formIdPrefix}-activity-start-at`}
                        type="date"
                        name="activityStartAt"
                        value={formValue.startAt}
                        onChange={(event) => updateField("startAt", event.target.value)}
                        onClick={(event) => openDatePicker(event.currentTarget)}
                        required
                    />
                </div>
                <div className="grid gap-1">
                    <FieldLabel htmlFor={`${formIdPrefix}-activity-date-mode`} label={activityUi.dateModeLabel} />
                    <Select
                        id={`${formIdPrefix}-activity-date-mode`}
                        value={dateMode}
                        onChange={(event) => {
                            const nextMode = event.target.value === "unlimited" ? "unlimited" : "limited";
                            setDateMode(nextMode);
                            if (nextMode === "unlimited") {
                                updateField("endAt", "");
                            }
                        }}
                    >
                        <option value="limited">{activityUi.dateModeLimited}</option>
                        <option value="unlimited">{activityUi.dateModeUnlimited}</option>
                    </Select>
                </div>
            </div>
            {dateMode === "limited" ? (
                <div className="grid gap-1 md:max-w-sm">
                    <FieldLabel htmlFor={`${formIdPrefix}-activity-end-at`} label={activityUi.endDateLabel} />
                    <Input
                        id={`${formIdPrefix}-activity-end-at`}
                        type="date"
                        name="activityEndAt"
                        value={formValue.endAt}
                        onChange={(event) => updateField("endAt", event.target.value)}
                        onClick={(event) => openDatePicker(event.currentTarget)}
                        required
                    />
                </div>
            ) : null}

            <div className="grid gap-2 md:grid-cols-3">
                <div className="grid gap-1">
                    <FieldLabel htmlFor={`${formIdPrefix}-activity-effect-choice`} label={activityUi.effectLabel} />
                    <Select
                        id={`${formIdPrefix}-activity-effect-choice`}
                        value={effectChoice}
                        onChange={(event) => setFormValue((current) => applyEffectChoice(current, event.target.value as ActivityEditorEffectChoice))}
                    >
                        <option value="discount_amount">{activityUi.effectDiscountAmount}</option>
                        <option value="discount_percentage">{activityUi.effectDiscountPercentage}</option>
                        <option value="gift_item">{activityUi.effectGiftItem}</option>
                        <option value="bundle_price">{activityUi.effectBundlePrice}</option>
                        <option value="pickup_reservation">{activityUi.effectPickupReservationCompatibility}</option>
                        <option value="entitlement">{activityUi.effectEntitlementCompatibility}</option>
                    </Select>
                </div>
                {usesTarget ? (
                    <div className="grid gap-1">
                        <FieldLabel htmlFor={`${formIdPrefix}-activity-scope-type`} label={activityUi.targetTypeLabel} />
                        <Select
                            id={`${formIdPrefix}-activity-scope-type`}
                            name="activityScopeType"
                            value={formValue.scopeType}
                            onChange={(event) =>
                                setFormValue((current) => ({
                                    ...current,
                                    scopeType: event.target.value as ActivityScopeType,
                                    categoryId: event.target.value === "category" ? current.categoryId : "",
                                    categoryName: event.target.value === "category" ? current.categoryName : "",
                                    productId: event.target.value === "product" ? current.productId : "",
                                    productName: event.target.value === "product" ? current.productName : "",
                                }))
                            }
                        >
                            <option value="product">{activityUi.targetProduct}</option>
                            <option value="category">{activityUi.targetCategory}</option>
                        </Select>
                    </div>
                ) : (
                    <input type="hidden" name="activityScopeType" value={formValue.scopeType} />
                )}
                <div className="grid gap-1">
                    <FieldLabel htmlFor={`${formIdPrefix}-activity-reservation-qty`} label={activityUi.reservationQtyLabel} />
                    <Input id={`${formIdPrefix}-activity-reservation-qty`} type="number" min={0} name="activityReservationQty" value={formValue.reservationQty} onChange={(event) => updateField("reservationQty", Math.max(0, Number(event.target.value || "0")))} />
                </div>
            </div>

            {usesTarget ? (
                <div className="grid gap-2 md:grid-cols-2">
                    <div className="grid gap-1">
                        <FieldLabel htmlFor={`${formIdPrefix}-activity-target-name`} label={targetIsCategory ? activityUi.categoryNameLabel : activityUi.productNameLabel} />
                        <Input
                            id={`${formIdPrefix}-activity-target-name`}
                            name={targetIsCategory ? "activityCategoryName" : "activityProductName"}
                            value={targetIsCategory ? formValue.categoryName : formValue.productName}
                            onChange={(event) => {
                                if (targetIsCategory) {
                                    updateField("categoryName", event.target.value);
                                } else {
                                    updateField("productName", event.target.value);
                                }
                            }}
                            placeholder={targetIsCategory ? activityUi.categoryNamePlaceholder : activityUi.productNamePlaceholder}
                        />
                    </div>
                    <div className="grid gap-1">
                        {formValue.effectType === "discount" && formValue.discountMode === "amount" ? (
                            <>
                                <FieldLabel htmlFor={`${formIdPrefix}-activity-discount-amount`} label={activityUi.discountAmountLabel} />
                                <Input id={`${formIdPrefix}-activity-discount-amount`} type="number" min={0} name="activityDiscountAmount" value={formValue.discountAmount} onChange={(event) => updateField("discountAmount", Number(event.target.value || "0"))} />
                            </>
                        ) : null}
                        {formValue.effectType === "discount" && formValue.discountMode === "percentage" ? (
                            <>
                                <FieldLabel htmlFor={`${formIdPrefix}-activity-discount-percentage`} label={activityUi.discountPercentageLabel} />
                                <Input id={`${formIdPrefix}-activity-discount-percentage`} type="number" min={0} max={100} name="activityDiscountPercentage" value={formValue.discountPercentage} onChange={(event) => updateField("discountPercentage", Math.min(100, Math.max(0, Number(event.target.value || "0"))))} />
                            </>
                        ) : null}
                        {formValue.effectType === "bundle_price" ? (
                            <>
                                <FieldLabel htmlFor={`${formIdPrefix}-activity-bundle-discount`} label={activityUi.bundleDiscountLabel} />
                                <Input id={`${formIdPrefix}-activity-bundle-discount`} type="number" min={0} name="activityBundlePriceDiscount" value={formValue.bundlePriceDiscount} onChange={(event) => updateField("bundlePriceDiscount", Number(event.target.value || "0"))} />
                            </>
                        ) : null}
                        {formValue.effectType === "create_pickup_reservation" ? (
                            <>
                                <FieldLabel htmlFor={`${formIdPrefix}-activity-reservation-expire`} label={activityUi.reservationExpireLabel} />
                                <Input id={`${formIdPrefix}-activity-reservation-expire`} type="date" name="activityReservationExpiresAt" value={formValue.reservationExpiresAt} onChange={(event) => updateField("reservationExpiresAt", event.target.value)} onClick={(event) => openDatePicker(event.currentTarget)} />
                            </>
                        ) : null}
                        {formValue.effectType === "create_entitlement" ? (
                            <>
                                <FieldLabel htmlFor={`${formIdPrefix}-activity-entitlement-qty`} label={activityUi.entitlementQtyLabel} />
                                <Input id={`${formIdPrefix}-activity-entitlement-qty`} type="number" min={1} name="activityEntitlementQty" value={formValue.entitlementQty} onChange={(event) => updateField("entitlementQty", Math.max(1, Number(event.target.value || "1")))} />
                            </>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {formValue.effectType === "gift_item" ? (
                <div className="grid gap-2 md:grid-cols-2">
                    <div className="grid gap-1">
                        <FieldLabel htmlFor={`${formIdPrefix}-activity-gift-product-name`} label={activityUi.giftProductNameLabel} />
                        <Input id={`${formIdPrefix}-activity-gift-product-name`} name="activityGiftProductName" value={formValue.giftProductName} onChange={(event) => updateField("giftProductName", event.target.value)} placeholder={activityUi.giftProductNamePlaceholder} />
                    </div>
                    <div className="grid gap-1">
                        <FieldLabel htmlFor={`${formIdPrefix}-activity-gift-qty`} label={activityUi.giftQtyLabel} />
                        <Input id={`${formIdPrefix}-activity-gift-qty`} type="number" min={1} name="activityGiftQty" value={formValue.giftQty} onChange={(event) => updateField("giftQty", Math.max(1, Number(event.target.value || "1")))} />
                    </div>
                </div>
            ) : null}

            <div className="grid gap-1">
                <FieldLabel htmlFor={`${formIdPrefix}-activity-message`} label={activityUi.messageLabel} />
                <Textarea id={`${formIdPrefix}-activity-message`} name="activityMessage" rows={messageRows} value={formValue.message} onChange={(event) => updateField("message", event.target.value)} placeholder={activityUi.messagePlaceholder} />
            </div>

            <details className="rounded-lg border border-[rgb(var(--border))] p-3">
                <summary className="cursor-pointer text-sm font-medium">{activityUi.advancedSectionTitle}</summary>
                <div className="mt-3 grid gap-3">
                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-1">
                            <FieldLabel htmlFor={`${formIdPrefix}-activity-product-id`} label={activityUi.productIdLabel} />
                            <Input id={`${formIdPrefix}-activity-product-id`} name="activityProductId" value={formValue.productId} onChange={(event) => updateField("productId", event.target.value)} placeholder={activityUi.productIdPlaceholder} />
                        </div>
                        <div className="grid gap-1">
                            <FieldLabel htmlFor={`${formIdPrefix}-activity-category-id`} label={activityUi.categoryIdLabel} />
                            <Input id={`${formIdPrefix}-activity-category-id`} name="activityCategoryId" value={formValue.categoryId} onChange={(event) => updateField("categoryId", event.target.value)} placeholder={activityUi.categoryIdPlaceholder} />
                        </div>
                        <div className="grid gap-1">
                            <FieldLabel htmlFor={`${formIdPrefix}-activity-gift-product-id`} label={activityUi.giftProductIdLabel} />
                            <Input id={`${formIdPrefix}-activity-gift-product-id`} name="activityGiftProductId" value={formValue.giftProductId} onChange={(event) => updateField("giftProductId", event.target.value)} placeholder={activityUi.giftProductIdPlaceholder} />
                        </div>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-1">
                            <FieldLabel htmlFor={`${formIdPrefix}-activity-entitlement-type`} label={activityUi.entitlementTypeLabel} />
                            <Select id={`${formIdPrefix}-activity-entitlement-type`} name="activityEntitlementType" value={formValue.entitlementType} onChange={(event) => updateField("entitlementType", event.target.value as ActivityEntitlementType)}>
                                <option value="replacement">{activityUi.entitlementReplacement}</option>
                                <option value="gift">{activityUi.entitlementGift}</option>
                                <option value="discount">{activityUi.entitlementDiscount}</option>
                                <option value="service">{activityUi.entitlementService}</option>
                            </Select>
                        </div>
                        <div className="grid gap-1">
                            <FieldLabel htmlFor={`${formIdPrefix}-activity-entitlement-expire`} label={activityUi.entitlementExpireLabel} />
                            <Input id={`${formIdPrefix}-activity-entitlement-expire`} type="date" name="activityEntitlementExpiresAt" value={formValue.entitlementExpiresAt} onChange={(event) => updateField("entitlementExpiresAt", event.target.value)} onClick={(event) => openDatePicker(event.currentTarget)} />
                        </div>
                        <div className="grid gap-1">
                            <FieldLabel htmlFor={`${formIdPrefix}-activity-default-store-qty`} label={activityUi.defaultStoreQtyLabel} />
                            <Input id={`${formIdPrefix}-activity-default-store-qty`} type="number" min={0} name="activityDefaultStoreQty" value={formValue.defaultStoreQty} onChange={(event) => updateField("defaultStoreQty", Math.max(0, Number(event.target.value || "0")))} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <div className="text-sm font-medium">{activityUi.advancedItemsTitle}</div>
                                <div className="text-xs text-[rgb(var(--muted))]">{activityUi.advancedItemsHint}</div>
                            </div>
                            <Button type="button" variant="ghost" onClick={addItem}>
                                {activityUi.addItemCard}
                            </Button>
                        </div>
                        {formValue.items.length === 0 ? <div className="text-xs text-[rgb(var(--muted))]">{activityUi.advancedItemsEmpty}</div> : null}
                        {formValue.items.map((item, index) => (
                            <div key={item.id} className="grid gap-2 rounded-lg border border-[rgb(var(--border))] p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-sm font-medium">{activityUi.itemCardTitle.replace("{index}", String(index + 1))}</div>
                                    <Button type="button" variant="ghost" onClick={() => removeItem(index)}>
                                        {activityUi.removeItemCard}
                                    </Button>
                                </div>
                                <div className="grid gap-2 md:grid-cols-4">
                                    <div className="grid gap-1 md:col-span-2">
                                        <FieldLabel htmlFor={`${formIdPrefix}-item-name-${item.id}`} label={activityUi.itemNameLabel} />
                                        <Input id={`${formIdPrefix}-item-name-${item.id}`} name="activityItemName[]" value={item.itemName} onChange={(event) => updateItem(index, "itemName", event.target.value)} placeholder={activityUi.itemNamePlaceholder} />
                                    </div>
                                    <div className="grid gap-1">
                                        <FieldLabel htmlFor={`${formIdPrefix}-item-qty-${item.id}`} label={activityUi.itemQtyLabel} />
                                        <Input id={`${formIdPrefix}-item-qty-${item.id}`} type="number" min={1} name="activityItemQty[]" value={item.qty} onChange={(event) => updateItem(index, "qty", Math.max(1, Number(event.target.value || "1")))} />
                                    </div>
                                    <div className="grid gap-1">
                                        <FieldLabel htmlFor={`${formIdPrefix}-item-price-${item.id}`} label={activityUi.itemPriceLabel} />
                                        <Input id={`${formIdPrefix}-item-price-${item.id}`} type="number" min={0} name="activityItemPrice[]" value={item.price} onChange={(event) => updateItem(index, "price", Math.max(0, Number(event.target.value || "0")))} />
                                    </div>
                                </div>
                                <div className="grid gap-2 md:grid-cols-2">
                                    <div className="grid gap-1">
                                        <FieldLabel htmlFor={`${formIdPrefix}-item-cost-${item.id}`} label={activityUi.itemCostLabel} />
                                        <Input id={`${formIdPrefix}-item-cost-${item.id}`} type="number" min={0} name="activityItemCost[]" value={item.cost} onChange={(event) => updateItem(index, "cost", Math.max(0, Number(event.target.value || "0")))} />
                                    </div>
                                    <div className="grid gap-1 text-sm">
                                        <span className="text-xs text-[rgb(var(--muted))]">{activityUi.itemAmountPreview}</span>
                                        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2">{formatMoney(Math.max(0, item.qty) * Math.max(0, item.price), lang)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {formValue.items.map((item) => <input key={`${item.id}-id`} type="hidden" name="activityItemId[]" value={item.id} />)}
                        <div className="text-xs text-[rgb(var(--muted))]">{activityUi.totalPrice}：{formatMoney(totalPrice, lang)}</div>
                    </div>
                </div>
            </details>

            <div className="flex justify-end">
                <Button type="submit">{submitLabel}</Button>
            </div>
        </form>
    );
}
