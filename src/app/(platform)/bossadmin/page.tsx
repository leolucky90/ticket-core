import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BossAdminWorkspace } from "@/components/dashboard/BossAdminWorkspace";
import { MerchantAppShell, MerchantPageShell, type MerchantSidebarGroupConfig } from "@/components/merchant/shell";
import { buildRevenueStatsFromSubscriptions, listBossAdminCompanies } from "@/lib/services/commerce";
import { getBusinessHomepageContentPreferences } from "@/features/business/services/businessHomepageContent.server";
import { BOSS_ADMIN_COOKIE, BOSS_ADMIN_EMAIL, BOSS_ADMIN_PASSWORD, isBossAdminAuthed } from "@/lib/services/bossadmin-auth";

function isBossTab(value: string | undefined): value is "dashboard" | "query" {
    return value === "dashboard" || value === "query";
}

function parseError(value: string | undefined): boolean {
    return value === "invalid";
}

const bossAdminSidebarGroups: MerchantSidebarGroupConfig[] = [
    {
        id: "overview",
        title: "總覽",
        items: [
            { id: "boss-home", label: "首頁", href: "/", icon: "building" },
            { id: "boss-dashboard", label: "儀表板", href: "/bossadmin?tab=dashboard", icon: "gauge" },
        ],
    },
    {
        id: "store",
        title: "商店",
        items: [
            { id: "boss-homepage-studio", label: "展示頁設定", href: "/bossadmin?tab=dashboard", icon: "settings" },
        ],
    },
    {
        id: "admin",
        title: "管理",
        items: [
            { id: "boss-query", label: "查詢頁面", href: "/bossadmin?tab=query", icon: "receipt-text" },
        ],
    },
];

export default async function BossAdminPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string; error?: string }>;
}) {
    const cookieStore = await cookies();
    const bossSession = cookieStore.get(BOSS_ADMIN_COOKIE)?.value;
    const isAuthed = isBossAdminAuthed(bossSession);

    async function signInAction(formData: FormData) {
        "use server";

        const email = String(formData.get("email") ?? "").trim().toLowerCase();
        const password = String(formData.get("password") ?? "").trim();

        if (email !== BOSS_ADMIN_EMAIL || password !== BOSS_ADMIN_PASSWORD) {
            redirect("/bossadmin?error=invalid");
        }

        const c = await cookies();
        c.set(BOSS_ADMIN_COOKIE, "ok", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 8,
        });

        redirect("/bossadmin?tab=dashboard");
    }

    async function signOutAction() {
        "use server";

        const c = await cookies();
        c.set(BOSS_ADMIN_COOKIE, "", {
            path: "/",
            maxAge: 0,
        });

        redirect("/bossadmin");
    }

    if (!isAuthed) {
        const sp = await searchParams;
        const hasError = parseError(sp.error);

        return (
            <div className="min-h-dvh bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
                <div className="mx-auto flex min-h-dvh w-full max-w-3xl items-center justify-center px-4 py-10">
                    <Card className="w-full max-w-md">
                        <div className="mb-4 text-center">
                            <h1 className="text-2xl font-semibold">商業儀表板登入</h1>
                            <p className="mt-1 text-sm text-[rgb(var(--muted))]">/bossadmin</p>
                        </div>
                        <form action={signInAction} className="grid gap-3">
                            <Input type="email" name="email" placeholder="管理帳號" defaultValue={BOSS_ADMIN_EMAIL} required />
                            <Input type="password" name="password" placeholder="密碼" defaultValue={BOSS_ADMIN_PASSWORD} required />
                            {hasError ? <div className="text-sm text-red-500">帳號或密碼錯誤</div> : null}
                            <Button type="submit">登入</Button>
                        </form>
                    </Card>
                </div>
            </div>
        );
    }

    const sp = await searchParams;
    const tab = isBossTab(sp.tab) ? sp.tab : "dashboard";
    const companies = await listBossAdminCompanies();
    const stats = buildRevenueStatsFromSubscriptions(companies);
    const homepagePreferences = await getBusinessHomepageContentPreferences();
    const tabLabels: Record<typeof tab, { title: string; subtitle: string }> = {
        dashboard: { title: "儀表板", subtitle: "官方站營運概覽、首頁展示設定與平台資訊整合。" },
        query: { title: "查詢頁面", subtitle: "檢視公司訂閱、聯絡資料、付款資訊與到期時間。" },
    };
    const currentTabLabel = tabLabels[tab];
    const topbarLinkClass = "rounded-md border border-[rgb(var(--border))] px-2 py-1 text-xs hover:bg-[rgb(var(--panel2))]";
    const topbarActions = (
        <nav className="flex items-center gap-2">
            <Link href="/" className={topbarLinkClass}>
                首頁
            </Link>
            <Link href="/bossadmin?tab=dashboard" className={topbarLinkClass}>
                儀表板
            </Link>
            <Link href="/bossadmin?tab=dashboard" className={topbarLinkClass}>
                展示頁設定
            </Link>
            <Link href="/bossadmin?tab=query" className={topbarLinkClass}>
                查詢頁面
            </Link>
            <form action={signOutAction}>
                <Button type="submit" variant="ghost" className="px-2 py-1 text-xs">
                    登出
                </Button>
            </form>
        </nav>
    );

    return (
        <MerchantAppShell
            sidebarGroups={bossAdminSidebarGroups}
            topbarActions={topbarActions}
            brandHref="/bossadmin?tab=dashboard"
            brandLabel="Ticket Core"
        >
            <MerchantPageShell title={currentTabLabel.title} subtitle={currentTabLabel.subtitle} width="overview">
                <BossAdminWorkspace
                    tab={tab}
                    stats={stats}
                    companies={companies}
                    homepageContent={homepagePreferences.content}
                    homepageUpdatedAt={homepagePreferences.updatedAt}
                />
            </MerchantPageShell>
        </MerchantAppShell>
    );
}
