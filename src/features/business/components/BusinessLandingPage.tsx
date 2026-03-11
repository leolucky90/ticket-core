import Link from "next/link";

type BusinessLandingPageProps = {
    lang: "zh" | "en";
};

const copyByLang = {
    zh: {
        brand: "Ticket Core Commerce",
        navProduct: "產品",
        navFlow: "流程",
        navPlan: "方案",
        navLogin: "登入",
        navCompanyHome: "公司首頁",
        ctaPrimary: "免費註冊公司帳號",
        ctaSecondary: "先看登入入口",
        kicker: "為中小型團隊打造的商務營運系統",
        title: "像 Shopify 一樣，快速啟動你的公司營運入口",
        desc: "三分鐘完成公司帳號建立，立刻管理客戶案件、銷售流程與展示頁內容。後台、客戶歷程、內容管理一次串接。",
        metricDeploy: "上線時間",
        metricDeployValue: "3 分鐘",
        metricConversion: "平均導流轉換",
        metricConversionValue: "+27%",
        metricOps: "跨部門同步",
        metricOpsValue: "即時",
        logoTitle: "正在採用這套流程的團隊類型",
        productTitle: "從流量到成交，完整接住",
        productDesc: "以品牌展示、案件管理、銷售記錄三條主線設計，讓公司帳號從第一天就能跑起來。",
        featureA: "品牌展示首頁可視化",
        featureADesc: "用可編輯區塊打造公司專屬首頁，行銷活動與服務內容即時更新。",
        featureB: "公司案件與工單流程",
        featureBDesc: "將客服、需求、追蹤記錄集中管理，避免資訊散落在聊天工具。",
        featureC: "銷售節奏透明化",
        featureCDesc: "每一筆商機的狀態、預估金額與下一步行動，在同一個面板看完。",
        flowTitle: "公司註冊後，直接進入可營運狀態",
        flowStep1: "建立公司帳號",
        flowStep1Desc: "用 Email 或 Google 完成註冊，系統自動建立公司身分與資料空間。",
        flowStep2: "設定品牌與內容",
        flowStep2Desc: "填入品牌主張、服務內容與聯絡方式，首頁即可對外展示。",
        flowStep3: "啟動銷售流程",
        flowStep3Desc: "導入客戶案件，追蹤處理進度與成交節點，團隊同步不漏接。",
        planTitle: "先從免費方案開始",
        planDesc: "你可以先註冊公司帳號，等團隊準備好再升級進階流程。",
        planFree: "Starter",
        planFreePrice: "NT$ 0",
        planFreeDesc: "適合剛起步的公司驗證流程",
        planScale: "Growth",
        planScalePrice: "NT$ 1,490 / 月",
        planScaleDesc: "適合穩定成交、需要多人協作的團隊",
        finalTitle: "準備好建立公司帳號了嗎？",
        finalDesc: "從商業首頁出發，完成註冊後直接進入公司專用首頁與後台。",
        finalCta: "前往公司註冊",
    },
    en: {
        brand: "Ticket Core Commerce",
        navProduct: "Product",
        navFlow: "Flow",
        navPlan: "Plan",
        navLogin: "Log In",
        navCompanyHome: "Company Home",
        ctaPrimary: "Create Company Account",
        ctaSecondary: "View Login",
        kicker: "A commerce-ready operating layer for growing teams",
        title: "Launch your company workspace with a Shopify-inspired landing flow",
        desc: "Create a company account in minutes, then manage customer tickets, sales pipeline, and showcase content from one system.",
        metricDeploy: "Time to launch",
        metricDeployValue: "3 min",
        metricConversion: "Avg lead conversion",
        metricConversionValue: "+27%",
        metricOps: "Team sync",
        metricOpsValue: "Realtime",
        logoTitle: "Teams that run this setup",
        productTitle: "Capture traffic and convert in one loop",
        productDesc: "Built around showcase content, ticket operations, and sales records so company accounts can operate from day one.",
        featureA: "Visual company homepage builder",
        featureADesc: "Update campaign blocks and service content without waiting for deployment cycles.",
        featureB: "Ticket and service workflow",
        featureBDesc: "Keep support history, requests, and statuses in one operational thread.",
        featureC: "Sales visibility",
        featureCDesc: "Track value, stage, and next action for every opportunity in a single panel.",
        flowTitle: "After sign-up, move directly into operations",
        flowStep1: "Create company account",
        flowStep1Desc: "Register with Email or Google, and a company workspace is provisioned automatically.",
        flowStep2: "Configure brand and content",
        flowStep2Desc: "Set value props, services, and contact details to publish your landing sections.",
        flowStep3: "Start the sales cycle",
        flowStep3Desc: "Bring in leads, track handling status, and keep the team aligned on close actions.",
        planTitle: "Start free, scale when ready",
        planDesc: "Create your company account first and upgrade when your team workflow expands.",
        planFree: "Starter",
        planFreePrice: "NT$ 0",
        planFreeDesc: "For early validation and setup",
        planScale: "Growth",
        planScalePrice: "NT$ 1,490 / mo",
        planScaleDesc: "For teams with steady deals and collaboration needs",
        finalTitle: "Ready to onboard your company account?",
        finalDesc: "Start from this business landing and jump into your dedicated company homepage after sign-up.",
        finalCta: "Go to Company Sign-up",
    },
} as const;

export function BusinessLandingPage({ lang }: BusinessLandingPageProps) {
    const ui = copyByLang[lang];

    return (
        <div className="relative min-h-dvh overflow-x-hidden bg-[#f2f8ef] text-[#102316] [font-family:'Sora','Noto_Sans_TC',sans-serif]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-28 top-10 h-80 w-80 rounded-full bg-[#46b17a]/20 blur-3xl" />
                <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-[#0f7a52]/15 blur-3xl" />
                <div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-[#d5f2de] blur-3xl" />
            </div>

            <header className="sticky top-0 z-20 border-b border-[#0f5138]/15 bg-[#f2f8ef]/90 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
                    <Link href="/" className="text-sm font-black uppercase tracking-[0.18em] text-[#0b6e4a] md:text-base">
                        {ui.brand}
                    </Link>
                    <nav className="flex items-center gap-2 text-xs font-semibold md:text-sm">
                        <a className="rounded-full px-3 py-1.5 text-[#204b37] hover:bg-[#d8ecdf]" href="#product">
                            {ui.navProduct}
                        </a>
                        <a className="rounded-full px-3 py-1.5 text-[#204b37] hover:bg-[#d8ecdf]" href="#flow">
                            {ui.navFlow}
                        </a>
                        <a className="rounded-full px-3 py-1.5 text-[#204b37] hover:bg-[#d8ecdf]" href="#plan">
                            {ui.navPlan}
                        </a>
                        <Link
                            className="rounded-full border border-[#0f7a52] px-3 py-1.5 text-[#0f7a52] hover:bg-[#d8ecdf]"
                            href="/login"
                        >
                            {ui.navLogin}
                        </Link>
                        <Link className="rounded-full bg-[#0f7a52] px-3 py-1.5 text-white hover:bg-[#0b6e4a]" href="/company-home">
                            {ui.navCompanyHome}
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="relative z-10">
                <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-12 pt-12 md:grid-cols-[1.15fr_0.85fr] md:px-6 md:pt-20">
                    <div className="biz-fade-up space-y-6">
                        <p className="inline-flex rounded-full border border-[#0f7a52]/30 bg-[#def2e5] px-4 py-1 text-xs font-bold tracking-[0.1em] text-[#0f7a52]">
                            {ui.kicker}
                        </p>
                        <h1 className="text-4xl font-black leading-[1.05] text-[#0f402f] md:text-6xl">{ui.title}</h1>
                        <p className="max-w-2xl text-base leading-relaxed text-[#30523f] md:text-lg">{ui.desc}</p>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/register/company"
                                className="rounded-full bg-[#0f7a52] px-6 py-3 text-sm font-bold tracking-[0.04em] text-white transition hover:-translate-y-0.5 hover:bg-[#0b6e4a]"
                            >
                                {ui.ctaPrimary}
                            </Link>
                            <Link
                                href="/login"
                                className="rounded-full border border-[#0f7a52] px-6 py-3 text-sm font-bold tracking-[0.04em] text-[#0f7a52] transition hover:-translate-y-0.5 hover:bg-[#d8ecdf]"
                            >
                                {ui.ctaSecondary}
                            </Link>
                        </div>
                    </div>

                    <aside className="biz-fade-up biz-delay-1 rounded-3xl border border-[#0f5138]/20 bg-white/85 p-6 shadow-[0_24px_80px_-36px_rgba(16,61,40,0.55)]">
                        <div className="grid gap-4">
                            <div className="rounded-2xl border border-[#d6ebde] bg-[#f6fbf4] p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#59806a]">{ui.metricDeploy}</p>
                                <p className="mt-1 text-3xl font-black text-[#0f7a52]">{ui.metricDeployValue}</p>
                            </div>
                            <div className="rounded-2xl border border-[#d6ebde] bg-[#f6fbf4] p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#59806a]">{ui.metricConversion}</p>
                                <p className="mt-1 text-3xl font-black text-[#0f7a52]">{ui.metricConversionValue}</p>
                            </div>
                            <div className="rounded-2xl border border-[#d6ebde] bg-[#f6fbf4] p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#59806a]">{ui.metricOps}</p>
                                <p className="mt-1 text-3xl font-black text-[#0f7a52]">{ui.metricOpsValue}</p>
                            </div>
                        </div>
                    </aside>
                </section>

                <section className="mx-auto w-full max-w-6xl px-4 py-4 md:px-6">
                    <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-[#4f7c65]">{ui.logoTitle}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs font-extrabold tracking-[0.12em] text-[#2d5a44] md:grid-cols-5">
                        {["Agencies", "Clinics", "Studios", "Consulting", "Service Ops"].map((item, index) => (
                            <div
                                key={item}
                                className={`biz-fade-up rounded-xl border border-[#d6ebde] bg-white/80 px-3 py-2 ${index > 0 ? `biz-delay-${Math.min(index, 4)}` : ""}`}
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                </section>

                <section id="product" className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6">
                    <div className="biz-fade-up space-y-3">
                        <h2 className="text-3xl font-black text-[#0f402f] md:text-4xl">{ui.productTitle}</h2>
                        <p className="max-w-3xl text-[#325944]">{ui.productDesc}</p>
                    </div>
                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                        <article className="biz-fade-up rounded-2xl border border-[#d4e8da] bg-white p-6 shadow-[0_18px_40px_-34px_rgba(15,64,47,0.7)]">
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f836e]">01</p>
                            <h3 className="mt-2 text-xl font-black text-[#0f402f]">{ui.featureA}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#365b47]">{ui.featureADesc}</p>
                        </article>
                        <article className="biz-fade-up biz-delay-1 rounded-2xl border border-[#d4e8da] bg-white p-6 shadow-[0_18px_40px_-34px_rgba(15,64,47,0.7)]">
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f836e]">02</p>
                            <h3 className="mt-2 text-xl font-black text-[#0f402f]">{ui.featureB}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#365b47]">{ui.featureBDesc}</p>
                        </article>
                        <article className="biz-fade-up biz-delay-2 rounded-2xl border border-[#d4e8da] bg-white p-6 shadow-[0_18px_40px_-34px_rgba(15,64,47,0.7)]">
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f836e]">03</p>
                            <h3 className="mt-2 text-xl font-black text-[#0f402f]">{ui.featureC}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#365b47]">{ui.featureCDesc}</p>
                        </article>
                    </div>
                </section>

                <section id="flow" className="bg-[#e5f4ea] py-12">
                    <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
                        <h2 className="biz-fade-up text-3xl font-black text-[#0f402f] md:text-4xl">{ui.flowTitle}</h2>
                        <div className="mt-8 grid gap-4 md:grid-cols-3">
                            <article className="biz-fade-up rounded-2xl border border-[#c7e3d2] bg-white/90 p-5">
                                <p className="text-sm font-extrabold text-[#0f7a52]">Step 1</p>
                                <h3 className="mt-2 text-lg font-black text-[#133f30]">{ui.flowStep1}</h3>
                                <p className="mt-2 text-sm text-[#365b47]">{ui.flowStep1Desc}</p>
                            </article>
                            <article className="biz-fade-up biz-delay-1 rounded-2xl border border-[#c7e3d2] bg-white/90 p-5">
                                <p className="text-sm font-extrabold text-[#0f7a52]">Step 2</p>
                                <h3 className="mt-2 text-lg font-black text-[#133f30]">{ui.flowStep2}</h3>
                                <p className="mt-2 text-sm text-[#365b47]">{ui.flowStep2Desc}</p>
                            </article>
                            <article className="biz-fade-up biz-delay-2 rounded-2xl border border-[#c7e3d2] bg-white/90 p-5">
                                <p className="text-sm font-extrabold text-[#0f7a52]">Step 3</p>
                                <h3 className="mt-2 text-lg font-black text-[#133f30]">{ui.flowStep3}</h3>
                                <p className="mt-2 text-sm text-[#365b47]">{ui.flowStep3Desc}</p>
                            </article>
                        </div>
                    </div>
                </section>

                <section id="plan" className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6">
                    <div className="biz-fade-up text-center">
                        <h2 className="text-3xl font-black text-[#0f402f] md:text-4xl">{ui.planTitle}</h2>
                        <p className="mx-auto mt-3 max-w-2xl text-[#325944]">{ui.planDesc}</p>
                    </div>
                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                        <article className="biz-fade-up rounded-3xl border border-[#d4e8da] bg-white p-6">
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f836e]">{ui.planFree}</p>
                            <p className="mt-2 text-4xl font-black text-[#0f7a52]">{ui.planFreePrice}</p>
                            <p className="mt-2 text-sm text-[#365b47]">{ui.planFreeDesc}</p>
                        </article>
                        <article className="biz-fade-up biz-delay-1 rounded-3xl border border-[#0f7a52]/30 bg-gradient-to-br from-[#0f7a52] to-[#0c5f3f] p-6 text-white">
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#b9f0cf]">{ui.planScale}</p>
                            <p className="mt-2 text-4xl font-black">{ui.planScalePrice}</p>
                            <p className="mt-2 text-sm text-[#d8f9e4]">{ui.planScaleDesc}</p>
                        </article>
                    </div>
                </section>

                <section className="mx-auto w-full max-w-6xl px-4 pb-14 md:px-6">
                    <div className="biz-fade-up rounded-3xl border border-[#0f7a52]/20 bg-[#103f2f] p-8 text-center text-white">
                        <h2 className="text-3xl font-black md:text-4xl">{ui.finalTitle}</h2>
                        <p className="mx-auto mt-3 max-w-2xl text-[#d7f3e0]">{ui.finalDesc}</p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <Link
                                href="/register/company"
                                className="rounded-full bg-[#80e4af] px-6 py-3 text-sm font-extrabold text-[#103f2f] hover:bg-[#9af0c0]"
                            >
                                {ui.finalCta}
                            </Link>
                            <Link href="/login" className="rounded-full border border-[#9fdcba] px-6 py-3 text-sm font-bold hover:bg-white/10">
                                {ui.navLogin}
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
