import { AlertTriangle, PackageCheck, Timer, TrendingUp } from "lucide-react";
import { MerchantPageShell, MerchantSectionCard, MerchantStatGrid } from "@/components/merchant/shell";
import { getConsignmentOverviewData } from "@/lib/services/merchant/consignment-overview-service";

export default async function DashboardConsignmentsPage() {
    const data = await getConsignmentOverviewData();

    const stats = [
        { id: "active", label: "進行中寄店", value: data.kpi.activeCount, hint: "active + partially redeemed" },
        { id: "remaining", label: "剩餘寄店量", value: data.kpi.remainingQty, hint: "所有寄店 remainingQty 合計" },
        { id: "expiring", label: "7 日內到期", value: data.kpi.expiringSoonCount, hint: "需優先通知客戶" },
        { id: "completed", label: "已完成", value: data.kpi.completedCount, hint: "remainingQty = 0" },
        { id: "expired", label: "已過期", value: data.kpi.expiredCount, hint: "過期未兌換記錄" },
    ];

    return (
        <MerchantPageShell title="寄店總覽" subtitle="寄店/活動兌換的 KPI、熱門活動、待兌換與庫存風險基礎。" width="overview">
            <MerchantSectionCard title="寄店摘要" description="campaign end 與 fully closed 分離，待兌換仍持續追蹤。">
                <MerchantStatGrid items={stats} />
            </MerchantSectionCard>

            <MerchantSectionCard
                title="庫存風險提醒"
                description="規則式提醒：零庫存、低庫存、寄店待兌換缺貨風險。"
                emptyState={{
                    icon: AlertTriangle,
                    title: "目前沒有高風險提醒",
                    description: "庫存與寄店待兌換狀態目前安全。",
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
                    title="熱門活動"
                    description="按 entitlement/consignment 熱度與剩餘量排序。"
                    emptyState={{
                        icon: TrendingUp,
                        title: "尚無活動資料",
                        description: "建立活動後會顯示熱門活動統計。",
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
                    title="熱門寄店品類"
                    description="追蹤常見寄店類型與客戶覆蓋。"
                    emptyState={{
                        icon: PackageCheck,
                        title: "尚無寄店品類資料",
                        description: "建立寄店後會累積品類趨勢。",
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
                title="活動關閉狀態"
                description="結束日期與 fully closed 分開：有待兌換量時維持 ended_pending_redemption。"
                emptyState={{
                    icon: Timer,
                    title: "尚無活動關閉資料",
                    description: "活動建立後會顯示 lifecycle 狀態。",
                }}
            >
                {data.campaignClosures.length === 0 ? null : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-[rgb(var(--muted))]">
                                    <th className="px-2 py-2">活動</th>
                                    <th className="px-2 py-2">狀態</th>
                                    <th className="px-2 py-2">Lifecycle</th>
                                    <th className="px-2 py-2">剩餘量</th>
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
