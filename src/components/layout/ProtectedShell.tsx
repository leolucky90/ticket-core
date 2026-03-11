import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { DraggableNavCards } from "@/components/layout/DraggableNavCards";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import { cookies, headers } from "next/headers";
import { DashboardThemeSync } from "@/components/settings/DashboardThemeSync";
import { resolveCustomerHomepageUrl } from "@/lib/services/homepage-url.service";

type ProtectedShellProps = {
    children: ReactNode;
};

function isCompanyOnlyPath(pathname: string): boolean {
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return true;
    if (pathname === "/sales" || pathname.startsWith("/sales/")) return true;
    if (pathname === "/ticket") return true;
    if (pathname.startsWith("/ticket/") && !pathname.startsWith("/ticket/history")) return true;
    if (pathname === "/settings/security" || pathname.startsWith("/settings/security/")) return true;
    if (pathname === "/settings/dashboard" || pathname.startsWith("/settings/dashboard/")) return true;
    if (pathname === "/settings/showcase" || pathname.startsWith("/settings/showcase/")) return true;
    return false;
}

function isExternalHref(href: string): boolean {
    return href.startsWith("http://") || href.startsWith("https://");
}

export async function ProtectedShell({ children }: ProtectedShellProps) {
    const headerStore = await headers();
    const pathname = headerStore.get("x-pathname") ?? "";

    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
        const next = pathname || "/";
        redirect(`/login?next=${encodeURIComponent(next)}`);
    }

    const userDoc = await getUserDoc(sessionUser.uid);
    const accountType = toAccountType(userDoc?.role ?? null);
    if (accountType === "customer" && isCompanyOnlyPath(pathname)) {
        redirect("/ticket/history");
    }

    const accountName = sessionUser.email.split("@")[0] || "使用者";
    const accountEmail = sessionUser.email;
    const avatarText = accountName.slice(0, 1).toUpperCase();
    const labels =
        lang === "zh"
            ? {
                  nav: "導航",
                  publicHome: "首頁",
                  dashboard: "儀表板",
                  ticket: "案件",
                  sales: "銷售",
                  settings: "帳號設定",
                  account: "帳戶資訊",
                  history: "Ticket 紀錄",
                  dashboardSettings: "儀表板設定",
                  showcaseSettings: "展示頁設定",
                  styleSettings: "樣式設定",
                  contentSettings: "內容設定",
                  backHome: "回到首頁",
                  signOut: "登出",
              }
            : {
                  nav: "Navigation",
                  publicHome: "Homepage",
                  dashboard: "Dashboard",
                  ticket: "Cases",
                  sales: "Sales",
                  settings: "Account Settings",
                  account: "Account",
                  history: "Ticket History",
                  dashboardSettings: "Dashboard Settings",
                  showcaseSettings: "Showcase Settings",
                  styleSettings: "Style Settings",
                  contentSettings: "Content Settings",
                  backHome: "Back Home",
                  signOut: "Sign out",
              };
    const homeHref = accountType === "company" ? "/dashboard" : "/ticket/history";
    const customerTenantId = accountType === "customer" ? getShowcaseTenantId(userDoc, sessionUser.uid) : null;
    const customerHomepageHref = accountType === "customer" ? await resolveCustomerHomepageUrl(customerTenantId) : null;
    const publicHomeHref = accountType === "company" ? "/company-home" : customerHomepageHref;
    const hasPublicHomeLink = typeof publicHomeHref === "string" && publicHomeHref.length > 0;
    const publicHomeIsExternal = hasPublicHomeLink ? isExternalHref(publicHomeHref) : false;

    return (
        <div className="min-h-dvh bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
            {accountType === "company" ? <DashboardThemeSync /> : null}
            <header className="border-b border-[rgb(var(--border))] bg-[rgb(var(--nav))]">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
                    <Link href={homeHref} className="text-base font-semibold">
                        Ticket Core
                    </Link>
                    <nav className="flex items-center gap-2">
                        <details className="group relative">
                            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1.5 hover:border-[rgb(var(--accent))] [&::-webkit-details-marker]:hidden">
                                <span className="grid h-7 w-7 place-items-center rounded-full bg-[rgb(var(--panel2))] text-xs font-semibold">
                                    {avatarText}
                                </span>
                                <span className="hidden text-sm sm:block">{accountName}</span>
                                <span className="text-xs text-[rgb(var(--muted))]">▼</span>
                            </summary>
                            <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-3 shadow-lg">
                                <div className="space-y-1 border-b border-[rgb(var(--border))] pb-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm font-semibold">{accountName}</div>
                                        <LanguageSwitcher currentLang={lang} />
                                    </div>
                                    {accountEmail ? (
                                        <div className="truncate text-xs text-[rgb(var(--muted))]">{accountEmail}</div>
                                    ) : null}
                                </div>
                                <div className="mt-2 grid gap-2">
                                    <details className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]">
                                        <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel))] [&::-webkit-details-marker]:hidden">
                                            <span>{labels.settings}</span>
                                            <span className="text-xs text-[rgb(var(--muted))]">▼</span>
                                        </summary>
                                        <div className="grid gap-1 px-2 pb-2 pt-1">
                                            <Link
                                                href="/settings/account"
                                                className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel))]"
                                            >
                                                {labels.account}
                                            </Link>
                                            {accountType === "company" ? (
                                                <>
                                                    <Link
                                                        href="/settings/dashboard"
                                                        className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel))]"
                                                    >
                                                        {labels.dashboardSettings}
                                                    </Link>
                                                    <details className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))]">
                                                        <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel2))] [&::-webkit-details-marker]:hidden">
                                                            <span>{labels.showcaseSettings}</span>
                                                            <span className="text-xs text-[rgb(var(--muted))]">▼</span>
                                                        </summary>
                                                        <div className="grid gap-1 px-2 pb-2 pt-1">
                                                            <Link
                                                                href="/settings/showcase/content"
                                                                className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel2))]"
                                                            >
                                                                {labels.contentSettings}
                                                            </Link>
                                                            <Link
                                                                href="/settings/showcase/style"
                                                                className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel2))]"
                                                            >
                                                                {labels.styleSettings}
                                                            </Link>
                                                        </div>
                                                    </details>
                                                </>
                                            ) : null}
                                        </div>
                                    </details>
                                    <SignOutButton className="w-full text-left" label={labels.signOut} />
                                    {hasPublicHomeLink ? (
                                        publicHomeIsExternal ? (
                                            <a
                                                href={publicHomeHref}
                                                className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel2))]"
                                            >
                                                {labels.publicHome}
                                            </a>
                                        ) : (
                                            <Link
                                                href={publicHomeHref}
                                                className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel2))]"
                                            >
                                                {labels.publicHome}
                                            </Link>
                                        )
                                    ) : (
                                        <Link
                                            href="/"
                                            className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel2))]"
                                        >
                                            {labels.backHome}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </details>
                    </nav>
                </div>
            </header>

            <div className="mx-auto grid w-full max-w-7xl gap-4 p-4 sm:p-6 md:grid-cols-[220px_1fr]">
                <aside className="self-start rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-3">
                    <div className="mb-2 px-2 text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
                        {labels.nav}
                    </div>
                    <nav className="grid gap-2">
                        {accountType === "company" ? (
                            <>
                                <Link href="/dashboard" className="rounded-lg px-2 py-2 text-sm hover:bg-[rgb(var(--panel2))]">
                                    {labels.dashboard}
                                </Link>
                                <DraggableNavCards
                                    labels={{
                                        ticket: labels.ticket,
                                        sales: labels.sales,
                                    }}
                                    lang={lang}
                                />
                            </>
                        ) : (
                            <>
                                {hasPublicHomeLink ? (
                                    publicHomeIsExternal ? (
                                        <a
                                            href={publicHomeHref}
                                            className="rounded-lg px-2 py-2 text-sm hover:bg-[rgb(var(--panel2))]"
                                        >
                                            {labels.publicHome}
                                        </a>
                                    ) : (
                                        <Link
                                            href={publicHomeHref}
                                            className="rounded-lg px-2 py-2 text-sm hover:bg-[rgb(var(--panel2))]"
                                        >
                                            {labels.publicHome}
                                        </Link>
                                    )
                                ) : null}
                                <Link
                                    href="/ticket/history"
                                    className="rounded-lg px-2 py-2 text-sm hover:bg-[rgb(var(--panel2))]"
                                >
                                    {labels.history}
                                </Link>
                                <Link
                                    href="/settings/account"
                                    className="rounded-lg px-2 py-2 text-sm hover:bg-[rgb(var(--panel2))]"
                                >
                                    {labels.account}
                                </Link>
                            </>
                        )}
                    </nav>
                </aside>
                <main className="space-y-4">{children}</main>
            </div>
        </div>
    );
}
