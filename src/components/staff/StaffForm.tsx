import type { PermissionLevel, StaffMember } from "@/lib/schema";
import { ArrowLeft, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";

type StaffFormProps = {
    mode: "create" | "edit";
    levels: PermissionLevel[];
    staff?: StaffMember | null;
    submitAction: (formData: FormData) => Promise<void>;
    backHref?: string;
};

export function StaffForm({ mode, levels, staff, submitAction, backHref = "/staff" }: StaffFormProps) {
    const isCreate = mode === "create";
    return (
        <form action={submitAction} className="grid max-w-3xl gap-4">
            {!isCreate && staff ? <input type="hidden" name="id" value={staff.id} /> : null}
            <Card className="grid gap-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{isCreate ? "新增員工" : "編輯員工"}</div>
                    {!isCreate && staff ? <StatusBadge label={staff.status} tone={staff.status === "active" ? "success" : "warning"} /> : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    <FormField label="姓名" required>
                        <Input name="name" defaultValue={staff?.name ?? ""} required />
                    </FormField>
                    <FormField label="電話" required>
                        <Input name="phone" defaultValue={staff?.phone ?? ""} required />
                    </FormField>
                    <FormField label="地址" className="md:col-span-2">
                        <Input name="address" defaultValue={staff?.address ?? ""} />
                    </FormField>
                    <FormField label="信箱" required>
                        <Input name="email" type="email" defaultValue={staff?.email ?? ""} required />
                    </FormField>
                    {isCreate ? (
                        <FormField label="預設密碼" required hint="建立後員工可用 email + password 登入">
                            <Input name="password" type="password" minLength={8} required />
                        </FormField>
                    ) : null}
                    <FormField label="權限等級" required>
                        <Select name="roleLevel" defaultValue={String(staff?.roleLevel ?? 1)}>
                            {levels.map((level) => (
                                <option key={level.level} value={String(level.level)}>
                                    Lv{level.level} {level.displayName}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                    <label className="flex items-center gap-2 text-sm text-[rgb(var(--text))]">
                        <input name="enabled" type="checkbox" defaultChecked={!staff || staff.status === "active"} className="h-4 w-4 accent-[rgb(var(--accent))]" />
                        啟用此員工帳號
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[rgb(var(--text))]">
                        <input
                            name="mustChangePassword"
                            type="checkbox"
                            defaultChecked={isCreate ? true : Boolean(staff?.mustChangePassword)}
                            className="h-4 w-4 accent-[rgb(var(--accent))]"
                        />
                        下次登入必須改密碼
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[rgb(var(--text))]">
                        <input
                            name="isRepairTechnician"
                            type="checkbox"
                            defaultChecked={Boolean(staff?.isRepairTechnician)}
                            className="h-4 w-4 accent-[rgb(var(--accent))]"
                        />
                        是否為維修人員
                    </label>
                    <FormField label="備註（可選）" className="md:col-span-2">
                        <Textarea name="note" defaultValue={staff?.note ?? ""} rows={4} />
                    </FormField>
                </div>
            </Card>

            {!isCreate && staff ? (
                <Card className="grid gap-2">
                    <div className="text-sm font-medium">唯讀安全資訊</div>
                    <div className="grid gap-1 text-sm text-[rgb(var(--muted))]">
                        <div>googleLinked: {staff.googleLinked ? "true" : "false"}</div>
                        <div>googleEmail: {staff.googleEmail ?? "-"}</div>
                        <div>lastLoginAt: {staff.lastLoginAt ?? "-"}</div>
                        <div>passwordResetAt: {staff.passwordResetAt ?? "-"}</div>
                    </div>
                </Card>
            ) : null}

            <div className="flex flex-wrap gap-2">
                <IconTextActionButton icon={Save} type="submit" label={isCreate ? "建立員工" : "儲存員工資料"} tooltip={isCreate ? "建立員工" : "儲存員工資料"} />
                <IconTextActionButton icon={ArrowLeft} href={backHref} label="返回" tooltip="返回員工列表" />
            </div>
        </form>
    );
}
