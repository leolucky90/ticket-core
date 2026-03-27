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
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";
import { resolveCustomerHomepageUrl } from "@/lib/services/homepage-url.service";

type ProtectedShellProps = {
    children: ReactNode;
};

function isCompanyOnlyPath(pathname: string): boolean {
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return true;
    if (pathname === "/sales" || pathname.startsWith("/sales/")) return true;
    if (pathname === "/products" || pathname.startsWith("/products/")) return true;
    if (pathname === "/settings/security" || pathname.startsWith("/settings/security/")) return true;
    if (pathname === "/settings/dashboard" || pathname.startsWith("/settings/dashboard/")) return true;
    if (pathname === "/settings/showcase" || pathname.startsWith("/settings/showcase/")) return true;
    if (pathname === "/settings/staff" || pathname.startsWith("/settings/staff/")) return true;
    if (pathname === "/staff" || pathname.startsWith("/staff/")) return true;
    if (pathname === "/account/security" || pathname.startsWith("/account/security/")) return true;
    return false;
}

function isStandaloneCompanyHomePath(pathname: string): boolean {
    return pathname === "/company-home" || pathname.startsWith("/company-home/");
}

function isExternalHref(href: string): boolean {
    return href.startsWith("http://") || href.startsWith("https://");
}

function buildCompanySidebarGroups(labels: {
    companyHome: string;
    dashboard: string;
    relationships: string;
    checkout: string;
    receipts: string;
    ticket: string;
    customers: string;
    inventory: string;
    productManagement: string;
    usedProducts: string;
    activities: string;
    consignments: string;
    marketing: string;
    showcaseSettings: string;
    staff: string;
    staffDeleted: string;
    roleSettings: string;
    deleteControl: string;
    deleteLogs: string;
}): MerchantSidebarGroupConfig[] {
    return [
        {
            id: "overview",
            title: "總覽",
            items: [
                { id: "home", label: labels.companyHome, href: "/company-home", icon: "building" },
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
                { id: "used-products", label: labels.usedProducts, href: "/products/used", icon: "shopping-bag" },
                { id: "activities", label: labels.activities, href: "/dashboard?tab=activities", icon: "megaphone" },
                { id: "consignments", label: labels.consignments, href: "/dashboard/consignments", icon: "package" },
            ],
        },
        {
            id: "store",
            title: "商店",
            items: [
                { id: "marketing", label: labels.marketing, href: "/dashboard?tab=marketing", icon: "building" },
                { id: "showcase-builder", label: labels.showcaseSettings, href: "/settings/showcase", icon: "settings" },
            ],
        },
        {
            id: "admin",
            title: "管理",
            items: [
                { id: "staff", label: labels.staff, href: "/staff", icon: "users" },
                { id: "staff-deleted", label: labels.staffDeleted, href: "/staff/deleted", icon: "ticket" },
                { id: "role-settings", label: labels.roleSettings, href: "/settings/staff/roles", icon: "settings" },
                { id: "delete-control", label: labels.deleteControl, href: "/settings/security/delete-control", icon: "settings" },
                { id: "delete-logs", label: labels.deleteLogs, href: "/settings/security/delete-logs", icon: "receipt-text" },
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

    const accountContext = await getCurrentSessionAccountContext();
    const shellAccountType = accountContext?.accountType ?? "customer";
    const customerTenantId = shellAccountType === "customer" ? accountContext?.tenantId ?? null : null;
    const customerDashboardHref = customerTenantId ? `/${encodeURIComponent(customerTenantId)}/dashboard` : "/customer-dashboard";
    if (shellAccountType === "customer" && isCompanyOnlyPath(pathname)) {
        redirect(customerDashboardHref);
    }

    if (shellAccountType === "company" && isStandaloneCompanyHomePath(pathname)) {
        return <>{children}</>;
    }

    const accountName = sessionUser.email.split("@")[0] || "使用者";
    const accountEmail = sessionUser.email;
    const avatarText = accountName.slice(0, 1).toUpperCase();

    const labels =
        lang === "zh"
            ? {
                  publicHome: "首頁",
                  companyHome: "首頁",
                  dashboard: "儀表板",
                  customerDashboard: "客戶儀錶板",
                  customers: "客戶",
                  ticket: "案件",
                  activities: "活動促銷",
                  consignments: "寄店總覽",
                  inventory: "庫存管理",
                  productManagement: "產品管理",
                  usedProducts: "二手商品",
                  checkout: "結帳",
                  receipts: "收據",
                  relationships: "開聯總覽",
                  marketing: "商店營銷設定",
                  staff: "員工管理",
                  staffDeleted: "員工刪除紀錄",
                  roleSettings: "權限等級設定",
                  deleteControl: "刪除安全控制",
                  deleteLogs: "刪除紀錄",
                  settings: "帳號設定",
                  account: "帳戶資訊",
                  accountSecurity: "帳號安全",
                  attributeSettings: "屬性設置",
                  dashboardSettings: "儀表板設定",
                  showcaseSettings: "展示頁設定",
                  backHome: "回到首頁",
                  signOut: "登出",
              }
            : {
                  publicHome: "Homepage",
                  companyHome: "Homepage",
                  dashboard: "Dashboard",
                  customerDashboard: "Customer Dashboard",
                  customers: "Customers",
                  ticket: "Cases",
                  activities: "Campaigns",
                  consignments: "Consignments",
                  inventory: "Inventory",
                  productManagement: "Product Management",
                  usedProducts: "Used Products",
                  checkout: "Checkout",
                  receipts: "Receipts",
                  relationships: "Relation Overview",
                  marketing: "Store Marketing Settings",
                  staff: "Staff Management",
                  staffDeleted: "Deleted Staff Records",
                  roleSettings: "Permission Levels",
                  deleteControl: "Delete Control",
                  deleteLogs: "Delete Logs",
                  settings: "Account Settings",
                  account: "Account",
                  accountSecurity: "Account Security",
                  attributeSettings: "Attribute Settings",
                  dashboardSettings: "Dashboard Settings",
                  showcaseSettings: "Showcase Settings",
                  backHome: "Back Home",
                  signOut: "Sign out",
              };

    const homeHref = shellAccountType === "company" ? "/company-home" : customerDashboardHref;
    const customerHomepageHref = shellAccountType === "customer" ? await resolveCustomerHomepageUrl(customerTenantId) : null;
    const publicHomeHref = shellAccountType === "company" ? "/company-home" : customerHomepageHref;
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
            {shellAccountType === "company" ? (
                <>
                    <Link href="/company-home" className="rounded-md border border-[rgb(var(--border))] px-2 py-1 text-xs hover:bg-[rgb(var(--panel2))]">
                        {labels.companyHome}
                    </Link>
                    <Link href="/dashboard?tab=dashboard" className="rounded-md border border-[rgb(var(--border))] px-2 py-1 text-xs hover:bg-[rgb(var(--panel2))]">
                        {labels.dashboard}
                    </Link>
                </>
            ) : null}
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
                                <Link href="/account/security" className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel))]">
                                    {labels.accountSecurity}
                                </Link>
                                {shellAccountType === "company" ? (
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
                                        <Link
                                            href="/settings/staff/roles"
                                            className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel))]"
                                        >
                                            {labels.roleSettings}
                                        </Link>
                                        <Link
                                            href="/settings/security/delete-control"
                                            className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel))]"
                                        >
                                            {labels.deleteControl}
                                        </Link>
                                        <Link
                                            href="/settings/security/delete-logs"
                                            className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel))]"
                                        >
                                            {labels.deleteLogs}
                                        </Link>
                                        <Link
                                            href="/settings/showcase"
                                            className="rounded-md px-2 py-1.5 text-sm hover:bg-[rgb(var(--panel))]"
                                        >
                                            {labels.showcaseSettings}
                                        </Link>
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

    const sidebarGroups = shellAccountType === "company" ? companySidebarGroups : customerSidebarGroups;

    return (
        <>
            {shellAccountType === "company" ? <DashboardThemeSync /> : null}
            <MerchantAppShell sidebarGroups={sidebarGroups} topbarActions={topbarActions} brandHref={homeHref}>
                {children}
            </MerchantAppShell>
        </>
    );
}
