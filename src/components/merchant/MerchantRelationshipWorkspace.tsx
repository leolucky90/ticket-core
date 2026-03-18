import Link from "next/link";
import { Handshake } from "lucide-react";
import { MerchantSectionCard, MerchantStatGrid } from "@/components/merchant/shell";
import type { MerchantStatItem } from "@/components/merchant/shell";
import type { MerchantRelationshipRow } from "@/lib/services/merchantOverview";

type MerchantRelationshipWorkspaceProps = {
    rows: MerchantRelationshipRow[];
};

export function MerchantRelationshipWorkspace({ rows }: MerchantRelationshipWorkspaceProps) {
    const totalOpenConsignments = rows.reduce((sum, row) => sum + row.activeConsignmentCount, 0);
    const totalRemainingQty = rows.reduce((sum, row) => sum + row.totalConsignmentRemainingQty, 0);
    const stats: MerchantStatItem[] = [
        { id: "customers", label: "客戶數", value: rows.length },
        { id: "consignments", label: "活躍寄存單", value: totalOpenConsignments },
        { id: "remaining", label: "寄存剩餘量", value: totalRemainingQty },
    ];

    return (
        <div className="space-y-4">
            <MerchantSectionCard title="跨模組關聯總覽" description="Customer ↔ Orders / Receipts / Warranty / Diagnostic / Consignment">
                <MerchantStatGrid items={stats} />
            </MerchantSectionCard>

            <MerchantSectionCard
                title="關聯清單"
                description="以客戶為核心查看交易、服務與寄存資料。"
                emptyState={
                    rows.length === 0
                        ? {
                              icon: Handshake,
                              title: "目前沒有可顯示的客戶資料",
                              description: "新增客戶、案件或交易後，這裡會出現跨模組關聯。",
                          }
                        : undefined
                }
            >
                {rows.length === 0 ? null : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-[rgb(var(--border))] text-left text-xs text-[rgb(var(--muted))]">
                                    <th className="px-2 py-2">客戶</th>
                                    <th className="px-2 py-2">訂單</th>
                                    <th className="px-2 py-2">收據</th>
                                    <th className="px-2 py-2">保固</th>
                                    <th className="px-2 py-2">診斷</th>
                                    <th className="px-2 py-2">寄存單</th>
                                    <th className="px-2 py-2">寄存剩餘量</th>
                                    <th className="px-2 py-2">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.customerId} className="border-b border-[rgb(var(--border))]">
                                        <td className="px-2 py-2">
                                            <div className="font-medium">{row.customerName}</div>
                                            <div className="text-xs text-[rgb(var(--muted))]">{row.customerPhone || "-"}</div>
                                        </td>
                                        <td className="px-2 py-2">{row.orderCount}</td>
                                        <td className="px-2 py-2">{row.receiptCount}</td>
                                        <td className="px-2 py-2">{row.warrantyCount}</td>
                                        <td className="px-2 py-2">{row.diagnosticCount}</td>
                                        <td className="px-2 py-2">{row.activeConsignmentCount}</td>
                                        <td className="px-2 py-2">{row.totalConsignmentRemainingQty}</td>
                                        <td className="px-2 py-2">
                                            <Link
                                                href={`/dashboard/customers/detail?id=${encodeURIComponent(row.customerId)}`}
                                                className="text-[rgb(var(--accent))] hover:underline"
                                            >
                                                查看詳情
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </MerchantSectionCard>
        </div>
    );
}
