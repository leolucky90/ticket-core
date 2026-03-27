
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { ShowcaseLanguageSwitcher } from "@/features/showcase/components/ShowcaseLanguageSwitcher";
import type { BlockCtaConfig } from "@/features/showcase/types/builder";
import type {
    ShowAdBlockContent,
    ShowContactBlockContent,
    ShowContentBlockStyles,
    ShowContentFontFamily,
    ShowContentTypography,
    ShowHeroBlockContent,
    ShowServiceCard,
    ShowServiceImagePosition,
    ShowServiceImageStyle,
    ShowServicesBlockContent,
    ShowSharedBlockContent,
} from "@/features/showcase/types/showContent";
import type { StorefrontSettings } from "@/features/showcase/types/showTheme";
import { MOCK_HOME_SERVICE_IMAGE_URLS } from "@/mock/homeServiceImages";
import type { CompanyHomeTemplateCopy } from "@/features/showcase/default-template/companyHomeDefaultTemplate";

export type CompanyHomeNavAccountType = "guest" | "company" | "customer";
export type CompanyHomeCta = { href: string; label: string };
export type CompanyHomeLinkSet = { homeHref: string; loginHref: string; signUpHref: string; customerDashboardHref: string; shopHref: string };
export type CompanyHomeNavLink = { id: string; anchor: string; label: string };

type HeaderProps = {
    copy: CompanyHomeTemplateCopy;
    navAccountType: CompanyHomeNavAccountType;
    storefrontSettings: StorefrontSettings;
    navLinks: CompanyHomeNavLink[];
    currentLang: "zh" | "en";
    links: CompanyHomeLinkSet;
};

type BaseSectionProps = {
    styles: ShowContentBlockStyles;
    typography: ShowContentTypography;
    themeTokenOverrides?: Record<string, string>;
};

type HeroProps = BaseSectionProps & {
    content: ShowHeroBlockContent;
    ctas: BlockCtaConfig[];
    defaultPrimaryCta: CompanyHomeCta;
    defaultSecondaryCta: CompanyHomeCta;
};

type AboutProps = BaseSectionProps & { content: ShowSharedBlockContent };
type ServicesProps = BaseSectionProps & { content: ShowServicesBlockContent };
type ContactProps = BaseSectionProps & { content: ShowContactBlockContent; ctas: BlockCtaConfig[] };
type AdProps = BaseSectionProps & { content: ShowAdBlockContent };
type FooterProps = { copy: CompanyHomeTemplateCopy; currentYear: number };

const fontClass = (fontFamily: ShowContentFontFamily) => (fontFamily === "serif" ? "[font-family:'Noto_Serif_TC','Times_New_Roman',serif]" : fontFamily === "mono" ? "font-mono" : "");
const titleClass = (scale: ShowContentTypography["titleScale"]) => (scale === "xl" ? "text-3xl md:text-4xl" : scale === "lg" ? "text-2xl md:text-3xl" : "text-xl md:text-2xl");
const bodyClass = (scale: ShowContentTypography["bodyScale"]) => (scale === "lg" ? "text-base md:text-lg" : scale === "md" ? "text-sm md:text-base" : "text-sm");
const alignClass = (align?: ShowContentBlockStyles["align"]) => (align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left");

function styleVars(styles: ShowContentBlockStyles, typography: ShowContentTypography, themeTokenOverrides?: Record<string, string>): CSSProperties {
    const vars: CSSProperties = {
        backgroundColor: styles.backgroundColor,
        color: styles.textColor,
        padding: styles.padding,
    };
    const cssVars = vars as CSSProperties & Record<string, string>;
    if (typography.titleColor) cssVars["--builder-title-color"] = typography.titleColor;
    if (typography.bodyColor) cssVars["--builder-body-color"] = typography.bodyColor;
    if (typography.kickerColor) cssVars["--builder-kicker-color"] = typography.kickerColor;
    if (styles.borderColor) cssVars["--builder-border-color"] = styles.borderColor;
    if (styles.surfaceColor) cssVars["--builder-surface-color"] = styles.surfaceColor;
    if (styles.accentColor) cssVars["--builder-accent-color"] = styles.accentColor;
    if (styles.summaryBackgroundColor) cssVars["--builder-card-soft"] = styles.summaryBackgroundColor;
    if (styles.cardBackgroundColor) cssVars["--builder-card-bg"] = styles.cardBackgroundColor;
    if (themeTokenOverrides) {
        for (const [token, value] of Object.entries(themeTokenOverrides)) {
            if (!token.trim() || !value.trim()) continue;
            cssVars[token.startsWith("--") ? token : `--${token}`] = value;
        }
    }
    return vars;
}

function actionStyle(variant: BlockCtaConfig["variant"], styles: ShowContentBlockStyles): CSSProperties {
    if (variant === "solid") return { backgroundColor: styles.accentColor, borderColor: styles.accentColor, color: styles.surfaceColor };
    if (variant === "outline") return { backgroundColor: styles.surfaceColor, borderColor: styles.borderColor, color: styles.textColor };
    return { color: styles.accentColor ?? styles.textColor };
}

function renderAction(cta: BlockCtaConfig, className: string, styles: ShowContentBlockStyles, key?: string) {
    const target = cta.openInNewTab ? "_blank" : undefined;
    const rel = cta.openInNewTab ? "noreferrer" : undefined;
    if (cta.href.startsWith("/")) {
        return (
            <Link key={key} href={cta.href} className={className} style={actionStyle(cta.variant, styles)}>
                {cta.label}
            </Link>
        );
    }
    return (
        <a key={key} href={cta.href} className={className} style={actionStyle(cta.variant, styles)} target={target} rel={rel}>
            {cta.label}
        </a>
    );
}

export function CompanyHomeHeader({ copy, navAccountType, storefrontSettings, navLinks, currentLang, links }: HeaderProps) {
    return (
        <header className="sticky top-0 z-20 border-b border-[rgb(var(--showcase-border))] bg-[rgb(var(--showcase-header-bg))]/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
                <Link href={links.homeHref} className="inline-flex items-center gap-2 rounded-full px-2 py-1 hover:bg-[rgb(var(--showcase-accent-soft))]">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[rgb(var(--showcase-accent))] text-xs font-semibold text-[rgb(var(--showcase-accent-contrast))]">HS</span>
                    <span>
                        <span className="block text-sm font-semibold tracking-[0.06em] text-[rgb(var(--showcase-text))]">{copy.logoText}</span>
                        <span className="block text-[10px] uppercase tracking-[0.1em] text-[rgb(var(--showcase-muted))]">{copy.logoSubtext}</span>
                    </span>
                </Link>
                <nav className="flex flex-wrap items-center justify-end gap-2 text-xs text-[rgb(var(--showcase-text))] md:text-sm">
                    {navLinks.map((item) => <a key={item.id} className="rounded-full px-3 py-1.5 font-medium hover:bg-[rgb(var(--showcase-accent-soft))]" href={`#${item.anchor}`}>{item.label}</a>)}
                    {navAccountType === "guest" ? <>
                        {storefrontSettings.shoppingEnabled ? <Link className="rounded-full border border-[rgb(var(--showcase-border))] px-4 py-1.5 font-medium hover:bg-[rgb(var(--showcase-accent-soft))]" href={links.shopHref}>{copy.navShop}</Link> : null}
                        <Link className="rounded-full border border-[rgb(var(--showcase-border))] px-4 py-1.5 font-medium hover:bg-[rgb(var(--showcase-accent-soft))]" href={links.loginHref}>{copy.navLogin}</Link>
                        <Link className="rounded-full bg-[rgb(var(--showcase-accent))] px-4 py-1.5 font-medium text-[rgb(var(--showcase-accent-contrast))] hover:opacity-90" href={links.signUpHref}>{copy.navSignUp}</Link>
                    </> : null}
                    {navAccountType === "company" ? <>
                        {storefrontSettings.shoppingEnabled ? <Link className="rounded-full border border-[rgb(var(--showcase-border))] px-4 py-1.5 font-medium hover:bg-[rgb(var(--showcase-accent-soft))]" href={links.shopHref}>{copy.navShop}</Link> : null}
                        <Link className="rounded-full bg-[rgb(var(--showcase-accent))] px-4 py-1.5 font-medium text-[rgb(var(--showcase-accent-contrast))] hover:opacity-90" href="/dashboard">{copy.navDashboard}</Link>
                        <SignOutButton className="rounded-full border-[rgb(var(--showcase-border))] bg-transparent px-4 py-1.5 text-[rgb(var(--showcase-text))] hover:border-[rgb(var(--showcase-accent))] hover:bg-[rgb(var(--showcase-accent-soft))]" label={copy.navSignOut} />
                    </> : null}
                    {navAccountType === "customer" ? <>
                        {storefrontSettings.shoppingEnabled && storefrontSettings.showCartOnNavForCustomer ? <Link className="rounded-full border border-[rgb(var(--showcase-border))] px-4 py-1.5 font-medium hover:bg-[rgb(var(--showcase-accent-soft))]" href={links.shopHref}>{copy.navCart}</Link> : null}
                        <Link className="rounded-full bg-[rgb(var(--showcase-accent))] px-4 py-1.5 font-medium text-[rgb(var(--showcase-accent-contrast))] hover:opacity-90" href={links.customerDashboardHref}>{copy.navMyAccount}</Link>
                        <SignOutButton className="rounded-full border-[rgb(var(--showcase-border))] bg-transparent px-4 py-1.5 text-[rgb(var(--showcase-text))] hover:border-[rgb(var(--showcase-accent))] hover:bg-[rgb(var(--showcase-accent-soft))]" label={copy.navSignOut} />
                    </> : null}
                    <div className="rounded-full border border-[rgb(var(--showcase-border))] bg-[rgb(var(--showcase-surface))]"><ShowcaseLanguageSwitcher currentLang={currentLang} /></div>
                </nav>
            </div>
        </header>
    );
}
export function CompanyHomeHeroSection({ content, styles, typography, ctas, defaultPrimaryCta, defaultSecondaryCta, themeTokenOverrides }: HeroProps) {
    const primary = ctas.find((item) => item.id === "primary" || item.variant === "solid") ?? { id: "primary", label: defaultPrimaryCta.label, href: defaultPrimaryCta.href, enabled: true, variant: "solid" as const };
    const secondary = ctas.find((item) => item.id === "secondary" || item.variant === "outline") ?? { id: "secondary", label: defaultSecondaryCta.label, href: defaultSecondaryCta.href, enabled: true, variant: "outline" as const };
    const sectionStyle = styleVars(styles, typography, themeTokenOverrides);
    const headingClass = titleClass(typography.titleScale);
    const copyClass = bodyClass(typography.bodyScale);
    return (
        <section id="hero" className="bg-[rgb(var(--showcase-hero-bg))]" style={sectionStyle}>
            <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 md:grid-cols-2 md:px-6 md:py-16">
                <div className={`space-y-5 ${fontClass(typography.fontFamily)} ${alignClass(styles.align)}`}>
                    {content.kicker ? <p className="inline-flex rounded-full border border-[rgb(var(--showcase-border))] bg-[rgb(var(--showcase-surface))] px-3 py-1 text-xs font-semibold tracking-[0.12em] text-[rgb(var(--showcase-muted))]" style={{ color: typography.kickerColor }}>{content.kicker}</p> : null}
                    <h1 className={`${headingClass} font-semibold leading-tight text-[rgb(var(--showcase-text))] md:text-5xl`} style={{ color: typography.titleColor }}>{content.title}</h1>
                    <p className={`${copyClass} max-w-xl leading-relaxed text-[rgb(var(--showcase-muted))]`} style={{ color: typography.bodyColor }}>{content.body}</p>
                    <div className={`flex flex-wrap gap-3 ${styles.align === "center" ? "justify-center" : styles.align === "right" ? "justify-end" : ""}`}>
                        {renderAction({ ...primary, label: primary.label || defaultPrimaryCta.label, href: primary.href || defaultPrimaryCta.href }, "rounded-full bg-[rgb(var(--showcase-accent))] px-6 py-2 text-sm font-semibold text-[rgb(var(--showcase-accent-contrast))] hover:opacity-90", styles)}
                        {renderAction({ ...secondary, label: secondary.label || defaultSecondaryCta.label, href: secondary.href || defaultSecondaryCta.href }, "rounded-full border border-[rgb(var(--showcase-border))] bg-[rgb(var(--showcase-surface))] px-6 py-2 text-sm font-semibold text-[rgb(var(--showcase-text))] hover:bg-[rgb(var(--showcase-accent-soft))]", styles)}
                    </div>
                </div>
                <article className="rounded-2xl border border-[rgb(var(--showcase-border))] bg-[rgb(var(--showcase-surface))] p-6 md:p-8" style={{ backgroundColor: styles.summaryBackgroundColor ?? styles.surfaceColor, borderColor: styles.borderColor, borderRadius: styles.borderRadius }}>
                    <h2 className="text-sm font-semibold tracking-[0.12em] text-[rgb(var(--showcase-muted))]" style={{ color: typography.bodyColor }}>{content.summaryTitle}</h2>
                    <div className={`mt-4 grid gap-2 ${fontClass(typography.fontFamily)}`}>
                        {content.points.map((line, index) => <p key={`${line}-${index}`} className={`rounded-xl border border-[rgb(var(--showcase-border))] bg-[rgb(var(--showcase-accent-soft))] px-3 py-2 ${copyClass}`} style={{ backgroundColor: styles.summaryBackgroundColor, borderColor: styles.borderColor, color: typography.titleColor }}>{line}</p>)}
                    </div>
                </article>
            </div>
        </section>
    );
}

export function CompanyHomeAboutSection({ content, styles, typography, themeTokenOverrides }: AboutProps) {
    const headingClass = titleClass(typography.titleScale);
    const copyClass = bodyClass(typography.bodyScale);
    return (
        <section id="about" className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16" style={styleVars(styles, typography, themeTokenOverrides)}>
            <article className={`grid gap-6 rounded-3xl border border-[rgb(var(--showcase-border))] bg-[rgb(var(--showcase-about-bg))] p-6 md:grid-cols-2 md:p-10 ${alignClass(styles.align)}`} style={{ backgroundColor: styles.backgroundColor, borderColor: styles.borderColor, borderRadius: styles.borderRadius }}>
                <div className={fontClass(typography.fontFamily)}>
                    {content.kicker ? <p className="text-xs font-semibold tracking-[0.12em] text-[rgb(var(--showcase-muted))]" style={{ color: typography.kickerColor }}>{content.kicker}</p> : null}
                    <h2 className={`mt-3 font-semibold leading-tight text-[rgb(var(--showcase-text))] ${headingClass}`} style={{ color: typography.titleColor }}>{content.title}</h2>
                </div>
                <div className={`grid gap-3 ${fontClass(typography.fontFamily)}`}>
                    <p className={`leading-relaxed text-[rgb(var(--showcase-muted))] ${copyClass}`} style={{ color: typography.bodyColor }}>{content.body}</p>
                    {content.points.length > 0 ? <ul className="grid gap-2">{content.points.map((point, index) => <li key={`${point}-${index}`} className={`rounded-xl border border-[rgb(var(--showcase-border))] bg-[rgb(var(--showcase-surface))] px-3 py-2 ${copyClass}`} style={{ backgroundColor: styles.surfaceColor, borderColor: styles.borderColor, color: typography.bodyColor ?? styles.textColor }}>{point}</li>)}</ul> : null}
                </div>
            </article>
        </section>
    );
}

function serviceImageClass(style: ShowServiceImageStyle, position: ShowServiceImagePosition) {
    if (style === "circle") return position === "left" || position === "right" ? "h-20 w-20 shrink-0 rounded-full object-cover sm:h-24 sm:w-24" : "h-24 w-24 self-center rounded-full object-cover sm:h-28 sm:w-28";
    return position === "left" || position === "right" ? "h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24" : "h-32 w-full rounded-xl object-cover";
}

function serviceLayoutClass(position: ShowServiceImagePosition) {
    if (position === "left") return "flex-row";
    if (position === "right") return "flex-row-reverse";
    if (position === "bottom") return "flex-col-reverse";
    return "flex-col";
}

export function CompanyHomeServicesSection({ content, styles, typography, themeTokenOverrides }: ServicesProps) {
    const headingClass = titleClass(typography.titleScale);
    const copyClass = bodyClass(typography.bodyScale);
    const visibleCount = (content.serviceRows || 2) * 3;
    const cards: ShowServiceCard[] = content.serviceCards.length > 0 ? content.serviceCards : content.points.slice(0, 9).map((title, index) => ({ id: `service-card-${index + 1}`, title, body: "", image: { sourceType: "external_url", url: "" }, imageUrl: "", imageStyle: "square", imagePosition: "top", showImage: true, showTitle: true, showBody: true }));
    return (
        <section id="services" className="bg-[rgb(var(--showcase-services-bg))] py-12 md:py-16" style={styleVars(styles, typography, themeTokenOverrides)}>
            <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
                <div className={`${fontClass(typography.fontFamily)} ${alignClass(styles.align)}`}>
                    {content.kicker ? <p className="text-xs font-semibold tracking-[0.12em] text-[rgb(var(--showcase-muted))]" style={{ color: typography.kickerColor }}>{content.kicker}</p> : null}
                    <h2 className={`mt-3 font-semibold text-[rgb(var(--showcase-text))] ${headingClass}`} style={{ color: typography.titleColor }}>{content.title}</h2>
                    <p className={`mt-3 max-w-2xl text-[rgb(var(--showcase-muted))] ${copyClass}`} style={{ color: typography.bodyColor }}>{content.body}</p>
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.slice(0, visibleCount).map((card, index) => {
                        const imageUrl = card.image.url.trim() || card.imageUrl.trim() || MOCK_HOME_SERVICE_IMAGE_URLS[index] || "";
                        return (
                            <article key={`${card.id}-${index}`} className={`flex gap-3 rounded-2xl border border-[rgb(var(--showcase-border))] bg-[rgb(var(--showcase-surface))] p-5 ${serviceLayoutClass(card.imagePosition)}`} style={{ backgroundColor: styles.cardBackgroundColor ?? styles.surfaceColor, borderColor: styles.borderColor, borderRadius: styles.borderRadius }}>
                                {card.showImage ? (imageUrl ? <Image src={imageUrl} alt={card.image.alt || card.title || `service-${index + 1}`} width={card.imagePosition === "left" || card.imagePosition === "right" ? 96 : 640} height={card.imagePosition === "left" || card.imagePosition === "right" ? 96 : 256} unoptimized className={serviceImageClass(card.imageStyle, card.imagePosition)} /> : <div className="grid h-24 place-items-center rounded-xl border border-dashed border-[rgb(var(--showcase-border))] text-[11px] text-[rgb(var(--showcase-muted))]">Image Placeholder</div>) : null}
                                <div className="grid content-center gap-2">
                                    {card.showTitle ? <h3 className={`font-semibold text-[rgb(var(--showcase-text))] ${fontClass(typography.fontFamily)} ${copyClass}`} style={{ color: typography.titleColor }}>{card.title || content.points[index] || content.body}</h3> : null}
                                    {card.showBody && card.body.trim() ? <p className={`text-sm text-[rgb(var(--showcase-muted))] ${fontClass(typography.fontFamily)}`} style={{ color: typography.bodyColor }}>{card.body}</p> : null}
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
export function CompanyHomeContactSection({ content, styles, typography, ctas, themeTokenOverrides }: ContactProps) {
    const headingClass = titleClass(typography.titleScale);
    const copyClass = bodyClass(typography.bodyScale);
    return (
        <section id="contact" className="mx-auto w-full max-w-6xl bg-[rgb(var(--showcase-contact-bg))] px-4 py-12 md:px-6 md:py-16" style={styleVars(styles, typography, themeTokenOverrides)}>
            <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-2xl border border-[rgb(var(--showcase-border))] bg-[rgb(var(--showcase-surface))] p-6" style={{ backgroundColor: styles.surfaceColor, borderColor: styles.borderColor, borderRadius: styles.borderRadius }}>
                    <div className={fontClass(typography.fontFamily)}>
                        {content.kicker ? <p className="text-xs font-semibold tracking-[0.12em] text-[rgb(var(--showcase-muted))]" style={{ color: typography.kickerColor }}>{content.kicker}</p> : null}
                        <h3 className={`mt-2 font-semibold text-[rgb(var(--showcase-text))] ${headingClass}`} style={{ color: typography.titleColor }}>{content.title}</h3>
                        <p className={`mt-3 text-[rgb(var(--showcase-muted))] ${copyClass}`} style={{ color: typography.bodyColor }}>{content.body}</p>
                        {content.points.length > 0 ? <ul className="mt-3 grid gap-2">{content.points.map((point, index) => <li key={`${point}-${index}`} className={`rounded-xl border border-[rgb(var(--showcase-border))] bg-[rgb(var(--showcase-surface))] px-3 py-2 ${copyClass}`} style={{ backgroundColor: styles.surfaceColor, borderColor: styles.borderColor, color: typography.bodyColor ?? styles.textColor }}>{point}</li>)}</ul> : null}
                    </div>
                </article>
                <article className="rounded-2xl border border-[rgb(var(--showcase-border))] bg-[rgb(var(--showcase-accent-soft))] p-6" style={{ backgroundColor: styles.summaryBackgroundColor ?? styles.cardBackgroundColor ?? styles.surfaceColor, borderColor: styles.borderColor, borderRadius: styles.borderRadius }}>
                    <h3 className="text-xl font-semibold text-[rgb(var(--showcase-text))]" style={{ color: typography.titleColor }}>{content.cardTitle}</h3>
                    <p className="mt-3 text-sm text-[rgb(var(--showcase-muted))]" style={{ color: typography.bodyColor }}>{content.cardBody}</p>
                    <div className="mt-5 flex flex-wrap gap-3">{ctas.filter((cta) => cta.enabled).slice(0, 2).map((cta, index) => renderAction(cta, cta.variant === "solid" ? "rounded-full bg-[rgb(var(--showcase-accent))] px-5 py-2 text-sm font-semibold text-[rgb(var(--showcase-accent-contrast))] hover:opacity-90" : "rounded-full border border-[rgb(var(--showcase-border))] bg-[rgb(var(--showcase-surface))] px-5 py-2 text-sm font-semibold text-[rgb(var(--showcase-text))] hover:bg-[rgb(var(--showcase-accent-contrast))]", styles, cta.id || `${cta.href}-${index}`))}</div>
                </article>
            </div>
        </section>
    );
}

export function CompanyHomeAdSection({ content, styles, typography, themeTokenOverrides }: AdProps) {
    const headingClass = titleClass(typography.titleScale);
    const copyClass = bodyClass(typography.bodyScale);
    return (
        <section id="ad" className="bg-[rgb(var(--showcase-ad-bg))] py-10 md:py-12" style={styleVars(styles, typography, themeTokenOverrides)}>
            <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
                <article className={`rounded-2xl border border-dashed border-[rgb(var(--showcase-border))] bg-[rgb(var(--showcase-surface))] p-6 text-center ${fontClass(typography.fontFamily)}`} style={{ backgroundColor: styles.surfaceColor, borderColor: styles.borderColor, borderRadius: styles.borderRadius }}>
                    {content.kicker ? <p className="text-xs font-semibold tracking-[0.12em] text-[rgb(var(--showcase-muted))]" style={{ color: typography.kickerColor }}>{content.kicker}</p> : null}
                    <p className={`mt-2 font-semibold text-[rgb(var(--showcase-text))] ${headingClass}`} style={{ color: typography.titleColor }}>{content.title}</p>
                    <p className={`mt-2 text-[rgb(var(--showcase-muted))] ${copyClass}`} style={{ color: typography.bodyColor }}>{content.body}</p>
                    {content.points.length > 0 ? <div className={`mx-auto mt-4 grid max-w-2xl gap-2 text-left text-[rgb(var(--showcase-text))] ${copyClass}`} style={{ color: typography.titleColor }}>{content.points.map((point, index) => <p key={`${point}-${index}`}>- {point}</p>)}</div> : null}
                </article>
            </div>
        </section>
    );
}

export function CompanyHomeFooter({ copy, currentYear }: FooterProps) {
    return (
        <footer className="border-t border-[rgb(var(--showcase-border))] bg-[rgb(var(--showcase-footer-bg))]">
            <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 md:grid-cols-3 md:px-6">
                <section>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-[rgb(var(--showcase-text))]">{copy.logoText}</h4>
                    <p className="mt-2 text-sm text-[rgb(var(--showcase-muted))]">{copy.footerTagline}</p>
                </section>
                <section>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-[rgb(var(--showcase-text))]">Info</h4>
                    <div className="mt-2 grid gap-1 text-sm text-[rgb(var(--showcase-muted))]">{copy.footerInfo.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>
                </section>
                <section>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-[rgb(var(--showcase-text))]">{copy.footerSocialLabel}</h4>
                    <div className="mt-2 flex flex-wrap gap-2">{copy.footerSocialLinks.map((label) => <a key={label} href="#" className="rounded-full border border-[rgb(var(--showcase-border))] bg-[rgb(var(--showcase-surface))] px-3 py-1 text-xs font-medium text-[rgb(var(--showcase-text))] hover:bg-[rgb(var(--showcase-accent-soft))]">{label}</a>)}</div>
                </section>
            </div>
            <div className="border-t border-[rgb(var(--showcase-border))] px-4 py-4 text-center text-xs text-[rgb(var(--showcase-muted))]">{copy.copyright} {currentYear}</div>
        </footer>
    );
}
