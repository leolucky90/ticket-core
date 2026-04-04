import type { CSSProperties } from "react";
import { AutoCarouselBanner } from "@/components/ui/builder/AutoCarouselBanner";
import { HeroBackgroundMedia } from "@/components/ui/builder/HeroBackgroundMedia";
import {
    COMPANY_HOME_TEMPLATE_COPY,
    COMPANY_HOME_TEMPLATE_STYLE_TOKENS,
} from "@/features/showcase/default-template/companyHomeDefaultTemplate";
import { renderCompanyHomeBlock } from "@/features/showcase/components/companyHomeDefault/blockRenderer";
import {
    CompanyHomeFooter,
    CompanyHomeHeader,
    type CompanyHomeCta,
    type CompanyHomeLinkSet,
    type CompanyHomeNavLink,
} from "@/features/showcase/components/companyHomeDefault/sections";
import { TENANT_BUILDER_HOMEPAGE_CONFIG } from "@/lib/constants/builder-demo";
import { getUiText } from "@/lib/i18n/ui-text";
import { normalizeTenantId } from "@/lib/tenant-scope";
import type { BuilderHomepageConfig } from "@/lib/types/builder";
import type { ShowContentBlock, ShowContentState } from "@/features/showcase/types/showContent";
import type { ShowThemeColors, StorefrontSettings } from "@/features/showcase/types/showTheme";

type ShowHomePageProps = {
    navAccountType: "guest" | "company" | "customer";
    lang: "zh" | "en";
    showThemeColors: ShowThemeColors;
    storefrontSettings: StorefrontSettings;
    showContentState: ShowContentState;
    homeHref?: string;
    authTenantId?: string | null;
    /** Homepage hero + carousel from structured builder config (Firebase/CMS-ready). */
    builderHomepage?: BuilderHomepageConfig;
};

export function ShowHomePage({
    navAccountType,
    lang,
    showThemeColors,
    storefrontSettings,
    showContentState,
    homeHref = "/",
    authTenantId = null,
    builderHomepage = TENANT_BUILDER_HOMEPAGE_CONFIG,
}: ShowHomePageProps) {
    const copy = COMPANY_HOME_TEMPLATE_COPY[lang];
    const builderUi = getUiText(lang).builderModule;
    const currentYear = new Date().getFullYear();
    const localeContent = showContentState.locale[lang];
    const orderedBlocks: ShowContentBlock[] = showContentState.order
        .map((blockId) => localeContent[blockId])
        .filter((block): block is ShowContentBlock => Boolean(block))
        .filter((block) => block.enabled);

    const blocksForCanvas: ShowContentBlock[] =
        builderHomepage.hero.enabled ? orderedBlocks.filter((block) => block.type !== "hero") : orderedBlocks;

    const firstEnabledAnchorByType = (type: ShowContentBlock["type"]) =>
        orderedBlocks.find((block) => block.type === type && block.anchor)?.anchor;

    const showcaseVars: CSSProperties = {
        ["--showcase-page-bg" as string]: showThemeColors.page,
        ["--showcase-header-bg" as string]: showThemeColors.header,
        ["--showcase-hero-bg" as string]: showThemeColors.hero,
        ["--showcase-about-bg" as string]: showThemeColors.about,
        ["--showcase-services-bg" as string]: showThemeColors.services,
        ["--showcase-contact-bg" as string]: showThemeColors.contact,
        ["--showcase-ad-bg" as string]: showThemeColors.ad,
        ["--showcase-footer-bg" as string]: showThemeColors.footer,
        ["--showcase-shop-page-bg" as string]: showThemeColors.shopPage,
        ["--showcase-shop-header-bg" as string]: showThemeColors.shopHeader,
        ["--showcase-shop-hero-bg" as string]: showThemeColors.shopHero,
        ["--showcase-shop-grid-bg" as string]: showThemeColors.shopGrid,
        ["--showcase-shop-footer-bg" as string]: showThemeColors.shopFooter,
        ["--showcase-text" as string]: COMPANY_HOME_TEMPLATE_STYLE_TOKENS.text,
        ["--showcase-muted" as string]: COMPANY_HOME_TEMPLATE_STYLE_TOKENS.muted,
        ["--showcase-border" as string]: COMPANY_HOME_TEMPLATE_STYLE_TOKENS.border,
        ["--showcase-accent" as string]: COMPANY_HOME_TEMPLATE_STYLE_TOKENS.accent,
        ["--showcase-accent-soft" as string]: COMPANY_HOME_TEMPLATE_STYLE_TOKENS.accentSoft,
        ["--showcase-accent-contrast" as string]: COMPANY_HOME_TEMPLATE_STYLE_TOKENS.accentContrast,
        ["--showcase-surface" as string]: COMPANY_HOME_TEMPLATE_STYLE_TOKENS.surface,
    };

    const safeAuthTenantId = normalizeTenantId(authTenantId);
    const withTenant = (path: string) => {
        if (!safeAuthTenantId) return path;
        const query = new URLSearchParams({ tenant: safeAuthTenantId });
        return `${path}${path.includes("?") ? "&" : "?"}${query.toString()}`;
    };

    const links: CompanyHomeLinkSet = {
        homeHref,
        loginHref: withTenant("/login"),
        signUpHref: withTenant("/register/customer"),
        customerDashboardHref: safeAuthTenantId ? `/${encodeURIComponent(safeAuthTenantId)}/dashboard` : "/customer-dashboard",
        shopHref: safeAuthTenantId ? `/${encodeURIComponent(safeAuthTenantId)}/shop` : "/shop",
    };

    const heroPrimaryCta: CompanyHomeCta =
        navAccountType === "company"
            ? { href: "/dashboard", label: copy.ctaCompany }
            : navAccountType === "customer"
              ? {
                    href:
                        storefrontSettings.shoppingEnabled && storefrontSettings.autoRedirectToShopForCustomer
                            ? links.shopHref
                            : links.customerDashboardHref,
                    label: copy.ctaCustomer,
                }
              : { href: links.loginHref, label: copy.ctaGuest };

    const servicesAnchor = firstEnabledAnchorByType("services")
        ? `#${firstEnabledAnchorByType("services")}`
        : firstEnabledAnchorByType("contact")
          ? `#${firstEnabledAnchorByType("contact")}`
          : "#hero";
    const heroSecondaryCta: CompanyHomeCta = { href: servicesAnchor, label: copy.ctaServices };

    const navLinks: CompanyHomeNavLink[] = [
        { id: "about", anchor: firstEnabledAnchorByType("about") ?? "", label: copy.navAbout },
        { id: "services", anchor: firstEnabledAnchorByType("services") ?? "", label: copy.navServices },
        { id: "contact", anchor: firstEnabledAnchorByType("contact") ?? "", label: copy.navContact },
        { id: "location", anchor: firstEnabledAnchorByType("contact") ?? "", label: copy.navLocation },
    ].filter((item) => Boolean(item.anchor));

    return (
        <div
            className="min-h-dvh bg-[rgb(var(--showcase-page-bg))] text-[rgb(var(--showcase-text))] [font-family:'Manrope','Noto_Sans_TC',sans-serif]"
            style={showcaseVars}
        >
            <CompanyHomeHeader
                copy={copy}
                navAccountType={navAccountType}
                storefrontSettings={storefrontSettings}
                navLinks={navLinks}
                currentLang={lang}
                links={links}
            />

            <main>
                <div className="builder-on-showcase">
                    {builderHomepage.hero.enabled ? <HeroBackgroundMedia config={builderHomepage.hero} /> : null}
                    {builderHomepage.carousel.enabled ? (
                        <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
                            <AutoCarouselBanner
                                config={builderHomepage.carousel}
                                labels={{
                                    prev: builderUi.carouselPrev,
                                    next: builderUi.carouselNext,
                                    goTo: builderUi.carouselGoTo,
                                }}
                            />
                        </div>
                    ) : null}
                </div>
                {blocksForCanvas.map((block) => renderCompanyHomeBlock(block, { copy, heroPrimaryCta, heroSecondaryCta }))}
            </main>

            <CompanyHomeFooter copy={copy} currentYear={currentYear} />
        </div>
    );
}
