import { cookies } from "next/headers";
import { MerchantPageShell } from "@/components/merchant/shell";
import { MerchantRelationshipWorkspace } from "@/components/merchant/MerchantRelationshipWorkspace";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getMerchantRelationshipOverview } from "@/lib/services/merchantOverview";

export default async function DashboardRelationshipsPage() {
    const lang = getUiLanguage((await cookies()).get("lang")?.value);
    const p = getUiText(lang).merchantStandalonePages.relationships;
    const rows = await getMerchantRelationshipOverview();

    return (
        <MerchantPageShell title={p.title} subtitle={p.subtitle} width="overview">
            <MerchantRelationshipWorkspace lang={lang} rows={rows} />
        </MerchantPageShell>
    );
}
