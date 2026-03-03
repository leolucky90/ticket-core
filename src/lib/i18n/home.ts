export type Locale = "zh-TW" | "en";

type HomeCopy = {
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    cards: {
        fast: { title: string; desc: string; body: string };
        secure: { title: string; desc: string; body: string };
        ai: { title: string; desc: string; body: string };
    };
};

const ZH_TW: HomeCopy = {
    title: "Ticket Core",
    subtitle: "Next 16 + TS strict + CSS Variables theme，用元件化方式打造企業級 SaaS + AI。",
    primaryCta: "開始使用",
    secondaryCta: "查看文件",
    cards: {
        fast: {
            title: "快速上手",
            desc: "頁面只組裝，UI 抽象化",
            body: "把重複結構抽成 components，讓每頁乾淨、好維護。",
        },
        secure: {
            title: "一致的主題",
            desc: "只用 CSS variables",
            body: "不 hard-code 顏色，light/dark 一致切換。",
        },
        ai: {
            title: "AI Ready",
            desc: "AI 呼叫集中管理",
            body: "把 AI 相關集中在 lib/ai，後續做版本化/人審流程也方便。",
        },
    },
};

const EN: HomeCopy = {
    title: "Ticket Core",
    subtitle:
        "Enterprise-grade SaaS + AI with Next.js App Router, strict TypeScript, and CSS-variable theming.",
    primaryCta: "Get Started",
    secondaryCta: "Read Docs",
    cards: {
        fast: {
            title: "Fast to Build",
            desc: "Compose pages from UI components",
            body: "Keep pages clean by extracting repeated patterns into components.",
        },
        secure: {
            title: "Consistent Theme",
            desc: "CSS variables only",
            body: "No hard-coded colors. Light/dark stays consistent everywhere.",
        },
        ai: {
            title: "AI Ready",
            desc: "Centralized AI layer",
            body: "Keep AI calls in lib/ai so you can add versioning & human review later.",
        },
    },
};

export function getHomeCopy(locale: Locale): HomeCopy {
    return locale === "en" ? EN : ZH_TW;
}