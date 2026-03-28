import type { SecuritySettings } from "@/lib/schema";
import { MerchantSectionCard } from "@/components/merchant/shell";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { UiLanguage } from "@/lib/i18n/ui-text";
import { getUiText } from "@/lib/i18n/ui-text";

type DeleteControlSettingsFormProps = {
    settings: SecuritySettings;
    canEdit: boolean;
    saveAction: (formData: FormData) => Promise<void>;
    lang: UiLanguage;
};

function levelOptions() {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9];
}

function ToggleRow({ name, label, defaultChecked, disabled }: { name: string; label: string; defaultChecked: boolean; disabled: boolean }) {
    return (
        <label className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2">
            <span className="text-sm">{label}</span>
            <input
                name={name}
                type="checkbox"
                defaultChecked={defaultChecked}
                disabled={disabled}
                className="h-4 w-4 accent-[rgb(var(--accent))]"
            />
        </label>
    );
}

export function DeleteControlSettingsForm({ settings, canEdit, saveAction, lang }: DeleteControlSettingsFormProps) {
    const ui = getUiText(lang).deleteControl;
    return (
        <form action={saveAction} className="grid max-w-4xl gap-4">
            <MerchantSectionCard title={ui.policyTitle} bodyClassName="grid gap-3">
                <ToggleRow name="deleteButtonEnabled" label={ui.showDeleteButton} defaultChecked={settings.deleteButtonEnabled} disabled={!canEdit} />
                <ToggleRow
                    name="requirePasswordWhenDeleteDisabled"
                    label={ui.requirePasswordWhenDeleteDisabled}
                    defaultChecked={settings.requirePasswordWhenDeleteDisabled}
                    disabled={!canEdit}
                />
                <ToggleRow
                    name="requireSecondConfirmation"
                    label={ui.requireSecondConfirmation}
                    defaultChecked={settings.requireSecondConfirmation}
                    disabled={!canEdit}
                />
                <ToggleRow name="requireReasonOnDelete" label={ui.requireReasonOnDelete} defaultChecked={settings.requireReasonOnDelete} disabled={!canEdit} />
                <ToggleRow name="deleteAuditLogEnabled" label={ui.deleteAuditLogEnabled} defaultChecked={settings.deleteAuditLogEnabled} disabled={!canEdit} />
                <ToggleRow name="softDeleteOnly" label={ui.softDeleteOnly} defaultChecked={settings.softDeleteOnly} disabled={!canEdit} />
                <FormField label={ui.minDeleteLevel}>
                    <Select name="allowLevelToDeleteFrom" defaultValue={String(settings.allowLevelToDeleteFrom)} disabled={!canEdit}>
                        {levelOptions().map((level) => (
                            <option key={level} value={level}>
                                Lv{level}
                            </option>
                        ))}
                    </Select>
                </FormField>
            </MerchantSectionCard>

            <MerchantSectionCard title={ui.restoreAndHardDeleteTitle} bodyClassName="grid gap-3">
                <ToggleRow name="restoreEnabled" label={ui.restoreEnabled} defaultChecked={settings.restoreEnabled} disabled={!canEdit} />
                <ToggleRow name="hardDeleteEnabled" label={ui.hardDeleteEnabled} defaultChecked={settings.hardDeleteEnabled} disabled={!canEdit} />
                <FormField label={ui.minHardDeleteLevel}>
                    <Select name="allowLevelToHardDeleteFrom" defaultValue={String(settings.allowLevelToHardDeleteFrom)} disabled={!canEdit}>
                        {levelOptions().map((level) => (
                            <option key={level} value={level}>
                                Lv{level}
                            </option>
                        ))}
                    </Select>
                </FormField>
                <ToggleRow
                    name="requirePasswordForHardDelete"
                    label={ui.requirePasswordForHardDelete}
                    defaultChecked={settings.requirePasswordForHardDelete}
                    disabled={!canEdit}
                />
                <ToggleRow
                    name="requireReasonOnHardDelete"
                    label={ui.requireReasonOnHardDelete}
                    defaultChecked={settings.requireReasonOnHardDelete}
                    disabled={!canEdit}
                />
            </MerchantSectionCard>

            <MerchantSectionCard title={ui.staffDeleteTitle} bodyClassName="grid gap-3">
                <FormField label={ui.staffRestoreLevel}>
                    <Select name="employeeRestoreLevel" defaultValue={String(settings.employeeRestoreLevel)} disabled={!canEdit}>
                        {levelOptions().map((level) => (
                            <option key={level} value={level}>
                                Lv{level}
                            </option>
                        ))}
                    </Select>
                </FormField>
                <FormField label={ui.staffHardDeleteLevel}>
                    <Select name="employeeHardDeleteLevel" defaultValue={String(settings.employeeHardDeleteLevel)} disabled={!canEdit}>
                        {levelOptions().map((level) => (
                            <option key={level} value={level}>
                                Lv{level}
                            </option>
                        ))}
                    </Select>
                </FormField>
                <ToggleRow
                    name="employeeStrictOwnerOnly"
                    label={ui.staffStrictOwnerOnly}
                    defaultChecked={settings.employeeStrictOwnerOnly}
                    disabled={!canEdit}
                />
            </MerchantSectionCard>

            <MerchantSectionCard title={ui.statusTitle} bodyClassName="grid gap-3">
                <div className="grid gap-2 text-sm text-[rgb(var(--muted))]">
                    <div>{ui.updatedAt}：{settings.updatedAt}</div>
                    <div>{ui.updatedBy}：{settings.updatedBy}</div>
                </div>
                {canEdit ? (
                    <div className="flex flex-wrap gap-2">
                        <Button type="submit">{ui.save}</Button>
                    </div>
                ) : (
                    <Input value={ui.noPermission} readOnly />
                )}
            </MerchantSectionCard>
        </form>
    );
}
