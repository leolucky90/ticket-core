import type { MerchantSidebarGroup, MerchantTopbarLink } from "@/components/merchant/shell/merchant-shell.types";

type ShellLang = "zh" | "en";

type CompanyShellLabels = {
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
    overviewGroup: string;
    transactionsGroup: string;
    serviceGroup: string;
    operationsGroup: string;
    storeGroup: string;
    adminGroup: string;
};

type CustomerSidebarLabels = {
    overview: string;
    customerDashboard: string;
    account: string;
};

type CustomerDashboardCopy = {
    dashboardTitle: string;
    dashboardSubtitle: string;
};

export function buildCompanySidebarGroups(labels: CompanyShellLabels): MerchantSidebarGroup[] {
    return [
        {
            id: "overview",
            title: labels.overviewGroup,
            items: [
                { id: "home", label: labels.companyHome, href: "/company-home", icon: "building" },
                { id: "dashboard", label: labels.dashboard, href: "/dashboard?tab=dashboard", icon: "gauge" },
                { id: "relationships", label: labels.relationships, href: "/dashboard/relationships", icon: "handshake" },
            ],
        },
        {
            id: "transactions",
            title: labels.transactionsGroup,
            items: [
                { id: "checkout", label: labels.checkout, href: "/dashboard/checkout", icon: "credit-card" },
                { id: "receipts", label: labels.receipts, href: "/dashboard/receipts", icon: "receipt-text" },
            ],
        },
        {
            id: "service",
            title: labels.serviceGroup,
            items: [
                { id: "cases", label: labels.ticket, href: "/dashboard?tab=cases", icon: "ticket" },
                { id: "customers", label: labels.customers, href: "/dashboard?tab=customers", icon: "users" },
            ],
        },
        {
            id: "operations",
            title: labels.operationsGroup,
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
            title: labels.storeGroup,
            items: [
                { id: "marketing", label: labels.marketing, href: "/dashboard?tab=marketing", icon: "building" },
                { id: "showcase-builder", label: labels.showcaseSettings, href: "/settings/showcase", icon: "settings" },
            ],
        },
        {
            id: "admin",
            title: labels.adminGroup,
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

export function buildCustomerSidebarGroups(labels: CustomerSidebarLabels, customerDashboardHref: string): MerchantSidebarGroup[] {
    return [
        {
            id: "customer-main",
            title: labels.overview,
            items: [
                { id: "customer-dashboard", label: labels.customerDashboard, href: customerDashboardHref, icon: "gauge" },
                { id: "account", label: labels.account, href: "/settings/account", icon: "settings" },
            ],
        },
    ];
}

export function buildBossAdminSidebarGroups(lang: ShellLang): MerchantSidebarGroup[] {
    const groupLabels =
        lang === "en"
            ? {
                  overview: "Overview",
                  store: "Store",
                  admin: "Admin",
                  home: "Homepage",
                  dashboard: "Dashboard",
                  homepageStudio: "Showcase Settings",
                  query: "Query",
              }
            : {
                  overview: "總覽",
                  store: "商店",
                  admin: "管理",
                  home: "首頁",
                  dashboard: "儀表板",
                  homepageStudio: "展示頁設定",
                  query: "查詢頁面",
              };

    return [
        {
            id: "overview",
            title: groupLabels.overview,
            items: [
                { id: "boss-home", label: groupLabels.home, href: "/", icon: "building" },
                { id: "boss-dashboard", label: groupLabels.dashboard, href: "/bossadmin?tab=dashboard", icon: "gauge" },
            ],
        },
        {
            id: "store",
            title: groupLabels.store,
            items: [{ id: "boss-homepage-studio", label: groupLabels.homepageStudio, href: "/bossadmin?tab=dashboard", icon: "settings" }],
        },
        {
            id: "admin",
            title: groupLabels.admin,
            items: [{ id: "boss-query", label: groupLabels.query, href: "/bossadmin?tab=query", icon: "receipt-text" }],
        },
    ];
}

export function buildCompanyTopbarLinks(labels: Pick<CompanyShellLabels, "companyHome" | "dashboard">): MerchantTopbarLink[] {
    return [
        { id: "company-home", label: labels.companyHome, href: "/company-home" },
        { id: "company-dashboard", label: labels.dashboard, href: "/dashboard?tab=dashboard" },
    ];
}

export function buildBossAdminTopbarLinks(lang: ShellLang): MerchantTopbarLink[] {
    const labels =
        lang === "en"
            ? {
                  home: "Homepage",
                  dashboard: "Dashboard",
                  homepageStudio: "Showcase Settings",
                  query: "Query",
              }
            : {
                  home: "首頁",
                  dashboard: "儀表板",
                  homepageStudio: "展示頁設定",
                  query: "查詢頁面",
              };

    return [
        { id: "boss-home", label: labels.home, href: "/" },
        { id: "boss-dashboard", label: labels.dashboard, href: "/bossadmin?tab=dashboard" },
        { id: "boss-homepage-studio", label: labels.homepageStudio, href: "/bossadmin?tab=dashboard" },
        { id: "boss-query", label: labels.query, href: "/bossadmin?tab=query" },
    ];
}

export function getCustomerDashboardPageCopy(lang: ShellLang): CustomerDashboardCopy {
    return lang === "en"
        ? {
              dashboardTitle: "Customer Dashboard",
              dashboardSubtitle: "Review your tickets, recent updates, and total service spending.",
          }
        : {
              dashboardTitle: "客戶儀表板",
              dashboardSubtitle: "查看自己的案件進度、最近更新與累計消費。",
          };
}
