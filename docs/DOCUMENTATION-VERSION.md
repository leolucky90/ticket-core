# Documentation 版本與更正日（single source of truth）

本檔為 `docs/` 資料夾內 **文件集版本** 與 **最後更正日** 的規格依據。  
其他 `docs/*.md` 頂部僅需保留連結至本檔，**不必**在各檔重複寫版本數字（避免漂移）。

**首頁 `/` 顯示的版本字串** 與 **執行時常數** 必須與下方表格一致：

- `src/lib/documentation-version.ts` → `DOCUMENTATION_VERSION_DISPLAY`

變更文件集版本時：**先**更新本檔表格與「最後更正」，**再**將同一版本字串寫入 `documentation-version.ts`（兩邊需完全相同）。

---

## 目前狀態

| 項目 | 值 |
| --- | --- |
| **版本** | **V1.44** |
| **最後更正** | **2026-04-27** |

---

## 版本與日期規則（AI／開發者必遵守）

1. **觸發條件：** 凡 **新增、刪除或修改** `docs/` 目錄下**任一**檔案（含本檔），收尾時必須更新本檔。
2. **版本號：** 自 **V1.00** 起，每次符合上述條件時，將版本**數值**加 **0.01**（例：V1.00 → V1.01 → V1.02）。
3. **最後更正：** 設為執行該次變更之**當日日期**（以工作階段或提交時之「今日」為準；跨時區專案建議與團隊約定一種日期欄位格式，本專案使用 `YYYY-MM-DD`）。
4. **執行時對齊：** 只要本檔 **版本** 欄位變更，必須同步更新 `src/lib/documentation-version.ts` 內 `DOCUMENTATION_VERSION_DISPLAY`，使首頁與本檔一致。
5. **不必**在每次變更時修改其他 docs 檔內的版本數字——除非該檔為展示用而刻意寫死（不建議）；以本檔與 `documentation-version.ts` 為準即可。

---

## 變更紀錄（可選，重大改版時簡記）

| 版本 | 日期 | 摘要 |
| --- | --- | --- |
| V1.44 | 2026-04-27 | 對齊目前未提交的 activities / checkout / customer detail baseline：活動主表單與活動商品 line 關聯維持既有 `selectedPromotions -> pickupReservations` 資料流，customer detail 補回顯寄貨總數與商品快照；同步校正 docs 版本與日期 |
| V1.43 | 2026-04-13 | activities / checkout baseline 再收斂：活動主表單精簡為名稱 / 日期 / 效果 / 寄貨數量 / 說明並保留進階相容區；checkout 商品命中活動時可轉成活動商品 line，折扣百分比與 bundle+reservation 會沿用既有 `selectedPromotions -> pickupReservations -> customer detail` 資料流 |
| V1.42 | 2026-04-13 | activities tab baseline 更新：搜尋 toolbar 與新增表單拆分，新增 shared `ActivityFormPanel` 供 create / update / restart 共用；過期活動可帶入既有內容後重新設定日期再建立 |
| V1.41 | 2026-04-05 | 官方首頁視覺節奏再收斂：`HeroBackgroundMedia` 與 `AutoCarouselBanner` 新增 inline/panel 文案呈現邏輯，official hero / carousel 改為文字直接疊在背景媒體上；`OfficialPostHeroSection`、platform architecture steps 與 demo 帳號區重排成較高密度版型，減少桌面大留白 |
| V1.40 | 2026-04-05 | 公開 `版本更新紀錄` 視覺再收斂：首頁改為較緊湊的摘要卡 + 卡片式版本歷史，首頁與 `/updates` 歷史列表皆改為固定高度內層滾動，避免 changelog 把整頁版面拉長 |
| V1.39 | 2026-04-05 | 官方首頁 `/` 新增公開 `版本更新紀錄` 區塊與 `/updates` 完整歷史頁；資料直接讀取 `docs/DOCUMENTATION-VERSION.md` 並顯示最新 Git revision metadata（可用時），作為對外展示的單一 changelog 來源 |
| V1.38 | 2026-04-05 | `DimensionPicker` 修正 `維修配件` flow：配件分類不再把品牌分類／型號篩成空集合，改依品牌可維修裝置家族顯示；`usedProductTypeSettings` 若 collection 為空，會依品牌已勾選的 `usedProductTypes` 自動回補 active baseline，避免二手商品新增頁與規格模板卡片錯誤顯示 0 類型 |
| V1.37 | 2026-04-05 | canonical item naming / catalog dimension 再收斂：主分類維持泛用類別（`手機` / `平板` / `手錶` / `維修配件`），`productTypeName`／品牌分類承接 `iPhone` / `Galaxy S` / `iWatch` 等家族；`DimensionPicker` 升為六欄（分類三層 + 品牌 + 品牌分類 + 型號），company_a catalog live data 亦同步修正 |
| V1.36 | 2026-04-05 | `DimensionPicker` 與 `/dashboard/products` filter 改為依已設定 catalog relation 嚴格 cascade：選分類後只顯示該分類可用品牌，選品牌後只顯示該品牌且屬於該分類的型號；`MarketingBrandEditor` 的「店內商品分類」改為唯讀顯示 `linkedCategoryNames` 摘要，分類 CRUD 收斂回「分類」分頁 |
| V1.35 | 2026-04-05 | 商店營銷目錄 canonical category schema 升級為三層（`categoryLevel: 1 | 2 | 3`）；`DimensionPicker`、品項快速命名與商品欄位同步支援第一層子分類（第二層分類）與第二層子分類（第三層分類），維修配件零件等級不再塞進 model naming |
| V1.34 | 2026-04-05 | 補充 catalog 階層限制：canonical `CategoryDoc` 目前僅支援兩層；維修配件若需 `維修配件 > 配件部位 > 零件等級`，第三層先保留在 model naming，待後續 schema / UI 升級 |
| V1.33 | 2026-04-05 | 移除 `reset-firebase-data.mjs` 內 demo `company_a` 專屬品牌種子；文件改回商店營銷目錄資料由 canonical company collections（`suppliers` / `brands` / `categories` / `models`）直接維護，而非 reset baseline |
| V1.32 | 2026-04-05 | `project-summary` 同步 demo `company_a` 目錄品牌種子敘述（後續已由 V1.33 移除 reset baseline 綁定） |
| V1.31 | 2026-04-05 | `reset-firebase-data.mjs` 曾為 demo `company_a` 加入六筆目錄品牌種子（後續已由 V1.33 移除） |
| V1.30 | 2026-04-05 | `settings/dashboard` 移除 `連結 Google 帳號` 卡片，頁面收斂為 appearance-only 設定；`SecuritySettingsPanel` 只保留 `ThemeModeToggle`，Google 綁定邊界維持在 `account/security` |
| V1.29 | 2026-04-05 | 商家 shell 導覽 IA 調整：`展示頁設定`、`儀表板設定` 從右上角帳戶選單 `帳戶設定` 移出，統一收進 sidebar `商店區域`，並將 `儀表板設定` 排在 `展示頁設定` 下方 |
| V1.28 | 2026-04-05 | storefront sign-out CTA 收斂到 shared `SignOutButton` appearance variants，修正 showcase dark mode 樣式覆蓋；文件明確區分 `/settings/showcase` 的 storefront `themeColors` 與 `/settings/dashboard` 的 app shell `light` / `dark` / `custom` 外觀切換 |
| V1.27 | 2026-04-05 | Demo 第三租戶：`company_c`、`adminc@gmail.com`／`cxc@gmail.com` 納入 `reset-firebase-data.mjs` 與 `sync-demo-auth-passwords.mjs`；`project-rules`／`multi-tenant-data-flow`／`project-summary`／首頁 `BusinessLandingPage` 測試帳號區同步 |
| V1.26 | 2026-04-05 | `multi-tenant-data-flow`：補充 demo 兩個商家帳號展示首頁分屬不同 `companyId`／`app_config/showcase`，與官方 `/` 資料來源分離之說明；`project-summary` 加交叉引用 |
| V1.25 | 2026-04-04 | invoice / receipt document canonical baseline：新增 `settings/invoiceSettings`、`invoiceTrackSettings`、`invoiceDrafts`、`receiptDocuments`、`invoiceVoids`、`invoiceCarriers`、`invoiceLogs` 文件；`/dashboard/receipts*` 與 `/settings/account/invoices*` 改走 merchant invoice-admin read/write wrappers |
| V1.24 | 2026-04-04 | checkout / POS canonical baseline：`/dashboard/checkout` 改走 `checkout-route-data.service` + `checkout-case-selector.service` + `services/checkout/document-service`；案件卡預設隱藏、TW/AU 單據設定與 preview 統一吃 `businessProfile` / `regionalReceiptSettings`，sale snapshot 新增 `checkoutDocument` |
| V1.23 | 2026-04-04 | 帳戶設定 canonical split：`/settings/account` 改為 auth summary / `businessProfile` / `regionalReceiptSettings` 三段分離；新增 receipt preview model、Firestore settings 路徑與 focused account-settings read/write docs |
| V1.22 | 2026-04-04 | 結帳 `CheckoutWorkspace` 客戶區塊再收斂：`過路客` 模式直接隱藏搜尋欄，僅在 `選擇客戶` 時顯示搜尋輸入；同步更新 `project-summary` |
| V1.21 | 2026-04-04 | 結帳 `CheckoutWorkspace` 客戶查找 UX 收斂：未輸入關鍵字不預覽客戶清單，且只有所選客戶存在未關閉 Ticket 時才顯示案件勾選卡；同步更新 `project-summary` |
| V1.20 | 2026-04-01 | 官方／租戶首頁展示優化：`HeroBackgroundMedia` 內容卡尺寸與 CTA 層級、`AnimatedBackground` layers、mock 影片／圖輪播素材與文案；`OfficialPostHeroSection` 收斂第一屏後節奏；`BuilderMediaField` 上傳 disabled + 指定備註文案；同步 `ui-text`／文件版本 |
| V1.19 | 2026-04-01 | 新增首頁 Builder 模組（`HeroBackgroundMedia`、`AutoCarouselBanner`、媒體欄位 UI）、`lib/types/builder` 與 `builder-demo` mock；官方 `/` 與租戶 `ShowHomePage` 整合；Demo `/demo/builder`；同步更新 `project-summary`／`codebase-map` |
| V1.18 | 2026-04-01 | official homepage demo/test account section 的官方入口 URL 改為依目前 request host 動態顯示，不再寫死 `localhost`；同步更新 `project-summary` |
| V1.17 | 2026-04-01 | official homepage demo/test account section 補上 Company A / B public route 直達連結，方便外部測試租戶首頁；同步更新 `project-summary` |
| V1.16 | 2026-04-01 | auth 註冊邊界收斂：官方 `/register/company` 固定為用戶註冊，`/register/customer` 僅保留 tenant-scoped 商家客戶註冊；同步更新 `project-summary`／`codebase-map`／`multi-tenant-data-flow` |
| V1.15 | 2026-03-31 | `project-rules` / `project-summary` 補充 i18n guardrail：之後任何 visible UI 編輯都必須同輪完成 i18n，且要連 shared child components / dropdown / empty state / prompt 一併檢查 |
| V1.14 | 2026-03-31 | 補完 merchant dashboard / customers / cases / campaigns / items i18n 收斂；`DimensionPicker`、predictive search dropdown/error、`CustomerDashboardPanel` 也改走 shared `ui-text.ts`，修正 `ReceiptWorkspace` server/client 邊界後續補漏 |
| V1.13 | 2026-03-31 | page-level i18n 收斂：auth、二手商品、customer detail、receipts、relationships、error pages、`settings/showcase` 與 staff/dashboard flash 改走 `ui-text.ts`；customer linkage 移除 plain-name fallback；activity purchase / checkout search 改為 id-first linkage；`project-summary`／`codebase-map` 同步更新 |
| V1.12 | 2026-03-30 | Merchant i18n 收斂：`ui-text.ts` 新增 showcase 引言、商店營銷 workspace／品項快速命名／品牌編輯／二手規格說明等 key；儀表板分頁與多個獨立路由 shell 標題與 cookie `lang` 對齊；**`project-summary`**／**`project-rules`**／**`codebase-map`** 同步敘述 |
| V1.11 | 2026-03-30 | **`project-rules.md`** 補充：未落地／第三方 API 對照指向 `project-summary` 專節 |
| V1.10 | 2026-03-30 | **`project-summary.md`** 新增「未落地／待細修／第三方 API 對照（實作驗證用）」；**`saas-erp-ai-blueprint.md`** 結論交叉引用該節與 intake 待辦表 |
| V1.09 | 2026-03-30 | 擴充 **`saas-erp-ai-blueprint.md`**：商業化平台樹、Pricing 矩陣、Stripe（規劃／`companyId` metadata）、Onboarding、白牌、`project-rules`／`project-summary`／`codebase-map` 交叉引用；標註 Stripe 未內建 |
| V1.08 | 2026-03-30 | 新增 **`docs/saas-erp-ai-blueprint.md`**：SaaS ERP+AI 完整版藍圖（租戶=`companyId`、架構樹、Lv1–9、Dashboard／OCR／Demo Flow、Codex 微調清單）；合併多輪草稿與實作對照 |
| V1.07 | 2026-03-30 | 權限 Lv1–9 文件化；操作稽核讀取（`audit-log-read-model`）與 `/settings/security/audit-logs`；儀表板估計 COGS／毛利（`lib/reporting/financial-summary`）；Safe import 與資料流文件更新 |
| V1.06 | 2026-03-30 | 多店面／多倉／IMEI／倉別庫存時間軸（`inventoryLogs`）／調貨／AI 補貨建議：schema + `services/inventory/*`、`services/ai/reorder-service`；Firestore 路徑與 `companyId` canonical 對齊 |
| V1.05 | 2026-03-30 | Po 草稿：`DimensionPicker` + 商品搜尋 API + `productId` 連動；`draft-editor`；`schema/poDraftProduct`；註記不重複新建 inventory 服務（沿用既有 schema／結帳） |
| V1.04 | 2026-03-30 | `project-summary` 新增「收據／採購 intake」待辦與後續優化備註；`codebase-map` 維護區加索引連結 |
| V1.03 | 2026-03-30 | 收據／發票 OCR（Google Vision）→ OpenAI 結構化 PoDraft → Firestore（intakeDocuments／ocrResults／poDrafts／purchaseOrders）；API `document-intake`、`po/confirm`、`po/draft`；`/demo/receipt-po`；採購頁人工確認 UI |
| V1.02 | 2026-03-29 | 新增商家 `/dashboard/purchase-orders` 採購草稿頁（AI 預留 + 人工建立）；型別／stub service／`lib/ai` placeholder；更新側欄與 codebase-map |
| V1.01 | 2026-03-29 | 首頁 `/` 顯示 ©、年份與文件集版本；版本與 `documentation-version.ts` 對齊；新增 `docs/ai-chat-starter.md` |
| V1.00 | 2026-03-29 | 初版文件集版本號與 docs 更新流程 |
