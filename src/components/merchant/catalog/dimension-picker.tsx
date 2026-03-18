import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/components/ui/cn";
import { FormField } from "@/components/ui/form-field";
import type { DimensionPickerBundle, ProductNamingMode } from "@/lib/types/catalog";

type DimensionPickerValue = {
    namingMode?: ProductNamingMode;
    categoryRef?: string;
    brandRef?: string;
    modelRef?: string;
    nameEntryRef?: string;
    customLabel?: string;
    aliasText?: string;
};

type DimensionPickerProps = {
    bundle: DimensionPickerBundle;
    value?: DimensionPickerValue;
    className?: string;
    idPrefix?: string;
    namingModeName?: string;
    categoryRefName?: string;
    brandRefName?: string;
    modelRefName?: string;
    nameEntryRefName?: string;
    customLabelName?: string;
    aliasTextName?: string;
};

function encodeRef(id: string, name: string): string {
    return `${id}::${name}`;
}

export function DimensionPicker({
    bundle,
    value,
    className,
    idPrefix = "dimension-picker",
    namingModeName = "namingMode",
    categoryRefName = "categoryRef",
    brandRefName = "brandRef",
    modelRefName = "modelRef",
    nameEntryRefName = "nameEntryRef",
    customLabelName = "customLabel",
    aliasTextName = "aliasText",
}: DimensionPickerProps) {
    const namingModeId = `${idPrefix}-${namingModeName}`;
    const categoryId = `${idPrefix}-${categoryRefName}`;
    const brandId = `${idPrefix}-${brandRefName}`;
    const modelId = `${idPrefix}-${modelRefName}`;
    const nameEntryId = `${idPrefix}-${nameEntryRefName}`;
    const customLabelId = `${idPrefix}-${customLabelName}`;
    const aliasTextId = `${idPrefix}-${aliasTextName}`;
    const controlClass = "h-10 min-w-0 w-full";

    return (
        <div className={cn("grid gap-3 md:grid-cols-2 xl:grid-cols-3", className)}>
            <FormField label="命名方式" htmlFor={namingModeId} required>
                <Select id={namingModeId} name={namingModeName} defaultValue={value?.namingMode ?? "custom"} className={controlClass}>
                    <option value="structured">structured（分類 + 品牌 + 型號）</option>
                    <option value="custom">custom（自訂 / 通用品名）</option>
                    <option value="hybrid">hybrid（型號 + 品項標籤）</option>
                </Select>
            </FormField>
            <FormField label="分類" htmlFor={categoryId}>
                <Select id={categoryId} name={categoryRefName} defaultValue={value?.categoryRef ?? ""} className={controlClass}>
                    <option value="">未指定</option>
                    {bundle.categories.map((item) => (
                        <option key={`cat-${item.id}`} value={encodeRef(item.id, item.name)}>
                            {item.name}
                        </option>
                    ))}
                </Select>
            </FormField>
            <FormField label="品牌" htmlFor={brandId}>
                <Select id={brandId} name={brandRefName} defaultValue={value?.brandRef ?? ""} className={controlClass}>
                    <option value="">未指定</option>
                    {bundle.brands.map((item) => (
                        <option key={`brand-${item.id}`} value={encodeRef(item.id, item.name)}>
                            {item.name}
                        </option>
                    ))}
                </Select>
            </FormField>
            <FormField label="型號" htmlFor={modelId}>
                <Select id={modelId} name={modelRefName} defaultValue={value?.modelRef ?? ""} className={controlClass}>
                    <option value="">未指定</option>
                    {bundle.models.map((item) => (
                        <option key={`model-${item.id}`} value={encodeRef(item.id, item.name)}>
                            {item.name}
                        </option>
                    ))}
                </Select>
            </FormField>
            <FormField label="產品詞條" htmlFor={nameEntryId}>
                <Select id={nameEntryId} name={nameEntryRefName} defaultValue={value?.nameEntryRef ?? ""} className={controlClass}>
                    <option value="">未指定</option>
                    {bundle.nameEntries.map((item) => (
                        <option key={`entry-${item.id}`} value={encodeRef(item.id, item.name)}>
                            {item.name}
                        </option>
                    ))}
                </Select>
            </FormField>
            <FormField label="自訂標籤" htmlFor={customLabelId}>
                <Input id={customLabelId} name={customLabelName} defaultValue={value?.customLabel ?? ""} placeholder="例如：限量版" className={controlClass} />
            </FormField>
            <FormField
                label="別名"
                htmlFor={aliasTextId}
                hint="可輸入多個別名，使用逗號分隔。"
                className="md:col-span-2 xl:col-span-3"
            >
                <Input id={aliasTextId} name={aliasTextName} defaultValue={value?.aliasText ?? ""} placeholder="如：Apple Watch, AW" className={controlClass} />
            </FormField>
        </div>
    );
}
