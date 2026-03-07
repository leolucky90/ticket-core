import { headers } from "next/headers";
import { cookies } from "next/headers";
import { ShowContentSettingsPanel } from "@/features/showcase/components/ShowContentSettingsPanel";
import { getLocaleFromHeader } from "@/lib/i18n/authIndex";
import { getShowcasePreferences } from "@/features/showcase/services/showcasePreferences.server";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcaseTenantId, getUserDoc } from "@/lib/services/user.service";

export default async function ShowcaseContentPage() {
    const h = await headers();
    const c = await cookies();
    const langCookie = c.get("lang")?.value;
    const locale = langCookie === "en" ? "en" : getLocaleFromHeader(h.get("accept-language"));
    const session = await getSessionUser();
    const userDoc = session ? await getUserDoc(session.uid) : null;
    const tenantId = getShowcaseTenantId(userDoc, session?.uid);
    const preferences = await getShowcasePreferences({ tenantId });

    const labels =
        locale === "en"
            ? {
                  title: "Showcase Settings / Content Settings",
                  hint: "Edit each section content, typography style, and order by drag-and-drop.",
                  reset: "Reset Content Defaults",
                  save: "Save to Firebase",
                  saving: "Saving...",
                  saved: "Saved",
                  saveFailed: "Save failed",
                  localeZh: "ZH",
                  localeEn: "EN",
                  orderHint: "Drag sections to reorder layout",
                  enabled: "Enabled",
                  hidden: "Hidden",
                  fieldKicker: "Kicker",
                  fieldTitle: "Title",
                  fieldBody: "Body Text",
                  fieldPoints: "List Content",
                  pointsHint: "One line per item",
                  fieldFontFamily: "Font Family",
                  fieldTitleScale: "Title Size",
                  fieldBodyScale: "Body Size",
                  optionFontDefault: "Default",
                  optionFontSerif: "Serif",
                  optionFontMono: "Monospace",
                  optionTitleMd: "Medium",
                  optionTitleLg: "Large",
                  optionTitleXl: "XL",
                  optionBodySm: "Small",
                  optionBodyMd: "Medium",
                  optionBodyLg: "Large",
                  blockHero: "Hero",
                  blockAbout: "About",
                  blockServices: "Services",
                  blockContact: "Contact",
                  blockAd: "Ad Banner",
              }
            : {
                  title: "展示頁設定 / 內容設定",
                  hint: "可編輯每個區塊的內容、字體樣式，並透過拖曳排序調整版面順序。",
                  reset: "重設內容預設值",
                  save: "儲存到 Firebase",
                  saving: "儲存中...",
                  saved: "已儲存",
                  saveFailed: "儲存失敗",
                  localeZh: "中",
                  localeEn: "EN",
                  orderHint: "可拖曳區塊調整頁面順序",
                  enabled: "啟用",
                  hidden: "隱藏",
                  fieldKicker: "區塊前綴文字",
                  fieldTitle: "主標題",
                  fieldBody: "內文",
                  fieldPoints: "列表內容",
                  pointsHint: "一行代表一筆",
                  fieldFontFamily: "字體樣式",
                  fieldTitleScale: "標題尺寸",
                  fieldBodyScale: "內文字級",
                  optionFontDefault: "預設",
                  optionFontSerif: "襯線字",
                  optionFontMono: "等寬字",
                  optionTitleMd: "中",
                  optionTitleLg: "大",
                  optionTitleXl: "特大",
                  optionBodySm: "小",
                  optionBodyMd: "中",
                  optionBodyLg: "大",
                  blockHero: "Hero 首屏",
                  blockAbout: "About 區塊",
                  blockServices: "Services 區塊",
                  blockContact: "Contact 區塊",
                  blockAd: "廣告區塊",
              };

    return <ShowContentSettingsPanel labels={labels} initialState={preferences.content} />;
}
