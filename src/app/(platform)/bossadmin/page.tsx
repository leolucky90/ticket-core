import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BossAdminWorkspace } from "@/components/dashboard/BossAdminWorkspace";
import { MerchantAccountMenu, MerchantAppShell, MerchantPageShell, MerchantTopbarLinkBar } from "@/components/merchant/shell";
import { buildBossAdminSidebarGroups, buildBossAdminTopbarLinks } from "@/components/merchant/shell/merchant-shell-presets";
import { getBusinessHomepageContentPreferences } from "@/features/business/services/businessHomepageContent.server";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { buildRevenueStatsFromSubscriptions, listBossAdminCompanies } from "@/lib/services/platform/bossadmin-reporting.service";
import { BOSS_ADMIN_COOKIE, BOSS_ADMIN_EMAIL, BOSS_ADMIN_PASSWORD, isBossAdminAuthed } from "@/lib/services/bossadmin-auth";

function isBossTab(value: string | undefined): value is "dashboard" | "query" {
    return value === "dashboard" || value === "query";
}

function parseError(value: string | undefined): boolean {
    return value === "invalid";
}

export default async function BossAdminPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string; error?: string }>;
}) {
    const cookieStore = await cookies();
    const bossSession = cookieStore.get(BOSS_ADMIN_COOKIE)?.value;
    const isAuthed = isBossAdminAuthed(bossSession);
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const ui = getUiText(lang);

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
                            <h1 className="text-2xl font-semibold">{ui.bossAdmin.loginTitle}</h1>
                            <p className="mt-1 text-sm text-[rgb(var(--muted))]">{ui.bossAdmin.loginRouteHint}</p>
                        </div>
                        <form action={signInAction} className="grid gap-3">
                            <Input type="email" name="email" placeholder={ui.bossAdmin.accountPlaceholder} defaultValue={BOSS_ADMIN_EMAIL} required />
                            <Input type="password" name="password" placeholder={ui.bossAdmin.passwordPlaceholder} defaultValue={BOSS_ADMIN_PASSWORD} required />
                            {hasError ? <div className="text-sm text-[rgb(var(--muted))]">{ui.bossAdmin.invalidCredential}</div> : null}
                            <Button type="submit">{ui.bossAdmin.signIn}</Button>
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
        dashboard: { title: ui.bossAdmin.dashboardTitle, subtitle: ui.bossAdmin.dashboardSubtitle },
        query: { title: ui.bossAdmin.queryTitle, subtitle: ui.bossAdmin.querySubtitle },
    };
    const currentTabLabel = tabLabels[tab];
    const topbarActions = (
        <div className="flex items-center gap-2">
            <MerchantTopbarLinkBar links={buildBossAdminTopbarLinks(lang)} />
            <MerchantAccountMenu
                accountName="BossAdmin"
                accountEmail={BOSS_ADMIN_EMAIL}
                avatarText="B"
                currentLang={lang}
                settingsLabel={ui.bossAdmin.adminMenu}
                settingsLinks={[
                    { id: "boss-dashboard", label: ui.shell.dashboard, href: "/bossadmin?tab=dashboard" },
                    { id: "boss-homepage-studio", label: ui.bossAdmin.homepageStudio, href: "/bossadmin?tab=dashboard" },
                    { id: "boss-query", label: ui.bossAdmin.query, href: "/bossadmin?tab=query" },
                ]}
                signOutSlot={
                    <form action={signOutAction}>
                        <Button type="submit" variant="ghost" className="w-full justify-start px-2 py-1.5 text-sm">
                            {ui.shell.signOut}
                        </Button>
                    </form>
                }
            />
        </div>
    );

    return (
        <MerchantAppShell
            sidebarGroups={buildBossAdminSidebarGroups(lang)}
            topbarActions={topbarActions}
            brandHref="/bossadmin?tab=dashboard"
            brandLabel="Ticket Core"
        >
            <MerchantPageShell title={currentTabLabel.title} subtitle={currentTabLabel.subtitle} width="overview">
                <BossAdminWorkspace
                    lang={lang}
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
