"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BossAdminCompanyRecord, CompanyDashboardStats } from "@/lib/types/reporting";
import type { BusinessHomepageContentState } from "@/features/business/services/businessHomepageContent";
import { BossAdminHomepageBuilder } from "@/components/dashboard/BossAdminHomepageBuilder";
import type { UiLanguage } from "@/lib/i18n/ui-text";
import { getUiText } from "@/lib/i18n/ui-text";

type BossAdminWorkspaceProps = {
    lang: UiLanguage;
    tab: "dashboard" | "query";
    stats: CompanyDashboardStats;
    companies: BossAdminCompanyRecord[];
    homepageContent: BusinessHomepageContentState;
    homepageUpdatedAt?: number;
};

function formatMoney(value: number, lang: UiLanguage) {
    return new Intl.NumberFormat(lang === "zh" ? "zh-TW" : "en-US").format(value);
}

function formatTime(ts: number, lang: UiLanguage) {
    if (!Number.isFinite(ts) || ts <= 0) return "-";
    return new Intl.DateTimeFormat(lang === "zh" ? "zh-TW" : "en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(ts);
}

function TrendChart({ stats, range, lang }: { stats: CompanyDashboardStats; range: "day" | "month"; lang: UiLanguage }) {
    const ui = getUiText(lang);
    const points = range === "day" ? stats.pointsByDay : stats.pointsByMonth;
    const values = points.map((point) => point.revenue);
    const max = Math.max(1, ...values);
    const width = 780;
    const height = 220;
    const step = points.length > 1 ? width / (points.length - 1) : width;

    const path = points
        .map((point, index) => {
            const x = index * step;
            const y = height - (point.revenue / max) * height;
            return `${index === 0 ? "M" : "L"}${x},${y}`;
        })
        .join(" ");

    return (
        <Card>
            <div className="mb-2 text-sm font-semibold">
                {ui.bossAdmin.trendTitle}（{range === "day" ? ui.bossAdmin.daySuffix : ui.bossAdmin.monthSuffix}）
            </div>
            <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="h-48 min-w-[680px] w-full">
                    <path d={path} fill="none" stroke="rgb(var(--accent))" strokeWidth="3" />
                    {points.map((point, index) => {
                        const x = index * step;
                        const y = height - (point.revenue / max) * height;
                        return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="4" fill="rgb(var(--accent))" />;
                    })}
                </svg>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {points.map((point, index) => (
                    <div key={`${point.label}-${index}`} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-2 text-xs">
                        <div className="text-[rgb(var(--muted))]">{point.label}</div>
                        <div>{ui.bossAdmin.subscriptionCount} {point.count}</div>
                        <div>{ui.bossAdmin.revenue} {formatMoney(point.revenue, lang)}</div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

export function BossAdminWorkspace({ lang, tab, stats, companies, homepageContent, homepageUpdatedAt = 0 }: BossAdminWorkspaceProps) {
    const ui = getUiText(lang);
    const [range, setRange] = useState<"day" | "month">("day");

    return (
        <div className="min-w-0 space-y-4">
            {tab === "dashboard" ? (
                <>
                    <Card>
                        <div className="mb-3 text-base font-semibold">{ui.bossAdmin.revenueCardTitle}</div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                <div className="text-xs text-[rgb(var(--muted))]">{ui.bossAdmin.todaySubscriptionCount}</div>
                                <div className="mt-1 text-2xl font-semibold">{stats.todaySubscriptionCount}</div>
                            </div>
                            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                <div className="text-xs text-[rgb(var(--muted))]">{ui.bossAdmin.todayRevenue}</div>
                                <div className="mt-1 text-2xl font-semibold">{formatMoney(stats.todayRevenue, lang)}</div>
                            </div>
                            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                <div className="text-xs text-[rgb(var(--muted))]">{ui.bossAdmin.monthSubscriptionCount}</div>
                                <div className="mt-1 text-2xl font-semibold">{stats.monthSubscriptionCount}</div>
                            </div>
                            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3">
                                <div className="text-xs text-[rgb(var(--muted))]">{ui.bossAdmin.monthRevenue}</div>
                                <div className="mt-1 text-2xl font-semibold">{formatMoney(stats.monthRevenue, lang)}</div>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Button type="button" variant={range === "day" ? "solid" : "ghost"} onClick={() => setRange("day")}>{ui.bossAdmin.dayRange}</Button>
                            <Button type="button" variant={range === "month" ? "solid" : "ghost"} onClick={() => setRange("month")}>{ui.bossAdmin.monthRange}</Button>
                        </div>
                    </Card>
                    <TrendChart stats={stats} range={range} lang={lang} />
                    <BossAdminHomepageBuilder lang={lang} initialState={homepageContent} hasSavedPreferences={homepageUpdatedAt > 0} />
                </>
            ) : null}

            {tab === "query" ? (
                <Card>
                    <div className="mb-3 text-base font-semibold">{ui.bossAdmin.queryHeading}</div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-[rgb(var(--border))] text-left text-xs text-[rgb(var(--muted))]">
                                    <th className="px-2 py-2">{ui.bossAdmin.companyColumn}</th>
                                    <th className="px-2 py-2">{ui.bossAdmin.phoneColumn}</th>
                                    <th className="px-2 py-2">{ui.bossAdmin.addressColumn}</th>
                                    <th className="px-2 py-2">{ui.bossAdmin.paymentInfoColumn}</th>
                                    <th className="px-2 py-2">{ui.bossAdmin.subscriptionStartColumn}</th>
                                    <th className="px-2 py-2">{ui.bossAdmin.subscriptionEndColumn}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.map((company) => (
                                    <tr key={company.id} className="border-b border-[rgb(var(--border))]">
                                        <td className="px-2 py-2">{company.name}</td>
                                        <td className="px-2 py-2">{company.phone || "-"}</td>
                                        <td className="px-2 py-2">{company.address || "-"}</td>
                                        <td className="px-2 py-2">{company.paymentInfo || "-"}</td>
                                        <td className="px-2 py-2">{formatTime(company.subscriptionStartAt, lang)}</td>
                                        <td className="px-2 py-2">{formatTime(company.subscriptionEndAt, lang)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : null}
        </div>
    );
}
