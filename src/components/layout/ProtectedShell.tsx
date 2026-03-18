import type { ReactNode } from "react";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { MerchantAppShell } from "@/components/merchant/shell";
import type { MerchantSidebarGroupConfig } from "@/components/merchant/shell";
import { DashboardThemeSync } from "@/components/settings/DashboardThemeSync";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { resolveCustomerHomepageUrl } from "@/lib/services/homepage-url.service";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";

type ProtectedShellProps = {
    children: ReactNode;
};

function isCompanyOnlyPath(pathname: string): boolean {
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return true;
    if (pathname === "/sales" || pathname.startsWith("/sales/")) return true;
    if (pathname === "/settings/security" || pathname.startsWith("/settings/security/")) return true;
    if (pathname === "/settings/dashboard" || pathname.startsWith("/settings/dashboard/")) return true;
    if (pathname === "/settings/showcase" || pathname.startsWith("/settings/showcase/")) return true;
    return false;
}

function isExternalHref(href: string): boolean {
    return href.startsWith("http://") || href.startsWith("https://");
}

function buildCompanySidebarGroups(labels: {
    dashboard: string;
    relationships: string;
    checkout: string;
    receipts: string;
    ticket: string;
    customers: string;
    inventory: string;
    productManagement: string;
    activities: string;
    consignments: string;
    marketing: string;
    contentSettings: string;
    styleSettings: string;
}): MerchantSidebarGroupConfig[] {
    return [
        {
            id: "overview",
            title: "總覽",
            items: [
                { id: "dashboard", label: labels.dashboard, href: "/dashboard?tab=dashboard", icon: "gauge" },
                { id: "relationships", label: labels.relationships, href: "/dashboard/relationships", icon: "handshake" },
            ],
        },
        {
            id: "transactions",
            title: "交易",
            items: [
                { id: "checkout", label: labels.checkout, href: "/dashboard/checkout", icon: "credit-card" },
                { id: "receipts", label: labels.receipts, href: "/dashboard/receipts", icon: "receipt-text" },
            ],
        },
        {
            id: "service",
            title: "客戶服務",
            items: [
                { id: "cases", label: labels.ticket, href: "/dashboard?tab=cases", icon: "ticket" },
                { id: "customers", label: labels.customers, href: "/dashboard?tab=customers", icon: "users" },
            ],
        },
        {
            id: "operations",
            title: "商品與營運",
            items: [
                { id: "inventory", label: labels.inventory, href: "/dashboard?tab=inventory", icon: "package" },
                { id: "products", label: labels.productManagement, href: "/dashboard/products", icon: "shopping-bag" },
                { id: "activities", label: labels.activities, href: "/dashboard?tab=activities", icon: "megaphone" },
                { id: "consignments", label: labels.consignments, href: "/dashboard/consignments", icon: "package" },
            ],
        },
        {
            id: "store",
            title: "商店",
            items: [
                { id: "marketing", label: labels.marketing, href: "/dashboard?tab=marketing", icon: "building" },
                { id: "showcase-content", label: labels.contentSettings, href: "/settings/showcase/content", icon: "settings" },
                { id: "showcase-style", label: labels.styleSettings, href: "/settings/showcase/style", icon: "shopping-cart" },
            ],
        },
    ];
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
    const customerTenantId = accountType === "customer" ? getShowcaseTenantId(userDoc, sessionUser.uid) : null;
    const customerDashboardHref = customerTenantId ? `/${encodeURIComponent(customerTenantId)}/dashboard` : "/customer-dashboard";
    if (accountType === "customer" && isCompanyOnlyPath(pathname)) {
        redirect(customerDashboardHref);
    }

    const accountName = sessionUser.email.split("@")[0] || "使用者";
    const accountEmail = sessionUser.email;
    const avatarText = accountName.slice(0, 1).toUpperCase();

    const labels =
        lang === "zh"
            ? {
                  publicHome: "首頁",
                  dashboard: "儀表板",
                  customerDashboard: "客戶儀錶板",
                  customers: "客戶",
                  ticket: "案件",
                  activities: "活動促銷",
                  consignments: "寄店總覽",
                  inventory: "庫存管理",
                  productManagement: "產品管理",
                  checkout: "結帳",
                  receipts: "收據",
                  relationships: "開聯總覽",
                  marketing: "商店營銷設定",
                  settings: "帳號設定",
                  account: "帳戶資訊",
                  attributeSettings: "屬性設置",
                  dashboardSettings: "儀表板設定",
                  showcaseSettings: "展示頁設定",
                  styleSettings: "樣式設定",
                  contentSettings: "內容設定",
                  backHome: "回到首頁",
                  signOut: "登出",
              }
            : {
                  publicHome: "Homepage",
                  dashboard: "Dashboard",
                  customerDashboard: "Customer Dashboard",
                  customers: "Customers",
                  ticket: "Cases",
                  activities: "Campaigns",
                  consignments: "Consignments",
                  inventory: "Inventory",
                  productManagement: "Product Management",
                  checkout: "Checkout",
                  receipts: "Receipts",
                  relationships: "Relation Overview",
                  marketing: "Store Marketing Settings",
                  settings: "Account Settings",
                  account: "Account",
                  attributeSettings: "Attribute Settings",
                  dashboardSettings: "Dashboard Settings",
                  showcaseSettings: "Showcase Settings",
                  styleSettings: "Style Settings",
                  contentSettings: "Content Settings",
                  backHome: "Back Home",
                  signOut: "Sign out",
              };

    const homeHref = accountType === "company" ? "/dashboard" : customerDashboardHref;
    const customerHomepageHref = accountType === "customer" ? await resolveCustomerHomepageUrl(customerTenantId) : null;
    const publicHomeHref = accountType === "company" ? "/company-home" : customerHomepageHref;
    const hasPublicHomeLink = typeof publicHomeHref === "string" && publicHomeHref.length > 0;
    const publicHomeIsExternal = hasPublicHomeLink ? isExternalHref(publicHomeHref) : false;

    const companySidebarGroups = buildCompanySidebarGroups(labels);
    const customerSidebarGroups: MerchantSidebarGroupConfig[] = [
        {
            id: "customer-main",
            title: lang === "zh" ? "總覽" : "Overview",
            items: [
                { id: "customer-dashboard", label: labels.customerDashboard, href: customerDashboardHref, icon: "gauge" },
                { id: "account", label: labels.account, href: "/settings/account", icon: "settings" },
            ],
        },
    ];

    const topbarActions = (
        <nav className="flex items-center gap-2">
            <SignOutButton className="px-2 py-1 text-xs" label={labels.signOut} />
            <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1.5 hover:border-[rgb(var(--accent))] [&::-webkit-details-marker]:hidden">
                    <span className="grid h-7 w-7 place-items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] text-xs font-semibold">
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
                        {accountEmail ? <div className="truncate text-xs text-[rgb(var(--muted))]">{accountEmail}</div> : null}
                    </div>
                    <div className="mt-2 grid gap-2">
                        <details className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]">
                            <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel))] [&::-webkit-details-marker]:hidden">
                                <span>{labels.settings}</span>
                                <span className="text-xs text-[rgb(var(--muted))]">▼</span>
                            </summary>
                            <div className="grid gap-1 px-2 pb-2 pt-1">
                                <Link href="/settings/account" className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel))]">
                                    {labels.account}
                                </Link>
                                {accountType === "company" ? (
                                    <>
                                        <Link
                                            href="/settings/account/attributes"
                                            className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel))]"
                                        >
                                            {labels.attributeSettings}
                                        </Link>
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
                                <a href={publicHomeHref} className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel2))]">
                                    {labels.publicHome}
                                </a>
                            ) : (
                                <Link href={publicHomeHref} className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel2))]">
                                    {labels.publicHome}
                                </Link>
                            )
                        ) : (
                            <Link href="/" className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel2))]">
                                {labels.backHome}
                            </Link>
                        )}
                    </div>
                </div>
            </details>
        </nav>
    );

    const sidebarGroups = accountType === "company" ? companySidebarGroups : customerSidebarGroups;

    return (
        <>
            {accountType === "company" ? <DashboardThemeSync /> : null}
            <MerchantAppShell sidebarGroups={sidebarGroups} topbarActions={topbarActions} brandHref={homeHref}>
                {children}
            </MerchantAppShell>
        </>
    );
}
