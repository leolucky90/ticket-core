import type { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { MerchantAccountMenu, MerchantAppShell, MerchantTopbarLinkBar } from "@/components/merchant/shell";
import { DashboardThemeSync } from "@/components/settings/DashboardThemeSync";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";
import { resolveCustomerHomepageUrl } from "@/lib/services/homepage-url.service";
import {
    buildCompanySidebarGroups,
    buildCompanyTopbarLinks,
    buildCustomerSidebarGroups,
} from "@/components/merchant/shell/merchant-shell-presets";

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

export async function ProtectedShell({ children }: ProtectedShellProps) {
    const headerStore = await headers();
    const pathname = headerStore.get("x-pathname") ?? "";

    const cookieStore = await cookies();
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const ui = getUiText(lang);

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
    const labels = {
        publicHome: ui.shell.publicHome,
        companyHome: ui.shell.companyHome,
        dashboard: ui.shell.dashboard,
        customerDashboard: ui.shell.customerDashboard,
        customers: ui.shell.customers,
        ticket: ui.shell.tickets,
        activities: ui.shell.campaigns,
        consignments: ui.shell.consignments,
        inventory: ui.shell.inventory,
        productManagement: ui.shell.productManagement,
        usedProducts: ui.shell.usedProducts,
        checkout: ui.shell.checkout,
        receipts: ui.shell.receipts,
        relationships: ui.shell.relationshipOverview,
        marketing: ui.shell.marketing,
        staff: ui.shell.staff,
        staffDeleted: ui.shell.staffDeleted,
        roleSettings: ui.shell.roleSettings,
        deleteControl: ui.shell.deleteControl,
        deleteLogs: ui.shell.deleteLogs,
        overviewGroup: ui.shell.overviewGroup,
        transactionsGroup: ui.shell.transactionsGroup,
        serviceGroup: ui.shell.serviceGroup,
        operationsGroup: ui.shell.operationsGroup,
        storeGroup: ui.shell.storeGroup,
        adminGroup: ui.shell.adminGroup,
        settings: ui.shell.settings,
        account: ui.shell.account,
        accountSecurity: ui.shell.accountSecurity,
        attributeSettings: ui.shell.attributeSettings,
        dashboardSettings: ui.shell.dashboardSettings,
        showcaseSettings: ui.shell.showcaseSettings,
        backHome: ui.shell.backHome,
        signOut: ui.shell.signOut,
    };

    const homeHref = shellAccountType === "company" ? "/company-home" : customerDashboardHref;
    const customerHomepageHref = shellAccountType === "customer" ? await resolveCustomerHomepageUrl(customerTenantId) : null;
    const publicHomeHref = shellAccountType === "company" ? "/company-home" : customerHomepageHref;
    const hasPublicHomeLink = typeof publicHomeHref === "string" && publicHomeHref.length > 0;
    const publicHomeIsExternal = hasPublicHomeLink ? isExternalHref(publicHomeHref) : false;

    const companySidebarGroups = buildCompanySidebarGroups(labels);
    const customerSidebarGroups = buildCustomerSidebarGroups(
        {
            overview: ui.shell.overviewGroup,
            customerDashboard: labels.customerDashboard,
            account: labels.account,
        },
        customerDashboardHref,
    );

    const settingsLinks = [
        { id: "account", label: labels.account, href: "/settings/account" },
        { id: "account-security", label: labels.accountSecurity, href: "/account/security" },
        ...(shellAccountType === "company"
            ? [
                  { id: "account-attributes", label: labels.attributeSettings, href: "/settings/account/attributes" },
                  { id: "dashboard-settings", label: labels.dashboardSettings, href: "/settings/dashboard" },
                  { id: "role-settings", label: labels.roleSettings, href: "/settings/staff/roles" },
                  { id: "delete-control", label: labels.deleteControl, href: "/settings/security/delete-control" },
                  { id: "delete-logs", label: labels.deleteLogs, href: "/settings/security/delete-logs" },
                  { id: "showcase-settings", label: labels.showcaseSettings, href: "/settings/showcase" },
              ]
            : []),
    ];

    const quickLinks = hasPublicHomeLink
        ? [{ id: "public-home", label: labels.publicHome, href: publicHomeHref, external: publicHomeIsExternal }]
        : [{ id: "back-home", label: labels.backHome, href: "/" }];

    const topbarActions = (
        <div className="flex items-center gap-2">
            {shellAccountType === "company" ? <MerchantTopbarLinkBar links={buildCompanyTopbarLinks(labels)} /> : null}
            <MerchantAccountMenu
                accountName={accountName}
                accountEmail={accountEmail}
                avatarText={avatarText}
                currentLang={lang}
                settingsLabel={labels.settings}
                settingsLinks={settingsLinks}
                quickLinks={quickLinks}
                signOutSlot={<SignOutButton className="w-full text-left" label={labels.signOut} />}
            />
        </div>
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
