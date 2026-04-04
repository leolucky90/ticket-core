"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { MerchantSectionCard } from "@/components/merchant/shell";
import { useUiLanguage } from "@/components/layout/ui-language-provider";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BusinessProfile } from "@/lib/schema";
import { getUiText } from "@/lib/i18n/ui-text";

type BusinessProfileFormProps = {
    profile: BusinessProfile;
    saveAction: (formData: FormData) => Promise<void>;
};

function buildCopyText(profile: BusinessProfile): string {
    return [
        `companyName: ${profile.companyName}`,
        `displayName: ${profile.displayName}`,
        `contactName: ${profile.contactName}`,
        `phone: ${profile.phone}`,
        `email: ${profile.email}`,
        `website: ${profile.website}`,
        `address: ${profile.address}`,
        `country: ${profile.country}`,
        `region: ${profile.region}`,
        `postcode: ${profile.postcode}`,
    ].join("\n");
}

function SectionBlock({ title, description, children }: { title: string; description: string; children: ReactNode }) {
    return (
        <div className="grid gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-4">
            <div className="grid gap-1">
                <h3 className="text-sm font-semibold text-[rgb(var(--text))]">{title}</h3>
                <p className="text-xs text-[rgb(var(--muted))]">{description}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">{children}</div>
        </div>
    );
}

function SaveProfileButton({ label, loadingLabel }: { label: string; loadingLabel: string }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" loading={pending} loadingLabel={loadingLabel}>
            {label}
        </Button>
    );
}

export function BusinessProfileForm({ profile, saveAction }: BusinessProfileFormProps) {
    const lang = useUiLanguage();
    const t = getUiText(lang).businessProfileSettings;
    const [editing, setEditing] = useState(false);
    const [formVersion, setFormVersion] = useState(0);

    return (
        <form action={saveAction} key={formVersion} className="grid gap-4">
            <MerchantSectionCard
                title={t.sectionTitle}
                description={t.sectionDescription}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <IconActionButton
                            icon={Copy}
                            label={t.copyLabel}
                            tooltip={t.copyTooltip}
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(buildCopyText(profile));
                                } catch {
                                    // ignore clipboard errors
                                }
                            }}
                        />
                        {!editing ? (
                            <Button type="button" variant="ghost" onClick={() => setEditing(true)}>
                                {t.editLabel}
                            </Button>
                        ) : (
                            <>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setEditing(false);
                                        setFormVersion((value) => value + 1);
                                    }}
                                >
                                    {t.cancelLabel}
                                </Button>
                                <SaveProfileButton label={t.saveLabel} loadingLabel={t.savingLabel} />
                            </>
                        )}
                    </div>
                }
                bodyClassName="grid gap-4"
            >
                <SectionBlock title={t.groups.identityTitle} description={t.groups.identityDescription}>
                    <FormField label={t.fields.companyName} required>
                        <Input name="companyName" defaultValue={profile.companyName} disabled={!editing} required={editing} />
                    </FormField>
                    <FormField label={t.fields.displayName} hint={t.hints.displayName}>
                        <Input name="displayName" defaultValue={profile.displayName} disabled={!editing} />
                    </FormField>
                </SectionBlock>

                <SectionBlock title={t.groups.contactTitle} description={t.groups.contactDescription}>
                    <FormField label={t.fields.contactName}>
                        <Input name="contactName" defaultValue={profile.contactName} disabled={!editing} />
                    </FormField>
                    <FormField label={t.fields.phone}>
                        <Input name="phone" defaultValue={profile.phone} disabled={!editing} />
                    </FormField>
                    <FormField label={t.fields.email}>
                        <Input type="email" name="email" defaultValue={profile.email} disabled={!editing} />
                    </FormField>
                    <FormField label={t.fields.website}>
                        <Input type="url" name="website" defaultValue={profile.website} disabled={!editing} placeholder="https://example.com" />
                    </FormField>
                </SectionBlock>

                <SectionBlock title={t.groups.addressTitle} description={t.groups.addressDescription}>
                    <FormField label={t.fields.address} className="md:col-span-2">
                        <Textarea name="address" rows={3} defaultValue={profile.address} disabled={!editing} />
                    </FormField>
                    <FormField label={t.fields.country}>
                        <Input name="country" defaultValue={profile.country} disabled={!editing} />
                    </FormField>
                    <FormField label={t.fields.region}>
                        <Input name="region" defaultValue={profile.region} disabled={!editing} />
                    </FormField>
                    <FormField label={t.fields.postcode}>
                        <Input name="postcode" defaultValue={profile.postcode} disabled={!editing} />
                    </FormField>
                </SectionBlock>
            </MerchantSectionCard>
        </form>
    );
}
