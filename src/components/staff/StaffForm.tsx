import type { PermissionLevel, StaffMember } from "@/lib/schema";
import type { UiLanguage } from "@/lib/i18n/ui-text";
import { getUiText } from "@/lib/i18n/ui-text";
import { ArrowLeft, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";

function formatStaffDateTime(value: string | undefined | null, lang: UiLanguage, noRecordYet: string): string {
    if (value == null || String(value).trim() === "") return noRecordYet;
    const t = Date.parse(value);
    if (!Number.isFinite(t)) return String(value);
    return new Date(t).toLocaleString(lang === "en" ? "en-AU" : "zh-TW", { dateStyle: "medium", timeStyle: "short" });
}

type StaffFormProps = {
    mode: "create" | "edit";
    levels: PermissionLevel[];
    staff?: StaffMember | null;
    submitAction: (formData: FormData) => Promise<void>;
    backHref?: string;
    lang: UiLanguage;
};

export function StaffForm({ mode, levels, staff, submitAction, backHref = "/staff", lang }: StaffFormProps) {
    const ui = getUiText(lang).staffForm;
    const isCreate = mode === "create";
    return (
        <form action={submitAction} className="grid max-w-3xl gap-4">
            {!isCreate && staff ? <input type="hidden" name="id" value={staff.id} /> : null}
            <Card className="grid gap-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{isCreate ? ui.cardTitleCreate : ui.cardTitleEdit}</div>
                    {!isCreate && staff ? <StatusBadge label={staff.status} tone={staff.status === "active" ? "success" : "warning"} /> : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    <FormField label={ui.name} required>
                        <Input name="name" defaultValue={staff?.name ?? ""} required />
                    </FormField>
                    <FormField label={ui.phone} required>
                        <Input name="phone" defaultValue={staff?.phone ?? ""} required />
                    </FormField>
                    <FormField label={ui.address} className="md:col-span-2">
                        <Input name="address" defaultValue={staff?.address ?? ""} />
                    </FormField>
                    <FormField label={ui.email} required>
                        <Input name="email" type="email" defaultValue={staff?.email ?? ""} required />
                    </FormField>
                    {isCreate ? (
                        <FormField label={ui.defaultPassword} required hint={ui.defaultPasswordHint}>
                            <Input name="password" type="password" minLength={8} required />
                        </FormField>
                    ) : null}
                    <FormField label={ui.roleLevel} required>
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
                        {ui.enabledStaff}
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[rgb(var(--text))]">
                        <input
                            name="mustChangePassword"
                            type="checkbox"
                            defaultChecked={isCreate ? true : Boolean(staff?.mustChangePassword)}
                            className="h-4 w-4 accent-[rgb(var(--accent))]"
                        />
                        {ui.mustChangePasswordNextLogin}
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[rgb(var(--text))]">
                        <input
                            name="isRepairTechnician"
                            type="checkbox"
                            defaultChecked={Boolean(staff?.isRepairTechnician)}
                            className="h-4 w-4 accent-[rgb(var(--accent))]"
                        />
                        {ui.isRepairTechnician}
                    </label>
                    <FormField label={ui.noteOptional} className="md:col-span-2">
                        <Textarea name="note" defaultValue={staff?.note ?? ""} rows={4} />
                    </FormField>
                </div>
            </Card>

            {!isCreate && staff ? (
                <Card className="grid gap-3">
                    <div className="text-sm font-medium">{ui.securityReadOnlyTitle}</div>
                    <p className="text-xs text-[rgb(var(--muted))]">{ui.securityReadOnlyHint}</p>
                    <dl className="grid gap-2 text-sm">
                        <div className="grid gap-0.5 sm:grid-cols-[10rem_1fr] sm:gap-3">
                            <dt className="text-[rgb(var(--muted))]">{ui.googleSignIn}</dt>
                            <dd className="text-[rgb(var(--text))]">{staff.googleLinked ? ui.googleLinkedYes : ui.googleLinkedNo}</dd>
                        </div>
                        <div className="grid gap-0.5 sm:grid-cols-[10rem_1fr] sm:gap-3">
                            <dt className="text-[rgb(var(--muted))]">{ui.googleEmail}</dt>
                            <dd className="break-all text-[rgb(var(--text))]">
                                {staff.googleLinked && staff.googleEmail?.trim() ? staff.googleEmail.trim() : ui.googleEmailEmpty}
                            </dd>
                        </div>
                        <div className="grid gap-0.5 sm:grid-cols-[10rem_1fr] sm:gap-3">
                            <dt className="text-[rgb(var(--muted))]">{ui.lastLogin}</dt>
                            <dd className="text-[rgb(var(--text))]">{formatStaffDateTime(staff.lastLoginAt, lang, ui.noRecordYet)}</dd>
                        </div>
                        <div className="grid gap-0.5 sm:grid-cols-[10rem_1fr] sm:gap-3">
                            <dt className="text-[rgb(var(--muted))]">{ui.passwordResetAt}</dt>
                            <dd className="text-[rgb(var(--text))]">{formatStaffDateTime(staff.passwordResetAt, lang, ui.noRecordYet)}</dd>
                        </div>
                    </dl>
                </Card>
            ) : null}

            <div className="flex flex-wrap gap-2">
                <IconTextActionButton icon={Save} type="submit" label={isCreate ? ui.saveCreate : ui.saveEdit} tooltip={isCreate ? ui.saveCreate : ui.saveEdit} />
                <IconTextActionButton icon={ArrowLeft} href={backHref} label={ui.back} tooltip={ui.backTooltip} />
            </div>
        </form>
    );
}
