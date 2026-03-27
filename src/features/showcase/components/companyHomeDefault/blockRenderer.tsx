import type { ReactElement } from "react";
import type { CompanyHomeTemplateCopy } from "@/features/showcase/default-template/companyHomeDefaultTemplate";
import {
    CompanyHomeAboutSection,
    CompanyHomeAdSection,
    CompanyHomeContactSection,
    CompanyHomeHeroSection,
    CompanyHomeServicesSection,
    type CompanyHomeCta,
} from "@/features/showcase/components/companyHomeDefault/sections";
import type { ShowContentBlock } from "@/features/showcase/types/showContent";

export type CompanyHomeBlockRenderContext = {
    copy: CompanyHomeTemplateCopy;
    heroPrimaryCta: CompanyHomeCta;
    heroSecondaryCta: CompanyHomeCta;
};

export function renderCompanyHomeBlock(block: ShowContentBlock, context: CompanyHomeBlockRenderContext): ReactElement {
    switch (block.type) {
        case "hero": {
            const heroBlock = block as ShowContentBlock<"hero">;
            return (
                <CompanyHomeHeroSection
                    key={heroBlock.id}
                    content={heroBlock.content}
                    styles={heroBlock.styles}
                    typography={heroBlock.typography}
                    ctas={heroBlock.ctas}
                    themeTokenOverrides={heroBlock.themeTokenOverrides}
                    defaultPrimaryCta={context.heroPrimaryCta}
                    defaultSecondaryCta={context.heroSecondaryCta}
                />
            );
        }
        case "about": {
            const aboutBlock = block as ShowContentBlock<"about">;
            return (
                <CompanyHomeAboutSection
                    key={aboutBlock.id}
                    content={aboutBlock.content}
                    styles={aboutBlock.styles}
                    typography={aboutBlock.typography}
                    themeTokenOverrides={aboutBlock.themeTokenOverrides}
                />
            );
        }
        case "services": {
            const servicesBlock = block as ShowContentBlock<"services">;
            return (
                <CompanyHomeServicesSection
                    key={servicesBlock.id}
                    content={servicesBlock.content}
                    styles={servicesBlock.styles}
                    typography={servicesBlock.typography}
                    themeTokenOverrides={servicesBlock.themeTokenOverrides}
                />
            );
        }
        case "contact": {
            const contactBlock = block as ShowContentBlock<"contact">;
            return (
                <CompanyHomeContactSection
                    key={contactBlock.id}
                    content={contactBlock.content}
                    styles={contactBlock.styles}
                    typography={contactBlock.typography}
                    ctas={contactBlock.ctas}
                    themeTokenOverrides={contactBlock.themeTokenOverrides}
                />
            );
        }
        case "ad": {
            const adBlock = block as ShowContentBlock<"ad">;
            return (
                <CompanyHomeAdSection
                    key={adBlock.id}
                    content={adBlock.content}
                    styles={adBlock.styles}
                    typography={adBlock.typography}
                    themeTokenOverrides={adBlock.themeTokenOverrides}
                />
            );
        }
        default:
            return <></>;
    }
}
