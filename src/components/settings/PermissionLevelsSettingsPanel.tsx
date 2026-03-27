import type { PermissionLevel } from "@/lib/schema";
import { ALL_PERMISSION_KEYS } from "@/lib/permissionKeys";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";

type PermissionLevelsSettingsPanelProps = {
    levels: PermissionLevel[];
    saveAction: (formData: FormData) => Promise<void>;
    canEdit: boolean;
    lang: "zh" | "en";
};

type PermissionGroup = {
    id: string;
    title: { zh: string; en: string };
    keys: string[];
};

const PERMISSION_GROUPS: PermissionGroup[] = [
    {
        id: "staff",
        title: { zh: "員工管理", en: "Staff" },
        keys: [
            "staff.view",
            "staff.create",
            "staff.edit",
            "staff.delete",
            "staff.resetPassword",
            "staff.deleted.view",
            "staff.restore",
            "staff.hardDelete",
        ],
    },
    {
        id: "security",
        title: { zh: "安全設定", en: "Security" },
        keys: ["security.deleteControl.view", "security.deleteControl.edit"],
    },
    {
        id: "deleteLogs",
        title: { zh: "刪除紀錄", en: "Delete Logs" },
        keys: ["deleteLogs.view", "deleteLogs.restore", "deleteLogs.hardDelete", "hard_delete_authorized"],
    },
    {
        id: "general",
        title: { zh: "一般功能", en: "General" },
        keys: [
            "dashboard.view",
            "settings.view",
            "settings.edit",
            "products.view",
            "products.delete",
            "inventory.edit",
            "customers.delete",
            "campaigns.manage",
            "reports.export",
        ],
    },
];

const PERMISSION_LABELS: Record<string, { zh: string; en: string }> = {
    "staff.view": { zh: "查看員工", en: "View Staff" },
    "staff.create": { zh: "新增員工", en: "Create Staff" },
    "staff.edit": { zh: "編輯員工", en: "Edit Staff" },
    "staff.delete": { zh: "刪除員工（軟刪除）", en: "Delete Staff (Soft)" },
    "staff.resetPassword": { zh: "重置員工密碼", en: "Reset Staff Password" },
    "staff.deleted.view": { zh: "查看員工刪除紀錄", en: "View Deleted Staff" },
    "staff.restore": { zh: "恢復員工", en: "Restore Staff" },
    "staff.hardDelete": { zh: "永久刪除員工", en: "Hard Delete Staff" },
    "security.deleteControl.view": { zh: "查看刪除控制設定", en: "View Delete Control" },
    "security.deleteControl.edit": { zh: "編輯刪除控制設定", en: "Edit Delete Control" },
    "deleteLogs.view": { zh: "查看刪除紀錄", en: "View Delete Logs" },
    "deleteLogs.restore": { zh: "回復刪除資料", en: "Restore Deleted Records" },
    "deleteLogs.hardDelete": { zh: "永久刪除資料", en: "Hard Delete Records" },
    "dashboard.view": { zh: "查看儀表板", en: "View Dashboard" },
    "settings.view": { zh: "查看設定", en: "View Settings" },
    "settings.edit": { zh: "編輯設定", en: "Edit Settings" },
    "products.view": { zh: "查看產品", en: "View Products" },
    "products.delete": { zh: "刪除產品", en: "Delete Products" },
    "inventory.edit": { zh: "編輯庫存", en: "Edit Inventory" },
    "customers.delete": { zh: "刪除客戶", en: "Delete Customers" },
    "campaigns.manage": { zh: "管理活動", en: "Manage Campaigns" },
    "reports.export": { zh: "匯出報表", en: "Export Reports" },
    hard_delete_authorized: { zh: "高風險永久刪除授權", en: "High-risk Hard Delete Authorization" },
};

function permissionLabel(key: string, lang: "zh" | "en"): string {
    return PERMISSION_LABELS[key]?.[lang] ?? key;
}

function uniqueKeys(value: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of value) {
        const key = item.trim();
        if (!key) continue;
        const lower = key.toLowerCase();
        if (seen.has(lower)) continue;
        seen.add(lower);
        out.push(key);
    }
    return out;
}

export function PermissionLevelsSettingsPanel({ levels, saveAction, canEdit, lang }: PermissionLevelsSettingsPanelProps) {
    const ui =
        lang === "zh"
            ? {
                  active: "啟用",
                  inactive: "停用",
                  displayName: "顯示名稱",
                  activeToggle: "啟用此等級",
                  permissions: "權限勾選",
                  custom: "其他自訂權限",
                  code: "代碼",
                  updated: "更新時間",
                  save: "儲存",
              }
            : {
                  active: "Active",
                  inactive: "Inactive",
                  displayName: "Display Name",
                  activeToggle: "Enable this level",
                  permissions: "Permission Checkboxes",
                  custom: "Custom Permissions",
                  code: "Code",
                  updated: "Updated",
                  save: "Save",
              };

    return (
        <div className="grid max-w-5xl gap-3">
            {levels.map((level) => (
                <form key={level.level} action={saveAction}>
                    <input type="hidden" name="level" value={String(level.level)} />
                    <Card className="grid gap-3">
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium">
                                Lv{level.level} {level.displayName}
                            </div>
                            <StatusBadge label={level.isActive ? ui.active : ui.inactive} tone={level.isActive ? "success" : "warning"} />
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                            <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                                {ui.displayName}
                                <Input name="displayName" defaultValue={level.displayName} disabled={!canEdit} />
                            </label>
                            <label className="flex items-end gap-2 text-xs text-[rgb(var(--muted))]">
                                <input name="isActive" type="checkbox" defaultChecked={level.isActive} disabled={!canEdit} className="h-4 w-4 accent-[rgb(var(--accent))]" />
                                <span>{ui.activeToggle}</span>
                            </label>
                        </div>
                        <div className="grid gap-2">
                            <div className="text-xs text-[rgb(var(--muted))]">{ui.permissions}</div>
                            {PERMISSION_GROUPS.map((group) => {
                                const selectedSet = new Set(level.permissions.map((item) => item.toLowerCase()));
                                return (
                                    <div key={group.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                        <div className="mb-2 text-xs font-medium text-[rgb(var(--muted))]">{group.title[lang]}</div>
                                        <div className="grid gap-2 md:grid-cols-2">
                                            {group.keys.map((key) => (
                                                <label key={key} className="flex items-center gap-2 text-sm">
                                                    <input
                                                        name="permissions[]"
                                                        type="checkbox"
                                                        value={key}
                                                        defaultChecked={selectedSet.has(key.toLowerCase())}
                                                        disabled={!canEdit}
                                                        className="h-4 w-4 accent-[rgb(var(--accent))]"
                                                    />
                                                    <span>{permissionLabel(key, lang)}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {(() => {
                                const builtIn = new Set(ALL_PERMISSION_KEYS.map((item) => item.toLowerCase()));
                                const customKeys = uniqueKeys(level.permissions.filter((key) => !builtIn.has(key.toLowerCase())));
                                if (customKeys.length === 0) return null;
                                return (
                                    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                        <div className="mb-2 text-xs font-medium text-[rgb(var(--muted))]">{ui.custom}</div>
                                        <div className="grid gap-2 md:grid-cols-2">
                                            {customKeys.map((key) => (
                                                <label key={key} className="flex items-center gap-2 text-sm">
                                                    <input
                                                        name="permissions[]"
                                                        type="checkbox"
                                                        value={key}
                                                        defaultChecked
                                                        disabled={!canEdit}
                                                        className="h-4 w-4 accent-[rgb(var(--accent))]"
                                                    />
                                                    <span>{key}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                            <div>
                                {ui.code}: {level.code}
                            </div>
                            <div>
                                {ui.updated}: {level.updatedAt}
                            </div>
                        </div>
                        {canEdit ? <Button type="submit">{ui.save} Lv{level.level}</Button> : null}
                    </Card>
                </form>
            ))}
        </div>
    );
}
