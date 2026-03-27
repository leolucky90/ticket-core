"use client";

import { Copy, Pencil, Save, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CompanyProfile } from "@/lib/schema";

type CompanyProfileSettingsFormProps = {
    profile: CompanyProfile | null;
    saveAction: (formData: FormData) => Promise<void>;
};

function buildCopyText(profile: CompanyProfile | null): string {
    if (!profile) return "";
    return [
        `companyName: ${profile.companyName}`,
        `displayName: ${profile.displayName}`,
        `contactName: ${profile.contactName}`,
        `phone: ${profile.phone}`,
        `email: ${profile.email}`,
        `address: ${profile.address}`,
        `country: ${profile.country}`,
        `region: ${profile.region}`,
        `postcode: ${profile.postcode}`,
        `taxId: ${profile.taxId}`,
        `abn: ${profile.abn}`,
        `businessRegistrationNumber: ${profile.businessRegistrationNumber}`,
        `invoiceNote: ${profile.invoiceNote}`,
        `receiptNote: ${profile.receiptNote}`,
    ].join("\n");
}

export function CompanyProfileSettingsForm({ profile, saveAction }: CompanyProfileSettingsFormProps) {
    const [editing, setEditing] = useState(false);
    const copyText = useMemo(() => buildCopyText(profile), [profile]);

    return (
        <form action={saveAction} className="grid gap-4">
            <Card className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <div className="text-sm font-semibold">公司帳戶資訊</div>
                        <div className="text-xs text-[rgb(var(--muted))]">收據、報價、客戶預設帶入資料來源（可擴充地區欄位）。</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <IconActionButton
                            icon={Copy}
                            label="複製資訊"
                            tooltip="複製公司帳戶資訊"
                            onClick={async () => {
                                if (!copyText) return;
                                try {
                                    await navigator.clipboard.writeText(copyText);
                                } catch {
                                    // ignore clipboard errors
                                }
                            }}
                        />
                        {!editing ? (
                            <IconTextActionButton icon={Pencil} label="編輯" tooltip="編輯公司帳戶資訊" onClick={() => setEditing(true)} />
                        ) : (
                            <>
                                <IconTextActionButton icon={Save} type="submit" label="儲存" tooltip="儲存公司帳戶資訊" />
                                <IconTextActionButton
                                    icon={X}
                                    type="button"
                                    label="取消"
                                    tooltip="取消編輯"
                                    onClick={() => {
                                        setEditing(false);
                                        window.location.reload();
                                    }}
                                />
                            </>
                        )}
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <FormField label="companyName" required>
                        <Input name="companyName" defaultValue={profile?.companyName ?? ""} disabled={!editing} required={editing} />
                    </FormField>
                    <FormField label="displayName">
                        <Input name="displayName" defaultValue={profile?.displayName ?? ""} disabled={!editing} />
                    </FormField>
                    <FormField label="contactName">
                        <Input name="contactName" defaultValue={profile?.contactName ?? ""} disabled={!editing} />
                    </FormField>
                    <FormField label="phone">
                        <Input name="phone" defaultValue={profile?.phone ?? ""} disabled={!editing} />
                    </FormField>
                    <FormField label="email">
                        <Input name="email" defaultValue={profile?.email ?? ""} disabled={!editing} />
                    </FormField>
                    <FormField label="address" className="md:col-span-2">
                        <Input name="address" defaultValue={profile?.address ?? ""} disabled={!editing} />
                    </FormField>
                    <FormField label="country">
                        <Input name="country" defaultValue={profile?.country ?? ""} disabled={!editing} />
                    </FormField>
                    <FormField label="region">
                        <Input name="region" defaultValue={profile?.region ?? ""} disabled={!editing} />
                    </FormField>
                    <FormField label="postcode">
                        <Input name="postcode" defaultValue={profile?.postcode ?? ""} disabled={!editing} />
                    </FormField>
                    <FormField label="taxId">
                        <Input name="taxId" defaultValue={profile?.taxId ?? ""} disabled={!editing} />
                    </FormField>
                    <FormField label="abn">
                        <Input name="abn" defaultValue={profile?.abn ?? ""} disabled={!editing} />
                    </FormField>
                    <FormField label="businessRegistrationNumber">
                        <Input name="businessRegistrationNumber" defaultValue={profile?.businessRegistrationNumber ?? ""} disabled={!editing} />
                    </FormField>
                    <FormField label="invoiceNote" className="md:col-span-2">
                        <Textarea name="invoiceNote" rows={2} defaultValue={profile?.invoiceNote ?? ""} disabled={!editing} />
                    </FormField>
                    <FormField label="receiptNote" className="md:col-span-2">
                        <Textarea name="receiptNote" rows={2} defaultValue={profile?.receiptNote ?? ""} disabled={!editing} />
                    </FormField>
                </div>
            </Card>
        </form>
    );
}
