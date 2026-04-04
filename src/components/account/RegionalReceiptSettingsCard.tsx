"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { MerchantSectionCard } from "@/components/merchant/shell";
import { useUiLanguage } from "@/components/layout/ui-language-provider";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ReceiptTemplatePreview } from "@/components/account/ReceiptTemplatePreview";
import type { BusinessProfile, BusinessRegion, RegionalReceiptSettings } from "@/lib/schema";
import { getRegionalReceiptDefaults } from "@/lib/schema";
import { getUiText } from "@/lib/i18n/ui-text";

type RegionalReceiptSettingsCardProps = {
    businessProfile: BusinessProfile | null;
    settings: RegionalReceiptSettings;
    saveAction: (formData: FormData) => Promise<void>;
};

type EditableRegionalReceiptSettings = RegionalReceiptSettings;

function cloneSettings(settings: RegionalReceiptSettings): EditableRegionalReceiptSettings {
    return {
        ...settings,
        tw: { ...settings.tw },
        au: { ...settings.au },
    };
}

function SectionBlock({ title, description, children }: { title: string; description: string; children: ReactNode }) {
    return (
        <div className="grid gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-4">
            <div className="grid gap-1">
                <h3 className="text-sm font-semibold text-[rgb(var(--text))]">{title}</h3>
                <p className="text-xs text-[rgb(var(--muted))]">{description}</p>
            </div>
            {children}
        </div>
    );
}

function CheckboxField({
    name,
    checked,
    label,
    description,
    disabled,
    onChange,
}: {
    name: string;
    checked: boolean;
    label: string;
    description: string;
    disabled: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex items-start gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-3">
            <input
                type="hidden"
                name={name}
                value="false"
            />
            <input
                type="checkbox"
                name={name}
                value="true"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]"
            />
            <span className="grid gap-1">
                <span className="text-sm font-medium text-[rgb(var(--text))]">{label}</span>
                <span className="text-xs text-[rgb(var(--muted))]">{description}</span>
            </span>
        </label>
    );
}

function HiddenRegionFields({ settings, activeRegion }: { settings: EditableRegionalReceiptSettings; activeRegion: BusinessRegion }) {
    if (activeRegion === "TW") {
        return (
            <>
                <input type="hidden" name="au.abn" value={settings.au.abn} />
                <input type="hidden" name="au.businessRegistrationNumber" value={settings.au.businessRegistrationNumber} />
                <input type="hidden" name="au.gstRegistered" value={String(settings.au.gstRegistered)} />
                <input type="hidden" name="au.showAbnOnReceipt" value={String(settings.au.showAbnOnReceipt)} />
                <input type="hidden" name="au.showGstBreakdown" value={String(settings.au.showGstBreakdown)} />
                <input type="hidden" name="au.invoiceTitleMode" value={settings.au.invoiceTitleMode} />
                <input type="hidden" name="au.invoiceNote" value={settings.au.invoiceNote} />
                <input type="hidden" name="au.receiptNote" value={settings.au.receiptNote} />
            </>
        );
    }

    return (
        <>
            <input type="hidden" name="tw.taxId" value={settings.tw.taxId} />
            <input type="hidden" name="tw.electronicInvoiceEnabled" value={String(settings.tw.electronicInvoiceEnabled)} />
            <input type="hidden" name="tw.carrierEnabled" value={String(settings.tw.carrierEnabled)} />
            <input type="hidden" name="tw.mobileBarcodeEnabled" value={String(settings.tw.mobileBarcodeEnabled)} />
            <input type="hidden" name="tw.memberCarrierEnabled" value={String(settings.tw.memberCarrierEnabled)} />
            <input type="hidden" name="tw.donationCodeEnabled" value={String(settings.tw.donationCodeEnabled)} />
            <input type="hidden" name="tw.invoiceNote" value={settings.tw.invoiceNote} />
            <input type="hidden" name="tw.receiptNote" value={settings.tw.receiptNote} />
        </>
    );
}

function SaveRegionalSettingsButton({ label, loadingLabel }: { label: string; loadingLabel: string }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" loading={pending} loadingLabel={loadingLabel}>
            {label}
        </Button>
    );
}

export function RegionalReceiptSettingsCard({ businessProfile, settings, saveAction }: RegionalReceiptSettingsCardProps) {
    const lang = useUiLanguage();
    const t = getUiText(lang).regionalReceiptSettings;
    const [editing, setEditing] = useState(false);
    const [formState, setFormState] = useState<EditableRegionalReceiptSettings>(() => cloneSettings(settings));

    const region = formState.businessRegion;

    function resetForm() {
        setEditing(false);
        setFormState(cloneSettings(settings));
    }

    function setRegion(nextRegion: BusinessRegion) {
        const defaults = getRegionalReceiptDefaults(nextRegion);
        setFormState((current) => ({
            ...current,
            ...defaults,
        }));
    }

    return (
        <form action={saveAction} className="grid gap-4">
            <MerchantSectionCard
                title={t.sectionTitle}
                description={t.sectionDescription}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        {!editing ? (
                            <Button type="button" variant="ghost" onClick={() => setEditing(true)}>
                                {t.editLabel}
                            </Button>
                        ) : (
                            <>
                                <Button type="button" variant="ghost" onClick={resetForm}>
                                    {t.cancelLabel}
                                </Button>
                                <SaveRegionalSettingsButton label={t.saveLabel} loadingLabel={t.savingLabel} />
                            </>
                        )}
                    </div>
                }
                bodyClassName="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.9fr)]"
            >
                <div className="grid gap-4">
                    <SectionBlock title={t.groups.baselineTitle} description={t.groups.baselineDescription}>
                        <HiddenRegionFields settings={formState} activeRegion={region} />
                        <div className="grid gap-3 md:grid-cols-2">
                            <FormField label={t.fields.businessRegion} required hint={t.hints.businessRegion}>
                                <Select
                                    name="businessRegion"
                                    value={formState.businessRegion}
                                    disabled={!editing}
                                    onChange={(event) => setRegion(event.target.value as BusinessRegion)}
                                >
                                    <option value="TW">{t.regions.TW}</option>
                                    <option value="AU">{t.regions.AU}</option>
                                </Select>
                            </FormField>
                            <FormField label={t.fields.documentMode} required>
                                <Select
                                    name="documentMode"
                                    value={formState.documentMode}
                                    disabled={!editing}
                                    onChange={(event) => setFormState((current) => ({ ...current, documentMode: event.target.value as RegionalReceiptSettings["documentMode"] }))}
                                >
                                    <option value="auto">{t.documentModes.auto}</option>
                                    <option value="receipt">{t.documentModes.receipt}</option>
                                    <option value="invoice">{t.documentModes.invoice}</option>
                                    <option value="tax-invoice">{t.documentModes.taxInvoice}</option>
                                    <option value="electronic-invoice">{t.documentModes.electronicInvoice}</option>
                                </Select>
                            </FormField>
                            <FormField label={t.fields.locale}>
                                <Input
                                    name="locale"
                                    value={formState.locale}
                                    disabled={!editing}
                                    onChange={(event) => setFormState((current) => ({ ...current, locale: event.target.value }))}
                                />
                            </FormField>
                            <FormField label={t.fields.currency}>
                                <Input
                                    name="currency"
                                    value={formState.currency}
                                    disabled={!editing}
                                    onChange={(event) => setFormState((current) => ({ ...current, currency: event.target.value }))}
                                />
                            </FormField>
                            <FormField label={t.fields.timezone} className="md:col-span-2">
                                <Input
                                    name="timezone"
                                    value={formState.timezone}
                                    disabled={!editing}
                                    onChange={(event) => setFormState((current) => ({ ...current, timezone: event.target.value }))}
                                />
                            </FormField>
                        </div>
                    </SectionBlock>

                    {region === "TW" ? (
                        <SectionBlock title={t.groups.twTitle} description={t.groups.twDescription}>
                            <div className="grid gap-3 md:grid-cols-2">
                                <FormField label={t.fields.taxId}>
                                    <Input
                                        name="tw.taxId"
                                        value={formState.tw.taxId}
                                        disabled={!editing}
                                        onChange={(event) =>
                                            setFormState((current) => ({
                                                ...current,
                                                tw: { ...current.tw, taxId: event.target.value },
                                            }))
                                        }
                                    />
                                </FormField>
                                <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
                                    <CheckboxField
                                        name="tw.electronicInvoiceEnabled"
                                        checked={formState.tw.electronicInvoiceEnabled}
                                        disabled={!editing}
                                        label={t.fields.electronicInvoiceEnabled}
                                        description={t.descriptions.electronicInvoiceEnabled}
                                        onChange={(checked) =>
                                            setFormState((current) => ({
                                                ...current,
                                                tw: { ...current.tw, electronicInvoiceEnabled: checked },
                                            }))
                                        }
                                    />
                                    <CheckboxField
                                        name="tw.carrierEnabled"
                                        checked={formState.tw.carrierEnabled}
                                        disabled={!editing}
                                        label={t.fields.carrierEnabled}
                                        description={t.descriptions.carrierEnabled}
                                        onChange={(checked) =>
                                            setFormState((current) => ({
                                                ...current,
                                                tw: { ...current.tw, carrierEnabled: checked },
                                            }))
                                        }
                                    />
                                    <CheckboxField
                                        name="tw.mobileBarcodeEnabled"
                                        checked={formState.tw.mobileBarcodeEnabled}
                                        disabled={!editing}
                                        label={t.fields.mobileBarcodeEnabled}
                                        description={t.descriptions.mobileBarcodeEnabled}
                                        onChange={(checked) =>
                                            setFormState((current) => ({
                                                ...current,
                                                tw: { ...current.tw, mobileBarcodeEnabled: checked },
                                            }))
                                        }
                                    />
                                    <CheckboxField
                                        name="tw.memberCarrierEnabled"
                                        checked={formState.tw.memberCarrierEnabled}
                                        disabled={!editing}
                                        label={t.fields.memberCarrierEnabled}
                                        description={t.descriptions.memberCarrierEnabled}
                                        onChange={(checked) =>
                                            setFormState((current) => ({
                                                ...current,
                                                tw: { ...current.tw, memberCarrierEnabled: checked },
                                            }))
                                        }
                                    />
                                    <CheckboxField
                                        name="tw.donationCodeEnabled"
                                        checked={formState.tw.donationCodeEnabled}
                                        disabled={!editing}
                                        label={t.fields.donationCodeEnabled}
                                        description={t.descriptions.donationCodeEnabled}
                                        onChange={(checked) =>
                                            setFormState((current) => ({
                                                ...current,
                                                tw: { ...current.tw, donationCodeEnabled: checked },
                                            }))
                                        }
                                    />
                                </div>
                                <FormField label={t.fields.invoiceNote} className="md:col-span-2">
                                    <Textarea
                                        name="tw.invoiceNote"
                                        rows={3}
                                        value={formState.tw.invoiceNote}
                                        disabled={!editing}
                                        onChange={(event) =>
                                            setFormState((current) => ({
                                                ...current,
                                                tw: { ...current.tw, invoiceNote: event.target.value },
                                            }))
                                        }
                                    />
                                </FormField>
                                <FormField label={t.fields.receiptNote} className="md:col-span-2">
                                    <Textarea
                                        name="tw.receiptNote"
                                        rows={3}
                                        value={formState.tw.receiptNote}
                                        disabled={!editing}
                                        onChange={(event) =>
                                            setFormState((current) => ({
                                                ...current,
                                                tw: { ...current.tw, receiptNote: event.target.value },
                                            }))
                                        }
                                    />
                                </FormField>
                            </div>
                        </SectionBlock>
                    ) : (
                        <SectionBlock title={t.groups.auTitle} description={t.groups.auDescription}>
                            <div className="grid gap-3 md:grid-cols-2">
                                <FormField label={t.fields.abn}>
                                    <Input
                                        name="au.abn"
                                        value={formState.au.abn}
                                        disabled={!editing}
                                        onChange={(event) =>
                                            setFormState((current) => ({
                                                ...current,
                                                au: { ...current.au, abn: event.target.value },
                                            }))
                                        }
                                    />
                                </FormField>
                                <FormField label={t.fields.businessRegistrationNumber}>
                                    <Input
                                        name="au.businessRegistrationNumber"
                                        value={formState.au.businessRegistrationNumber}
                                        disabled={!editing}
                                        onChange={(event) =>
                                            setFormState((current) => ({
                                                ...current,
                                                au: { ...current.au, businessRegistrationNumber: event.target.value },
                                            }))
                                        }
                                    />
                                </FormField>
                                <FormField label={t.fields.invoiceTitleMode}>
                                    <Select
                                        name="au.invoiceTitleMode"
                                        value={formState.au.invoiceTitleMode}
                                        disabled={!editing}
                                        onChange={(event) =>
                                            setFormState((current) => ({
                                                ...current,
                                                au: { ...current.au, invoiceTitleMode: event.target.value as RegionalReceiptSettings["au"]["invoiceTitleMode"] },
                                            }))
                                        }
                                    >
                                        <option value="auto">{t.invoiceTitleModes.auto}</option>
                                        <option value="invoice">{t.invoiceTitleModes.invoice}</option>
                                        <option value="tax-invoice">{t.invoiceTitleModes.taxInvoice}</option>
                                    </Select>
                                </FormField>
                                <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
                                    <CheckboxField
                                        name="au.gstRegistered"
                                        checked={formState.au.gstRegistered}
                                        disabled={!editing}
                                        label={t.fields.gstRegistered}
                                        description={t.descriptions.gstRegistered}
                                        onChange={(checked) =>
                                            setFormState((current) => ({
                                                ...current,
                                                au: { ...current.au, gstRegistered: checked },
                                            }))
                                        }
                                    />
                                    <CheckboxField
                                        name="au.showAbnOnReceipt"
                                        checked={formState.au.showAbnOnReceipt}
                                        disabled={!editing}
                                        label={t.fields.showAbnOnReceipt}
                                        description={t.descriptions.showAbnOnReceipt}
                                        onChange={(checked) =>
                                            setFormState((current) => ({
                                                ...current,
                                                au: { ...current.au, showAbnOnReceipt: checked },
                                            }))
                                        }
                                    />
                                    <CheckboxField
                                        name="au.showGstBreakdown"
                                        checked={formState.au.showGstBreakdown}
                                        disabled={!editing}
                                        label={t.fields.showGstBreakdown}
                                        description={t.descriptions.showGstBreakdown}
                                        onChange={(checked) =>
                                            setFormState((current) => ({
                                                ...current,
                                                au: { ...current.au, showGstBreakdown: checked },
                                            }))
                                        }
                                    />
                                </div>
                                <FormField label={t.fields.invoiceNote} className="md:col-span-2">
                                    <Textarea
                                        name="au.invoiceNote"
                                        rows={3}
                                        value={formState.au.invoiceNote}
                                        disabled={!editing}
                                        onChange={(event) =>
                                            setFormState((current) => ({
                                                ...current,
                                                au: { ...current.au, invoiceNote: event.target.value },
                                            }))
                                        }
                                    />
                                </FormField>
                                <FormField label={t.fields.receiptNote} className="md:col-span-2">
                                    <Textarea
                                        name="au.receiptNote"
                                        rows={3}
                                        value={formState.au.receiptNote}
                                        disabled={!editing}
                                        onChange={(event) =>
                                            setFormState((current) => ({
                                                ...current,
                                                au: { ...current.au, receiptNote: event.target.value },
                                            }))
                                        }
                                    />
                                </FormField>
                            </div>
                        </SectionBlock>
                    )}
                </div>

                <ReceiptTemplatePreview businessProfile={businessProfile} settings={formState} />
            </MerchantSectionCard>
        </form>
    );
}
