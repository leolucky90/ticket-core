import { BuilderDemoClient } from "@/app/demo/builder/builder-demo-client";
import { cookies } from "next/headers";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";

export default async function BuilderDemoPage() {
    const cookieStore = await cookies();
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const ui = getUiText(lang).builderModule;

    return (
        <BuilderDemoClient
            lang={lang}
            title={ui.demoPageTitle}
            subtitle={ui.demoPageSubtitle}
            demoAnimated={{
                eyebrow: ui.demoAnimatedEyebrow,
                title: ui.demoAnimatedTitle,
                description: ui.demoAnimatedDesc,
                primaryLabel: ui.demoAnimatedPrimary,
            }}
            demoImage={{
                eyebrow: ui.demoImageEyebrow,
                title: ui.demoImageTitle,
                description: ui.demoImageDesc,
                primaryLabel: ui.demoImagePrimary,
                secondaryLabel: ui.demoImageSecondary,
            }}
            sectionOfficialHero={ui.sectionOfficialHero}
            sectionOfficialCarousel={ui.sectionOfficialCarousel}
            sectionTenantHero={ui.sectionTenantHero}
            sectionTenantCarousel={ui.sectionTenantCarousel}
            sectionAnimatedHero={ui.sectionAnimatedHero}
            sectionUrlHero={ui.sectionUrlHero}
            sectionMedia={ui.sectionMedia}
            carouselLabels={{
                prev: ui.carouselPrev,
                next: ui.carouselNext,
                goTo: ui.carouselGoTo,
            }}
            mediaImage={ui.mediaFieldImage}
            mediaVideo={ui.mediaFieldVideo}
        />
    );
}
