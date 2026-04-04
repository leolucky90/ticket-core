import { MerchantSectionCard } from "@/components/merchant/shell";
import { formatIsoForDisplay } from "@/lib/format/datetime-display";
import { getUiText, type UiLanguage } from "@/lib/i18n/ui-text";
import type { AuthAccountSummary } from "@/lib/services/merchant/account-settings-read-model.service";

type AccountSummaryCardProps = {
    summary: AuthAccountSummary;
    lang: UiLanguage;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid gap-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-3">
            <span className="text-xs font-medium text-[rgb(var(--muted))]">{label}</span>
            <span className="break-all text-sm text-[rgb(var(--text))]">{value || "-"}</span>
        </div>
    );
}

export function AccountSummaryCard({ summary, lang }: AccountSummaryCardProps) {
    const t = getUiText(lang).accountInfo;
    const accountTypeText = summary.accountType === "company" ? t.companyAccount : t.customerAccount;

    return (
        <MerchantSectionCard title={t.summaryTitle} description={t.summaryDescription} bodyClassName="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <SummaryRow label={t.accountType} value={accountTypeText} />
            <SummaryRow label={t.email} value={summary.email} />
            <SummaryRow label={t.uid} value={summary.uid} />
            {summary.provider ? <SummaryRow label={t.provider} value={summary.provider} /> : null}
            {summary.createdAt ? <SummaryRow label={t.createdAt} value={formatIsoForDisplay(summary.createdAt, lang)} /> : null}
            {summary.lastLoginAt ? <SummaryRow label={t.lastLoginAt} value={formatIsoForDisplay(summary.lastLoginAt, lang)} /> : null}
        </MerchantSectionCard>
    );
}
