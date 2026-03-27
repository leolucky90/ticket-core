import Link from "next/link";
import type { CSSProperties } from "react";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { BusinessLanguageSwitcher } from "@/features/business/components/BusinessLanguageSwitcher";
import { CtaStrip } from "@/features/business/components/homepage/CtaStrip";
import { FeatureCard } from "@/features/business/components/homepage/FeatureCard";
import { MetricPanel } from "@/features/business/components/homepage/MetricPanel";
import { PortfolioIntroBlock } from "@/features/business/components/homepage/PortfolioIntroBlock";
import { SectionShell } from "@/features/business/components/homepage/SectionShell";
import type { BusinessHomepageContentState, BusinessHomepageThemePreset } from "@/features/business/services/businessHomepageContent";

type BusinessLandingPageProps = {
    lang: "zh" | "en";
    isAuthenticated?: boolean;
    dashboardHref?: string;
    homepageContent?: BusinessHomepageContentState;
};

type LandingCopy = {
    brand: string;
    navValue: string;
    navFeature: string;
    navPreview: string;
    navAbout: string;
    navDemo: string;
    navProposal: string;
    navLogin: string;
    navDashboard: string;
    navSignOut: string;
    navRegister: string;
    kicker: string;
    title: string;
    desc: string;
    ctaPrimary: string;
    ctaSecondary: string;
    heroBulletA: string;
    heroBulletB: string;
    heroBulletC: string;
    heroMetrics: Array<{ title: string; value: string; note: string }>;
    heroFlowTitle: string;
    heroFlowLabel: string;
    heroFlowModules: string[];
    valueEyebrow: string;
    valueTitle: string;
    valueDesc: string;
    valueProblems: Array<{ title: string; desc: string }>;
    valueBridgeTitle: string;
    valueBridgeDesc: string;
    valueBridgeSteps: Array<{ stage: string; module: string; desc: string }>;
    valueScenarioLabel: string;
    valueScenarios: string[];
    featureEyebrow: string;
    featureTitle: string;
    featureDesc: string;
    featureCards: Array<{
        title: string;
        description: string;
        points: string[];
    }>;
    previewEyebrow: string;
    previewTitle: string;
    previewDesc: string;
    previewLaneA: string;
    previewLaneB: string;
    previewLaneC: string;
    previewTasks: string[];
    previewSummaryTitle: string;
    previewSummaryBlocks: Array<{ title: string; lines: string[] }>;
    aboutEyebrow: string;
    aboutTitle: string;
    aboutDesc: string;
    aboutIntroTitle: string;
    aboutIntroDesc: string;
    aboutHighlights: string[];
    aboutStack: string[];
    aboutMilestoneTitle: string;
    aboutMilestones: Array<{ year: string; title: string; desc: string }>;
    demoEyebrow: string;
    demoTitle: string;
    demoDesc: string;
    demoFlowTitle: string;
    demoFlowSteps: string[];
    demoAccessTitle: string;
    demoAccessNotes: string[];
    proposalEyebrow: string;
    proposalTitle: string;
    proposalDesc: string;
    proposalCards: Array<{ title: string; desc: string; href: string; label: string }>;
    finalTitle: string;
    finalDesc: string;
    finalCta: string;
    finalSecondaryCta: string;
};

const copyByLang: Record<"zh" | "en", LandingCopy> = {
    zh: {
        brand: "Ticket Core",
        navValue: "Product Value",
        navFeature: "Core Features",
        navPreview: "System Preview",
        navAbout: "Builder Intro",
        navDemo: "Demo",
        navProposal: "Proposal",
        navLogin: "登入",
        navDashboard: "儀錶板",
        navSignOut: "登出",
        navRegister: "建立公司帳號",
        kicker: "Builder-crafted commerce operating system",
        title: "Ticket Core Commerce / SaaS + AI：我親手打造的商家營運系統",
        desc: "這不是模板式官網，而是實際可運作的商業系統展示。它把維修案件、門市銷售、商品與二手品管理、收據流程與展示頁 builder 串在同一條營運鏈路中。",
        ctaPrimary: "查看系統入口",
        ctaSecondary: "看架構重點",
        heroBulletA: "商家營運可視化：從接單到結案都有紀錄",
        heroBulletB: "案件 / 商品 / 收據 / 展示頁共用同一份資料脈絡",
        heroBulletC: "以實作者視角設計流程，不依賴單一電商模板",
        heroMetrics: [
            {
                title: "Core Modules",
                value: "5",
                note: "展示頁、案件、商品、收據、權限流程",
            },
            {
                title: "Work Context",
                value: "Single Source",
                note: "門市與後台看到同一份狀態",
            },
            {
                title: "Builder Ownership",
                value: "End-to-End",
                note: "從需求拆解到落地維運都由我主導",
            },
        ],
        heroFlowTitle: "Operational Mesh",
        heroFlowLabel: "資料鏈路",
        heroFlowModules: ["展示頁 Builder", "案件管理", "商品 / 二手品", "收據與銷售", "門市權限流程"],
        valueEyebrow: "Product Value",
        valueTitle: "把碎裂流程整合成一套可執行的營運系統",
        valueDesc:
            "多數團隊把展示、接案、銷售、出單拆在不同工具，導致資料重工與流程斷層。Ticket Core 的目標是讓每個模組彼此可追蹤，不需要靠人肉同步。",
        valueProblems: [
            {
                title: "資訊分散",
                desc: "維修進度在聊天軟體、報價在試算表、收據在另一套系統，交接成本高。",
            },
            {
                title: "流程不可回放",
                desc: "當問題發生時，很難追到是誰在何時改了哪個階段，決策缺乏依據。",
            },
            {
                title: "展示與營運脫節",
                desc: "對外頁面只負責曝光，無法直接承接到真正的案件與銷售流程。",
            },
        ],
        valueBridgeTitle: "模組串接方式",
        valueBridgeDesc: "不是堆功能，而是用一致資料模型串起每個工作節點。",
        valueBridgeSteps: [
            {
                stage: "01",
                module: "Showcase Entry",
                desc: "展示頁接住詢問與需求，直接建立可追蹤的處理線索。",
            },
            {
                stage: "02",
                module: "Case + Inventory Sync",
                desc: "案件與商品狀態同步更新，避免門市與後台資訊不同步。",
            },
            {
                stage: "03",
                module: "Receipt + Sales Loop",
                desc: "收據、成交與後續分析回流到同一套營運資料。",
            },
        ],
        valueScenarioLabel: "適用場景",
        valueScenarios: ["維修接案流程", "門市櫃台銷售", "二手商品流轉", "預約與到店管理", "收據與對帳", "品牌展示頁管理"],
        featureEyebrow: "Core Feature Blocks",
        featureTitle: "以作品級敘事呈現功能，不只是功能清單",
        featureDesc: "每個區塊都對應真實營運問題與落地做法，適合拿來做提案、履歷與技術作品說明。",
        featureCards: [
            {
                title: "展示頁 Builder",
                description: "模組化區塊設計，可快速建立品牌首頁、服務介紹與導流入口。",
                points: ["可調整版位與文案", "活動內容可即時上線", "對外資訊與內部流程同源"],
            },
            {
                title: "案件管理",
                description: "將維修 / 客服 / 處理節點集中，支援追蹤、交接與歷程查找。",
                points: ["狀態與責任人明確", "案件歷程可回放", "減少口頭交接遺漏"],
            },
            {
                title: "商品 / 二手品管理",
                description: "針對一般商品與二手流轉建立一致管理方式，兼顧資訊完整與查詢效率。",
                points: ["規格與狀態分層", "二手品可追來源", "商品資訊可直連案件"],
            },
            {
                title: "收據與銷售",
                description: "從前台成交到後台收據歸檔，建立可稽核的交易紀錄。",
                points: ["收據流程標準化", "成交節點可追蹤", "可作為後續分析基礎"],
            },
            {
                title: "員工 / 權限 / 門市流程",
                description: "依角色控管可見範圍與操作能力，降低多門市協作風險。",
                points: ["角色權限分級", "操作責任可追溯", "支援實務門市分工"],
            },
        ],
        previewEyebrow: "Builder / System Preview",
        previewTitle: "系統畫面重點：讓提案對象快速看懂價值",
        previewDesc: "這裡不是炫技 dashboard，而是把商家日常最常用的資訊濃縮在同一個操作視圖。",
        previewLaneA: "接案看板",
        previewLaneB: "商品與庫存",
        previewLaneC: "收據與今日銷售",
        previewTasks: ["案件 #A102 / 待估價", "案件 #A099 / 待交付", "二手品上架檢查", "收據 R-2480 已開立"],
        previewSummaryTitle: "Preview Summary",
        previewSummaryBlocks: [
            {
                title: "Panel A - Operations",
                lines: ["案件數與逾期提醒", "待處理工單優先序", "門市即時處理節奏"],
            },
            {
                title: "Panel B - Commerce",
                lines: ["商品 / 二手品同步狀態", "收據與成交記錄對齊", "跨角色共用同一份資料"],
            },
            {
                title: "Panel C - Showcase",
                lines: ["展示頁與活動內容更新", "導流入口與轉換節點", "提案時可直接 demo 給合作方"],
            },
        ],
        aboutEyebrow: "About Me / Builder Intro",
        aboutTitle: "我是把產品、流程與工程落地的人",
        aboutDesc: "這個專案同時是產品實作與作品集。我以實作者身份從問題定義、資料模型、前後台架構到介面敘事完整負責。",
        aboutIntroTitle: "Builder Profile",
        aboutIntroDesc:
            "我專注在把混亂流程整理成可執行系統，尤其是需要同時兼顧營運現場、資料一致性與可擴充性的場景。",
        aboutHighlights: [
            "可獨立完成 MVP 到可提案版本，並保留後續擴充空間。",
            "擅長把商務流程轉成可維護的 TypeScript / App Router 架構。",
            "能和營運、門市、管理層對齊需求，避免產品與現場脫節。",
        ],
        aboutStack: ["Next.js 16 App Router", "TypeScript strict", "Tailwind CSS v4", "Firebase", "Role-based workflow"],
        aboutMilestoneTitle: "System Build Notes",
        aboutMilestones: [
            {
                year: "Phase 1",
                title: "資料與權限骨架",
                desc: "先建立多角色與商家資料邊界，確保後續模組可共用。",
            },
            {
                year: "Phase 2",
                title: "營運模組串接",
                desc: "把案件、商品、收據流程串成同一條可追蹤鏈路。",
            },
            {
                year: "Phase 3",
                title: "展示與提案能力",
                desc: "補上展示頁 builder 與官方首頁敘事，讓系統可直接對外說明。",
            },
        ],
        demoEyebrow: "Demo / Test Account",
        demoTitle: "Demo 入口與測試流程",
        demoDesc: "支援提案、驗收與合作前評估。若需要實際測試帳號，可用下列流程申請。",
        demoFlowTitle: "建議 demo 觀看順序",
        demoFlowSteps: [
            "先看官方首頁的系統全貌與模組關聯。",
            "登入後查看案件、商品、收據三個核心流程。",
            "最後看展示頁 builder，確認內容與營運資料如何串接。",
        ],
        demoAccessTitle: "測試帳號提供方式",
        demoAccessNotes: [
            "可提供短期測試帳號與指定情境資料。",
            "可依提案對象準備：維修門市版、二手流通版、一般零售版。",
            "若要進行導入評估，會附上流程圖與模組對照說明。",
        ],
        proposalEyebrow: "Proposal / Contact CTA",
        proposalTitle: "給前公司、潛在客戶與合作方的提案入口",
        proposalDesc: "你可以從下方直接選擇下一步，我會用同一套系統畫面進行功能 walkthrough 與導入討論。",
        proposalCards: [
            {
                title: "想看 demo",
                desc: "先從系統入口快速體驗核心流程。",
                href: "/login",
                label: "前往登入入口",
            },
            {
                title: "想談導入",
                desc: "建立公司帳號後可先用標準流程進行 PoC。",
                href: "/register/company",
                label: "建立公司帳號",
            },
            {
                title: "想看作品架構",
                desc: "直接回到 Builder Intro 區，查看設計與實作脈絡。",
                href: "#about",
                label: "查看架構敘事",
            },
            {
                title: "想做提案討論",
                desc: "可先看 demo 區與測試流程，再進一步安排合作溝通。",
                href: "#demo",
                label: "看測試流程",
            },
        ],
        finalTitle: "如果你正在找可落地的商家系統方案，我可以直接帶你看實機流程",
        finalDesc: "這個首頁同時是產品介紹、作品集與提案入口。下一步可先看 demo，或直接建立帳號展開導入討論。",
        finalCta: "先看 Demo",
        finalSecondaryCta: "開始導入評估",
    },
    en: {
        brand: "Ticket Core",
        navValue: "Product Value",
        navFeature: "Core Features",
        navPreview: "System Preview",
        navAbout: "Builder Intro",
        navDemo: "Demo",
        navProposal: "Proposal",
        navLogin: "Log in",
        navDashboard: "Dashboard",
        navSignOut: "Sign out",
        navRegister: "Create Company Account",
        kicker: "Builder-crafted commerce operating system",
        title: "Ticket Core Commerce / SaaS + AI: the operating system I built end to end",
        desc: "This homepage presents a real production system, not a template landing. It connects repair cases, store sales, product and used-item workflow, receipts, and showcase builder in one operating chain.",
        ctaPrimary: "Open system entry",
        ctaSecondary: "View architecture",
        heroBulletA: "Operations become visible from intake to completion",
        heroBulletB: "Cases, products, receipts, and showcase share one data context",
        heroBulletC: "Designed from a builder perspective instead of generic e-commerce templates",
        heroMetrics: [
            {
                title: "Core Modules",
                value: "5",
                note: "Showcase, cases, products, receipts, permissions",
            },
            {
                title: "Work Context",
                value: "Single Source",
                note: "Storefront and back office stay in sync",
            },
            {
                title: "Builder Ownership",
                value: "End-to-End",
                note: "From product design to technical delivery",
            },
        ],
        heroFlowTitle: "Operational Mesh",
        heroFlowLabel: "Data chain",
        heroFlowModules: ["Showcase Builder", "Case Management", "Products / Used Items", "Receipts & Sales", "Staff Permission Flow"],
        valueEyebrow: "Product Value",
        valueTitle: "Turning fragmented work into one executable operating system",
        valueDesc:
            "Most teams split showcase, service intake, sales, and receipts into disconnected tools. Ticket Core links modules through shared data so teams can run faster without manual syncing.",
        valueProblems: [
            {
                title: "Scattered data",
                desc: "Progress in chat, quotes in sheets, receipts somewhere else. Handoffs break easily.",
            },
            {
                title: "No replayable flow",
                desc: "When issues happen, teams cannot trace who changed what and when.",
            },
            {
                title: "Showcase disconnected from operations",
                desc: "Public pages capture traffic but fail to connect to actual case and sales execution.",
            },
        ],
        valueBridgeTitle: "How modules connect",
        valueBridgeDesc: "Not a feature pile, but a shared model across operational touchpoints.",
        valueBridgeSteps: [
            {
                stage: "01",
                module: "Showcase Entry",
                desc: "Public entry points can immediately create trackable operational leads.",
            },
            {
                stage: "02",
                module: "Case + Inventory Sync",
                desc: "Case updates and item status move together across teams.",
            },
            {
                stage: "03",
                module: "Receipt + Sales Loop",
                desc: "Receipts and sales outcomes flow back into one analysis-ready dataset.",
            },
        ],
        valueScenarioLabel: "Use cases",
        valueScenarios: ["Repair intake", "Storefront counter sales", "Used-item circulation", "Appointment flow", "Receipt reconciliation", "Showcase page operations"],
        featureEyebrow: "Core Feature Blocks",
        featureTitle: "Feature narratives that explain business outcomes",
        featureDesc: "Each block maps to an operational pain point and implementation approach for proposals and portfolio review.",
        featureCards: [
            {
                title: "Showcase Builder",
                description: "Modular sections for homepage storytelling, service highlights, and conversion entry points.",
                points: ["Editable content blocks", "Faster campaign updates", "Public and internal context stay aligned"],
            },
            {
                title: "Case Management",
                description: "Consolidates repair and service progress into one timeline for handoff and traceability.",
                points: ["Clear status ownership", "Replayable progress history", "Lower communication loss"],
            },
            {
                title: "Product / Used-item Management",
                description: "Unified model for standard products and used-item lifecycle with practical querying flow.",
                points: ["Layered specs and status", "Track source of used items", "Linked to case flow"],
            },
            {
                title: "Receipt and Sales",
                description: "Standardizes transaction records from frontline closing to back-office audit.",
                points: ["Receipt flow consistency", "Trackable close stages", "Ready for reporting"],
            },
            {
                title: "Staff / Permission / Store Process",
                description: "Role-based visibility and operation boundaries for multi-store collaboration safety.",
                points: ["Permission tiers", "Action traceability", "Supports real store division of labor"],
            },
        ],
        previewEyebrow: "Builder / System Preview",
        previewTitle: "System preview designed for proposal readability",
        previewDesc: "Instead of decorative dashboard shots, this layout highlights the panels real teams use every day.",
        previewLaneA: "Case Queue",
        previewLaneB: "Product & Inventory",
        previewLaneC: "Receipt & Daily Sales",
        previewTasks: ["Case #A102 / awaiting quote", "Case #A099 / pending delivery", "Used item listing check", "Receipt R-2480 issued"],
        previewSummaryTitle: "Preview Summary",
        previewSummaryBlocks: [
            {
                title: "Panel A - Operations",
                lines: ["Case load and overdue alerts", "Prioritized pending tickets", "Store-level handling rhythm"],
            },
            {
                title: "Panel B - Commerce",
                lines: ["Product and used-item status sync", "Receipt and closing consistency", "Shared data across roles"],
            },
            {
                title: "Panel C - Showcase",
                lines: ["Homepage content updates", "Conversion entry management", "Reusable for external walkthroughs"],
            },
        ],
        aboutEyebrow: "About Me / Builder Intro",
        aboutTitle: "I build product strategy and implementation as one system",
        aboutDesc: "This project doubles as a production product and portfolio case. I own the full chain from problem framing and data model to UI narrative and delivery.",
        aboutIntroTitle: "Builder Profile",
        aboutIntroDesc:
            "My focus is turning messy workflows into systems teams can operate confidently, especially where business operations, data consistency, and extensibility must coexist.",
        aboutHighlights: [
            "Deliverable from MVP to proposal-ready version with expansion room.",
            "Strong at converting business process into maintainable TypeScript architecture.",
            "Comfortable aligning with operations, store teams, and decision-makers.",
        ],
        aboutStack: ["Next.js 16 App Router", "TypeScript strict", "Tailwind CSS v4", "Firebase", "Role-based workflow"],
        aboutMilestoneTitle: "System Build Notes",
        aboutMilestones: [
            {
                year: "Phase 1",
                title: "Data and permission foundation",
                desc: "Defined role boundaries and tenant-safe data architecture first.",
            },
            {
                year: "Phase 2",
                title: "Operational module integration",
                desc: "Connected case, product, and receipt flow into one trackable chain.",
            },
            {
                year: "Phase 3",
                title: "Showcase and proposal layer",
                desc: "Added builder-facing presentation for external demos and proposals.",
            },
        ],
        demoEyebrow: "Demo / Test Account",
        demoTitle: "Demo entry and test account workflow",
        demoDesc: "Built for proposal review, validation, and collaboration onboarding. Test credentials can be prepared per scenario.",
        demoFlowTitle: "Recommended walkthrough order",
        demoFlowSteps: [
            "Start with official homepage to see system scope and module connections.",
            "Log in and review cases, products, and receipt flow.",
            "Open showcase builder to verify how content links to operations.",
        ],
        demoAccessTitle: "Test account policy",
        demoAccessNotes: [
            "Short-term test accounts can be provided with scenario data.",
            "Available scenarios: repair service, used-item flow, general retail.",
            "For onboarding discussions, architecture notes can be included.",
        ],
        proposalEyebrow: "Proposal / Contact CTA",
        proposalTitle: "Proposal entry for former teams, potential clients, and partners",
        proposalDesc: "Pick your next step below. I can run a focused walkthrough and discuss rollout based on this live system.",
        proposalCards: [
            {
                title: "Need a demo",
                desc: "Quickly experience the core operation flow.",
                href: "/login",
                label: "Open login",
            },
            {
                title: "Need rollout discussion",
                desc: "Create a company account and start with a structured PoC path.",
                href: "/register/company",
                label: "Create company account",
            },
            {
                title: "Need architecture view",
                desc: "Jump to the builder intro section and review design decisions.",
                href: "#about",
                label: "View architecture",
            },
            {
                title: "Need proposal preparation",
                desc: "Review demo setup process first, then proceed to collaboration planning.",
                href: "#demo",
                label: "Open demo plan",
            },
        ],
        finalTitle: "If you need an operable commerce system, I can walk you through the live flow",
        finalDesc: "This page is a product showcase, portfolio landing, and proposal gateway in one place.",
        finalCta: "View Demo",
        finalSecondaryCta: "Start Rollout",
    },
};

const themeByPreset: Record<BusinessHomepageThemePreset, Record<string, string>> = {
    forest: {
        "--biz-page-bg": "#f4f3ee",
        "--biz-text": "#1f2d2a",
        "--biz-heading": "#1b312d",
        "--biz-body": "#405653",
        "--biz-muted": "#6e807b",
        "--biz-surface": "#ffffff",
        "--biz-surface-soft": "#f1efe8",
        "--biz-border": "#d8d5cb",
        "--biz-border-strong": "#bcc8c1",
        "--biz-accent": "#2f695f",
        "--biz-accent-ink": "#25574d",
        "--biz-accent-contrast": "#eff7f4",
        "--biz-chip-bg": "#e2ebe7",
        "--biz-shadow": "rgba(35,56,51,0.28)",
        "--biz-bloom-a": "rgba(47,105,95,0.15)",
        "--biz-bloom-b": "rgba(168,144,104,0.14)",
        "--biz-bloom-c": "rgba(90,118,132,0.12)",
        "--biz-cta-bg": "#213833",
        "--biz-cta-text": "#f1f6f4",
        "--biz-cta-muted": "#c6d4cf",
        "--biz-cta-button": "#d8e6e1",
        "--biz-cta-button-text": "#223a35",
        "--biz-cta-border": "rgba(198,212,206,0.5)",
    },
    ocean: {
        "--biz-page-bg": "#f2f4f6",
        "--biz-text": "#1d2931",
        "--biz-heading": "#1b2f3b",
        "--biz-body": "#425a69",
        "--biz-muted": "#708594",
        "--biz-surface": "#ffffff",
        "--biz-surface-soft": "#edf1f4",
        "--biz-border": "#d2dae1",
        "--biz-border-strong": "#b6c4cf",
        "--biz-accent": "#3c6f8e",
        "--biz-accent-ink": "#2f5e7b",
        "--biz-accent-contrast": "#f1f7fb",
        "--biz-chip-bg": "#dfebf3",
        "--biz-shadow": "rgba(31,52,67,0.28)",
        "--biz-bloom-a": "rgba(60,111,142,0.14)",
        "--biz-bloom-b": "rgba(128,146,170,0.13)",
        "--biz-bloom-c": "rgba(173,154,120,0.1)",
        "--biz-cta-bg": "#243644",
        "--biz-cta-text": "#eef4f8",
        "--biz-cta-muted": "#c1d0db",
        "--biz-cta-button": "#d7e5ef",
        "--biz-cta-button-text": "#274155",
        "--biz-cta-border": "rgba(193,208,219,0.45)",
    },
    sunset: {
        "--biz-page-bg": "#f6f1eb",
        "--biz-text": "#2e2721",
        "--biz-heading": "#3a2f25",
        "--biz-body": "#645445",
        "--biz-muted": "#8b7a6a",
        "--biz-surface": "#ffffff",
        "--biz-surface-soft": "#f3ece4",
        "--biz-border": "#e0d3c5",
        "--biz-border-strong": "#cfb8a0",
        "--biz-accent": "#8d5a34",
        "--biz-accent-ink": "#764926",
        "--biz-accent-contrast": "#fff7f1",
        "--biz-chip-bg": "#efdfd0",
        "--biz-shadow": "rgba(66,48,32,0.28)",
        "--biz-bloom-a": "rgba(141,90,52,0.15)",
        "--biz-bloom-b": "rgba(105,128,121,0.1)",
        "--biz-bloom-c": "rgba(188,145,102,0.13)",
        "--biz-cta-bg": "#3d2d20",
        "--biz-cta-text": "#fff6ef",
        "--biz-cta-muted": "#ddcbbd",
        "--biz-cta-button": "#f0ddd0",
        "--biz-cta-button-text": "#4a2f1f",
        "--biz-cta-border": "rgba(221,203,189,0.5)",
    },
    slate: {
        "--biz-page-bg": "#f1f2f4",
        "--biz-text": "#232933",
        "--biz-heading": "#262f3d",
        "--biz-body": "#49586b",
        "--biz-muted": "#738398",
        "--biz-surface": "#ffffff",
        "--biz-surface-soft": "#eceff3",
        "--biz-border": "#d3d9e1",
        "--biz-border-strong": "#bcc6d2",
        "--biz-accent": "#4a5f78",
        "--biz-accent-ink": "#3f536d",
        "--biz-accent-contrast": "#eff3f8",
        "--biz-chip-bg": "#e1e8f0",
        "--biz-shadow": "rgba(33,45,61,0.28)",
        "--biz-bloom-a": "rgba(74,95,120,0.13)",
        "--biz-bloom-b": "rgba(137,155,178,0.12)",
        "--biz-bloom-c": "rgba(167,154,126,0.1)",
        "--biz-cta-bg": "#2a3646",
        "--biz-cta-text": "#edf2f8",
        "--biz-cta-muted": "#c2cedd",
        "--biz-cta-button": "#d8e2ef",
        "--biz-cta-button-text": "#2f435a",
        "--biz-cta-border": "rgba(194,206,221,0.46)",
    },
};

function toCssVars(vars: Record<string, string>): CSSProperties {
    const style: Record<string, string> = {};
    for (const [key, value] of Object.entries(vars)) {
        style[key] = value;
    }
    return style as CSSProperties;
}

export function BusinessLandingPage({
    lang,
    isAuthenticated = false,
    dashboardHref = "/dashboard",
    homepageContent,
}: BusinessLandingPageProps) {
    const ui = copyByLang[lang];
    const themePreset = homepageContent?.theme?.preset ?? "forest";
    const pageStyle = toCssVars(themeByPreset[themePreset] ?? themeByPreset.forest);

    const entryHref = isAuthenticated ? dashboardHref : "/login";
    const entryLabel = isAuthenticated ? ui.navDashboard : ui.navLogin;
    const heroSecondaryLabel = isAuthenticated ? ui.navDashboard : ui.ctaSecondary;

    return (
        <div
            style={pageStyle}
            className="relative min-h-dvh overflow-x-hidden bg-[var(--biz-page-bg)] text-[var(--biz-text)] [font-family:'Sora','Noto_Sans_TC',sans-serif]"
        >
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-[var(--biz-bloom-a)] blur-3xl" />
                <div className="absolute right-[-7rem] top-[28%] h-[26rem] w-[26rem] rounded-full bg-[var(--biz-bloom-b)] blur-3xl" />
                <div className="absolute bottom-8 left-[28%] h-72 w-72 rounded-full bg-[var(--biz-bloom-c)] blur-3xl" />
            </div>

            <header className="sticky top-0 z-20 border-b border-[var(--biz-border)] bg-[var(--biz-page-bg)] backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-6">
                    <Link href="/" className="text-sm font-semibold tracking-[0.14em] text-[var(--biz-accent-ink)] uppercase md:text-base">
                        {ui.brand}
                    </Link>

                    <nav className="hidden items-center gap-1 text-xs text-[var(--biz-body)] md:flex md:text-sm">
                        <a href="#value" className="rounded-full px-3 py-1.5 transition hover:bg-[var(--biz-surface-soft)]">
                            {ui.navValue}
                        </a>
                        <a href="#features" className="rounded-full px-3 py-1.5 transition hover:bg-[var(--biz-surface-soft)]">
                            {ui.navFeature}
                        </a>
                        <a href="#preview" className="rounded-full px-3 py-1.5 transition hover:bg-[var(--biz-surface-soft)]">
                            {ui.navPreview}
                        </a>
                        <a href="#about" className="rounded-full px-3 py-1.5 transition hover:bg-[var(--biz-surface-soft)]">
                            {ui.navAbout}
                        </a>
                        <a href="#demo" className="rounded-full px-3 py-1.5 transition hover:bg-[var(--biz-surface-soft)]">
                            {ui.navDemo}
                        </a>
                        <a href="#proposal" className="rounded-full px-3 py-1.5 transition hover:bg-[var(--biz-surface-soft)]">
                            {ui.navProposal}
                        </a>
                    </nav>

                    <div className="flex items-center gap-2">
                        <BusinessLanguageSwitcher currentLang={lang} />
                        <Link
                            className="rounded-full border border-[var(--biz-border-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--biz-accent-ink)] transition hover:bg-[var(--biz-surface-soft)] md:text-sm"
                            href={entryHref}
                        >
                            {entryLabel}
                        </Link>
                        {isAuthenticated ? (
                            <SignOutButton
                                className="rounded-full border-[var(--biz-border-strong)] bg-transparent px-3 py-1.5 text-xs text-[var(--biz-accent-ink)] hover:bg-[var(--biz-surface-soft)] md:text-sm"
                                label={ui.navSignOut}
                            />
                        ) : null}
                    </div>
                </div>
            </header>

            <main className="relative z-10">
                <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-14 pt-12 md:grid-cols-[1.1fr_0.9fr] md:px-6 md:pt-20">
                    <div className="biz-fade-up space-y-6">
                        <p className="inline-flex rounded-full border border-[var(--biz-border-strong)] bg-[var(--biz-surface-soft)] px-4 py-1 text-xs font-semibold tracking-[0.12em] text-[var(--biz-accent-ink)] uppercase">
                            {ui.kicker}
                        </p>
                        <h1 className="max-w-3xl [font-family:'Fraunces','Noto_Serif_TC',serif] text-4xl leading-tight text-[var(--biz-heading)] md:text-6xl">
                            {ui.title}
                        </h1>
                        <p className="max-w-2xl text-base leading-relaxed text-[var(--biz-body)] md:text-lg">{ui.desc}</p>

                        <div className="grid gap-2 text-sm text-[var(--biz-body)]">
                            <p className="rounded-xl border border-[var(--biz-border)] bg-[var(--biz-surface)] px-3 py-2">{ui.heroBulletA}</p>
                            <p className="rounded-xl border border-[var(--biz-border)] bg-[var(--biz-surface)] px-3 py-2">{ui.heroBulletB}</p>
                            <p className="rounded-xl border border-[var(--biz-border)] bg-[var(--biz-surface)] px-3 py-2">{ui.heroBulletC}</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/register/company"
                                className="rounded-full bg-[var(--biz-accent)] px-6 py-3 text-sm font-semibold text-[var(--biz-accent-contrast)] transition hover:translate-y-[-1px]"
                            >
                                {ui.ctaPrimary}
                            </Link>
                            <a
                                href="#about"
                                className="rounded-full border border-[var(--biz-border-strong)] px-6 py-3 text-sm font-semibold text-[var(--biz-accent-ink)] transition hover:translate-y-[-1px] hover:bg-[var(--biz-surface-soft)]"
                            >
                                {ui.ctaSecondary}
                            </a>
                            <Link
                                href={entryHref}
                                className="rounded-full border border-[var(--biz-border)] px-6 py-3 text-sm font-semibold text-[var(--biz-body)] transition hover:bg-[var(--biz-surface-soft)]"
                            >
                                {heroSecondaryLabel}
                            </Link>
                        </div>
                    </div>

                    <aside className="biz-fade-up biz-delay-1 rounded-3xl border border-[var(--biz-border)] bg-[var(--biz-surface)] p-5 shadow-[0_32px_85px_-56px_var(--biz-shadow)] md:p-6">
                        <p className="text-xs font-semibold tracking-[0.12em] text-[var(--biz-muted)] uppercase">{ui.heroFlowTitle}</p>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            {ui.heroMetrics.map((metric) => (
                                <MetricPanel key={metric.title} title={metric.title} value={metric.value} note={metric.note} />
                            ))}
                        </div>

                        <div className="mt-5 rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] p-4">
                            <p className="text-xs font-semibold tracking-[0.1em] text-[var(--biz-muted)] uppercase">{ui.heroFlowLabel}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {ui.heroFlowModules.map((module) => (
                                    <span
                                        key={module}
                                        className="rounded-full border border-[var(--biz-border-strong)] bg-[var(--biz-chip-bg)] px-3 py-1 text-xs font-medium text-[var(--biz-accent-ink)]"
                                    >
                                        {module}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </aside>
                </section>

                <SectionShell id="value" eyebrow={ui.valueEyebrow} title={ui.valueTitle} description={ui.valueDesc}>
                    <div className="grid gap-4 md:grid-cols-3">
                        {ui.valueProblems.map((problem, index) => (
                            <article
                                key={problem.title}
                                className={`biz-fade-up rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface)] p-5 ${index === 1 ? "biz-delay-1" : index === 2 ? "biz-delay-2" : ""}`}
                            >
                                <h3 className="text-xl font-semibold text-[var(--biz-heading)]">{problem.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-[var(--biz-body)]">{problem.desc}</p>
                            </article>
                        ))}
                    </div>

                    <div className="mt-8 grid gap-6 rounded-3xl border border-[var(--biz-border)] bg-[var(--biz-surface)] p-6 md:grid-cols-[1.2fr_0.8fr]">
                        <div>
                            <h3 className="text-2xl font-semibold text-[var(--biz-heading)]">{ui.valueBridgeTitle}</h3>
                            <p className="mt-2 text-sm text-[var(--biz-body)]">{ui.valueBridgeDesc}</p>
                            <div className="mt-5 space-y-3">
                                {ui.valueBridgeSteps.map((step) => (
                                    <div key={step.stage} className="rounded-xl border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] p-3">
                                        <p className="text-xs font-semibold tracking-[0.08em] text-[var(--biz-muted)] uppercase">
                                            {step.stage} / {step.module}
                                        </p>
                                        <p className="mt-1 text-sm text-[var(--biz-body)]">{step.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] p-4">
                            <p className="text-xs font-semibold tracking-[0.08em] text-[var(--biz-muted)] uppercase">{ui.valueScenarioLabel}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {ui.valueScenarios.map((scenario) => (
                                    <span
                                        key={scenario}
                                        className="rounded-full border border-[var(--biz-border)] bg-[var(--biz-surface)] px-3 py-1 text-xs text-[var(--biz-body)]"
                                    >
                                        {scenario}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </SectionShell>

                <SectionShell
                    id="features"
                    eyebrow={ui.featureEyebrow}
                    title={ui.featureTitle}
                    description={ui.featureDesc}
                    className="pt-6 md:pt-10"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        {ui.featureCards.map((feature, index) => (
                            <FeatureCard
                                key={feature.title}
                                index={`${String(index + 1).padStart(2, "0")}`}
                                title={feature.title}
                                description={feature.description}
                                points={feature.points}
                                className={index === 0 ? "md:col-span-2" : undefined}
                            />
                        ))}
                    </div>
                </SectionShell>

                <SectionShell id="preview" eyebrow={ui.previewEyebrow} title={ui.previewTitle} description={ui.previewDesc}>
                    <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
                        <article className="rounded-3xl border border-[var(--biz-border)] bg-[var(--biz-surface)] p-5 shadow-[0_28px_72px_-54px_var(--biz-shadow)] md:p-6">
                            <div className="flex items-center justify-between border-b border-[var(--biz-border)] pb-3">
                                <p className="text-xs font-semibold tracking-[0.1em] text-[var(--biz-muted)] uppercase">Workspace Mock</p>
                                <span className="rounded-full border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] px-3 py-1 text-xs text-[var(--biz-body)]">
                                    Ticket Core Console
                                </span>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                <div className="rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] p-3">
                                    <p className="text-xs font-semibold text-[var(--biz-muted)]">{ui.previewLaneA}</p>
                                    <div className="mt-3 h-2 w-4/5 rounded-full bg-[var(--biz-chip-bg)]" />
                                    <div className="mt-2 h-2 w-3/5 rounded-full bg-[var(--biz-chip-bg)]" />
                                    <div className="mt-2 h-2 w-2/3 rounded-full bg-[var(--biz-chip-bg)]" />
                                </div>
                                <div className="rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] p-3">
                                    <p className="text-xs font-semibold text-[var(--biz-muted)]">{ui.previewLaneB}</p>
                                    <div className="mt-3 h-2 w-2/3 rounded-full bg-[var(--biz-chip-bg)]" />
                                    <div className="mt-2 h-2 w-4/5 rounded-full bg-[var(--biz-chip-bg)]" />
                                    <div className="mt-2 h-2 w-1/2 rounded-full bg-[var(--biz-chip-bg)]" />
                                </div>
                                <div className="rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] p-3">
                                    <p className="text-xs font-semibold text-[var(--biz-muted)]">{ui.previewLaneC}</p>
                                    <div className="mt-3 h-2 w-3/4 rounded-full bg-[var(--biz-chip-bg)]" />
                                    <div className="mt-2 h-2 w-2/3 rounded-full bg-[var(--biz-chip-bg)]" />
                                    <div className="mt-2 h-2 w-4/5 rounded-full bg-[var(--biz-chip-bg)]" />
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] p-3">
                                <ul className="grid gap-2 text-sm text-[var(--biz-body)] md:grid-cols-2">
                                    {ui.previewTasks.map((task) => (
                                        <li key={task} className="rounded-xl border border-[var(--biz-border)] bg-[var(--biz-surface)] px-3 py-2">
                                            {task}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </article>

                        <aside className="rounded-3xl border border-[var(--biz-border)] bg-[var(--biz-surface)] p-5 md:p-6">
                            <h3 className="text-xl font-semibold text-[var(--biz-heading)]">{ui.previewSummaryTitle}</h3>
                            <div className="mt-4 space-y-3">
                                {ui.previewSummaryBlocks.map((block) => (
                                    <article key={block.title} className="rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] p-4">
                                        <p className="text-sm font-semibold text-[var(--biz-heading)]">{block.title}</p>
                                        <ul className="mt-2 space-y-2 text-sm text-[var(--biz-body)]">
                                            {block.lines.map((line) => (
                                                <li key={line} className="flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--biz-accent)]" />
                                                    <span>{line}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </article>
                                ))}
                            </div>
                        </aside>
                    </div>
                </SectionShell>

                <SectionShell id="about" eyebrow={ui.aboutEyebrow} title={ui.aboutTitle} description={ui.aboutDesc}>
                    <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr]">
                        <PortfolioIntroBlock
                            title={ui.aboutIntroTitle}
                            description={ui.aboutIntroDesc}
                            highlights={ui.aboutHighlights}
                            stack={ui.aboutStack}
                        />

                        <article className="rounded-3xl border border-[var(--biz-border)] bg-[var(--biz-surface)] p-6">
                            <h3 className="text-2xl font-semibold text-[var(--biz-heading)]">{ui.aboutMilestoneTitle}</h3>
                            <div className="mt-5 space-y-3">
                                {ui.aboutMilestones.map((item) => (
                                    <div key={item.year} className="rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] p-4">
                                        <p className="text-xs font-semibold tracking-[0.1em] text-[var(--biz-muted)] uppercase">{item.year}</p>
                                        <p className="mt-1 text-lg font-semibold text-[var(--biz-heading)]">{item.title}</p>
                                        <p className="mt-1 text-sm text-[var(--biz-body)]">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </article>
                    </div>
                </SectionShell>

                <SectionShell id="demo" eyebrow={ui.demoEyebrow} title={ui.demoTitle} description={ui.demoDesc}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <article className="rounded-3xl border border-[var(--biz-border)] bg-[var(--biz-surface)] p-6">
                            <h3 className="text-xl font-semibold text-[var(--biz-heading)]">{ui.demoFlowTitle}</h3>
                            <ol className="mt-4 space-y-2 text-sm text-[var(--biz-body)]">
                                {ui.demoFlowSteps.map((step, index) => (
                                    <li key={step} className="rounded-xl border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] px-3 py-2">
                                        {index + 1}. {step}
                                    </li>
                                ))}
                            </ol>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <Link
                                    href="/login"
                                    className="rounded-full bg-[var(--biz-accent)] px-5 py-2 text-sm font-semibold text-[var(--biz-accent-contrast)]"
                                >
                                    {ui.navLogin}
                                </Link>
                                <Link
                                    href="/register/company"
                                    className="rounded-full border border-[var(--biz-border-strong)] px-5 py-2 text-sm font-semibold text-[var(--biz-accent-ink)]"
                                >
                                    {ui.navRegister}
                                </Link>
                            </div>
                        </article>

                        <article className="rounded-3xl border border-[var(--biz-border)] bg-[var(--biz-surface)] p-6">
                            <h3 className="text-xl font-semibold text-[var(--biz-heading)]">{ui.demoAccessTitle}</h3>
                            <ul className="mt-4 space-y-2 text-sm text-[var(--biz-body)]">
                                {ui.demoAccessNotes.map((note) => (
                                    <li key={note} className="rounded-xl border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] px-3 py-2">
                                        {note}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    </div>
                </SectionShell>

                <SectionShell id="proposal" eyebrow={ui.proposalEyebrow} title={ui.proposalTitle} description={ui.proposalDesc}>
                    <div className="grid gap-4 md:grid-cols-2">
                        {ui.proposalCards.map((item) => (
                            <article key={item.title} className="rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface)] p-5">
                                <h3 className="text-xl font-semibold text-[var(--biz-heading)]">{item.title}</h3>
                                <p className="mt-2 text-sm text-[var(--biz-body)]">{item.desc}</p>
                                <a
                                    href={item.href}
                                    className="mt-4 inline-flex rounded-full border border-[var(--biz-border-strong)] px-4 py-2 text-sm font-semibold text-[var(--biz-accent-ink)] transition hover:bg-[var(--biz-surface-soft)]"
                                >
                                    {item.label}
                                </a>
                            </article>
                        ))}
                    </div>
                </SectionShell>

                <CtaStrip
                    title={ui.finalTitle}
                    description={ui.finalDesc}
                    primaryHref="/login"
                    primaryLabel={ui.finalCta}
                    secondaryHref="/register/company"
                    secondaryLabel={ui.finalSecondaryCta}
                />
            </main>
        </div>
    );
}
