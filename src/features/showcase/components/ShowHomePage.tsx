import Link from "next/link";
import type { CSSProperties } from "react";
import { ShowcaseLanguageSwitcher } from "@/features/showcase/components/ShowcaseLanguageSwitcher";
import { MOCK_HOME_SERVICE_IMAGE_URLS } from "@/mock/homeServiceImages";
import type {
    ShowContentBlock,
    ShowContentBlockId,
    ShowContentBodyScale,
    ShowContentFontFamily,
    ShowContentState,
    ShowContentTitleScale,
    ShowServiceCard,
    ShowServiceImagePosition,
    ShowServiceImageStyle,
} from "@/features/showcase/types/showContent";
import type { ShowThemeColors } from "@/features/showcase/types/showTheme";

type ShowHomePageProps = {
    navAccountType: "guest" | "company" | "customer";
    lang: "zh" | "en";
    showThemeColors: ShowThemeColors;
    showContentState: ShowContentState;
    homeHref?: string;
    authTenantId?: string | null;
};

const uiByLang = {
    zh: {
        navAbout: "關於我們",
        navServices: "服務項目",
        navContact: "聯絡方式",
        navLogin: "登入",
        navSignUp: "註冊",
        navDashboard: "儀表板",
        navMyAccount: "我的帳戶",
        ctaCompany: "前往儀表板",
        ctaCustomer: "我的帳戶",
        ctaGuest: "預約 / 登入",
        ctaServices: "查看服務",
        quickContact: "快速聯絡",
        helpTitle: "需要協助？",
        helpDesc: "立即聯絡我們，取得當日報價與可預約時段。",
        copyright: "版權所有",
    },
    en: {
        navAbout: "About",
        navServices: "Services",
        navContact: "Contact",
        navLogin: "Log In",
        navSignUp: "Sign Up",
        navDashboard: "Dashboard",
        navMyAccount: "My Account",
        ctaCompany: "Open Dashboard",
        ctaCustomer: "My Account",
        ctaGuest: "Book / Log In",
        ctaServices: "View Services",
        quickContact: "Quick Contact",
        helpTitle: "Need Help?",
        helpDesc: "Call now for same-day quote and available booking slots.",
        copyright: "Copyright",
    },
} as const;

function getFontClass(fontFamily: ShowContentFontFamily): string {
    if (fontFamily === "serif") return "[font-family:'Noto_Serif_TC','Times_New_Roman',serif]";
    if (fontFamily === "mono") return "font-mono";
    return "";
}

function getTitleScaleClass(scale: ShowContentTitleScale): string {
    if (scale === "xl") return "text-4xl md:text-5xl";
    if (scale === "lg") return "text-3xl md:text-4xl";
    return "text-2xl md:text-3xl";
}

function getBodyScaleClass(scale: ShowContentBodyScale): string {
    if (scale === "lg") return "text-lg";
    if (scale === "md") return "text-base";
    return "text-sm";
}

function renderPoints(points: string[], textClass: string) {
    if (points.length === 0) return null;
    return (
        <ul className={`grid gap-2 ${textClass}`}>
            {points.map((point, index) => (
                <li key={`${point}-${index}`} className="rounded-lg border border-[#1d1b16]/20 bg-white/40 px-3 py-2">
                    {point}
                </li>
            ))}
        </ul>
    );
}

function isHorizontalImagePosition(position: ShowServiceImagePosition) {
    return position === "left" || position === "right";
}

function getServiceCardLayoutClass(position: ShowServiceImagePosition) {
    if (position === "left") return "flex-row";
    if (position === "right") return "flex-row-reverse";
    if (position === "bottom") return "flex-col-reverse";
    return "flex-col";
}

function getServiceImageClass(style: ShowServiceImageStyle, position: ShowServiceImagePosition) {
    const horizontal = isHorizontalImagePosition(position);
    if (style === "circle") {
        return horizontal
            ? "h-20 w-20 shrink-0 rounded-full object-cover sm:h-24 sm:w-24"
            : "h-24 w-24 self-center rounded-full object-cover sm:h-28 sm:w-28";
    }
    return horizontal
        ? "h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
        : "h-32 w-full rounded-xl object-cover";
}

function getServicePlaceholderClass(style: ShowServiceImageStyle, position: ShowServiceImagePosition) {
    const horizontal = isHorizontalImagePosition(position);
    if (style === "circle") {
        return horizontal
            ? "grid h-20 w-20 shrink-0 place-items-center rounded-full border border-dashed border-[#1d1b16]/30 text-[10px] text-[#7b745e] sm:h-24 sm:w-24"
            : "grid h-24 w-24 place-items-center self-center rounded-full border border-dashed border-[#1d1b16]/30 text-[10px] text-[#7b745e] sm:h-28 sm:w-28";
    }
    return horizontal
        ? "grid h-20 w-20 shrink-0 place-items-center rounded-xl border border-dashed border-[#1d1b16]/30 text-[10px] text-[#7b745e] sm:h-24 sm:w-24"
        : "grid h-32 w-full place-items-center rounded-xl border border-dashed border-[#1d1b16]/30 text-[10px] text-[#7b745e]";
}

function renderServicePlaceholder(style: ShowServiceImageStyle, position: ShowServiceImagePosition) {
    return (
        <div className={getServicePlaceholderClass(style, position)}>
            <div className="grid gap-1 text-center">
                <span>No Image</span>
                <span>need upgrade project ,demo only</span>
            </div>
        </div>
    );
}

export function ShowHomePage({
    navAccountType,
    lang,
    showThemeColors,
    showContentState,
    homeHref = "/",
    authTenantId = null,
}: ShowHomePageProps) {
    const ui = uiByLang[lang];
    const currentYear = new Date().getFullYear();
    const localeContent = showContentState.locale[lang];

    const showcaseVars: CSSProperties = {
        ["--showcase-page-bg" as string]: showThemeColors.page,
        ["--showcase-header-bg" as string]: showThemeColors.header,
        ["--showcase-hero-bg" as string]: showThemeColors.hero,
        ["--showcase-about-bg" as string]: showThemeColors.about,
        ["--showcase-services-bg" as string]: showThemeColors.services,
        ["--showcase-contact-bg" as string]: showThemeColors.contact,
        ["--showcase-ad-bg" as string]: showThemeColors.ad,
        ["--showcase-footer-bg" as string]: showThemeColors.footer,
    };

    const normalizeTenantId = (value: string | null | undefined) => {
        if (!value) return null;
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (/[/?#]/.test(trimmed)) return null;
        return trimmed;
    };
    const safeAuthTenantId = normalizeTenantId(authTenantId);
    const withTenant = (path: string) => {
        if (!safeAuthTenantId) return path;
        const query = new URLSearchParams({ tenant: safeAuthTenantId });
        return `${path}${path.includes("?") ? "&" : "?"}${query.toString()}`;
    };
    const loginHref = withTenant("/login");
    const signUpHref = withTenant("/register/customer");

    const cta =
        navAccountType === "company"
            ? { href: "/dashboard", label: ui.ctaCompany }
            : navAccountType === "customer"
              ? { href: "/ticket/history", label: ui.ctaCustomer }
              : { href: loginHref, label: ui.ctaGuest };

    const servicesAnchor = localeContent.services.enabled ? "#services" : localeContent.contact.enabled ? "#contact" : "#hero";
    const orderedVisibleBlocks = showContentState.order.filter((blockId) => localeContent[blockId].enabled);
    const navLinks = [
        { id: "about", label: ui.navAbout, enabled: localeContent.about.enabled },
        { id: "services", label: ui.navServices, enabled: localeContent.services.enabled },
        { id: "contact", label: ui.navContact, enabled: localeContent.contact.enabled },
    ].filter((item) => item.enabled);

    function renderBlock(blockId: ShowContentBlockId, block: ShowContentBlock) {
        const fontClass = getFontClass(block.fontFamily);
        const titleClass = getTitleScaleClass(block.titleScale);
        const bodyClass = getBodyScaleClass(block.bodyScale);

        if (blockId === "hero") {
            return (
                <section key={blockId} id="hero" className="bg-[rgb(var(--showcase-hero-bg))]">
                    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:px-6 md:py-16">
                        <div className={`space-y-6 ${fontClass}`}>
                            {block.kicker ? (
                                <p className="inline-flex rounded-full border border-[#ffcb2d] px-3 py-1 text-xs font-semibold tracking-[0.12em] text-[#ffcb2d]">
                                    {block.kicker}
                                </p>
                            ) : null}
                            <h1 className={`${titleClass} font-black leading-tight text-[#ffcb2d] md:text-6xl`}>{block.title}</h1>
                            <p className={`${bodyClass} max-w-xl leading-relaxed text-[#f5f1df]`}>{block.body}</p>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    className="rounded-full bg-[#ffcb2d] px-6 py-2 text-sm font-bold tracking-[0.08em] text-[#191815]"
                                    href={cta.href}
                                >
                                    {cta.label}
                                </Link>
                                <a
                                    className="rounded-full border border-[#ffcb2d] px-6 py-2 text-sm font-bold tracking-[0.08em] text-[#ffcb2d]"
                                    href={servicesAnchor}
                                >
                                    {ui.ctaServices}
                                </a>
                            </div>
                        </div>

                        <div className="rounded-2xl border-2 border-[#ffcb2d] bg-[#24221c] p-6 md:p-8">
                            <h2 className="text-xl font-bold tracking-[0.08em] text-[#ffcb2d]">{ui.quickContact}</h2>
                            <div className={`mt-6 grid gap-3 text-[#f5f1df] ${fontClass} ${bodyClass}`}>
                                {block.points.length > 0 ? (
                                    block.points.map((point, index) => <p key={`${point}-${index}`}>{point}</p>)
                                ) : (
                                    <p>{block.body}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            );
        }

        if (blockId === "about") {
            return (
                <section key={blockId} id="about" className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
                    <div className="grid gap-6 rounded-3xl border-2 border-[#1d1b16] bg-[rgb(var(--showcase-about-bg))] p-6 md:grid-cols-2 md:p-10">
                        <div className={fontClass}>
                            {block.kicker ? <p className="text-xs font-bold tracking-[0.12em] text-[#7b745e]">{block.kicker}</p> : null}
                            <h2 className={`mt-3 font-black leading-tight text-[#191815] ${titleClass}`}>{block.title}</h2>
                        </div>
                        <div className={`grid gap-3 ${fontClass}`}>
                            <p className={`leading-relaxed text-[#3b382f] ${bodyClass}`}>{block.body}</p>
                            {renderPoints(block.points, `${bodyClass} text-[#3b382f]`)}
                        </div>
                    </div>
                </section>
            );
        }

        if (blockId === "services") {
            const fallbackItems = block.points.length > 0 ? block.points : [block.body];
            const serviceRows = block.serviceRows === 1 || block.serviceRows === 2 || block.serviceRows === 3 ? block.serviceRows : 2;
            const visibleCardCount = serviceRows * 3;
            const serviceCards: ShowServiceCard[] =
                block.serviceCards.length > 0
                    ? block.serviceCards
                    : fallbackItems.slice(0, 9).map((title) => ({
                          title,
                          body: "",
                          imageUrl: "",
                          imageStyle: "square",
                          imagePosition: "top",
                          showImage: true,
                          showTitle: true,
                          showBody: true,
                      }));
            const visibleServiceCards = serviceCards.slice(0, visibleCardCount);

            return (
                <section key={blockId} id="services" className="bg-[rgb(var(--showcase-services-bg))] py-12 md:py-16">
                    <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
                        <div className={fontClass}>
                            {block.kicker ? <p className="text-xs font-bold tracking-[0.12em] text-[#7b745e]">{block.kicker}</p> : null}
                            <h2 className={`mt-3 font-black text-[#191815] ${titleClass}`}>{block.title}</h2>
                            <p className={`mt-3 text-[#3b382f] ${bodyClass}`}>{block.body}</p>
                        </div>
                        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {visibleServiceCards.map((card, index) => {
                                const resolvedTitle = card.title || fallbackItems[index] || block.body;
                                const showImage = card.showImage;
                                const showTitle = card.showTitle && resolvedTitle.trim().length > 0;
                                const showBody = card.showBody && card.body.trim().length > 0;
                                const layoutClass = showImage ? getServiceCardLayoutClass(card.imagePosition) : "flex-col";
                                const resolvedImageUrl = card.imageUrl.trim() || MOCK_HOME_SERVICE_IMAGE_URLS[index] || "";

                                return (
                                    <article
                                        key={`${card.title || "service"}-${index}`}
                                        className={`flex gap-3 rounded-2xl border-2 border-[#1d1b16] bg-white p-5 ${layoutClass}`}
                                    >
                                        {showImage ? (
                                            resolvedImageUrl ? (
                                                <img
                                                    src={resolvedImageUrl}
                                                    alt={resolvedTitle || `service-${index + 1}`}
                                                    className={getServiceImageClass(card.imageStyle, card.imagePosition)}
                                                />
                                            ) : renderServicePlaceholder(card.imageStyle, card.imagePosition)
                                        ) : null}
                                        <div className="grid content-center gap-2">
                                            {showTitle ? <h3 className={`font-bold text-[#191815] ${fontClass} ${bodyClass}`}>{resolvedTitle}</h3> : null}
                                            {showBody ? <p className={`text-[#3b382f] ${fontClass} text-sm`}>{card.body}</p> : null}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>
            );
        }

        if (blockId === "contact") {
            return (
                <section
                    key={blockId}
                    id="contact"
                    className="mx-auto w-full max-w-6xl bg-[rgb(var(--showcase-contact-bg))] px-4 py-12 md:px-6 md:py-16"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <article className="rounded-2xl border-2 border-[#1d1b16] bg-white p-6">
                            <div className={fontClass}>
                                {block.kicker ? <p className="text-xs font-bold tracking-[0.12em] text-[#7b745e]">{block.kicker}</p> : null}
                                <h3 className={`mt-2 font-bold text-[#191815] ${titleClass}`}>{block.title}</h3>
                                <p className={`mt-3 text-[#3b382f] ${bodyClass}`}>{block.body}</p>
                            </div>
                        </article>
                        <article className="rounded-2xl border-2 border-[#1d1b16] bg-[#ffcb2d] p-6">
                            <h3 className="text-lg font-bold text-[#191815]">{ui.helpTitle}</h3>
                            <p className="mt-3 text-sm text-[#191815]">{ui.helpDesc}</p>
                            <div className={`mt-4 grid gap-2 ${fontClass} ${bodyClass} text-[#191815]`}>
                                {block.points.length > 0 ? block.points.map((point, index) => <p key={`${point}-${index}`}>{point}</p>) : null}
                            </div>
                        </article>
                    </div>
                </section>
            );
        }

        return (
            <section key={blockId} id="ad" className="bg-[rgb(var(--showcase-ad-bg))] py-12 md:py-16">
                <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
                    <div className={`rounded-2xl border-2 border-dashed border-[#ffcb2d] p-8 text-center ${fontClass}`}>
                        {block.kicker ? <p className="text-xs font-bold tracking-[0.14em] text-[#f5f1df]">{block.kicker}</p> : null}
                        <p className={`mt-3 font-black text-[#ffcb2d] ${titleClass}`}>{block.title}</p>
                        <p className={`mt-2 text-[#f5f1df] ${bodyClass}`}>{block.body}</p>
                        {block.points.length > 0 ? (
                            <div className={`mx-auto mt-4 grid max-w-2xl gap-2 text-left text-[#f5f1df] ${bodyClass}`}>
                                {block.points.map((point, index) => (
                                    <p key={`${point}-${index}`}>- {point}</p>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <div
            className="min-h-dvh bg-[rgb(var(--showcase-page-bg))] text-[#191815] [font-family:'Montserrat','Noto_Sans_TC',sans-serif]"
            style={showcaseVars}
        >
            <header className="sticky top-0 z-20 border-b border-[#1d1b16] bg-[rgb(var(--showcase-header-bg))]">
                <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
                    <Link href={homeHref} className="text-lg font-black uppercase tracking-[0.16em] text-[#191815]">
                        LOGO
                    </Link>

                    <nav className="flex flex-wrap items-center justify-end gap-2 text-xs font-semibold tracking-[0.08em] md:text-sm">
                        {navLinks.map((item) => (
                            <a key={item.id} className="rounded-full px-3 py-1.5 hover:bg-[#191815] hover:text-[#ffcb2d]" href={`#${item.id}`}>
                                {item.label}
                            </a>
                        ))}
                        {navAccountType === "guest" ? (
                            <>
                                <Link
                                    className="rounded-full border border-[#191815] px-4 py-1.5 hover:bg-[#191815] hover:text-[#ffcb2d]"
                                    href={loginHref}
                                >
                                    {ui.navLogin}
                                </Link>
                                <Link
                                    className="rounded-full bg-[#191815] px-4 py-1.5 text-[#ffcb2d] hover:bg-black"
                                    href={signUpHref}
                                >
                                    {ui.navSignUp}
                                </Link>
                            </>
                        ) : null}
                        {navAccountType === "company" ? (
                            <Link className="rounded-full bg-[#191815] px-4 py-1.5 text-[#ffcb2d] hover:bg-black" href="/dashboard">
                                {ui.navDashboard}
                            </Link>
                        ) : null}
                        {navAccountType === "customer" ? (
                            <Link className="rounded-full bg-[#191815] px-4 py-1.5 text-[#ffcb2d] hover:bg-black" href="/ticket/history">
                                {ui.navMyAccount}
                            </Link>
                        ) : null}
                        <ShowcaseLanguageSwitcher currentLang={lang} />
                    </nav>
                </div>
            </header>

            <main>{orderedVisibleBlocks.map((blockId) => renderBlock(blockId, localeContent[blockId]))}</main>

            <footer className="border-t-2 border-[#1d1b16] bg-[rgb(var(--showcase-footer-bg))]">
                <div className="mx-auto w-full max-w-6xl px-4 py-6 text-center text-sm font-semibold tracking-[0.08em] text-[#191815] md:px-6">
                    {ui.copyright} {currentYear} by BO-HAN CHEN
                </div>
            </footer>
        </div>
    );
}
