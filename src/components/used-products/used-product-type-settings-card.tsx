"use client";

import { Plus, RotateCcw, Save, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import { EmptyStateCard, MerchantBuilderShell } from "@/components/merchant/shell";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
    UsedProductTypeSetting,
    UsedProductTypeSpecificationInputType,
    UsedProductTypeSpecificationTemplate,
} from "@/lib/schema";
import { LIST_DISPLAY_OPTIONS } from "@/lib/ui/list-display";

type UsedProductTypeSettingsCardProps = {
    lang: "zh" | "en";
    settings: UsedProductTypeSetting[];
    updateTypeAction: (formData: FormData) => Promise<void>;
};

type UsedProductTypeSettingsText = {
    cardTitle: string;
    cardHint: string;
    typeListLabel: string;
    pickTypeHint: string;
    templates: string;
    noTemplates: string;
    specName: string;
    tip: string;
    required: string;
    optional: string;
    addSpec: string;
    addSpecTooltip: string;
    saveSpec: string;
    saveSpecTooltip: string;
    removeSpec: string;
    removeSpecTooltip: string;
    noTypes: string;
    searchPlaceholder: string;
    fieldType: string;
    textInput: string;
    selectInput: string;
    selectOptions: string;
    addOption: string;
    removeOption: string;
    optionPlaceholder: string;
    optionHint: string;
    typeSummaryText: string;
    typeSummarySelect: string;
    optionCount: string;
};

type TemplateEditorFormProps = {
    lang: "zh" | "en";
    text: UsedProductTypeSettingsText;
    settingId: string;
    actionMode: "addSpec" | "updateSpec";
    updateTypeAction: (formData: FormData) => Promise<void>;
    template?: UsedProductTypeSpecificationTemplate;
};

type TemplateOptionEditorProps = {
    lang: "zh" | "en";
    options: string[];
    onChange: (value: string[]) => void;
    text: UsedProductTypeSettingsText;
};

function limitRows<T>(rows: T[], size: string): T[] {
    if (size === "all") return rows;
    const limit = Number(size);
    if (!Number.isFinite(limit) || limit <= 0) return rows;
    return rows.slice(0, limit);
}

function templateName(template: UsedProductTypeSpecificationTemplate): string {
    return template.label || template.labelZh || template.labelEn || template.key;
}

function templateTip(template: UsedProductTypeSpecificationTemplate): string {
    return template.placeholder || template.placeholderZh || template.placeholderEn || "";
}

function templateInputType(template: UsedProductTypeSpecificationTemplate): UsedProductTypeSpecificationInputType {
    return template.inputType === "select" && (template.options?.length ?? 0) > 0 ? "select" : "text";
}

function templateOptions(template: UsedProductTypeSpecificationTemplate): string[] {
    return (template.options ?? []).filter((option, index, all) => option.trim().length > 0 && all.indexOf(option) === index);
}

function serializeOptions(options: string[]): string {
    return JSON.stringify(
        options
            .map((option) => option.trim())
            .filter((option, index, all) => option.length > 0 && all.indexOf(option) === index),
    );
}

function TemplateOptionsEditor({ lang, options, onChange, text }: TemplateOptionEditorProps) {
    return (
        <div className="grid gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-[rgb(var(--muted))]">{text.selectOptions}</div>
                <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 text-xs transition hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--accent))]"
                    onClick={() => onChange([...options, ""])}
                >
                    {text.addOption}
                </button>
            </div>

            <div className="grid gap-2">
                {options.map((option, index) => (
                    <div key={`template-option-${index}`} className="flex items-center gap-2">
                        <Input
                            value={option}
                            placeholder={`${text.optionPlaceholder} ${index + 1}`}
                            onChange={(event) => {
                                const next = [...options];
                                next[index] = event.currentTarget.value;
                                onChange(next);
                            }}
                        />
                        <button
                            type="button"
                            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 text-xs transition hover:border-[rgb(var(--danger))] hover:text-[rgb(var(--danger))]"
                            onClick={() => {
                                const next = options.filter((_, optionIndex) => optionIndex !== index);
                                onChange(next.length > 0 ? next : [""]);
                            }}
                        >
                            {text.removeOption}
                        </button>
                    </div>
                ))}
            </div>

            <div className="text-[11px] text-[rgb(var(--muted))]">
                {lang === "en" ? text.optionHint : text.optionHint}
            </div>
        </div>
    );
}

function TemplateEditorForm({ lang, text, settingId, actionMode, updateTypeAction, template }: TemplateEditorFormProps) {
    const initialInputType = template ? templateInputType(template) : "text";
    const initialOptions = template ? templateOptions(template) : [""];
    const [fieldType, setFieldType] = useState<UsedProductTypeSpecificationInputType>(initialInputType);
    const [options, setOptions] = useState<string[]>(initialOptions.length > 0 ? initialOptions : [""]);
    const isEditing = actionMode === "updateSpec";

    return (
        <form
            action={updateTypeAction}
            className="grid gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_180px_auto_auto] md:items-end"
        >
            <input type="hidden" name="id" value={settingId} />
            <input type="hidden" name="actionMode" value={actionMode} />
            {template ? <input type="hidden" name="specKey" value={template.key} /> : null}
            <input type="hidden" name="specOptionsJson" value={serializeOptions(options)} />

            <div className="grid gap-1">
                <label className="text-xs text-[rgb(var(--muted))]">{text.specName}</label>
                <Input
                    name="specName"
                    defaultValue={template ? templateName(template) : ""}
                    placeholder={lang === "en" ? "For example: Battery Health" : "例如：電池健康度"}
                    required
                />
            </div>

            <div className="grid gap-1">
                <label className="text-xs text-[rgb(var(--muted))]">{text.tip}</label>
                <Input
                    name="specPlaceholder"
                    defaultValue={template ? templateTip(template) : ""}
                    placeholder={lang === "en" ? "For example: Enter percentage" : "例如：請輸入健康度（%）"}
                />
            </div>

            <div className="grid gap-1">
                <label className="text-xs text-[rgb(var(--muted))]">{text.fieldType}</label>
                <Select
                    name="specInputType"
                    value={fieldType}
                    onChange={(event) => {
                        const nextType = event.currentTarget.value === "select" ? "select" : "text";
                        setFieldType(nextType);
                        if (nextType === "select" && options.length === 0) {
                            setOptions([""]);
                        }
                    }}
                >
                    <option value="text">{text.textInput}</option>
                    <option value="select">{text.selectInput}</option>
                </Select>
            </div>

            <label className="inline-flex items-center gap-2 text-xs">
                <input
                    type="checkbox"
                    name="specRequired"
                    defaultChecked={template?.isRequired === true}
                    className="h-4 w-4 accent-[rgb(var(--accent))]"
                />
                {text.required}
            </label>

            <div className="flex justify-end gap-2">
                <IconActionButton
                    icon={isEditing ? Save : Plus}
                    type="submit"
                    label={isEditing ? text.saveSpec : text.addSpec}
                    tooltip={isEditing ? text.saveSpecTooltip : text.addSpecTooltip}
                />
            </div>

            {fieldType === "select" ? (
                <div className="grid gap-2 md:col-span-full">
                    <TemplateOptionsEditor lang={lang} options={options} onChange={setOptions} text={text} />
                </div>
            ) : null}
        </form>
    );
}

function TypeSpecificationEditorPanel({
    lang,
    text,
    setting,
    updateTypeAction,
}: {
    lang: "zh" | "en";
    text: UsedProductTypeSettingsText;
    setting: UsedProductTypeSetting;
    updateTypeAction: (formData: FormData) => Promise<void>;
}) {
    return (
        <div className="grid min-h-0 min-w-0 gap-4">
            <div className="text-sm font-semibold text-[rgb(var(--text))]">{setting.name}</div>

            <div className="grid gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
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
                        {setting.specificationTemplates.map((template) => {
                            const currentType = templateInputType(template);
                            const currentOptions = templateOptions(template);

                            return (
                                <div
                                    key={`${setting.id}_${template.key}`}
                                    className="grid gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-3"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-medium text-[rgb(var(--text))]">{templateName(template)}</span>
                                            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-2 py-0.5">
                                                {currentType === "select" ? text.typeSummarySelect : text.typeSummaryText}
                                            </span>
                                            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-2 py-0.5">
                                                {template.isRequired ? text.required : text.optional}
                                            </span>
                                            {currentType === "select" ? (
                                                <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-2 py-0.5">
                                                    {currentOptions.length} {text.optionCount}
                                                </span>
                                            ) : null}
                                        </div>
                                        <form action={updateTypeAction}>
                                            <input type="hidden" name="id" value={setting.id} />
                                            <input type="hidden" name="actionMode" value="removeSpec" />
                                            <input type="hidden" name="specKey" value={template.key} />
                                            <IconActionButton icon={Trash2} type="submit" label={text.removeSpec} tooltip={text.removeSpecTooltip} />
                                        </form>
                                    </div>

                                    {currentType === "select" && currentOptions.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 text-xs text-[rgb(var(--muted))]">
                                            {currentOptions.map((option) => (
                                                <span key={`${template.key}-${option}`} className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-2 py-0.5">
                                                    {option}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}

                                    <TemplateEditorForm
                                        lang={lang}
                                        text={text}
                                        settingId={setting.id}
                                        actionMode="updateSpec"
                                        updateTypeAction={updateTypeAction}
                                        template={template}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                <TemplateEditorForm lang={lang} text={text} settingId={setting.id} actionMode="addSpec" updateTypeAction={updateTypeAction} />
            </div>
        </div>
    );
}

export function UsedProductTypeSettingsCard({
    lang,
    settings,
    updateTypeAction,
}: UsedProductTypeSettingsCardProps) {
    const [displaySize, setDisplaySize] = useState("5");
    const [searchDraft, setSearchDraft] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

    const text: UsedProductTypeSettingsText =
        lang === "en"
            ? {
                  cardTitle: "Used Product Settings",
                  cardHint: "Used-product type list comes from brand settings. Only types enabled there appear here for specification templates.",
                  typeListLabel: "Type list",
                  pickTypeHint: "Select a type on the left to edit its specification templates.",
                  templates: "Specification Templates",
                  noTemplates: "No specification template yet.",
                  specName: "Specification Name",
                  tip: "Tip",
                  required: "Required",
                  optional: "Optional",
                  addSpec: "Add Specification",
                  addSpecTooltip: "Add specification template",
                  saveSpec: "Save Specification",
                  saveSpecTooltip: "Save specification template",
                  removeSpec: "Delete Specification",
                  removeSpecTooltip: "Delete specification template",
                  noTypes: "No enabled used-product type yet. Turn it on in brand settings first.",
                  searchPlaceholder: "Search type or specification",
                  fieldType: "Field Type",
                  textInput: "Text Input",
                  selectInput: "Dropdown",
                  selectOptions: "Dropdown Options",
                  addOption: "Add Option",
                  removeOption: "Remove",
                  optionPlaceholder: "Option",
                  optionHint: "You can add, remove, or edit dropdown options here.",
                  typeSummaryText: "Text",
                  typeSummarySelect: "Dropdown",
                  optionCount: "options",
              }
            : {
                  cardTitle: "二手商品設定",
                  cardHint: "二手商品類型改由品牌設定中的「啟用二手商品設定」控制；這裡只管理規格模板。",
                  typeListLabel: "類型清單",
                  pickTypeHint: "請從左側選擇類型，以編輯該類型的規格模板。",
                  templates: "規格模板",
                  noTemplates: "尚未設定規格欄位。",
                  specName: "規格名稱",
                  tip: "提示",
                  required: "必填",
                  optional: "選填",
                  addSpec: "新增規格",
                  addSpecTooltip: "新增規格欄位",
                  saveSpec: "儲存規格",
                  saveSpecTooltip: "儲存規格欄位",
                  removeSpec: "刪除規格",
                  removeSpecTooltip: "刪除規格欄位",
                  noTypes: "目前沒有啟用中的二手商品類型，請先到品牌設定勾選「啟用二手商品設定」。",
                  searchPlaceholder: "搜尋類型或規格名稱",
                  fieldType: "欄位類型",
                  textInput: "文字輸入",
                  selectInput: "下拉選單",
                  selectOptions: "下拉選項",
                  addOption: "新增選項",
                  removeOption: "移除",
                  optionPlaceholder: "選項",
                  optionHint: "可在這裡自行新增、移除、修改下拉選單內容。",
                  typeSummaryText: "文字輸入",
                  typeSummarySelect: "下拉選單",
                  optionCount: "個選項",
              };

    const filteredSettings = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return settings;
        return settings.filter((setting) => {
            const haystacks = [
                setting.name,
                ...setting.specificationTemplates.flatMap((template) => [
                    templateName(template),
                    templateTip(template),
                    template.key,
                    templateInputType(template),
                    ...templateOptions(template),
                ]),
            ]
                .join(" ")
                .toLowerCase();
            return haystacks.includes(q);
        });
    }, [searchTerm, settings]);

    const visibleSettings = useMemo(() => limitRows(filteredSettings, displaySize), [displaySize, filteredSettings]);

    const resolvedSelectedTypeId = useMemo(() => {
        if (filteredSettings.length === 0) return null;
        if (selectedTypeId && filteredSettings.some((s) => s.id === selectedTypeId)) {
            return selectedTypeId;
        }
        return filteredSettings[0].id;
    }, [filteredSettings, selectedTypeId]);

    const selectedSetting = resolvedSelectedTypeId
        ? filteredSettings.find((s) => s.id === resolvedSelectedTypeId)
        : undefined;

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
                    keywords: [
                        templateName(template),
                        templateTip(template),
                        template.key,
                        setting.name,
                        templateInputType(template),
                        ...templateOptions(template),
                    ].filter((value): value is string => Boolean(value)),
                })),
            ]),
        [settings, text.templates],
    );

    const typeListShell = (
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
            <div className="text-sm font-semibold text-[rgb(var(--text))]">{text.cardTitle}</div>
            <p className="text-xs text-[rgb(var(--muted))]">{text.cardHint}</p>
            <div className="text-xs font-medium text-[rgb(var(--muted))]">
                {text.typeListLabel}（{filteredSettings.length}）
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2">
                <MerchantPredictiveSearchInput
                    defaultValue={searchDraft}
                    placeholder={text.searchPlaceholder}
                    localSuggestions={searchSuggestions}
                    className="min-w-[200px] flex-1"
                    onValueChange={setSearchDraft}
                    onSelect={(item) => {
                        setSearchDraft(item.value);
                        setSearchTerm(item.value.trim());
                        if (item.id.startsWith("type-")) {
                            setSelectedTypeId(item.id.slice("type-".length));
                        } else if (item.id.startsWith("spec-")) {
                            const rest = item.id.slice("spec-".length);
                            const owning = settings.find((s) => rest.startsWith(`${s.id}-`));
                            if (owning) setSelectedTypeId(owning.id);
                        }
                    }}
                />
                <IconActionButton
                    icon={Search}
                    label={lang === "en" ? "Search used product settings" : "搜尋二手商品設定"}
                    tooltip={lang === "en" ? "Search" : "搜尋"}
                    onClick={() => setSearchTerm(searchDraft.trim())}
                />
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
            {searchTerm ? (
                <button
                    type="button"
                    className="w-fit text-xs text-[rgb(var(--accent))] underline"
                    onClick={() => {
                        setSearchDraft("");
                        setSearchTerm("");
                    }}
                >
                    {lang === "en" ? "Clear search" : "清除搜尋"}
                </button>
            ) : null}
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[rgb(var(--muted))]">{lang === "en" ? "List display" : "清單顯示"}</span>
                <Select value={displaySize} onChange={(event) => setDisplaySize(event.currentTarget.value)} className="h-9 w-[96px]">
                    {LIST_DISPLAY_OPTIONS.map((size) => (
                        <option key={`used-type-display-${size}`} value={size}>
                            {size}
                        </option>
                    ))}
                </Select>
            </div>
            <div className="max-h-[min(520px,65vh)] min-w-0 overflow-y-auto pr-1">
                {visibleSettings.length === 0 ? (
                    <EmptyStateCard
                        icon={Search}
                        title={lang === "en" ? "No matching types" : "沒有符合的類型"}
                        description={lang === "en" ? "Adjust search or clear filters." : "可調整搜尋或清除篩選。"}
                        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]"
                    />
                ) : (
                    <div className="grid gap-1">
                        {visibleSettings.map((setting) => (
                            <button
                                key={setting.id}
                                type="button"
                                onClick={() => setSelectedTypeId(setting.id)}
                                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                                    resolvedSelectedTypeId === setting.id
                                        ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10 font-medium"
                                        : "border-[rgb(var(--border))] bg-[rgb(var(--panel2))] hover:bg-[rgb(var(--panel))]"
                                }`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="truncate">{setting.name}</span>
                                    <span className="shrink-0 text-xs text-[rgb(var(--muted))]">
                                        {setting.specificationTemplates.length}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const editorShell =
        settings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-4 py-10 text-center text-sm text-[rgb(var(--muted))]">
                {text.noTypes}
            </div>
        ) : filteredSettings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-4 py-10 text-center text-sm text-[rgb(var(--muted))]">
                {lang === "en" ? "No matching used product settings." : "找不到符合條件的二手商品設定。"}
            </div>
        ) : !selectedSetting ? (
            <div className="rounded-xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-4 py-10 text-center text-sm text-[rgb(var(--muted))]">
                {text.pickTypeHint}
            </div>
        ) : (
            <TypeSpecificationEditorPanel lang={lang} text={text} setting={selectedSetting} updateTypeAction={updateTypeAction} />
        );

    return <MerchantBuilderShell sectionList={typeListShell} editor={editorShell} />;
}
