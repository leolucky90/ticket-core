import Link from "next/link";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
    ArrowRight,
    BrainCircuit,
    Building2,
    Code2,
    Globe2,
    GraduationCap,
    Layers3,
    Palette,
    Package,
    ReceiptText,
    ShieldCheck,
    Sparkles,
    Store,
    Wrench,
} from "lucide-react";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { BusinessLanguageSwitcher } from "@/features/business/components/BusinessLanguageSwitcher";
import { CtaStrip } from "@/features/business/components/homepage/CtaStrip";
import { MetricPanel } from "@/features/business/components/homepage/MetricPanel";
import { PortfolioIntroBlock } from "@/features/business/components/homepage/PortfolioIntroBlock";
import { SectionShell } from "@/features/business/components/homepage/SectionShell";
import type {
    BusinessHomepageContentState,
    BusinessHomepageEditableContent,
    BusinessHomepageThemePreset,
} from "@/features/business/services/businessHomepageContent";

type BusinessLandingPageProps = {
    lang: "zh" | "en";
    isAuthenticated?: boolean;
    dashboardHref?: string;
    homepageContent?: BusinessHomepageContentState;
};

type LandingCopy = {
    brand: string;
    navPlatform: string;
    navModules: string;
    navStack: string;
    navPreview: string;
    navDemo: string;
    navAbout: string;
    navProgress: string;
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
    platformEyebrow: string;
    platformTitle: string;
    platformDesc: string;
    platformCards: Array<{ title: string; tag: string; desc: string }>;
    architectureTitle: string;
    architectureDesc: string;
    architectureSteps: Array<{ stage: string; module: string; desc: string }>;
    scenarioLabel: string;
    scenarios: string[];
    featureEyebrow: string;
    featureTitle: string;
    featureDesc: string;
    featureCards: Array<{
        title: string;
        description: string;
        points: string[];
    }>;
    techEyebrow: string;
    techTitle: string;
    techDesc: string;
    techSpecs: Array<{ label: string; value: string; desc: string }>;
    techPrinciplesTitle: string;
    techPrinciples: string[];
    techRoadmapTitle: string;
    techRoadmap: Array<{ phase: string; title: string; desc: string }>;
    previewEyebrow: string;
    previewTitle: string;
    previewDesc: string;
    previewLaneA: string;
    previewLaneB: string;
    previewLaneC: string;
    previewTasks: string[];
    previewSummaryTitle: string;
    previewSummaryBlocks: Array<{ title: string; lines: string[] }>;
    demoEyebrow: string;
    demoTitle: string;
    demoDesc: string;
    demoEntryLabel: string;
    demoEntryValue: string;
    demoPasswordLabel: string;
    demoPasswordValue: string;
    demoGroups: Array<{ title: string; accounts: Array<{ label: string; email: string }> }>;
    aboutEyebrow: string;
    aboutTitle: string;
    aboutDesc: string;
    aboutIntroTitle: string;
    aboutIntroDesc: string;
    aboutHighlights: string[];
    aboutStack: string[];
    aboutMilestoneTitle: string;
    aboutMilestones: Array<{ year: string; title: string; desc: string }>;
    progressEyebrow: string;
    progressTitle: string;
    progressDesc: string;
    progressNowTitle: string;
    progressNowItems: string[];
    progressNextTitle: string;
    progressNextItems: string[];
    proposalEyebrow: string;
    proposalTitle: string;
    proposalDesc: string;
    proposalCards: Array<{ title: string; desc: string; href: string; label: string }>;
    finalTitle: string;
    finalDesc: string;
    finalCta: string;
    finalSecondaryCta: string;
};

type EditableLandingCopy = Pick<LandingCopy, "kicker" | "title" | "desc" | "ctaPrimary" | "ctaSecondary" | "finalTitle" | "finalDesc" | "finalCta">;

const platformIcons: LucideIcon[] = [Building2, Wrench, ReceiptText, BrainCircuit];
const featureIcons: LucideIcon[] = [Layers3, Wrench, Package, ReceiptText, BrainCircuit];
const techIcons: LucideIcon[] = [Code2, ShieldCheck, Package, Palette, Layers3, Sparkles];
const proposalIcons: LucideIcon[] = [Sparkles, Store, Layers3, Globe2];

const legacyEditableCopyByLang: Record<"zh" | "en", EditableLandingCopy> = {
    zh: {
        kicker: "Builder-crafted commerce operating system",
        title: "Ticket Core Commerce / SaaS + AI：我親手打造的商家營運系統",
        desc: "這不是模板式官網，而是實際可運作的商業系統展示。它把維修案件、門市銷售、商品與二手品管理、收據流程與展示頁 builder 串在同一條營運鏈路中。",
        ctaPrimary: "查看系統入口",
        ctaSecondary: "看架構重點",
        finalTitle: "如果你正在找可落地的商家系統方案，我可以直接帶你看實機流程",
        finalDesc: "這個首頁同時是產品介紹、作品集與提案入口。下一步可先看 demo，或直接建立帳號展開導入討論。",
        finalCta: "先看 Demo",
    },
    en: {
        kicker: "Builder-crafted commerce operating system",
        title: "Ticket Core Commerce / SaaS + AI: the operating system I built end to end",
        desc: "This homepage presents a real production system, not a template landing. It connects repair cases, store sales, product and used-item workflow, receipts, and showcase builder in one operating chain.",
        ctaPrimary: "Open system entry",
        ctaSecondary: "View architecture",
        finalTitle: "If you need an operable commerce system, I can walk you through the live flow",
        finalDesc: "This page is a product showcase, portfolio landing, and proposal gateway in one place.",
        finalCta: "View Demo",
    },
};

const copyByLang: Record<"zh" | "en", LandingCopy> = {
    zh: {
        brand: "Ticket Core",
        navPlatform: "Platform",
        navModules: "Modules",
        navStack: "Tech Stack",
        navPreview: "Preview",
        navDemo: "Demo",
        navAbout: "About Me",
        navProgress: "Progress",
        navProposal: "Proposal",
        navLogin: "登入",
        navDashboard: "儀表板",
        navSignOut: "登出",
        navRegister: "建立公司帳號",
        kicker: "Proposal-ready portfolio for a SaaS + AI operating platform",
        title: "Ticket Core 是我正在打造的多租戶 SaaS + AI 核心平台，整合 ERP、Repair System、POS 與 Commerce",
        desc: "這個首頁定位為未來提案與履歷展示的作品頁。系統以手機維修店的實務流程為起點，把多租戶營運、維修案件、商品與二手流通、櫃台交易、品牌展示與後續 AI 能力收斂成同一個產品方向。",
        ctaPrimary: "查看平台定位",
        ctaSecondary: "認識我的背景",
        heroBulletA: "定位為多租戶 ERP + Repair System + POS + Commerce 的 SaaS 核心平台。",
        heroBulletB: "以手機維修門市為第一個使用背景，同時保留延伸到零售與服務業的架構彈性。",
        heroBulletC: "首頁本身就是作品展示頁，未來可直接用於提案、履歷與產品對外說明。",
        heroMetrics: [
            {
                title: "Platform Scope",
                value: "ERP + Repair + POS + Commerce",
                note: "不是單一模組，而是可持續擴充的營運核心。",
            },
            {
                title: "Architecture",
                value: "Multi-tenant",
                note: "以角色邊界與租戶隔離作為系統骨架。",
            },
            {
                title: "Build Mode",
                value: "AI-assisted",
                note: "以 AI 協作加速介面、內容與實作迭代。",
            },
            {
                title: "Origin Context",
                value: "Repair-first",
                note: "從第一線維修門市經驗往回設計流程。",
            },
        ],
        heroFlowTitle: "Operating Thesis",
        heroFlowLabel: "Core lanes",
        heroFlowModules: ["Tenant & Roles", "Repair Tickets", "Inventory / Used Devices", "POS / Receipts", "Commerce Showcase", "AI / RAG Roadmap"],
        platformEyebrow: "Platform Positioning",
        platformTitle: "不是單頁形象站，而是一套可成長的 SaaS + AI 營運平台雛型",
        platformDesc:
            "首頁的敘事會直接對齊產品方向，讓提案對象能快速理解這個作品不是只有畫面，而是以真實營運情境為基礎所設計的系統。",
        platformCards: [
            {
                title: "多租戶 ERP 核心",
                tag: "Tenant-safe foundation",
                desc: "系統先處理商家邊界、角色權限與資料一致性，讓後續模組可以共用同一套基礎。",
            },
            {
                title: "Repair System 起點",
                tag: "Repair-first workflow",
                desc: "以手機維修門市的接案、檢測、交付與售後流程作為第一個完整場景。",
            },
            {
                title: "POS + Commerce 串接",
                tag: "Front to back office",
                desc: "櫃台交易、收據、商品與展示頁不分裂，避免營運資料散落在不同工具。",
            },
            {
                title: "AI-ready 擴充",
                tag: "Assistant + knowledge layer",
                desc: "目前先完成作品展示與核心工作流，後續導入 AI assistant 與 RAG 能力。",
            },
        ],
        architectureTitle: "平台架構邏輯",
        architectureDesc: "從接觸客戶到完成交易與後續知識沉澱，盡量維持在同一條可追蹤的資料鏈路上。",
        architectureSteps: [
            {
                stage: "01",
                module: "Inquiry / Intake",
                desc: "從展示頁、詢問入口或現場接待開始，形成可追蹤的服務線索。",
            },
            {
                stage: "02",
                module: "Repair / Inventory Sync",
                desc: "案件與商品狀態同步更新，讓門市與後台不需要額外人工對帳。",
            },
            {
                stage: "03",
                module: "POS / Receipt Loop",
                desc: "成交、收據與售後紀錄回流同一資料脈絡，方便後續分析與追蹤。",
            },
            {
                stage: "04",
                module: "AI / RAG Layer",
                desc: "把維修知識、產品規格與 SOP 逐步整理成未來可檢索與可推理的知識層。",
            },
        ],
        scenarioLabel: "適用場景",
        scenarios: ["手機維修門市", "3C 維修櫃台", "二手裝置流通", "小型連鎖零售", "服務型櫃台作業", "展示頁與導流頁管理"],
        featureEyebrow: "Core Modules",
        featureTitle: "以真實營運模組構成，而不是把功能堆成清單",
        featureDesc: "每個模組都對應到實際工作現場的痛點，是我拿來做提案、履歷作品說明與未來產品頁敘事。",
        featureCards: [
            {
                title: "Showcase / Proposal Layer",
                description: "把首頁做成可提案、可履歷展示、也可延伸成正式官網的入口層。",
                points: ["首頁文案與產品定位一致", "可展示產品架構與個人背景", "對外敘事不再和系統脫節"],
            },
            {
                title: "Repair Workflow",
                description: "針對維修店情境整理接案、狀態更新、交接與結案流程。",
                points: ["案件狀態清晰", "交接資訊可回放", "更符合第一線門市節奏"],
            },
            {
                title: "Inventory / Used Device Flow",
                description: "商品、二手裝置與來源資訊可被統一管理，方便查詢與追蹤。",
                points: ["規格與狀態可分層", "可追裝置來源", "可和案件或銷售流程串接"],
            },
            {
                title: "POS / Receipt Operations",
                description: "把櫃台交易和後台紀錄接起來，降低資訊落差與對帳成本。",
                points: ["交易節點可追蹤", "收據流程標準化", "可延伸做營運分析"],
            },
            {
                title: "AI System Roadmap",
                description: "目前先以 AI 協作加速前端與敘事，下一步會導入真正的 AI 功能層。",
                points: ["情境式 AI assistant", "維修知識 RAG", "知識與操作建議整合"],
            },
        ],
        techEyebrow: "Tech Foundation",
        techTitle: "技術規格直接服務產品可維護性與後續擴充",
        techDesc: "這個專案不是只追求畫面，而是以之後能持續擴充、多模組共存與 AI 整合為前提選擇技術基礎。",
        techSpecs: [
            {
                label: "Framework",
                value: "Next.js 16 App Router",
                desc: "用 App Router 統整展示頁、後台與後續 API / workflow 的組織方式。",
            },
            {
                label: "Language",
                value: "TypeScript strict mode",
                desc: "用嚴格型別維持資料模型、流程狀態與跨模組實作的穩定性。",
            },
            {
                label: "Package Manager",
                value: "pnpm",
                desc: "讓依賴管理更乾淨，也更適合長期維護與多人協作。",
            },
            {
                label: "Styling",
                value: "Tailwind CSS v4",
                desc: "用更快的設計與排版節奏迭代首頁與各類工作流畫面。",
            },
            {
                label: "Design Tokens",
                value: "CSS variables only",
                desc: "所有主題與視覺語彙盡量由變數控制，方便日後做品牌化與主題切換。",
            },
            {
                label: "Icon System",
                value: "lucide-react",
                desc: "使用一致、輕量的 icon 系統強化資訊層次與模組辨識度。",
            },
        ],
        techPrinciplesTitle: "Build principles",
        techPrinciples: [
            "讓首頁敘事與實際系統工作流說同一件事，避免作品展示和產品本體分裂。",
            "先建立多租戶與角色權限邊界，再往維修、商品、POS 與 Commerce 擴充。",
            "用 AI 協助加速開發節奏，但保留後續導入真正 AI workflow 的空間。",
        ],
        techRoadmapTitle: "AI roadmap",
        techRoadmap: [
            {
                phase: "Now",
                title: "持續打磨首頁與核心模組",
                desc: "目前持續更新 UI、作品敘事與基礎工作流，讓整體更適合提案與展示。",
            },
            {
                phase: "Next",
                title: "導入情境式 AI assistant",
                desc: "規劃讓產品說明、操作引導與部分服務流程擁有更智能的輔助能力。",
            },
            {
                phase: "Later",
                title: "研究並實作 RAG",
                desc: "把維修知識、商品規格與 SOP 收斂成未來可以檢索、問答與建議的知識系統。",
            },
        ],
        previewEyebrow: "System Preview",
        previewTitle: "首頁視覺延續到系統預覽，讓作品更像一個真的平台",
        previewDesc: "用比較接近現代 SaaS 官網的方式呈現 dashboard mock，讓提案方能快速感受到產品方向與營運脈絡。",
        previewLaneA: "Repair Queue",
        previewLaneB: "Inventory & Devices",
        previewLaneC: "POS & Receipts",
        previewTasks: ["Ticket RC-204 / 待檢測", "Ticket RC-197 / 等待報價確認", "Used Device / iPhone 13 128G 上架中", "Receipt POS-2480 / 已開立"],
        previewSummaryTitle: "Preview Summary",
        previewSummaryBlocks: [
            {
                title: "Operations",
                lines: ["案件進度與門市節奏整合呈現", "待處理狀態優先排序", "讓接案與交付資訊更直覺"],
            },
            {
                title: "Commerce",
                lines: ["商品與二手裝置狀態同步", "櫃台成交與收據同源", "方便延伸做後續營運分析"],
            },
            {
                title: "Showcase",
                lines: ["首頁可直接做提案展示", "產品定位、背景與技術規格集中說明", "未來可延伸成正式品牌官網"],
            },
        ],
        demoEyebrow: "Demo / Test Access",
        demoTitle: "首頁直接提供測試帳號，方便觀察者快速體驗 A / B 端與客戶端情境",
        demoDesc: "這個作品頁也同時作為 demo 入口。若要直接測試，請從首頁登入入口進入，以下帳號目前密碼皆為同一組。",
        demoEntryLabel: "用戶登入入口",
        demoEntryValue: "http://localhost:3000",
        demoPasswordLabel: "測試密碼",
        demoPasswordValue: "123456",
        demoGroups: [
            {
                title: "A 組租戶",
                accounts: [
                    { label: "用戶 A 端", email: "admina@gmail.com" },
                    { label: "A 用戶客戶端", email: "cxa@gmail.com" },
                ],
            },
            {
                title: "B 組租戶",
                accounts: [
                    { label: "用戶 B 端", email: "adminb@gmail.com" },
                    { label: "B 用戶客戶端", email: "cxb@gmail.com" },
                ],
            },
        ],
        aboutEyebrow: "About Me",
        aboutTitle: "我把澳洲生活、維修現場經驗與 AI 學習，轉成這個產品的設計基礎",
        aboutDesc:
            "這個專案不只是工程練習，而是我把跨領域背景轉成產品思考與系統實作的作品。也因為我真的待過維修與服務現場，所以我更在意流程是不是能落地。",
        aboutIntroTitle: "Builder Profile",
        aboutIntroDesc:
            "我在澳洲待了八年，畢業於 AIT Academy of Interactive Technology，主修 Mobile App Development。雖然沒有在澳洲累積 IT 正職經驗，但有約六年的手機、電腦等 3C 軟硬體維修與汽車維修經驗。回台後，我開始積極研究 AI，並把這些現場理解轉成現在這個 SaaS + AI 平台作品。",
        aboutHighlights: [
            "熟悉第一線維修門市、接案、交接、銷售與客戶溝通的實際節奏。",
            "能把現場流程往回抽象成資料模型、權限邊界與畫面敘事。",
            "目前以 AI 協作方式持續打磨產品，下一步會研究 RAG 與 AI 系統整合。",
        ],
        aboutStack: ["Next.js 16 App Router", "TypeScript strict mode", "pnpm", "Tailwind CSS v4", "CSS variables only", "lucide-react"],
        aboutMilestoneTitle: "Journey & Context",
        aboutMilestones: [
            {
                year: "Australia / 8 Years",
                title: "長時間海外生活與學習",
                desc: "培養跨文化溝通、獨立處理問題與從不同角度理解工作流程的能力。",
            },
            {
                year: "AIT",
                title: "Mobile App Development",
                desc: "畢業於 AIT Academy of Interactive Technology，建立產品與軟體開發基礎。",
            },
            {
                year: "Repair / 6 Years",
                title: "3C 與汽車維修現場經驗",
                desc: "實際接觸手機、電腦與其他硬體維修流程，理解第一線服務與營運痛點。",
            },
            {
                year: "Now",
                title: "AI + Product Build",
                desc: "回台後持續研究 AI，現階段目標是把這個平台完善，之後開始深入 RAG 與 AI 系統。",
            },
        ],
        progressEyebrow: "Progress / AI Roadmap",
        progressTitle: "目前網站仍持續更新與完善，這版首頁已朝更正式的作品頁與提案頁靠近",
        progressDesc: "現階段是 AI 協作下持續打磨的前端展示與產品敘事版本，接下來會把更多 AI 能力真正接進系統，而不只停留在展示層。",
        progressNowTitle: "現階段重點",
        progressNowItems: [
            "持續把首頁與系統頁整理成更專業、可提案也可履歷展示的作品。",
            "補強多租戶、維修流程、商品 / 二手裝置與 POS 的核心模組連動。",
            "讓首頁敘事、設計語言與實際工作流畫面更一致。",
        ],
        progressNextTitle: "下一階段",
        progressNextItems: [
            "導入 AI assistant 與情境化操作引導。",
            "研究與實作 RAG，整理維修知識、規格與 SOP。",
            "把系統使用情境從手機維修門市逐步擴展到更多零售與服務業場景。",
        ],
        proposalEyebrow: "Proposal Entry",
        proposalTitle: "這個首頁也可以直接作為提案、合作溝通與履歷展示入口",
        proposalDesc: "如果是前公司、潛在合作方、招募方或客戶，可以從下面的入口快速理解我目前的產品方向與作品價值。",
        proposalCards: [
            {
                title: "想先看作品定位",
                desc: "先快速理解這個平台的產品方向、模組範圍與設計邏輯。",
                href: "#platform",
                label: "查看平台定位",
            },
            {
                title: "想看目前系統",
                desc: "從目前可登入的入口進一步看實際畫面與工作流。",
                href: "/login",
                label: "前往登入入口",
            },
            {
                title: "想看我的背景",
                desc: "從澳洲生活、維修經驗到 AI 學習脈絡，了解這個作品的來源。",
                href: "#about",
                label: "查看 About Me",
            },
            {
                title: "想談提案或導入",
                desc: "可作為 PoC、合作提案或未來產品討論的起點。",
                href: "/register/company",
                label: "建立公司帳號",
            },
        ],
        finalTitle: "如果你在找一個帶有現場理解、產品思維與 AI 發展方向的作品，我可以直接用這個平台跟你說明",
        finalDesc: "這個首頁同時是產品介紹、作品集頁與提案入口。接下來我會繼續把系統打磨成熟，並把 AI / RAG 真正接進來。",
        finalCta: "查看目前系統入口",
        finalSecondaryCta: "開始提案 / 導入討論",
    },
    en: {
        brand: "Ticket Core",
        navPlatform: "Platform",
        navModules: "Modules",
        navStack: "Tech Stack",
        navPreview: "Preview",
        navDemo: "Demo",
        navAbout: "About",
        navProgress: "Progress",
        navProposal: "Proposal",
        navLogin: "Log in",
        navDashboard: "Dashboard",
        navSignOut: "Sign out",
        navRegister: "Create Company Account",
        kicker: "Proposal-ready portfolio for a SaaS + AI operating platform",
        title: "Ticket Core is the multi-tenant SaaS + AI platform I am building across ERP, repair workflow, POS, and commerce",
        desc: "This homepage is designed as a proposal deck, portfolio landing, and future product front door in one. The first operating context is a phone repair store, but the architecture is shaped to expand into broader retail and service workflows.",
        ctaPrimary: "View platform thesis",
        ctaSecondary: "Read my background",
        heroBulletA: "Positioned as a multi-tenant ERP + Repair System + POS + Commerce core platform.",
        heroBulletB: "Grounded in real repair-store workflow while staying extensible for wider service and retail use cases.",
        heroBulletC: "The homepage itself is meant to work as a polished portfolio and proposal page.",
        heroMetrics: [
            {
                title: "Platform Scope",
                value: "ERP + Repair + POS + Commerce",
                note: "A product direction rather than a single isolated feature.",
            },
            {
                title: "Architecture",
                value: "Multi-tenant",
                note: "Tenant boundaries and role safety come first.",
            },
            {
                title: "Build Mode",
                value: "AI-assisted",
                note: "AI speeds up design, implementation, and iteration.",
            },
            {
                title: "Origin Context",
                value: "Repair-first",
                note: "Derived from real service-counter and repair operations.",
            },
        ],
        heroFlowTitle: "Operating Thesis",
        heroFlowLabel: "Core lanes",
        heroFlowModules: ["Tenant & Roles", "Repair Tickets", "Inventory / Used Devices", "POS / Receipts", "Commerce Showcase", "AI / RAG Roadmap"],
        platformEyebrow: "Platform Positioning",
        platformTitle: "Not just a landing page, but an early shape of a scalable SaaS + AI operating platform",
        platformDesc:
            "The homepage is intentionally written to match the product direction, so viewers can understand this project as a system backed by real operational context rather than a visual mock alone.",
        platformCards: [
            {
                title: "Multi-tenant ERP core",
                tag: "Tenant-safe foundation",
                desc: "Role boundaries, merchant separation, and data consistency act as the base for every future module.",
            },
            {
                title: "Repair-system starting point",
                tag: "Repair-first workflow",
                desc: "The first full scenario is based on intake, diagnosis, handoff, and after-service flow in repair operations.",
            },
            {
                title: "POS + commerce connection",
                tag: "Front to back office",
                desc: "Counter sales, receipts, products, and storefront context should not be split across disconnected tools.",
            },
            {
                title: "AI-ready extension",
                tag: "Assistant + knowledge layer",
                desc: "The current phase focuses on product narrative and core flow, with AI assistant and RAG planned next.",
            },
        ],
        architectureTitle: "Platform architecture logic",
        architectureDesc: "The goal is to keep customer intake, operations, sales records, and future knowledge layers on one trackable chain.",
        architectureSteps: [
            {
                stage: "01",
                module: "Inquiry / Intake",
                desc: "Public pages, customer inquiry, or in-store intake become trackable service leads.",
            },
            {
                stage: "02",
                module: "Repair / Inventory Sync",
                desc: "Case movement and product state stay aligned across store and back office teams.",
            },
            {
                stage: "03",
                module: "POS / Receipt Loop",
                desc: "Transactions and receipts flow into a consistent operational record.",
            },
            {
                stage: "04",
                module: "AI / RAG Layer",
                desc: "Repair knowledge, product specs, and SOPs are being shaped into a future retrieval layer.",
            },
        ],
        scenarioLabel: "Use cases",
        scenarios: ["Phone repair stores", "Service counters", "Used-device operations", "Small retail chains", "Repair workshops", "Showcase and campaign pages"],
        featureEyebrow: "Core Modules",
        featureTitle: "Built from operational modules instead of a generic feature pile",
        featureDesc: "Each module reflects a concrete business or store-side need, making the homepage useful for portfolio review and proposal conversation.",
        featureCards: [
            {
                title: "Showcase / Proposal Layer",
                description: "The homepage is designed to work as a portfolio page, proposal layer, and future official product site.",
                points: ["Clear product narrative", "Builder background integrated", "External storytelling matches the system"],
            },
            {
                title: "Repair Workflow",
                description: "Intake, status updates, handoff, and closing are structured around real repair operations.",
                points: ["Clear case states", "Replayable handoff context", "Better fit for frontline handling"],
            },
            {
                title: "Inventory / Used Device Flow",
                description: "Products, used devices, and sourcing details are modeled in one practical management flow.",
                points: ["Layered status and specs", "Trackable source context", "Connects with case and sales flow"],
            },
            {
                title: "POS / Receipt Operations",
                description: "Counter transactions and office records stay aligned to reduce reconciliation and communication gaps.",
                points: ["Trackable close stages", "Standardized receipt flow", "Ready for future analytics"],
            },
            {
                title: "AI System Roadmap",
                description: "AI already helps the current build process, and the next stage is to make AI a first-class product capability.",
                points: ["Contextual assistant", "Repair knowledge RAG", "Integrated guidance layer"],
            },
        ],
        techEyebrow: "Tech Foundation",
        techTitle: "The stack is chosen for maintainability, multi-module growth, and future AI integration",
        techDesc: "The project is not only about visuals. The technical choices are meant to support scale, clarity, and room for an actual AI layer later.",
        techSpecs: [
            {
                label: "Framework",
                value: "Next.js 16 App Router",
                desc: "Used to organize the landing layer, dashboards, and future workflow APIs in one structure.",
            },
            {
                label: "Language",
                value: "TypeScript strict mode",
                desc: "Keeps data models and cross-module flow safer as the product grows.",
            },
            {
                label: "Package Manager",
                value: "pnpm",
                desc: "Supports cleaner dependency management for long-term maintenance.",
            },
            {
                label: "Styling",
                value: "Tailwind CSS v4",
                desc: "Speeds up UI iteration while keeping the visual system flexible.",
            },
            {
                label: "Design Tokens",
                value: "CSS variables only",
                desc: "Theme and design language are kept variable-driven for future branding and theming.",
            },
            {
                label: "Icon System",
                value: "lucide-react",
                desc: "Provides lightweight and consistent iconography across the interface.",
            },
        ],
        techPrinciplesTitle: "Build principles",
        techPrinciples: [
            "Keep homepage storytelling and actual workflow UI aligned.",
            "Build tenant and role boundaries first, then expand into repair, product, POS, and commerce modules.",
            "Use AI to accelerate the build now while keeping room for real AI workflows later.",
        ],
        techRoadmapTitle: "AI roadmap",
        techRoadmap: [
            {
                phase: "Now",
                title: "Refining homepage and core workflows",
                desc: "The current focus is UI polish, stronger narrative, and more proposal-ready structure.",
            },
            {
                phase: "Next",
                title: "Adding contextual AI assistant",
                desc: "The next step is to bring AI into guidance, explanation, and operational support.",
            },
            {
                phase: "Later",
                title: "Researching and building RAG",
                desc: "Repair knowledge, specs, and SOPs will be shaped into a retrievable system layer.",
            },
        ],
        previewEyebrow: "System Preview",
        previewTitle: "The landing visual language flows into a believable product preview",
        previewDesc: "This preview uses a more modern SaaS presentation style so viewers can quickly understand where the platform is heading.",
        previewLaneA: "Repair Queue",
        previewLaneB: "Inventory & Devices",
        previewLaneC: "POS & Receipts",
        previewTasks: ["Ticket RC-204 / diagnosis pending", "Ticket RC-197 / quote approval waiting", "Used Device / iPhone 13 128G listing", "Receipt POS-2480 / issued"],
        previewSummaryTitle: "Preview Summary",
        previewSummaryBlocks: [
            {
                title: "Operations",
                lines: ["Case movement organized in one view", "Pending work stays prioritized", "More intuitive store-side handling"],
            },
            {
                title: "Commerce",
                lines: ["Inventory and used-device state align", "POS and receipt records stay in sync", "Prepared for future analytics"],
            },
            {
                title: "Showcase",
                lines: ["Homepage can support proposals directly", "Product direction and stack are clear", "Can evolve into an official product site"],
            },
        ],
        demoEyebrow: "Demo / Test Access",
        demoTitle: "Test accounts are available on the homepage so reviewers can try both tenant-side and customer-side flows quickly",
        demoDesc: "This page also acts as a demo entry. To test the system, start from the main login entry below. All demo accounts currently use the same password.",
        demoEntryLabel: "Login entry",
        demoEntryValue: "http://localhost:3000",
        demoPasswordLabel: "Test password",
        demoPasswordValue: "123456",
        demoGroups: [
            {
                title: "Tenant Group A",
                accounts: [
                    { label: "Tenant A admin", email: "admina@gmail.com" },
                    { label: "Tenant A customer", email: "cxa@gmail.com" },
                ],
            },
            {
                title: "Tenant Group B",
                accounts: [
                    { label: "Tenant B admin", email: "adminb@gmail.com" },
                    { label: "Tenant B customer", email: "cxb@gmail.com" },
                ],
            },
        ],
        aboutEyebrow: "About Me",
        aboutTitle: "I am turning life in Australia, repair experience, and AI study into a product-building direction",
        aboutDesc:
            "This project is not only a coding exercise. It is my way of translating a cross-domain background into product thinking and system implementation grounded in real operations.",
        aboutIntroTitle: "Builder Profile",
        aboutIntroDesc:
            "I spent eight years in Australia and studied Mobile App Development at AIT Academy of Interactive Technology. I did not build a formal IT career there, but I gained about six years of practical repair experience across phones, computers, and automotive work. After returning to Taiwan, I started studying AI seriously and turned that momentum into this SaaS + AI platform project.",
        aboutHighlights: [
            "Strong familiarity with repair-store rhythm, service handling, handoff, sales, and customer communication.",
            "Able to translate messy operational reality into data models, permissions, and UI structure.",
            "Currently building with AI-assisted iteration and planning to move deeper into RAG and AI integration.",
        ],
        aboutStack: ["Next.js 16 App Router", "TypeScript strict mode", "pnpm", "Tailwind CSS v4", "CSS variables only", "lucide-react"],
        aboutMilestoneTitle: "Journey & Context",
        aboutMilestones: [
            {
                year: "Australia / 8 Years",
                title: "Long-form overseas living and study",
                desc: "Built independence, adaptability, and stronger cross-context communication.",
            },
            {
                year: "AIT",
                title: "Mobile App Development",
                desc: "Graduated from AIT Academy of Interactive Technology and built a software foundation.",
            },
            {
                year: "Repair / 6 Years",
                title: "Hands-on repair experience",
                desc: "Worked around phones, computers, related hardware, and automotive repair context.",
            },
            {
                year: "Now",
                title: "AI + Product Build",
                desc: "Now focused on refining this platform and moving toward RAG and AI system integration.",
            },
        ],
        progressEyebrow: "Progress / AI Roadmap",
        progressTitle: "The site is still being refined, and this homepage is now much closer to a proposal-ready portfolio page",
        progressDesc: "The current stage is an AI-assisted frontend and storytelling layer. The next step is to make AI a real product capability instead of only a development accelerator.",
        progressNowTitle: "Current focus",
        progressNowItems: [
            "Refine the homepage and system views into a stronger proposal and portfolio presentation.",
            "Strengthen the connection between multi-tenant core, repair flow, inventory, and POS.",
            "Align narrative, visual language, and actual workflow UI more tightly.",
        ],
        progressNextTitle: "Next stage",
        progressNextItems: [
            "Add contextual AI assistant and guided flows.",
            "Research and implement RAG around repair knowledge, specs, and SOPs.",
            "Expand the product direction beyond phone repair into more retail and service scenarios.",
        ],
        proposalEyebrow: "Proposal Entry",
        proposalTitle: "This homepage can already act as a portfolio, proposal entry, and collaboration touchpoint",
        proposalDesc: "Former teams, recruiters, clients, or collaborators can use these entry points to understand the current product direction and project value quickly.",
        proposalCards: [
            {
                title: "Need the product thesis",
                desc: "Start with the platform direction, scope, and architecture logic.",
                href: "#platform",
                label: "View platform thesis",
            },
            {
                title: "Need the live system",
                desc: "Open the current system entry and review the actual workflow UI.",
                href: "/login",
                label: "Open login",
            },
            {
                title: "Need my background",
                desc: "Review the experience behind the product direction and execution.",
                href: "#about",
                label: "Read About",
            },
            {
                title: "Need rollout discussion",
                desc: "Use this as a starting point for proposal or collaboration conversation.",
                href: "/register/company",
                label: "Create company account",
            },
        ],
        finalTitle: "If you want to review a project shaped by real operations, product thinking, and AI direction, I can walk you through this platform directly",
        finalDesc: "This page works as a product story, portfolio page, and proposal entry. The next phase is to keep maturing the system and bring AI / RAG into the product itself.",
        finalCta: "Open current system",
        finalSecondaryCta: "Start proposal discussion",
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
        "--biz-grid-line": "rgba(37,87,77,0.08)",
        "--biz-glass": "rgba(255,255,255,0.74)",
        "--biz-glass-border": "rgba(188,200,193,0.72)",
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
        "--biz-grid-line": "rgba(47,94,123,0.08)",
        "--biz-glass": "rgba(255,255,255,0.75)",
        "--biz-glass-border": "rgba(182,196,207,0.7)",
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
        "--biz-grid-line": "rgba(118,73,38,0.08)",
        "--biz-glass": "rgba(255,255,255,0.72)",
        "--biz-glass-border": "rgba(207,184,160,0.72)",
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
        "--biz-grid-line": "rgba(63,83,109,0.08)",
        "--biz-glass": "rgba(255,255,255,0.75)",
        "--biz-glass-border": "rgba(188,198,210,0.7)",
    },
};

function toCssVars(vars: Record<string, string>): CSSProperties {
    const style: Record<string, string> = {};
    for (const [key, value] of Object.entries(vars)) {
        style[key] = value;
    }
    return style as CSSProperties;
}

function resolveEditableCopy(
    lang: "zh" | "en",
    ui: LandingCopy,
    homepageContent?: BusinessHomepageContentState,
): EditableLandingCopy {
    const candidate = homepageContent?.locale[lang];
    const legacy = legacyEditableCopyByLang[lang];

    const pickValue = <K extends keyof BusinessHomepageEditableContent>(key: K, fallback: EditableLandingCopy[K]) => {
        const value = candidate?.[key];
        if (!value || value === legacy[key]) return fallback;
        return value;
    };

    return {
        kicker: pickValue("kicker", ui.kicker),
        title: pickValue("title", ui.title),
        desc: pickValue("desc", ui.desc),
        ctaPrimary: pickValue("ctaPrimary", ui.ctaPrimary),
        ctaSecondary: pickValue("ctaSecondary", ui.ctaSecondary),
        finalTitle: pickValue("finalTitle", ui.finalTitle),
        finalDesc: pickValue("finalDesc", ui.finalDesc),
        finalCta: pickValue("finalCta", ui.finalCta),
    };
}

export function BusinessLandingPage({
    lang,
    isAuthenticated = false,
    dashboardHref = "/dashboard",
    homepageContent,
}: BusinessLandingPageProps) {
    const ui = copyByLang[lang];
    const editable = resolveEditableCopy(lang, ui, homepageContent);
    const themePreset = homepageContent?.theme?.preset ?? "forest";
    const pageStyle = toCssVars(themeByPreset[themePreset] ?? themeByPreset.forest);
    const entryHref = isAuthenticated ? dashboardHref : "/login";
    const entryLabel = isAuthenticated ? ui.navDashboard : ui.navLogin;
    const heroEntryLabel = isAuthenticated ? ui.navDashboard : ui.navLogin;
    const heroModules = [...ui.heroFlowModules, ...ui.heroFlowModules];

    return (
        <div style={pageStyle} className="relative min-h-dvh overflow-x-hidden bg-[var(--biz-page-bg)] text-[var(--biz-text)]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="biz-grid absolute inset-0 opacity-70" />
                <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-[var(--biz-bloom-a)] blur-3xl" />
                <div className="absolute right-[-8rem] top-[18%] h-[30rem] w-[30rem] rounded-full bg-[var(--biz-bloom-b)] blur-3xl" />
                <div className="absolute bottom-10 left-[20%] h-72 w-72 rounded-full bg-[var(--biz-bloom-c)] blur-3xl" />
            </div>

            <header className="sticky top-0 z-30 border-b border-[var(--biz-border)] bg-[var(--biz-page-bg)]/90 backdrop-blur-xl">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
                    <Link href="/" className="text-sm font-semibold tracking-[0.18em] text-[var(--biz-accent-ink)] uppercase md:text-base">
                        {ui.brand}
                    </Link>

                    <nav className="hidden items-center gap-1 text-xs text-[var(--biz-body)] lg:flex">
                        <a href="#platform" className="rounded-full px-3 py-1.5 transition hover:bg-[var(--biz-surface-soft)]">
                            {ui.navPlatform}
                        </a>
                        <a href="#modules" className="rounded-full px-3 py-1.5 transition hover:bg-[var(--biz-surface-soft)]">
                            {ui.navModules}
                        </a>
                        <a href="#tech" className="rounded-full px-3 py-1.5 transition hover:bg-[var(--biz-surface-soft)]">
                            {ui.navStack}
                        </a>
                        <a href="#preview" className="rounded-full px-3 py-1.5 transition hover:bg-[var(--biz-surface-soft)]">
                            {ui.navPreview}
                        </a>
                        <a href="#demo" className="rounded-full px-3 py-1.5 transition hover:bg-[var(--biz-surface-soft)]">
                            {ui.navDemo}
                        </a>
                        <a href="#about" className="rounded-full px-3 py-1.5 transition hover:bg-[var(--biz-surface-soft)]">
                            {ui.navAbout}
                        </a>
                        <a href="#progress" className="rounded-full px-3 py-1.5 transition hover:bg-[var(--biz-surface-soft)]">
                            {ui.navProgress}
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
                <section className="mx-auto grid w-full max-w-7xl items-start gap-8 px-4 pb-10 pt-12 md:px-6 md:pb-14 md:pt-20 xl:grid-cols-[1.06fr_0.94fr]">
                    <div className="biz-fade-up space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] px-4 py-1.5 text-xs font-semibold tracking-[0.12em] text-[var(--biz-accent-ink)] uppercase backdrop-blur-xl">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>{editable.kicker}</span>
                        </div>

                        <div className="space-y-5">
                            <h1 className="max-w-4xl [font-family:var(--font-display)] text-4xl leading-[1.02] text-[var(--biz-heading)] md:text-6xl xl:text-[4.5rem]">
                                {editable.title}
                            </h1>
                            <p className="max-w-3xl text-base leading-relaxed text-[var(--biz-body)] md:text-lg">{editable.desc}</p>
                        </div>

                        <div className="grid gap-3 md:max-w-3xl md:grid-cols-3">
                            <div className="rounded-2xl border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-4 text-sm leading-relaxed text-[var(--biz-body)] backdrop-blur-xl">
                                {ui.heroBulletA}
                            </div>
                            <div className="rounded-2xl border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-4 text-sm leading-relaxed text-[var(--biz-body)] backdrop-blur-xl">
                                {ui.heroBulletB}
                            </div>
                            <div className="rounded-2xl border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-4 text-sm leading-relaxed text-[var(--biz-body)] backdrop-blur-xl">
                                {ui.heroBulletC}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <a
                                href="#platform"
                                className="inline-flex items-center gap-2 rounded-full bg-[var(--biz-accent)] px-6 py-3 text-sm font-semibold text-[var(--biz-accent-contrast)] transition hover:translate-y-[-1px]"
                            >
                                {editable.ctaPrimary}
                                <ArrowRight className="h-4 w-4" />
                            </a>
                            <a
                                href="#about"
                                className="rounded-full border border-[var(--biz-border-strong)] px-6 py-3 text-sm font-semibold text-[var(--biz-accent-ink)] transition hover:translate-y-[-1px] hover:bg-[var(--biz-surface-soft)]"
                            >
                                {editable.ctaSecondary}
                            </a>
                            <Link
                                href={entryHref}
                                className="rounded-full border border-[var(--biz-border)] px-6 py-3 text-sm font-semibold text-[var(--biz-body)] transition hover:bg-[var(--biz-surface-soft)]"
                            >
                                {heroEntryLabel}
                            </Link>
                        </div>

                    </div>

                    <aside className="biz-fade-up biz-delay-1 relative overflow-hidden rounded-[2rem] border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-5 shadow-[0_32px_90px_-56px_var(--biz-shadow)] backdrop-blur-xl md:p-6">
                        <div className="absolute inset-0">
                            <div className="absolute left-[-2rem] top-10 h-32 w-32 rounded-full bg-[var(--biz-bloom-a)] blur-3xl" />
                            <div className="biz-rotate-slow absolute right-6 top-8 h-28 w-28 rounded-full border border-[var(--biz-border-strong)]/80" />
                            <div className="biz-float absolute right-12 top-12 h-16 w-16 rounded-full border border-[var(--biz-border)]/80" />
                        </div>

                        <div className="relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.12em] text-[var(--biz-muted)] uppercase">{ui.heroFlowTitle}</p>
                                    <p className="mt-1 text-sm text-[var(--biz-body)]">{ui.heroFlowLabel}</p>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--biz-border)] bg-[var(--biz-surface)] px-3 py-1 text-xs text-[var(--biz-body)]">
                                    <span className="biz-pulse h-2 w-2 rounded-full bg-[var(--biz-accent)]" />
                                    <span>Live build</span>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                {ui.heroMetrics.map((metric) => (
                                    <MetricPanel key={metric.title} title={metric.title} value={metric.value} note={metric.note} className="bg-[var(--biz-surface)]/90" />
                                ))}
                            </div>

                            <div className="mt-5 rounded-3xl border border-[var(--biz-border)] bg-[var(--biz-surface)]/90 p-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {ui.heroFlowModules.map((module, index) => {
                                        const Icon = featureIcons[index % featureIcons.length];
                                        return (
                                            <div key={module} className="flex items-center gap-3 rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] px-3 py-3">
                                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--biz-chip-bg)] text-[var(--biz-accent-ink)]">
                                                    <Icon className="h-4.5 w-4.5" />
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-[var(--biz-heading)]">{module}</p>
                                                    <p className="text-xs text-[var(--biz-muted)]">Operational layer {String(index + 1).padStart(2, "0")}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </aside>

                    <div className="xl:col-span-2 grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
                        <article className="rounded-[1.8rem] border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-5 backdrop-blur-xl">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.12em] text-[var(--biz-muted)] uppercase">System momentum</p>
                                    <p className="mt-1 text-sm text-[var(--biz-body)]">把首頁敘事、工作流與 AI roadmap 串成同一條產品線索。</p>
                                </div>
                                <span className="rounded-full border border-[var(--biz-border)] bg-[var(--biz-surface)] px-3 py-1 text-xs text-[var(--biz-body)]">
                                    Proposal + Product
                                </span>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                {ui.architectureSteps.slice(0, 3).map((step, index) => (
                                    <div
                                        key={step.stage}
                                        className={`rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface)] px-4 py-3 ${index === 1 ? "biz-fade-up biz-delay-1" : index === 2 ? "biz-fade-up biz-delay-2" : "biz-fade-up"}`}
                                    >
                                        <p className="text-xs font-semibold tracking-[0.1em] text-[var(--biz-muted)] uppercase">
                                            {step.stage} / {step.module}
                                        </p>
                                        <p className="mt-1 text-sm text-[var(--biz-body)]">{step.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </article>

                        <div className="overflow-hidden rounded-full border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] backdrop-blur-xl self-center">
                            <div className="biz-marquee flex w-max items-center gap-3 px-4 py-3">
                                {heroModules.map((module, index) => (
                                    <span
                                        key={`${module}-${index}`}
                                        className="rounded-full border border-[var(--biz-border)] bg-[var(--biz-surface)] px-3 py-1 text-xs font-medium text-[var(--biz-body)]"
                                    >
                                        {module}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <SectionShell id="platform" eyebrow={ui.platformEyebrow} title={ui.platformTitle} description={ui.platformDesc}>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {ui.platformCards.map((card, index) => {
                            const Icon = platformIcons[index % platformIcons.length];
                            return (
                                <article
                                    key={card.title}
                                    className={`biz-fade-up rounded-[1.75rem] border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-5 shadow-[0_24px_70px_-52px_var(--biz-shadow)] backdrop-blur-xl ${index === 1 ? "biz-delay-1" : index === 2 ? "biz-delay-2" : index === 3 ? "biz-delay-3" : ""}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--biz-chip-bg)] text-[var(--biz-accent-ink)]">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <span className="rounded-full border border-[var(--biz-border)] bg-[var(--biz-surface)] px-3 py-1 text-[11px] font-medium text-[var(--biz-body)]">
                                            {card.tag}
                                        </span>
                                    </div>
                                    <h3 className="mt-5 text-xl font-semibold text-[var(--biz-heading)]">{card.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-[var(--biz-body)]">{card.desc}</p>
                                </article>
                            );
                        })}
                    </div>

                    <div className="mt-8 grid gap-6 rounded-[2rem] border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-6 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
                        <div>
                            <h3 className="text-2xl font-semibold text-[var(--biz-heading)]">{ui.architectureTitle}</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--biz-body)]">{ui.architectureDesc}</p>
                            <div className="mt-5 grid gap-3">
                                {ui.architectureSteps.map((step, index) => (
                                    <div key={step.stage} className="rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface)] px-4 py-4">
                                        <p className="text-xs font-semibold tracking-[0.1em] text-[var(--biz-muted)] uppercase">
                                            {step.stage} / {step.module}
                                        </p>
                                        <p className="mt-1 text-sm leading-relaxed text-[var(--biz-body)]">{step.desc}</p>
                                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--biz-surface-soft)]">
                                            <div
                                                className="biz-shimmer h-full rounded-full bg-[var(--biz-accent)]"
                                                style={{ width: `${56 + index * 10}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[1.75rem] border border-[var(--biz-border)] bg-[var(--biz-surface)] p-5">
                            <p className="text-xs font-semibold tracking-[0.12em] text-[var(--biz-muted)] uppercase">{ui.scenarioLabel}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {ui.scenarios.map((scenario) => (
                                    <span
                                        key={scenario}
                                        className="rounded-full border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--biz-body)]"
                                    >
                                        {scenario}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-6 rounded-3xl border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] p-4">
                                <p className="text-sm font-semibold text-[var(--biz-heading)]">Why this direction works</p>
                                <ul className="mt-3 space-y-3 text-sm text-[var(--biz-body)]">
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-[var(--biz-accent)]" />
                                        <span>首頁展示與實際營運模組使用同一套敘事，對提案和作品集都更有說服力。</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-[var(--biz-accent)]" />
                                        <span>從 repair-first 出發，能更清楚處理高摩擦流程與資料狀態切換。</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-[var(--biz-accent)]" />
                                        <span>未來加上 AI / RAG 後，這套平台會更像一個可持續成長的營運系統，而不是單點功能。</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </SectionShell>

                <SectionShell id="modules" eyebrow={ui.featureEyebrow} title={ui.featureTitle} description={ui.featureDesc} className="pt-4 md:pt-8">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {ui.featureCards.map((feature, index) => {
                            const Icon = featureIcons[index % featureIcons.length];
                            return (
                                <article
                                    key={feature.title}
                                    className={`biz-fade-up rounded-[1.9rem] border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-6 shadow-[0_24px_74px_-54px_var(--biz-shadow)] backdrop-blur-xl ${index === 0 ? "xl:col-span-2" : ""} ${index === 1 ? "biz-delay-1" : index === 2 ? "biz-delay-2" : index === 3 ? "biz-delay-3" : index === 4 ? "biz-delay-4" : ""}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--biz-chip-bg)] text-[var(--biz-accent-ink)]">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <span className="rounded-full border border-[var(--biz-border)] bg-[var(--biz-surface)] px-3 py-1 text-xs font-medium text-[var(--biz-body)]">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                    </div>
                                    <h3 className="mt-5 text-2xl font-semibold text-[var(--biz-heading)]">{feature.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-[var(--biz-body)]">{feature.description}</p>
                                    <ul className="mt-5 space-y-2 text-sm text-[var(--biz-body)]">
                                        {feature.points.map((point) => (
                                            <li key={point} className="flex items-start gap-3 rounded-xl border border-[var(--biz-border)] bg-[var(--biz-surface)] px-3 py-2.5">
                                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--biz-accent)]" />
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            );
                        })}
                    </div>
                </SectionShell>

                <SectionShell id="tech" eyebrow={ui.techEyebrow} title={ui.techTitle} description={ui.techDesc}>
                    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {ui.techSpecs.map((spec, index) => {
                                const Icon = techIcons[index % techIcons.length];
                                return (
                                    <article
                                        key={spec.label}
                                        className={`biz-fade-up rounded-[1.75rem] border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-5 backdrop-blur-xl ${index === 1 ? "biz-delay-1" : index === 2 ? "biz-delay-2" : index === 3 ? "biz-delay-3" : index === 4 ? "biz-delay-4" : ""}`}
                                    >
                                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--biz-chip-bg)] text-[var(--biz-accent-ink)]">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-[var(--biz-muted)] uppercase">{spec.label}</p>
                                        <h3 className="mt-2 text-lg font-semibold text-[var(--biz-heading)]">{spec.value}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-[var(--biz-body)]">{spec.desc}</p>
                                    </article>
                                );
                            })}
                        </div>

                        <div className="grid gap-4">
                            <article className="rounded-[1.9rem] border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-6 backdrop-blur-xl">
                                <h3 className="text-2xl font-semibold text-[var(--biz-heading)]">{ui.techPrinciplesTitle}</h3>
                                <ul className="mt-5 space-y-3 text-sm text-[var(--biz-body)]">
                                    {ui.techPrinciples.map((principle) => (
                                        <li key={principle} className="flex items-start gap-3 rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface)] px-4 py-3">
                                            <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[var(--biz-accent)]" />
                                            <span>{principle}</span>
                                        </li>
                                    ))}
                                </ul>
                            </article>

                            <article className="rounded-[1.9rem] border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-6 backdrop-blur-xl">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-semibold text-[var(--biz-heading)]">{ui.techRoadmapTitle}</h3>
                                    <BrainCircuit className="h-5 w-5 text-[var(--biz-accent)]" />
                                </div>
                                <div className="mt-5 space-y-3">
                                    {ui.techRoadmap.map((item, index) => (
                                        <div key={item.phase} className="rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface)] px-4 py-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-xs font-semibold tracking-[0.12em] text-[var(--biz-muted)] uppercase">{item.phase}</p>
                                                <span className="text-xs text-[var(--biz-muted)]">Phase {String(index + 1).padStart(2, "0")}</span>
                                            </div>
                                            <p className="mt-1 text-lg font-semibold text-[var(--biz-heading)]">{item.title}</p>
                                            <p className="mt-2 text-sm leading-relaxed text-[var(--biz-body)]">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        </div>
                    </div>
                </SectionShell>

                <SectionShell id="preview" eyebrow={ui.previewEyebrow} title={ui.previewTitle} description={ui.previewDesc}>
                    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                        <article className="relative overflow-hidden rounded-[2rem] border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-5 shadow-[0_28px_72px_-54px_var(--biz-shadow)] backdrop-blur-xl md:p-6">
                            <div className="absolute inset-0">
                                <div className="absolute right-4 top-4 h-24 w-24 rounded-full bg-[var(--biz-bloom-a)] blur-3xl" />
                                <div className="absolute left-10 top-16 h-20 w-20 rounded-full bg-[var(--biz-bloom-c)] blur-3xl" />
                            </div>

                            <div className="relative">
                                <div className="flex items-center justify-between border-b border-[var(--biz-border)] pb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--biz-accent)]" />
                                        <p className="text-xs font-semibold tracking-[0.12em] text-[var(--biz-muted)] uppercase">Workspace Mock</p>
                                    </div>
                                    <span className="rounded-full border border-[var(--biz-border)] bg-[var(--biz-surface)] px-3 py-1 text-xs text-[var(--biz-body)]">
                                        Ticket Core Console
                                    </span>
                                </div>

                                <div className="mt-5 grid gap-3 md:grid-cols-3">
                                    {[ui.previewLaneA, ui.previewLaneB, ui.previewLaneC].map((lane, index) => (
                                        <div
                                            key={lane}
                                            className={`rounded-[1.4rem] border border-[var(--biz-border)] bg-[var(--biz-surface)] p-4 ${index === 1 ? "biz-float" : index === 2 ? "biz-float biz-delay-1" : ""}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold text-[var(--biz-muted)]">{lane}</p>
                                                <span className="rounded-full bg-[var(--biz-surface-soft)] px-2 py-1 text-[11px] text-[var(--biz-body)]">
                                                    {index === 0 ? "12" : index === 1 ? "28" : "8"}
                                                </span>
                                            </div>
                                            <div className="mt-4 space-y-3">
                                                <div className="biz-shimmer h-2.5 rounded-full bg-[var(--biz-chip-bg)]" style={{ width: "82%" }} />
                                                <div className="biz-shimmer h-2.5 rounded-full bg-[var(--biz-chip-bg)]" style={{ width: "66%" }} />
                                                <div className="biz-shimmer h-2.5 rounded-full bg-[var(--biz-chip-bg)]" style={{ width: "73%" }} />
                                                <div className="biz-shimmer h-16 rounded-[1rem] bg-[var(--biz-surface-soft)]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 rounded-[1.5rem] border border-[var(--biz-border)] bg-[var(--biz-surface)] p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-[var(--biz-heading)]">Live activity</p>
                                        <span className="inline-flex items-center gap-2 text-xs text-[var(--biz-muted)]">
                                            <span className="biz-pulse h-2 w-2 rounded-full bg-[var(--biz-accent)]" />
                                            Synced
                                        </span>
                                    </div>
                                    <ul className="mt-4 grid gap-2 text-sm text-[var(--biz-body)] md:grid-cols-2">
                                        {ui.previewTasks.map((task) => (
                                            <li key={task} className="rounded-xl border border-[var(--biz-border)] bg-[var(--biz-surface-soft)] px-3 py-2.5">
                                                {task}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </article>

                        <aside className="grid gap-4">
                            <article className="rounded-[1.9rem] border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-6 backdrop-blur-xl">
                                <h3 className="text-2xl font-semibold text-[var(--biz-heading)]">{ui.previewSummaryTitle}</h3>
                                <div className="mt-5 space-y-3">
                                    {ui.previewSummaryBlocks.map((block, index) => (
                                        <article key={block.title} className={`rounded-[1.4rem] border border-[var(--biz-border)] bg-[var(--biz-surface)] p-4 ${index === 1 ? "biz-delay-1" : index === 2 ? "biz-delay-2" : ""}`}>
                                            <p className="text-sm font-semibold text-[var(--biz-heading)]">{block.title}</p>
                                            <ul className="mt-3 space-y-2 text-sm text-[var(--biz-body)]">
                                                {block.lines.map((line) => (
                                                    <li key={line} className="flex items-start gap-3">
                                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--biz-accent)]" />
                                                        <span>{line}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </article>
                                    ))}
                                </div>
                            </article>

                            <article className="rounded-[1.9rem] border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-6 backdrop-blur-xl">
                                <p className="text-xs font-semibold tracking-[0.12em] text-[var(--biz-muted)] uppercase">Current visual direction</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {["Glass panels", "Grid glow", "Motion chips", "Dashboard mock", "Portfolio storytelling"].map((item) => (
                                        <span
                                            key={item}
                                            className="rounded-full border border-[var(--biz-border)] bg-[var(--biz-surface)] px-3 py-1.5 text-xs font-medium text-[var(--biz-body)]"
                                        >
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </article>
                        </aside>
                    </div>
                </SectionShell>

                <SectionShell id="demo" eyebrow={ui.demoEyebrow} title={ui.demoTitle} description={ui.demoDesc}>
                    <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
                        <article className="rounded-[1.9rem] border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-6 backdrop-blur-xl">
                            <div className="grid gap-4">
                                <div className="rounded-[1.4rem] border border-[var(--biz-border)] bg-[var(--biz-surface)] p-4">
                                    <p className="text-xs font-semibold tracking-[0.12em] text-[var(--biz-muted)] uppercase">{ui.demoEntryLabel}</p>
                                    <p className="mt-2 break-all text-base font-semibold text-[var(--biz-heading)]">{ui.demoEntryValue}</p>
                                </div>
                                <div className="rounded-[1.4rem] border border-[var(--biz-border)] bg-[var(--biz-surface)] p-4">
                                    <p className="text-xs font-semibold tracking-[0.12em] text-[var(--biz-muted)] uppercase">{ui.demoPasswordLabel}</p>
                                    <p className="mt-2 text-3xl font-semibold tracking-[0.08em] text-[var(--biz-heading)]">{ui.demoPasswordValue}</p>
                                </div>
                                <Link
                                    href="/login"
                                    className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--biz-accent)] px-5 py-3 text-sm font-semibold text-[var(--biz-accent-contrast)] transition hover:translate-y-[-1px]"
                                >
                                    {ui.navLogin}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </article>

                        <div className="grid gap-4 md:grid-cols-2">
                            {ui.demoGroups.map((group, index) => (
                                <article
                                    key={group.title}
                                    className={`rounded-[1.9rem] border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-6 backdrop-blur-xl ${index === 1 ? "biz-fade-up biz-delay-1" : "biz-fade-up"}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-semibold text-[var(--biz-heading)]">{group.title}</h3>
                                        <span className="rounded-full border border-[var(--biz-border)] bg-[var(--biz-surface)] px-3 py-1 text-xs text-[var(--biz-body)]">
                                            {group.accounts.length} accounts
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {group.accounts.map((account) => (
                                            <div key={account.email} className="rounded-[1.25rem] border border-[var(--biz-border)] bg-[var(--biz-surface)] p-4">
                                                <p className="text-xs font-semibold tracking-[0.12em] text-[var(--biz-muted)] uppercase">{account.label}</p>
                                                <p className="mt-2 break-all text-base font-semibold text-[var(--biz-heading)]">{account.email}</p>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </SectionShell>

                <SectionShell id="about" eyebrow={ui.aboutEyebrow} title={ui.aboutTitle} description={ui.aboutDesc}>
                    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                        <PortfolioIntroBlock
                            title={ui.aboutIntroTitle}
                            description={ui.aboutIntroDesc}
                            highlights={ui.aboutHighlights}
                            stack={ui.aboutStack}
                        />

                        <article className="rounded-[2rem] border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-6 backdrop-blur-xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-semibold text-[var(--biz-heading)]">{ui.aboutMilestoneTitle}</h3>
                                <GraduationCap className="h-5 w-5 text-[var(--biz-accent)]" />
                            </div>
                            <div className="mt-5 space-y-3">
                                {ui.aboutMilestones.map((item, index) => (
                                    <div key={item.year} className="rounded-[1.35rem] border border-[var(--biz-border)] bg-[var(--biz-surface)] p-4">
                                        <p className="text-xs font-semibold tracking-[0.1em] text-[var(--biz-muted)] uppercase">{item.year}</p>
                                        <p className="mt-1 text-lg font-semibold text-[var(--biz-heading)]">{item.title}</p>
                                        <p className="mt-1 text-sm leading-relaxed text-[var(--biz-body)]">{item.desc}</p>
                                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--biz-surface-soft)]">
                                            <div className="biz-shimmer h-full rounded-full bg-[var(--biz-accent)]" style={{ width: `${58 + index * 8}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </article>
                    </div>
                </SectionShell>

                <SectionShell id="progress" eyebrow={ui.progressEyebrow} title={ui.progressTitle} description={ui.progressDesc}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <article className="rounded-[1.9rem] border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-6 backdrop-blur-xl">
                            <h3 className="text-xl font-semibold text-[var(--biz-heading)]">{ui.progressNowTitle}</h3>
                            <ul className="mt-4 space-y-3 text-sm text-[var(--biz-body)]">
                                {ui.progressNowItems.map((item) => (
                                    <li key={item} className="rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface)] px-4 py-3">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </article>

                        <article className="rounded-[1.9rem] border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-6 backdrop-blur-xl">
                            <h3 className="text-xl font-semibold text-[var(--biz-heading)]">{ui.progressNextTitle}</h3>
                            <ul className="mt-4 space-y-3 text-sm text-[var(--biz-body)]">
                                {ui.progressNextItems.map((item) => (
                                    <li key={item} className="rounded-2xl border border-[var(--biz-border)] bg-[var(--biz-surface)] px-4 py-3">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    </div>
                </SectionShell>

                <SectionShell id="proposal" eyebrow={ui.proposalEyebrow} title={ui.proposalTitle} description={ui.proposalDesc}>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {ui.proposalCards.map((item, index) => {
                            const Icon = proposalIcons[index % proposalIcons.length];
                            const Tag = item.href.startsWith("/") ? Link : "a";
                            const sharedProps = {
                                href: item.href,
                                className:
                                    "mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--biz-border-strong)] px-4 py-2 text-sm font-semibold text-[var(--biz-accent-ink)] transition hover:bg-[var(--biz-surface-soft)]",
                            };

                            return (
                                <article key={item.title} className="rounded-[1.8rem] border border-[var(--biz-glass-border)] bg-[var(--biz-glass)] p-5 backdrop-blur-xl">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--biz-chip-bg)] text-[var(--biz-accent-ink)]">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <h3 className="mt-4 text-xl font-semibold text-[var(--biz-heading)]">{item.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-[var(--biz-body)]">{item.desc}</p>
                                    <Tag {...sharedProps}>
                                        {item.label}
                                        <ArrowRight className="h-4 w-4" />
                                    </Tag>
                                </article>
                            );
                        })}
                    </div>
                </SectionShell>

                <CtaStrip
                    title={editable.finalTitle}
                    description={editable.finalDesc}
                    primaryHref="/login"
                    primaryLabel={editable.finalCta}
                    secondaryHref="/register/company"
                    secondaryLabel={ui.finalSecondaryCta}
                />
            </main>
        </div>
    );
}
