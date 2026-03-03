// src/lib/i18n/keys.ts

export const i18nKeys = { // 集中管理字串 key（避免散落造成維護地獄）
    appName: "app.name", // App 名稱
    nav: { // 導航相關
        dashboard: "nav.dashboard", // Dashboard
        tickets: "nav.tickets", // Tickets
        customers: "nav.customers", // Customers
        projects: "nav.projects", // Projects
        analytics: "nav.analytics", // Analytics
        ai: "nav.ai", // AI Assistant
        knowledge: "nav.knowledge", // Knowledge Base
        integrations: "nav.integrations", // Integrations
        billing: "nav.billing", // Billing
        settings: "nav.settings", // Settings
        notifications: "nav.notifications", // Notifications
        reports: "nav.reports", // Reports
        security: "nav.security", // Security
        support: "nav.support", // Support
        status: "nav.status", // Status
        adminUsers: "nav.admin.users", // Admin Users
        adminRoles: "nav.admin.roles", // Admin Roles
        adminAudit: "nav.admin.audit", // Audit Logs
    },
    common: { // 通用字串
        comingSoon: "common.comingSoon", // Coming soon
        search: "common.search", // Search
        create: "common.create", // Create
        save: "common.save", // Save
        close: "common.close", // Close
    },
} as const; // as const 讓 key 變成 readonly + 字面量