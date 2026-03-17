import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BossAdminWorkspace } from "@/components/dashboard/BossAdminWorkspace";
import { buildRevenueStatsFromSubscriptions, listBossAdminCompanies } from "@/lib/services/commerce";

const BOSS_ADMIN_COOKIE = "bossadmin_session";
const BOSS_ADMIN_EMAIL = "bossadmin@gmail.com";
const BOSS_ADMIN_PASSWORD = "123456";

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
    const isAuthed = bossSession === "ok";

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
                            <h1 className="text-2xl font-semibold">商業儀錶板登入</h1>
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

    return <BossAdminWorkspace tab={tab} stats={stats} companies={companies} signOutAction={signOutAction} />;
}
