import type { SecuritySettings } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type DeleteControlSettingsFormProps = {
    settings: SecuritySettings;
    canEdit: boolean;
    saveAction: (formData: FormData) => Promise<void>;
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

export function DeleteControlSettingsForm({ settings, canEdit, saveAction }: DeleteControlSettingsFormProps) {
    return (
        <form action={saveAction} className="grid max-w-4xl gap-4">
            <Card className="grid gap-3">
                <div className="text-sm font-medium">刪除控制策略</div>
                <ToggleRow name="deleteButtonEnabled" label="是否顯示刪除按鍵" defaultChecked={settings.deleteButtonEnabled} disabled={!canEdit} />
                <ToggleRow
                    name="requirePasswordWhenDeleteDisabled"
                    label="刪除按鍵關閉時需管理密碼解鎖"
                    defaultChecked={settings.requirePasswordWhenDeleteDisabled}
                    disabled={!canEdit}
                />
                <ToggleRow
                    name="requireSecondConfirmation"
                    label="啟用二次刪除確認"
                    defaultChecked={settings.requireSecondConfirmation}
                    disabled={!canEdit}
                />
                <ToggleRow name="requireReasonOnDelete" label="刪除時要求輸入原因" defaultChecked={settings.requireReasonOnDelete} disabled={!canEdit} />
                <ToggleRow name="deleteAuditLogEnabled" label="啟用刪除 audit log" defaultChecked={settings.deleteAuditLogEnabled} disabled={!canEdit} />
                <ToggleRow name="softDeleteOnly" label="只允許 soft delete" defaultChecked={settings.softDeleteOnly} disabled={!canEdit} />
                <FormField label="最低刪除權限等級">
                    <Select name="allowLevelToDeleteFrom" defaultValue={String(settings.allowLevelToDeleteFrom)} disabled={!canEdit}>
                        {levelOptions().map((level) => (
                            <option key={level} value={level}>
                                Lv{level}
                            </option>
                        ))}
                    </Select>
                </FormField>
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-medium">回復與永久刪除控制</div>
                <ToggleRow name="restoreEnabled" label="允許回復資料" defaultChecked={settings.restoreEnabled} disabled={!canEdit} />
                <ToggleRow name="hardDeleteEnabled" label="允許永久刪除" defaultChecked={settings.hardDeleteEnabled} disabled={!canEdit} />
                <FormField label="永久刪除最低權限等級">
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
                    label="永久刪除需輸入授權密碼"
                    defaultChecked={settings.requirePasswordForHardDelete}
                    disabled={!canEdit}
                />
                <ToggleRow
                    name="requireReasonOnHardDelete"
                    label="永久刪除需輸入原因"
                    defaultChecked={settings.requireReasonOnHardDelete}
                    disabled={!canEdit}
                />
            </Card>

            <Card className="grid gap-3">
                <div className="text-sm font-medium">員工資料刪除控制</div>
                <FormField label="員工回復最低權限等級">
                    <Select name="employeeRestoreLevel" defaultValue={String(settings.employeeRestoreLevel)} disabled={!canEdit}>
                        {levelOptions().map((level) => (
                            <option key={level} value={level}>
                                Lv{level}
                            </option>
                        ))}
                    </Select>
                </FormField>
                <FormField label="員工永久刪除最低權限等級">
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
                    label="員工資料僅限 Lv9 或授權者處理"
                    defaultChecked={settings.employeeStrictOwnerOnly}
                    disabled={!canEdit}
                />
            </Card>

            <Card className="grid gap-3">
                <div className="grid gap-2 text-sm text-[rgb(var(--muted))]">
                    <div>最後更新時間：{settings.updatedAt}</div>
                    <div>最後更新者：{settings.updatedBy}</div>
                </div>
                {canEdit ? (
                    <div className="flex flex-wrap gap-2">
                        <Button type="submit">儲存刪除安全設定</Button>
                    </div>
                ) : (
                    <Input value="你沒有編輯權限" readOnly />
                )}
            </Card>
        </form>
    );
}

