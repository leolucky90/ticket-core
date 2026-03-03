// src/lib/i18n/dict.ts

import type { Locale } from "@/lib/i18n/locales"; // 引入 Locale 型別
import { i18nKeys } from "@/lib/i18n/keys"; // 引入 key 集合

type Dict = Record<string, string>; // Dict：key->翻譯字串（簡化版，企業可換成 ICU/messageformat）

const en: Dict = { // 英文翻譯
    [i18nKeys.appName]: "Ticket Core", // App 名稱
    [i18nKeys.nav.dashboard]: "Dashboard", // nav
    [i18nKeys.nav.tickets]: "Tickets",
    [i18nKeys.nav.customers]: "Customers",
    [i18nKeys.nav.projects]: "Projects",
    [i18nKeys.nav.analytics]: "Analytics",
    [i18nKeys.nav.ai]: "AI Assistant",
    [i18nKeys.nav.knowledge]: "Knowledge Base",
    [i18nKeys.nav.integrations]: "Integrations",
    [i18nKeys.nav.billing]: "Billing",
    [i18nKeys.nav.settings]: "Settings",
    [i18nKeys.nav.notifications]: "Notifications",
    [i18nKeys.nav.reports]: "Reports",
    [i18nKeys.nav.security]: "Security",
    [i18nKeys.nav.support]: "Support",
    [i18nKeys.nav.status]: "Status",
    [i18nKeys.nav.adminUsers]: "Admin · Users",
    [i18nKeys.nav.adminRoles]: "Admin · Roles",
    [i18nKeys.nav.adminAudit]: "Admin · Audit Logs",
    [i18nKeys.common.comingSoon]: "This page is a template. Add your business logic in services.",
    [i18nKeys.common.search]: "Search",
    [i18nKeys.common.create]: "Create",
    [i18nKeys.common.save]: "Save",
    [i18nKeys.common.close]: "Close",
}; // en 結束

const zhHant: Dict = { // 繁中翻譯
    [i18nKeys.appName]: "Ticket Core",
    [i18nKeys.nav.dashboard]: "總覽",
    [i18nKeys.nav.tickets]: "工單",
    [i18nKeys.nav.customers]: "客戶",
    [i18nKeys.nav.projects]: "專案",
    [i18nKeys.nav.analytics]: "分析",
    [i18nKeys.nav.ai]: "AI 助理",
    [i18nKeys.nav.knowledge]: "知識庫",
    [i18nKeys.nav.integrations]: "整合",
    [i18nKeys.nav.billing]: "帳務",
    [i18nKeys.nav.settings]: "設定",
    [i18nKeys.nav.notifications]: "通知",
    [i18nKeys.nav.reports]: "報表",
    [i18nKeys.nav.security]: "資安",
    [i18nKeys.nav.support]: "支援",
    [i18nKeys.nav.status]: "系統狀態",
    [i18nKeys.nav.adminUsers]: "管理 · 使用者",
    [i18nKeys.nav.adminRoles]: "管理 · 權限",
    [i18nKeys.nav.adminAudit]: "管理 · 稽核紀錄",
    [i18nKeys.common.comingSoon]: "這頁是企業模板骨架；請把商業邏輯放到 services。",
    [i18nKeys.common.search]: "搜尋",
    [i18nKeys.common.create]: "新增",
    [i18nKeys.common.save]: "儲存",
    [i18nKeys.common.close]: "關閉",
}; // zhHant 結束

export function getDict(locale: Locale) { // 取得指定 locale 的 dictionary
    return locale === "en" ? en : zhHant; // 目前只有 en / zh-Hant
} // getDict 結束

export function t(dict: Dict, key: string) { // 翻譯函式（企業可加 fallback、format）
    return dict[key] ?? key; // 找不到就回 key（避免整頁壞掉）
} // t 結束