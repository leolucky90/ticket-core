"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import type { UsedProductSpecificationItem, UsedProductTypeSpecificationTemplate } from "@/lib/schema";

type SpecificationEditorProps = {
    templates: UsedProductTypeSpecificationTemplate[];
    initialItems?: UsedProductSpecificationItem[];
    hiddenName: string;
    lang?: "zh" | "en";
};

type SpecRow = {
    id: string;
    key: string;
    value: string;
};

function makeId(prefix = "spec"): string {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function templateName(template: UsedProductTypeSpecificationTemplate): string {
    return template.label || template.labelZh || template.labelEn || template.key;
}

function templateKey(template: UsedProductTypeSpecificationTemplate): string {
    return (template.key || templateName(template)).trim();
}

function seedRows(
    initialItems: UsedProductSpecificationItem[] | undefined,
    templates: UsedProductTypeSpecificationTemplate[],
): SpecRow[] {
    const seeded: SpecRow[] = [];
    const seen = new Set<string>();

    for (const row of initialItems ?? []) {
        const key = row.key.trim();
        const value = row.value.trim();
        if (!key && !value) continue;
        const normalizedKey = key.toLowerCase();
        if (seen.has(normalizedKey)) continue;
        seen.add(normalizedKey);
        seeded.push({ id: makeId(), key, value });
    }

    for (const template of templates) {
        const key = templateKey(template);
        if (!key) continue;
        const normalizedKey = key.toLowerCase();
        if (seen.has(normalizedKey)) continue;
        seen.add(normalizedKey);
        seeded.push({ id: makeId(), key, value: "" });
    }

    return seeded;
}

export function SpecificationEditor({ templates, initialItems, hiddenName, lang = "zh" }: SpecificationEditorProps) {
    const [rows, setRows] = useState<SpecRow[]>(() => seedRows(initialItems, templates));
    const templateMap = useMemo(() => {
        const next = new Map<string, UsedProductTypeSpecificationTemplate>();
        for (const template of templates) {
            const key = templateKey(template).toLowerCase();
            if (!key) continue;
            next.set(key, template);
        }
        return next;
    }, [templates]);

    const serialized = JSON.stringify(
        rows
            .map((row) => ({ key: row.key.trim(), value: row.value.trim() }))
            .filter((row) => row.key.length > 0 || row.value.length > 0),
    );

    return (
        <div className="grid gap-2">
            <input type="hidden" name={hiddenName} value={serialized} />

            {rows.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
                    {lang === "en" ? "No specification template yet. Please add templates in marketing settings first." : "尚未建立規格模板，請先到商店營銷設定新增規格模板。"}
                </div>
            ) : null}

            {rows.map((row) => (
                (() => {
                    const matchedTemplate = templateMap.get(row.key.trim().toLowerCase()) ?? null;
                    const isTemplateField = matchedTemplate !== null;
                    const specLabel = matchedTemplate ? templateName(matchedTemplate) : row.key;
                    const specPlaceholder =
                        matchedTemplate?.placeholder || matchedTemplate?.placeholderZh || matchedTemplate?.placeholderEn || "";

                    return (
                        <div key={row.id} className="grid gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3 md:grid-cols-[minmax(0,240px)_1fr]">
                            <div className="grid gap-1">
                                <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                                    <span>{lang === "en" ? "Specification" : "規格欄位"}</span>
                                    <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-0.5">
                                        {isTemplateField
                                            ? matchedTemplate.isRequired
                                                ? lang === "en"
                                                    ? "Required"
                                                    : "必填"
                                                : lang === "en"
                                                  ? "Optional"
                                                  : "選填"
                                            : lang === "en"
                                              ? "Existing"
                                              : "既有欄位"}
                                    </span>
                                </div>
                                <Input value={specLabel} readOnly className="bg-[rgb(var(--panel))] font-medium" />
                            </div>
                            <div className="grid gap-1">
                                <div className="text-xs text-[rgb(var(--muted))]">
                                    {lang === "en" ? "Value" : "規格內容"}
                                    {specPlaceholder ? ` · ${specPlaceholder}` : ""}
                                </div>
                                <Input
                                    value={row.value}
                                    placeholder={specPlaceholder || (lang === "en" ? "Enter specification value" : "請輸入規格內容")}
                                    onChange={(event) => {
                                        const value = event.currentTarget.value;
                                        setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, value } : item)));
                                    }}
                                />
                            </div>
                        </div>
                    );
                })()
            ))}

            {rows.length > 0 ? (
                <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
                    {lang === "en"
                        ? "Specification fields are managed by used-product type templates. Add or remove fields in marketing settings to keep data consistent."
                        : "規格欄位由二手商品類型模板集中管理；如需新增或移除欄位，請到商店營銷設定調整，避免商品資料格式不一致。"}
                </div>
            ) : null}
        </div>
    );
}
