import { cookies } from "next/headers";
import { MerchantPageShell } from "@/components/merchant/shell";
import { AuditLogsPanel } from "@/components/settings/AuditLogsPanel";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { queryCompanyAuditLogs } from "@/lib/services/merchant/audit-log-read-model.service";

export default async function AuditLogsPage() {
    const cookieStore = await cookies();
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const ui = getUiText(lang).auditLogs;
    const logs = await queryCompanyAuditLogs(100);

    return (
        <MerchantPageShell title={ui.pageTitle} subtitle={ui.pageSubtitle} width="index">
            <AuditLogsPanel logs={logs} lang={lang} />
        </MerchantPageShell>
    );
}
