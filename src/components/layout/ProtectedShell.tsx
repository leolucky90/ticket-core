import type { ReactNode } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { cookies } from "next/headers";

type ProtectedShellProps = {
    children: ReactNode;
};

export async function ProtectedShell({ children }: ProtectedShellProps) {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";
    const sessionUser = await getSessionUser();
    const accountName = sessionUser?.email?.split("@")[0] || "使用者";
    const accountEmail = sessionUser?.email || "";
    const avatarText = accountName.slice(0, 1).toUpperCase();
    const labels =
        lang === "zh"
            ? {
                  nav: "導航",
                  dashboard: "儀表板",
                  ticket: "案件",
                  sales: "銷售",
                  settings: "設定",
                  signOut: "登出",
              }
            : {
                  nav: "Navigation",
                  dashboard: "Dashboard",
                  ticket: "Cases",
                  sales: "Sales",
                  settings: "Settings",
                  signOut: "Sign out",
              };
    const menuItems = [
        { href: "/dashboard", label: labels.dashboard },
        { href: "/ticket", label: labels.ticket },
        { href: "/sales", label: labels.sales },
    ];

    return (
        <div className="min-h-dvh bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
            <header className="border-b border-[rgb(var(--border))] bg-[rgb(var(--panel))]">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
                    <Link href="/dashboard" className="text-base font-semibold">
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
                                    <Link
                                        href="/settings/security"
                                        className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel2))]"
                                    >
                                        {labels.settings}
                                    </Link>
                                    <SignOutButton className="w-full text-left" label={labels.signOut} />
                                </div>
                            </div>
                        </details>
                    </nav>
                </div>
            </header>

            <div className="mx-auto grid w-full max-w-7xl gap-4 p-4 sm:p-6 md:grid-cols-[220px_1fr]">
                <aside className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-3">
                    <div className="mb-2 px-2 text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
                        {labels.nav}
                    </div>
                    <nav className="grid gap-1">
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="rounded-lg px-2 py-2 text-sm hover:bg-[rgb(var(--panel2))]"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </aside>
                <main className="space-y-4">{children}</main>
            </div>
        </div>
    );
}
