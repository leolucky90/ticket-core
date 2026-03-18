import { headers } from "next/headers";
import { cookies } from "next/headers";
import { MerchantBuilderShell, MerchantPageShell } from "@/components/merchant/shell";
import { ShowStyleSettingsPanel } from "@/features/showcase/components/ShowStyleSettingsPanel";
import { getLocaleFromHeader, t } from "@/lib/i18n/authIndex";
import { getShowcasePreferences } from "@/features/showcase/services/showcasePreferences.server";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcaseTenantId, getUserDoc } from "@/lib/services/user.service";

export default async function ShowcaseStylePage() {
    const h = await headers();
    const c = await cookies();
    const langCookie = c.get("lang")?.value;
    const locale = langCookie === "en" ? "en" : getLocaleFromHeader(h.get("accept-language"));
    const session = await getSessionUser();
    const userDoc = session ? await getUserDoc(session.uid) : null;
    const tenantId = getShowcaseTenantId(userDoc, session?.uid);
    const preferences = await getShowcasePreferences({ tenantId });

    return (
        <MerchantPageShell title="展示頁設定 / 樣式設定" subtitle="Builder Shell：主題色票與 storefront 行為控制。" width="builder">
            <MerchantBuilderShell
                className="w-full"
                sectionList={
                    <div className="space-y-3">
                        <div className="text-sm font-semibold text-[rgb(var(--text))]">樣式區塊</div>
                        <div className="text-xs text-[rgb(var(--muted))]">管理展示頁與商店頁配色角色，並調整 storefront 開關。</div>
                        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-3 text-xs text-[rgb(var(--muted))]">
                            Page / Header / Hero / Services / Shop Grid / Footer
                        </div>
                    </div>
                }
                editor={
                    <ShowStyleSettingsPanel
                        initialColors={preferences.themeColors}
                        initialStorefront={preferences.storefront}
                        labels={{
                            title: t(locale, "showcaseStyleTitle"),
                            hint: t(locale, "showcaseStyleHint"),
                            reset: t(locale, "showcaseResetPalette"),
                            save: locale === "en" ? "Save to Firebase" : "儲存到 Firebase",
                            saving: locale === "en" ? "Saving..." : "儲存中...",
                            saved: locale === "en" ? "Saved" : "已儲存",
                            saveFailed: locale === "en" ? "Save failed" : "儲存失敗",
                            customColor: t(locale, "themeCustomColor"),
                            rolePage: t(locale, "showcaseRolePage"),
                            roleHeader: t(locale, "showcaseRoleHeader"),
                            roleHero: t(locale, "showcaseRoleHero"),
                            roleAbout: t(locale, "showcaseRoleAbout"),
                            roleServices: t(locale, "showcaseRoleServices"),
                            roleContact: t(locale, "showcaseRoleContact"),
                            roleAd: t(locale, "showcaseRoleAd"),
                            roleFooter: t(locale, "showcaseRoleFooter"),
                            roleShopPage: locale === "en" ? "Shop Page Background" : "購物頁背景",
                            roleShopHeader: locale === "en" ? "Shop Header Background" : "購物頁導覽列背景",
                            roleShopHero: locale === "en" ? "Shop Hero Background" : "購物頁 Hero 背景",
                            roleShopGrid: locale === "en" ? "Shop Product Grid Background" : "購物頁商品區塊背景",
                            roleShopFooter: locale === "en" ? "Shop Footer Background" : "購物頁 Footer 背景",
                            storefrontTitle: locale === "en" ? "Storefront Settings" : "購物頁功能設定",
                            storefrontHint:
                                locale === "en"
                                    ? "Control whether customer navigation shows shop/cart and auto redirect behavior."
                                    : "控制是否開啟線上購物、顯示購物車 icon 與客戶自動導購。",
                            storefrontShoppingEnabled: locale === "en" ? "Enable Online Shopping" : "開啟線上購物",
                            storefrontAutoRedirect:
                                locale === "en"
                                    ? "Auto redirect customer to shopping page after login"
                                    : "客戶登入後自動導向線上購物",
                            storefrontShowCart:
                                locale === "en" ? "Show cart icon + customer icon in homepage nav" : "首頁導覽列顯示購物車 + 客戶 icon",
                        }}
                    />
                }
            />
        </MerchantPageShell>
    );
}
