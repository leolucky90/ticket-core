"use client";

import { Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import { Card } from "@/components/ui/card";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { UsedProductTypeSetting, UsedProductTypeSpecificationTemplate } from "@/lib/schema";
import { LIST_DISPLAY_OPTIONS } from "@/lib/ui/list-display";

type UsedProductTypeSettingsCardProps = {
    lang: "zh" | "en";
    settings: UsedProductTypeSetting[];
    updateTypeAction: (formData: FormData) => Promise<void>;
};

function templateName(template: UsedProductTypeSpecificationTemplate): string {
    return template.label || template.labelZh || template.labelEn || template.key;
}

function templateTip(template: UsedProductTypeSpecificationTemplate): string {
    return template.placeholder || template.placeholderZh || template.placeholderEn || "";
}

export function UsedProductTypeSettingsCard({
    lang,
    settings,
    updateTypeAction,
}: UsedProductTypeSettingsCardProps) {
    const [displaySize, setDisplaySize] = useState("5");
    const [searchDraft, setSearchDraft] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const text =
        lang === "en"
            ? {
                  cardTitle: "Used Product Settings",
                  cardHint: "Used-product type list now comes from brand settings. Only types enabled there appear here for specification templates.",
                  templates: "Specification Templates",
                  noTemplates: "No specification template yet.",
                  specName: "Specification Name",
                  tip: "Tip",
                  required: "Required",
                  optional: "Optional",
                  addSpec: "Add Specification",
                  addSpecTooltip: "Add specification template",
                  removeSpec: "Delete Specification",
                  removeSpecTooltip: "Delete specification template",
                  noTypes: "No enabled used-product type yet. Turn it on in brand settings first.",
                  searchPlaceholder: "Search type or specification",
              }
            : {
                  cardTitle: "二手商品設定",
                  cardHint: "二手商品類型改由品牌設定中的「啟用二手商品設定」控制；這裡只管理規格模板。",
                  templates: "規格模板",
                  noTemplates: "尚未設定規格欄位。",
                  specName: "規格名稱",
                  tip: "提示",
                  required: "必填",
                  optional: "選填",
                  addSpec: "新增規格",
                  addSpecTooltip: "新增規格欄位",
                  removeSpec: "刪除規格",
                  removeSpecTooltip: "刪除規格欄位",
                  noTypes: "目前沒有啟用中的二手商品類型，請先到品牌設定勾選「啟用二手商品設定」。",
                  searchPlaceholder: "搜尋類型或規格名稱",
              };
    const filteredSettings = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return settings;
        return settings.filter((setting) => {
            const haystacks = [
                setting.name,
                ...setting.specificationTemplates.flatMap((template) => [templateName(template), templateTip(template), template.key]),
            ]
                .join(" ")
                .toLowerCase();
            return haystacks.includes(q);
        });
    }, [searchTerm, settings]);
    const visibleSettings = useMemo(() => {
        const limit = Number(displaySize);
        if (!Number.isFinite(limit) || limit <= 0) return filteredSettings;
        return filteredSettings.slice(0, limit);
    }, [displaySize, filteredSettings]);
    const listViewportClass =
        displaySize === "5"
            ? "max-h-[820px]"
            : displaySize === "10"
              ? "max-h-[1180px]"
              : displaySize === "15"
                ? "max-h-[1540px]"
                : "max-h-[1900px]";
    const searchSuggestions = useMemo(
        () =>
            settings.flatMap((setting) => [
                {
                    id: `type-${setting.id}`,
                    value: setting.name,
                    title: setting.name,
                    subtitle: `${text.templates} ${setting.specificationTemplates.length}`,
                    keywords: [setting.name, ...setting.specificationTemplates.map((template) => templateName(template))],
                },
                ...setting.specificationTemplates.map((template) => ({
                    id: `spec-${setting.id}-${template.key}`,
                    value: templateName(template),
                    title: templateName(template),
                    subtitle: setting.name,
                    keywords: [templateName(template), templateTip(template), template.key, setting.name].filter((value): value is string => Boolean(value)),
                })),
            ]),
        [settings, text.templates],
    );

    return (
        <Card>
            <div className="mb-3 text-sm font-semibold">{text.cardTitle}</div>
            <div className="mb-3 text-xs text-[rgb(var(--muted))]">{text.cardHint}</div>

            <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                    <MerchantPredictiveSearchInput
                        defaultValue={searchDraft}
                        placeholder={text.searchPlaceholder}
                        localSuggestions={searchSuggestions}
                        className="min-w-[240px] flex-1"
                        onValueChange={setSearchDraft}
                        onSelect={(item) => {
                            setSearchDraft(item.value);
                            setSearchTerm(item.value.trim());
                        }}
                    />
                    <IconActionButton icon={Search} label={lang === "en" ? "Search used product settings" : "搜尋二手商品設定"} tooltip={lang === "en" ? "Search" : "搜尋"} onClick={() => setSearchTerm(searchDraft.trim())} />
                    <IconActionButton
                        icon={RotateCcw}
                        label={lang === "en" ? "Clear used product setting search" : "清除二手商品設定搜尋"}
                        tooltip={lang === "en" ? "Clear" : "清除"}
                        onClick={() => {
                            setSearchDraft("");
                            setSearchTerm("");
                        }}
                    />
                </div>
                <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-[rgb(var(--muted))]">清單顯示</span>
                    <Select value={displaySize} onChange={(event) => setDisplaySize(event.currentTarget.value)} className="h-9 w-[96px]">
                        {LIST_DISPLAY_OPTIONS.map((size) => (
                            <option key={`used-type-display-${size}`} value={size}>
                                {size}
                            </option>
                        ))}
                    </Select>
                </div>
            </div>

            <div className={`${listViewportClass} overflow-y-auto pr-1`}>
            <div className="grid gap-3">
                {visibleSettings.map((setting) => (
                    <details key={setting.id} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium">{setting.name}</span>
                                </div>
                                <span className="text-xs text-[rgb(var(--muted))]">
                                    {text.templates} {setting.specificationTemplates.length}
                                </span>
                            </div>
                        </summary>

                        <div className="mt-3 grid gap-3">
                            <div className="grid gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-3">
                                <div className="text-xs text-[rgb(var(--muted))]">
                                    {text.templates}（{setting.specificationTemplates.length}）
                                </div>
                                <div className="text-xs text-[rgb(var(--muted))]">
                                    {lang === "en"
                                        ? "Product create/edit pages will only fill these template values."
                                        : "商品新增 / 編輯頁只會填寫這些模板值，不會再自由新增規格欄位。"}
                                </div>
                                {setting.specificationTemplates.length === 0 ? (
                                    <div className="text-xs text-[rgb(var(--muted))]">{text.noTemplates}</div>
                                ) : (
                                    <div className="grid gap-2">
                                        {setting.specificationTemplates.map((template) => (
                                            <div
                                                key={`${setting.id}_${template.key}`}
                                                className="grid gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3 text-xs md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_auto_auto] md:items-center"
                                            >
                                                <div>{text.specName}: {templateName(template)}</div>
                                                <div>{text.tip}: {templateTip(template) || "-"}</div>
                                                <div className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-center">
                                                    {template.isRequired ? text.required : text.optional}
                                                </div>
                                                <form action={updateTypeAction} className="ml-auto">
                                                    <input type="hidden" name="id" value={setting.id} />
                                                    <input type="hidden" name="actionMode" value="removeSpec" />
                                                    <input type="hidden" name="specKey" value={template.key} />
                                                    <IconActionButton icon={Trash2} type="submit" label={text.removeSpec} tooltip={text.removeSpecTooltip} />
                                                </form>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <form action={updateTypeAction} className="grid gap-2 rounded-lg border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.8fr)_auto_auto] md:items-end">
                                    <input type="hidden" name="id" value={setting.id} />
                                    <input type="hidden" name="actionMode" value="addSpec" />

                                    <div className="grid gap-1">
                                        <label className="text-xs text-[rgb(var(--muted))]">{text.specName}</label>
                                        <Input name="specName" placeholder={lang === "en" ? "For example: Battery Health" : "例如：電池健康度"} required />
                                    </div>

                                    <div className="grid gap-1">
                                        <label className="text-xs text-[rgb(var(--muted))]">{text.tip}</label>
                                        <Input name="specPlaceholder" placeholder={lang === "en" ? "For example: Enter percentage" : "例如：請輸入健康度（%）"} />
                                    </div>

                                    <label className="inline-flex items-center gap-2 text-xs">
                                        <input type="checkbox" name="specRequired" className="h-4 w-4 accent-[rgb(var(--accent))]" />
                                        {text.required}
                                    </label>

                                    <div className="flex justify-end">
                                        <IconActionButton icon={Plus} type="submit" label={text.addSpec} tooltip={text.addSpecTooltip} />
                                    </div>
                                </form>
                            </div>
                        </div>
                    </details>
                ))}
                {filteredSettings.length === 0 ? (
                    <div className="text-xs text-[rgb(var(--muted))]">
                        {settings.length === 0
                            ? text.noTypes
                            : lang === "en"
                              ? "No matching used product settings."
                              : "找不到符合條件的二手商品設定。"}
                    </div>
                ) : null}
            </div>
            </div>
        </Card>
    );
}
