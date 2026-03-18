import { headers } from "next/headers";
import { cookies } from "next/headers";
import { MerchantPageShell } from "@/components/merchant/shell";
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
                  save: "Save Changes",
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
                  fieldServiceCards: "Service Cards",
                  fieldServiceRows: "Rows",
                  fieldServiceCardTitle: "Card Title",
                  fieldServiceCardBody: "Card Body",
                  fieldServiceCardImage: "Card Image",
                  fieldServiceCardImageStyle: "Image Shape",
                  fieldServiceCardImagePosition: "Image Position",
                  fieldServiceCardShowImage: "Show Image",
                  fieldServiceCardShowTitle: "Show Title",
                  fieldServiceCardShowBody: "Show Body",
                  uploadImage: "Upload Image",
                  confirmUploadImage: "Confirm Upload",
                  selectedImage: "Selected File",
                  imageUploadSuccess: "Image uploaded. Click Save to persist.",
                  uploadingImage: "Uploading image...",
                  clearImage: "Clear Image",
                  imageUploadFailed: "Image upload failed",
                  optionImageSquare: "Square",
                  optionImageCircle: "Circle",
                  optionImageTop: "Top",
                  optionImageBottom: "Bottom",
                  optionImageLeft: "Left",
                  optionImageRight: "Right",
                  optionServiceRows1: "1 row (3 cards)",
                  optionServiceRows2: "2 rows (6 cards)",
                  optionServiceRows3: "3 rows (9 cards)",
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
                  save: "儲存修改內容",
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
                  fieldServiceCards: "服務卡片",
                  fieldServiceRows: "顯示列數",
                  fieldServiceCardTitle: "卡片標題",
                  fieldServiceCardBody: "卡片內容",
                  fieldServiceCardImage: "卡片圖片",
                  fieldServiceCardImageStyle: "圖片形狀",
                  fieldServiceCardImagePosition: "圖片位置",
                  fieldServiceCardShowImage: "顯示圖片",
                  fieldServiceCardShowTitle: "顯示標題",
                  fieldServiceCardShowBody: "顯示內容",
                  uploadImage: "上傳圖片",
                  confirmUploadImage: "確認上傳",
                  selectedImage: "已選檔案",
                  imageUploadSuccess: "圖片上傳成功，請按儲存",
                  uploadingImage: "圖片上傳中...",
                  clearImage: "清除圖片",
                  imageUploadFailed: "圖片上傳失敗",
                  optionImageSquare: "方形",
                  optionImageCircle: "圓形",
                  optionImageTop: "上方",
                  optionImageBottom: "下方",
                  optionImageLeft: "左方",
                  optionImageRight: "右方",
                  optionServiceRows1: "1 列（3 張）",
                  optionServiceRows2: "2 列（6 張）",
                  optionServiceRows3: "3 列（9 張）",
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

    return (
        <MerchantPageShell title="展示頁設定 / 內容設定" subtitle="Builder Shell：區塊排序、啟用狀態與內容編輯集中於此頁。" width="builder">
            <ShowContentSettingsPanel labels={labels} initialState={preferences.content} />
        </MerchantPageShell>
    );
}
