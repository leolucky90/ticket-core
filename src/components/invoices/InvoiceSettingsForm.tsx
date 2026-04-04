import { MerchantSectionCard } from "@/components/merchant/shell";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { InvoiceSettings } from "@/lib/schema";

type InvoiceSettingsFormProps = {
    ui: ReturnType<typeof import("@/lib/i18n/ui-text").getUiText>["invoiceAdmin"];
    settings: InvoiceSettings;
    saveAction: (formData: FormData) => Promise<void>;
};

export function InvoiceSettingsForm({ ui, settings, saveAction }: InvoiceSettingsFormProps) {
    return (
        <form action={saveAction} className="grid gap-4">
            <MerchantSectionCard title={ui.settingsTitle} description={ui.settingsDescription} bodyClassName="grid gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                    <FormField label={ui.integrationMode}>
                        <Select name="integrationMode" defaultValue={settings.integrationMode}>
                            <option value="mock">{ui.integrationModes.mock}</option>
                            <option value="mof-test">{ui.integrationModes.mofTest}</option>
                            <option value="mof-production">{ui.integrationModes.mofProduction}</option>
                            <option value="vac-test">{ui.integrationModes.vacTest}</option>
                            <option value="vac-production">{ui.integrationModes.vacProduction}</option>
                        </Select>
                    </FormField>
                    <FormField label={ui.defaultBranchId}>
                        <Input name="defaultBranchId" defaultValue={settings.defaultBranchId} />
                    </FormField>
                    <FormField label={ui.twSellerName}>
                        <Input name="twSellerName" defaultValue={settings.twSellerName} />
                    </FormField>
                    <FormField label={ui.twTaxId}>
                        <Input name="twTaxId" defaultValue={settings.twTaxId} />
                    </FormField>
                    <FormField label={ui.auBusinessName}>
                        <Input name="auBusinessName" defaultValue={settings.auBusinessName} />
                    </FormField>
                    <FormField label={ui.auAbn}>
                        <Input name="auAbn" defaultValue={settings.auAbn} />
                    </FormField>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex items-start gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3">
                        <input type="hidden" name="enabled" value="false" />
                        <input type="checkbox" name="enabled" value="true" defaultChecked={settings.enabled} className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]" />
                        <span className="grid gap-1">
                            <span className="text-sm font-medium text-[rgb(var(--text))]">{ui.enabled}</span>
                            <span className="text-xs text-[rgb(var(--muted))]">{ui.enabledHint}</span>
                        </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3">
                        <input type="hidden" name="autoIssueOnCheckout" value="false" />
                        <input type="checkbox" name="autoIssueOnCheckout" value="true" defaultChecked={settings.autoIssueOnCheckout} className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]" />
                        <span className="grid gap-1">
                            <span className="text-sm font-medium text-[rgb(var(--text))]">{ui.autoIssueOnCheckout}</span>
                            <span className="text-xs text-[rgb(var(--muted))]">{ui.autoIssueHint}</span>
                        </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3">
                        <input type="hidden" name="allowReissueAfterVoid" value="false" />
                        <input type="checkbox" name="allowReissueAfterVoid" value="true" defaultChecked={settings.allowReissueAfterVoid} className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]" />
                        <span className="grid gap-1">
                            <span className="text-sm font-medium text-[rgb(var(--text))]">{ui.allowReissueAfterVoid}</span>
                            <span className="text-xs text-[rgb(var(--muted))]">{ui.allowReissueHint}</span>
                        </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3">
                        <input type="hidden" name="simulateIssueFailure" value="false" />
                        <input type="checkbox" name="simulateIssueFailure" value="true" defaultChecked={settings.simulateIssueFailure} className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]" />
                        <span className="grid gap-1">
                            <span className="text-sm font-medium text-[rgb(var(--text))]">{ui.simulateIssueFailure}</span>
                            <span className="text-xs text-[rgb(var(--muted))]">{ui.simulateIssueHint}</span>
                        </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3 md:col-span-2">
                        <input type="hidden" name="simulateVoidFailure" value="false" />
                        <input type="checkbox" name="simulateVoidFailure" value="true" defaultChecked={settings.simulateVoidFailure} className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]" />
                        <span className="grid gap-1">
                            <span className="text-sm font-medium text-[rgb(var(--text))]">{ui.simulateVoidFailure}</span>
                            <span className="text-xs text-[rgb(var(--muted))]">{ui.simulateVoidHint}</span>
                        </span>
                    </label>
                </div>

                <div className="flex justify-end">
                    <Button type="submit">{ui.save}</Button>
                </div>
            </MerchantSectionCard>
        </form>
    );
}
