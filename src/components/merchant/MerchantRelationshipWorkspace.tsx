import Link from "next/link";
import { Handshake } from "lucide-react";
import { MerchantSectionCard, MerchantStatGrid } from "@/components/merchant/shell";
import type { MerchantStatItem } from "@/components/merchant/shell";
import { getUiText, type UiLanguage } from "@/lib/i18n/ui-text";
import type { MerchantRelationshipRow } from "@/lib/services/merchantOverview";

type MerchantRelationshipWorkspaceProps = {
    lang: UiLanguage;
    rows: MerchantRelationshipRow[];
};

export function MerchantRelationshipWorkspace({ lang, rows }: MerchantRelationshipWorkspaceProps) {
    const ui = getUiText(lang).relationshipWorkspace;
    const totalOpenConsignments = rows.reduce((sum, row) => sum + row.activeConsignmentCount, 0);
    const totalRemainingQty = rows.reduce((sum, row) => sum + row.totalConsignmentRemainingQty, 0);
    const stats: MerchantStatItem[] = [
        { id: "customers", label: ui.statsCustomers, value: rows.length },
        { id: "consignments", label: ui.statsConsignments, value: totalOpenConsignments },
        { id: "remaining", label: ui.statsRemaining, value: totalRemainingQty },
    ];

    return (
        <div className="space-y-4">
            <MerchantSectionCard title={ui.overviewTitle} description={ui.overviewDescription}>
                <MerchantStatGrid items={stats} />
            </MerchantSectionCard>

            <MerchantSectionCard
                title={ui.listTitle}
                description={ui.listDescription}
                emptyState={
                    rows.length === 0
                        ? {
                              icon: Handshake,
                              title: ui.emptyTitle,
                              description: ui.emptyDescription,
                          }
                        : undefined
                }
            >
                {rows.length === 0 ? null : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-[rgb(var(--border))] text-left text-xs text-[rgb(var(--muted))]">
                                    <th className="px-2 py-2">{ui.colCustomer}</th>
                                    <th className="px-2 py-2">{ui.colOrders}</th>
                                    <th className="px-2 py-2">{ui.colReceipts}</th>
                                    <th className="px-2 py-2">{ui.colWarranties}</th>
                                    <th className="px-2 py-2">{ui.colDiagnostics}</th>
                                    <th className="px-2 py-2">{ui.colConsignments}</th>
                                    <th className="px-2 py-2">{ui.colRemaining}</th>
                                    <th className="px-2 py-2">{ui.colActions}</th>
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
                                                {ui.viewDetail}
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
