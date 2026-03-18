import { MerchantPageShell } from "@/components/merchant/shell";
import { MerchantRelationshipWorkspace } from "@/components/merchant/MerchantRelationshipWorkspace";
import { getMerchantRelationshipOverview } from "@/lib/services/merchantOverview";

export default async function DashboardRelationshipsPage() {
    const rows = await getMerchantRelationshipOverview();

    return (
        <MerchantPageShell title="關聯總覽" subtitle="跨模組關係視圖，協助快速掌握客戶交易與服務脈絡。" width="overview">
            <MerchantRelationshipWorkspace rows={rows} />
        </MerchantPageShell>
    );
}
