import { cookies } from "next/headers";
import { AlertTriangle, PackageCheck, Timer, TrendingUp } from "lucide-react";
import { MerchantPageShell, MerchantSectionCard, MerchantStatGrid } from "@/components/merchant/shell";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getConsignmentOverviewData } from "@/lib/services/merchant/consignment-overview-service";

export default async function DashboardConsignmentsPage() {
    const lang = getUiLanguage((await cookies()).get("lang")?.value);
    const ui = getUiText(lang);
    const shell = ui.merchantStandalonePages.consignments;
    const co = ui.consignmentsOverview;
    const data = await getConsignmentOverviewData();

    const stats = [
        { id: "active", label: co.kpiActive, value: data.kpi.activeCount, hint: co.kpiActiveHint },
        { id: "remaining", label: co.kpiRemaining, value: data.kpi.remainingQty, hint: co.kpiRemainingHint },
        { id: "expiring", label: co.kpiExpiring, value: data.kpi.expiringSoonCount, hint: co.kpiExpiringHint },
        { id: "completed", label: co.kpiCompleted, value: data.kpi.completedCount, hint: co.kpiCompletedHint },
        { id: "expired", label: co.kpiExpired, value: data.kpi.expiredCount, hint: co.kpiExpiredHint },
    ];

    return (
        <MerchantPageShell title={shell.title} subtitle={shell.subtitle} width="overview">
            <MerchantSectionCard title={co.summaryTitle} description={co.summaryDescription}>
                <MerchantStatGrid items={stats} />
            </MerchantSectionCard>

            <MerchantSectionCard
                title={co.riskTitle}
                description={co.riskDescription}
                emptyState={{
                    icon: AlertTriangle,
                    title: co.riskEmptyTitle,
                    description: co.riskEmptyDescription,
                }}
            >
                {data.riskReminders.length === 0 ? null : (
                    <div className="grid gap-2">
                        {data.riskReminders.map((risk) => (
                            <div key={risk.id} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                <div className="text-sm font-semibold">{risk.title}</div>
                                <div className="text-xs text-[rgb(var(--muted))]">{risk.description}</div>
                            </div>
                        ))}
                    </div>
                )}
            </MerchantSectionCard>

            <div className="grid gap-4 xl:grid-cols-2">
                <MerchantSectionCard
                    title={co.hotTitle}
                    description={co.hotDescription}
                    emptyState={{
                        icon: TrendingUp,
                        title: co.hotEmptyTitle,
                        description: co.hotEmptyDescription,
                    }}
                >
                    {data.hotCampaigns.length === 0 ? null : (
                        <div className="grid gap-2">
                            {data.hotCampaigns.map((item) => (
                                <div key={item.campaignId} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                    <div className="font-semibold">{item.campaignName}</div>
                                    <div className="text-xs text-[rgb(var(--muted))]">
                                        entitlement {item.entitlementCount} / consignment {item.consignmentCount} / redeemed {item.redeemedQty} / remaining{" "}
                                        {item.remainingQty}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </MerchantSectionCard>

                <MerchantSectionCard
                    title={co.popularTitle}
                    description={co.popularDescription}
                    emptyState={{
                        icon: PackageCheck,
                        title: co.popularEmptyTitle,
                        description: co.popularEmptyDescription,
                    }}
                >
                    {data.popularStoredItemTypes.length === 0 ? null : (
                        <div className="grid gap-2">
                            {data.popularStoredItemTypes.map((item) => (
                                <div key={item.key} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                                    <div className="font-semibold">{item.label}</div>
                                    <div className="text-xs text-[rgb(var(--muted))]">
                                        remaining {item.remainingQty} / customers {item.customerCount}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </MerchantSectionCard>
            </div>

            <MerchantSectionCard
                title={co.closureTitle}
                description={co.closureDescription}
                emptyState={{
                    icon: Timer,
                    title: co.closureEmptyTitle,
                    description: co.closureEmptyDescription,
                }}
            >
                {data.campaignClosures.length === 0 ? null : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-[rgb(var(--muted))]">
                                    <th className="px-2 py-2">{co.colCampaign}</th>
                                    <th className="px-2 py-2">{co.colStatus}</th>
                                    <th className="px-2 py-2">{co.colLifecycle}</th>
                                    <th className="px-2 py-2">{co.colRemaining}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.campaignClosures.map((item) => (
                                    <tr key={item.campaignId} className="border-t border-[rgb(var(--border))]">
                                        <td className="px-2 py-2">{item.campaignName}</td>
                                        <td className="px-2 py-2">{item.status}</td>
                                        <td className="px-2 py-2">{item.lifecycleState}</td>
                                        <td className="px-2 py-2">{item.remainingQty}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </MerchantSectionCard>
        </MerchantPageShell>
    );
}
