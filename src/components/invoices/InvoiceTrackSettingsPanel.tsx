import { MerchantSectionCard } from "@/components/merchant/shell";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { InvoiceTrackSetting } from "@/lib/schema";

type InvoiceTrackSettingsPanelProps = {
    ui: ReturnType<typeof import("@/lib/i18n/ui-text").getUiText>["invoiceAdmin"];
    tracks: InvoiceTrackSetting[];
    saveAction: (formData: FormData) => Promise<void>;
};

function TrackForm({
    ui,
    track,
    saveAction,
}: {
    ui: InvoiceTrackSettingsPanelProps["ui"];
    track?: InvoiceTrackSetting;
    saveAction: (formData: FormData) => Promise<void>;
}) {
    return (
        <form action={saveAction} className="grid gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-4">
            {track ? <input type="hidden" name="id" value={track.id} /> : null}
            <div className="grid gap-3 md:grid-cols-2">
                <FormField label={ui.trackLabel}>
                    <Input name="label" defaultValue={track?.label ?? ""} />
                </FormField>
                <FormField label={ui.trackPrefix}>
                    <Input name="prefix" defaultValue={track?.prefix ?? ""} />
                </FormField>
                <FormField label={ui.region}>
                    <Select name="region" defaultValue={track?.region ?? "TW"}>
                        <option value="TW">TW</option>
                        <option value="AU">AU</option>
                    </Select>
                </FormField>
                <FormField label={ui.documentType}>
                    <Select name="documentType" defaultValue={track?.documentType ?? "electronic-invoice"}>
                        <option value="electronic-invoice">{ui.documentTypes.electronicInvoice}</option>
                        <option value="receipt">{ui.documentTypes.receipt}</option>
                        <option value="invoice">{ui.documentTypes.invoice}</option>
                        <option value="tax-invoice">{ui.documentTypes.taxInvoice}</option>
                    </Select>
                </FormField>
                <FormField label={ui.integrationMode}>
                    <Select name="integrationMode" defaultValue={track?.integrationMode ?? "mock"}>
                        <option value="mock">{ui.integrationModes.mock}</option>
                        <option value="mof-test">{ui.integrationModes.mofTest}</option>
                        <option value="mof-production">{ui.integrationModes.mofProduction}</option>
                        <option value="vac-test">{ui.integrationModes.vacTest}</option>
                        <option value="vac-production">{ui.integrationModes.vacProduction}</option>
                    </Select>
                </FormField>
                <FormField label={ui.startNo}>
                    <Input type="number" name="startNo" defaultValue={track?.startNo ?? 1} />
                </FormField>
                <FormField label={ui.endNo}>
                    <Input type="number" name="endNo" defaultValue={track?.endNo ?? 99999999} />
                </FormField>
                <FormField label={ui.nextNo}>
                    <Input type="number" name="nextNo" defaultValue={track?.nextNo ?? 1} />
                </FormField>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-[rgb(var(--text))]">
                <input type="hidden" name="active" value="false" />
                <input type="checkbox" name="active" value="true" defaultChecked={track?.active ?? true} className="h-4 w-4 accent-[rgb(var(--accent))]" />
                {ui.activeTrack}
            </label>
            <div className="flex justify-end">
                <Button type="submit">{track ? ui.updateTrack : ui.createTrack}</Button>
            </div>
        </form>
    );
}

export function InvoiceTrackSettingsPanel({ ui, tracks, saveAction }: InvoiceTrackSettingsPanelProps) {
    return (
        <div className="grid gap-4">
            <MerchantSectionCard title={ui.trackSettingsTitle} description={ui.trackSettingsDescription}>
                <TrackForm ui={ui} saveAction={saveAction} />
            </MerchantSectionCard>

            <MerchantSectionCard title={ui.existingTracksTitle} description={ui.existingTracksDescription} bodyClassName="grid gap-3">
                {tracks.length === 0 ? <div className="text-sm text-[rgb(var(--muted))]">{ui.noTracks}</div> : tracks.map((track) => <TrackForm key={track.id} ui={ui} track={track} saveAction={saveAction} />)}
            </MerchantSectionCard>
        </div>
    );
}
