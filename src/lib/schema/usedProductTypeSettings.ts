export type UsedProductTypeSpecificationTemplate = {
    key: string;
    label: string;
    labelZh?: string;
    labelEn?: string;
    placeholder?: string;
    placeholderZh?: string;
    placeholderEn?: string;
    isRequired?: boolean;
};

export type UsedProductTypeSetting = {
    id: string;
    name: string;
    isActive: boolean;
    specificationTemplates: UsedProductTypeSpecificationTemplate[];
    createdAt: string;
    updatedAt: string;
    updatedBy: string;
};

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toBool(value: unknown, fallback: boolean): boolean {
    if (typeof value === "boolean") return value;
    return fallback;
}

function toIso(value: unknown, fallback: string): string {
    if (typeof value === "string" && value.trim()) {
        const ts = Date.parse(value);
        if (Number.isFinite(ts)) return new Date(ts).toISOString();
    }
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return new Date(Math.round(value)).toISOString();
    }
    return fallback;
}

function normalizeTemplates(value: unknown): UsedProductTypeSpecificationTemplate[] {
    if (!Array.isArray(value)) return [];
    const templates: UsedProductTypeSpecificationTemplate[] = [];
    for (const row of value) {
        if (!row || typeof row !== "object") continue;
        const source = row as Record<string, unknown>;
        const key = toText(source.key, 120);
        const labelZh = toText(source.labelZh, 120);
        const labelEn = toText(source.labelEn, 120);
        const legacyLabel = toText(source.label, 120);
        const label = legacyLabel || labelZh || labelEn;
        if (!key && !label) continue;

        const template: UsedProductTypeSpecificationTemplate = {
            key: key || label,
            label: label || key,
            isRequired: toBool(source.isRequired, false),
        };
        if (labelZh) template.labelZh = labelZh;
        if (labelEn) template.labelEn = labelEn;

        const placeholderZh = toText(source.placeholderZh, 240);
        const placeholderEn = toText(source.placeholderEn, 240);
        const placeholder = toText(source.placeholder, 240) || placeholderZh || placeholderEn;
        if (placeholder) template.placeholder = placeholder;
        if (placeholderZh) template.placeholderZh = placeholderZh;
        if (placeholderEn) template.placeholderEn = placeholderEn;
        templates.push(template);
    }
    return templates.slice(0, 40);
}

export function usedProductTypeSettingsCollectionPath(companyId: string): string {
    return `companies/${toText(companyId, 120)}/usedProductTypeSettings`;
}

export function normalizeUsedProductTypeSetting(
    input: Partial<UsedProductTypeSetting> & Pick<UsedProductTypeSetting, "id">,
): UsedProductTypeSetting {
    const nowIso = new Date().toISOString();
    const createdAt = toIso(input.createdAt, nowIso);

    return {
        id: toText(input.id, 120),
        name: toText(input.name, 120) || "未命名類型",
        isActive: toBool(input.isActive, true),
        specificationTemplates: normalizeTemplates(input.specificationTemplates),
        createdAt,
        updatedAt: toIso(input.updatedAt, createdAt),
        updatedBy: toText(input.updatedBy, 120) || "system",
    };
}

export function isUsedProductTypeSetting(value: unknown): value is UsedProductTypeSetting {
    if (!value || typeof value !== "object") return false;
    const row = value as Record<string, unknown>;
    return Boolean(toText(row.id, 120) && toText(row.name, 120));
}
