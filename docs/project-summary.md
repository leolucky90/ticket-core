# Project Summary

> **Docs 版本／更正：** 見 [`DOCUMENTATION-VERSION.md`](./DOCUMENTATION-VERSION.md)

## How To Use This File Set

之後新的對話、摘要更新、handoff 都以這兩個檔案為主:

- `docs/project-rules.md`
- `docs/project-summary.md`

補充 **目錄與模組導航**（非規格替代品，不取代上述兩份）:

- `docs/codebase-map.md`
- `docs/saas-erp-ai-blueprint.md`（**提案／交接用**：SaaS ERP + AI 完整版藍圖，合併架構、Lv1–9、老闆 Dashboard、OCR→PO、A/B Demo Flow、**Pricing／Stripe（規劃）／Onboarding／白牌／商業模式** 與 Codex 微調邊界；**已落地 vs 規劃** 以該檔與本 summary 為準）
- `docs/ai-chat-starter.md`（新對話給 AI 的一鍵複製指令）

**`docs/` 任一支檔變更時的版本號與更正日：** 單一來源為 `docs/DOCUMENTATION-VERSION.md`（每次變更 docs +0.01 規則見該檔）；首頁顯示之版本字串見 `src/lib/documentation-version.ts`，須與該檔同步。

**新對話一鍵複製給 AI：** `docs/ai-chat-starter.md`。

如果要在新對話延續上下文，應先讀這兩個檔案，再開始工作。

## Iteration Update Rules

之後迭代更新時，為了避免越做越散，固定遵守這些規則:

- 不新增新的 phase recap / handoff / temp docs；優先只更新這兩份 canonical docs
- 有新的 shared helper、shared shell、service boundary、route baseline、demo baseline 變動時，同一輪必須同步更新 docs
- 之後任何新增或修改 visible UI 的工作，都必須在同一輪完成 i18n 與 shared child component 掃描；不可留下「頁面改了但 dropdown / empty state / prompt 還是舊語系」的補漏債
- 如果某個 shared helper 已經成形，同一輪應盡量把平行頁面一起收斂，不要讓新舊 pattern 長期並存
- 如果大型 workspace 持續膨脹，下一輪優先任務應改成拆 focused workspace / helper，而不是直接再疊功能
- `project-summary.md` 應只保留目前仍有效的 ground truth，不保留過時 phase 記錄
- 新的 safe starting point 應反映「現在最值得收斂的下一步」，不是保留舊優先順序不更新

## Current Status

目前已完成到適合交接的狀態:

- canonical naming rules 已文件化
- tenant / company normalization 已集中
- customer shared type 已抽離成 canonical module
- `cases` 已明確標成 ticket legacy bridge
- `types/commerce.ts` 已縮成 compatibility barrel
- merchant / platform read-side import path 已開始從大型聚合 service 抽離
- Firebase reset / seed baseline 已補齊到 `scripts/reset-firebase-data.mjs`（demo 租戶含 `company_a`／`company_b`／`company_c` 與對應 admin／customer 帳號；商店營銷目錄資料不綁在 reset baseline）
- demo account / tenant baseline 已整合到 `docs/multi-tenant-data-flow.md`
- official homepage demo/test account section 已補上 A / B / C 公司首頁 public route 直達連結，且官方首頁入口會依目前 request host 顯示，不再寫死 `localhost`；**各 demo 商家帳號的展示首頁內容**各自對應 `companies/{companyId}/app_config/showcase`（與官方 `/` 的 `business_homepage` 分開），詳見 `docs/multi-tenant-data-flow.md` 該節 FAQ
- 官方 `/` 與租戶公開首頁（`ShowHomePage`）已接上結構化 **`BuilderHomepageConfig`**（`src/lib/types/builder.ts`、mock `src/lib/constants/builder-demo.ts`）：含 **`HeroBackgroundMedia`**（image / video / animated / none、`contentPanelSize`、layers 動態背景）與 **`AutoCarouselBanner`**；`BuilderMediaField`／`BuilderUploadNotice` 完成 URL／上傳預留（上傳鈕 disabled）與 i18n，媒體檔案正式儲存前預設 **external URL**。官方首頁第一屏後節奏收斂至 **`OfficialPostHeroSection`**。Demo 頁：`/demo/builder`。租戶端若啟用 builder Hero，會略過 showcase 模板內既有的 `hero` block，避免雙 Hero。
- 官方首頁 builder hero / carousel 目前支援 `contentPresentation: "inline"`；official `/` 已改成文案直接疊在背景媒體上，而不是白底玻璃卡，輪播控制元件也回到圖片內。第一屏後的 `OfficialPostHeroSection`、platform architecture steps 與 demo 帳號區也已改為高密度橫向版型，避免桌面長段留白
- 官方首頁 `/` 底部新增公開 `版本更新紀錄` 區塊，並補 `/updates` 完整歷史頁；資料直接解析 `docs/DOCUMENTATION-VERSION.md`，可在有 Git metadata 的環境顯示最近 revision 時間／hash，對外展示的 changelog 不再維護第二份手寫資料源
- 公開 changelog 視覺已再收斂成較緊湊的摘要卡 + 卡片式版本歷史；首頁與 `/updates` 的歷史列表皆改為固定高度內層捲動，避免版本表把頁面主敘事拉得過長
- storefront / showcase 的登出 CTA 已回到 shared `SignOutButton` appearance variants，避免 dark mode root theme class 與 storefront 色票互相覆蓋，導致展示頁 navbar 的 sign-out 按鈕反白／失真
- `settings/showcase` 目前編輯的是租戶 storefront content + `themeColors` + storefront settings；**白天 / 黑夜 / custom 外觀切換**仍屬後台 shell appearance，入口在 `/settings/dashboard`，不是隱藏在 Builder 內的第二套 storefront mode
- 商家 shell 導覽目前將 `展示頁設定` 與 `儀表板設定` 歸在 sidebar `商店區域`（`展示頁設定` 上、`儀表板設定` 下）；右上角帳戶選單的 `帳戶設定` 已移除這兩個入口，避免 storefront / dashboard appearance link 與帳戶治理設定混在同一組
- `settings/dashboard` 已收斂為 appearance-only 設定頁，僅保留 `ThemeModeToggle`；`連結 Google 帳號` 卡片已移除，Google 綁定邊界維持在 `account/security`
- `company_a` 等商家之供應商 / 品牌 / 分類 / 型號資料應直接維護於 canonical collection（`suppliers` / `brands` / `categories` / `models`），不要再把特定公司目錄內容硬塞進 `reset:firebase` 種子
- `BossAdmin` reset 邊界已明確維持在 hidden cookie login，不進 `users/{uid}`
- shared shell / layout baseline 已集中到 `src/components/merchant/shell`
- official / merchant / customer backend 已開始共用同一套 topbar / sidebar / account area 結構
- merchant result-heavy pages 已開始共用 `query-controls` + `LIST_DISPLAY_OPTIONS` pagination baseline
- merchant operational index pages 已開始共用 `MerchantPageShell` + `SearchToolbar` + `MerchantListShell` + `MerchantSectionCard`
- `dashboard?tab=activities` 已把搜尋 toolbar 與新增表單拆開；`ActivityFormPanel` 成為活動 create / update / restart 的 shared helper，主表單收斂為活動名稱 / 日期 / 活動效果 / 寄貨數量 / 說明，其他組合品項與 legacy 欄位移到進階區；過期活動可直接複製原設定並重新設定日期後重建
- checkout promotion baseline 已延續 `activities -> selectedPromotions -> sales/pickupReservations -> customer detail` 這條 canonical data flow：活動可用折扣金額 / 折扣百分比 / 贈品 / 組合價建立，結帳商品命中活動時可轉成活動商品 line，組合價搭配寄貨數量會直接落到既有 `pickupReservations` 追蹤，customer detail 也會回顯寄貨總數與商品快照
- merchant settings/detail pages 已開始共用 `MerchantPageShell` + `MerchantSectionCard` section baseline
- merchant 帳戶設定頁已改成 **auth account summary / business profile / regional receipt settings** 三段分離：`/settings/account` 走 `merchant/account-settings-read-model.service.ts` + `merchant/account-settings-write.service.ts`；公司主資料 canonical doc 為 `settings/businessProfile`，地區單據設定 canonical doc 為 `settings/regionalReceiptSettings`，舊 `settings/companyProfile` 只保留 compatibility sync / fallback
- merchant workflow pages 已開始共用 `MerchantSectionCard` workflow section baseline
- Phase 4 shared index/list UX baseline 已開始，shared pagination / empty state 已擴散到 receipts / products / delete logs 與 dashboard customers / cases / activities tabs
- Phase 5 catalog read baseline 已開始收斂到 service-level warm cache / invalidation，避免重複 route-load Firestore fetch
- Phase 5 customer relationship read-model 已集中，`relationships` overview 與 customer detail 不再各自 fan-out 重跑整套 customer/ticket/sale/activity queries
- Phase 5 customer summary / detail baseline 已收斂到 shared read-model，customer list、detail、relationship overview 開始共用一致 linkage 規則
- Phase 5 sales / tickets / entitlements / pickup reservations / campaign-consignment 已開始共用 warm cache + write-side invalidation baseline
- merchant dashboard route data 已開始集中到 focused read-model service，降低 page-local orchestration
- merchant write-side route actions 已開始透過 focused `merchant/*-write.service.ts` wrappers 匯入
- Phase 6 loading / processing UX baseline 已開始收斂到 shared processing indicator / state / overlay 與 route progress bar
- merchant route change / page transition / server action submit 已對齊 shared overlay + loading baseline
- auth login / reset / forgot password / Google link flows 已補齊一致 spinner 與 processing feedback
- 官方 `/register/company` 已固定為用戶（merchant/company admin）註冊入口；`/register/customer` 只保留 tenant-scoped 商家客戶註冊，平台 `/login` 不再提供一般客戶公開註冊 CTA
- builder save / image upload / theme sync 已補齊 visible processing state，避免 silent async actions
- Phase 7 i18n consistency baseline 已開始收斂到 shared UI vocabulary 與 UI language provider
- shared shell / processing / settings / delete logs / boss admin builder 已開始共用同一套 bilingual UI keys，減少 page-local hard-coded framework text
- 員工建立／編輯頁（`StaffForm`）與「唯讀安全資訊」已納入 `src/lib/i18n/ui-text.ts` 的 `staffForm` 中英 key；語系與 cookie `lang` 對齊
- auth routes、二手商品 create/edit/detail、customer detail、receipts、relationships、`not-found`／`global-error`、`settings/dashboard` 與 `settings/showcase` 已進一步收斂到 `ui-text.ts`；page route 不再維持 route-local 中英字典
- `ItemFormFields`、dashboard flash、staff create/edit flash 也已改走 shared i18n key；獨立頁與 workspace 不再依賴 page-local flash 中文字串
- merchant dashboard 主 workspace（dashboard / customers / cases / activities）與 `/dashboard/products` 已補齊 shared i18n；`dashboardCustomerCaseWorkspace`、`productManagementWorkspace`、`customerDashboardPanel` 等 key 已涵蓋 KPI、list filters、pagination、活動表單與 delete prompt
- dashboard cases 新增案件表單已拆出 `CaseCustomerSelector`：可切換「新增客戶」或「加入現有客戶」，現有客戶以電話／姓名關鍵字篩選後提交 `existingCustomerId`，server 端以 `customerId` 綁定案件，不再靠姓名文字臨時關聯
- dashboard cases 展開列已拆成「案件資訊／維修資訊」分頁；維修資訊分頁固定顯示，若 `quoteStatus` 尚未 accepted，進入前會顯示目前報價狀態，並可選擇不改狀態進入或先寫入客戶已接受報價；維修資訊更新使用專用表單，只保留維修人員、維修狀態、維修配件、備註、歷史摘要與報價狀態；維修配件改走庫存商品搜尋與多筆 `repairParts[]`，儲存時依使用數量差額扣庫存或補回庫存；結帳前若維修狀態尚未完成會提示是否先把案件狀態改成 `resolved`（顯示為完成維修），同意後再帶 `customerId` / `caseId` 進 `/dashboard/checkout`
- merchant 共用 UI 補漏已延伸到 `DimensionPicker` 與 predictive search dropdown / error copy；英文模式下不再因底層 selector / 搜尋狀態而回退中文
- 示範品項／庫存資料以手動建立或既有 seed 為準；不內建第三方網站商品爬取匯入腳本
- Phase 8 builder template baseline 已開始收斂到 showcase block registry、instance order model 與 variant-aware preview renderer
- storefront builder 不再只綁死固定 block map；已支援 template insertion / remove / reorder 與 hero / ad variants
- merchant catalog 已支援主分類 / 第二分類階層與 `fullPath` 顯示基線，marketing / item management 共用同一套分類語意
- catalog category canonical schema 已升級為三層（`categoryLevel: 1 | 2 | 3`）；維修配件應使用 `主分類 → 第一層子分類（第二層分類）→ 第二層子分類（第三層分類）`，零件等級不再塞進 model naming
- 商店營銷目錄與品項建立流程已同步支援 `tertiaryCategory`：`DimensionPicker`、分類管理、品項快速命名、商品搜尋關鍵字與 product normalized name 皆會納入第三層分類
- catalog canonical naming 已拆成「主分類」與「品牌分類（`productTypeName`）」兩層：主分類維持 `手機` / `平板` / `手錶` / `維修配件` 等泛用類別，`iPhone` / `Galaxy S` / `iWatch` 等品牌家族改由 `productTypeName` 承接；`ModelDoc.name` 僅存家族下型號 suffix
- `DimensionPicker` 與 `/dashboard/products` filter 現在依 catalog relation 嚴格 cascade：分類只帶出已設定 `linkedCategoryNames` 的品牌，品牌只帶出該分類可用的品牌分類，再往下只顯示同品牌、同分類、同品牌分類的型號，避免 iPhone / iPad / iWatch 或維修配件型號互相混出
- `維修配件` flow 已補 special-case：`Screen` / `Battery` / `AMP` / `BQ7` 等配件分類不再直接把品牌分類／型號篩成空集合；shared selector 會回到品牌可維修的裝置家族，再由 `productTypeName` / model 完成選擇
- 商店營銷分類設定已改為左側樹狀清單（主分類可展開第二分類）+ 右側新增／編輯／刪除面板；品項自動命名支援選填「副品名」接在自動帶入名稱後（`customLabel` 在 structured 模式下僅存副品名）；品項快速命名設置預設以 `<details>` 收起
- 儀表板「商店營銷設定」分頁已改為頂部區塊選單（分類／供應來源／品牌／二手商品）+ `MerchantBuilderShell` 左清單右編輯區；已移除重複的「商店營銷設置 · 維修品牌型號」搜尋工具列；品牌編輯與型號邏輯收斂至 `MarketingBrandEditor` + `src/lib/marketing/brand-catalog-helpers.ts`
- `MarketingBrandEditor` 的「店內商品分類」已收斂為唯讀摘要，只顯示該品牌已設定的 `linkedCategoryNames`；分類 CRUD 邊界回到「分類」分頁
- 商店營銷 workspace、品項快速命名（`ItemQuickNamingSettingsCard`）、品牌編輯器、二手規格模板說明等 **框架文案** 已收斂至 `src/lib/i18n/ui-text.ts`（`marketingSettingsWorkspace`、`itemQuickNaming`、`marketingBrandEditor`、`usedProductTypeSettings` 等），與 cookie `lang` 一致；`ShowcaseBuilder` 頂部產品敘述用 `showcaseBuilderIntro`，`settings/showcase` 的 `MerchantPageShell` 副標用 `merchantStandalonePages.showcaseBuilderShellSubtitle`
- 儀表板 workspace 分頁抬頭（`dashboardWorkspaceTabs`）與結帳／收據／關聯總覽／寄店總覽／品項管理獨立路由等 shell 標題（`merchantStandalonePages`）、寄店 KPI 區塊（`consignmentsOverview`）已走同一套 `getUiLanguage`／`getUiText`，避免英文模式下殘留寫死中文
- `CheckoutWorkspace` 已收斂成結帳中心 / 客戶 / 案件 / 商品明細 / 單據設定 / 收據預覽 / 操作區 七段結構；案件卡預設隱藏，僅在所選客戶存在 checkout-eligible cases 時顯示；TW / AU 單據欄位與 preview 直接讀取 `businessProfile` + `regionalReceiptSettings`，並在 sale snapshot 寫入 `checkoutDocument`
- checkout route data 已進一步改成分段按需載入：base（customers/tickets/products）先載，deferred 拆成三支 API（activities、used products、receipt settings）；僅在明確動作（開啟活動或二手選單、載入單據設定）時才查詢
- invoice / receipt document 模組已建立 canonical baseline：`src/lib/schema/invoice-*.schema.ts` + `receipt-document.schema.ts` 定義 draft / issue / void / reissue / carrier / log / track / integration mode；`receiptDocuments` 為 canonical 已開立單據主資料，`invoiceDrafts` / `invoiceVoids` / `invoiceLogs` / `invoiceTrackSettings` / `settings/invoiceSettings` 為配套集合
- `sales.createCheckoutSale` 已在 checkout 完成後透過 `invoice-issue.service.ts` 建立 draft 並依 `settings/invoiceSettings` 決定是否自動開立；TW 電子發票、AU receipt / invoice / tax invoice 共用同一套 `receiptDocuments` materialization 流程，作廢與重開由 `invoice-void.service.ts` / `reissueVoidedReceiptDocument` 保留原單據與關聯鏈
- `/dashboard/receipts` 已從 raw sales list 收斂到 `receiptDocuments` 清單；`/dashboard/receipts/[id]` 顯示 document detail + log + void / reissue；`/settings/account/invoices` 與 `/settings/account/invoice-tracks` 走 `merchant/invoice-admin-read-model.service.ts` + `merchant/invoice-admin-write.service.ts`
- receipts list 已加入月份區間查詢（預設當月），查詢條件下推至 `receipt-document.service` 的 `issuedAt` 範圍，並搭配 `prefetch={false}` 降低分頁切換前預抓讀取
- 收據中心 `收據 / 作廢` view 切換已改為本地切換同一批月份資料，避免每次 tab 切換重跑 route-data；`receipt-document.service` 在明確 status filter 時會先嘗試下推 `status + issuedAt` 精準查詢，若 Firestore 尚缺 composite index 則退回既有月份範圍 query
- cases tab `queryTicketsPage` 已補 query-level TTL cache（含 cursor/status/order/keyword key）並在 ticket 寫入路徑自動失效；`customer-summary-read-model` 亦補短 TTL page cache，降低 customers/cases 高頻切頁重算與重讀
- dashboard bundle scope 已新增 `cases`，cases tab 不再連動讀取 inventory stock logs（僅保留案件頁必要 products），進一步降低 cases route load 成本
- activities tab 分頁查詢（`queryActivitiesPage`）已補 query-level TTL cache（含 keyword/status/order/cursor key）並在 activity 寫入與刪除路徑失效，降低活動分頁切換重讀
- receipt detail 使用的 `invoice-log.service` 清單查詢已補 query-level TTL cache（company/document/draft/limit key）並在 `appendInvoiceLog` 寫入時失效，降低單據詳情重開時的重複讀取
- receipt detail 的 log 查詢在帶 `documentId` / `draftId` 時會先嘗試精準 Firestore query，再於缺索引時 fallback 到原本 broad query；shared merchant shell links、PageTabs、topbar links 與 icon action links 也預設 `prefetch={false}`，避免後台可見導航提前觸發多個高成本 route reads
- 「二手商品」子區塊與供應來源／品牌對齊：`UsedProductTypeSettingsCard` 使用 `MerchantBuilderShell`，左欄為啟用中的二手類型清單（搜尋、清單顯示筆數、可點選列），右欄為該類型之規格模板列表與新增／編輯規格表單（不再用整頁 `<details>` 摺疊列表）
- 二手商品類型 baseline 現在會由品牌已勾選的 `usedProductTypes` 自動回補到 `usedProductTypeSettings`；當品牌頁已啟用類型但 collection 尚未建立時，二手商品新增頁與規格模板頁不再回退到 generic fallback 類型
- merchant item naming baseline 已集中到 `companies/{companyId}/settings/itemNaming` 與 shared helper，支援品牌 / 品牌分類 / 型號 / 主分類 / 第一層子分類 / 第二層子分類排序
- dashboard inventory `settings` / `product-management` 與 `/dashboard/products` 已共用同一套 `ItemFormFields`，避免第二分類與自動命名只存在單一路徑
- merchant item management UI 中文已統一用「品項」，英文用 `Item`；canonical data model 仍維持 `Product`
- shared processing state spinner 已對齊真正置中，staff 帳號登入也會正確回補 `staffProfile`
- iteration guardrails 已文件化到 canonical docs，之後 phase 收斂與 docs 更新應只回到 `project-rules.md` / `project-summary.md`
- `lint` / `tsc` / `build` / `verify` 已通過
- 目前沒有 lint warning
- 採購草稿已接上 **收據／發票影像 → Google Vision OCR → OpenAI 結構化 PoDraft → Firestore**（`companies/{companyId}/intakeDocuments|ocrResults|poDrafts|purchaseOrders`），商家於 `/dashboard/purchase-orders` 人工確認後才建立正式採購單；公開驗證頁 `/demo/receipt-po`（API 需商家登入）。環境變數：`OPENAI_API_KEY`、選用 `OPENAI_PO_MODEL`（預設 `gpt-4o-mini`）、Google Vision 用 `GOOGLE_CLOUD_PROJECT_ID`／`GOOGLE_CLOUD_CLIENT_EMAIL`／`GOOGLE_CLOUD_PRIVATE_KEY`
- Po 草稿品項已支援 **目錄 DimensionPicker（主分類／第二分類／品牌／型號）+ 品項關鍵字、`GET /api/products/search` 綁定 `productId`／SKU、自訂說明、數量×單價→金額**（`draft-editor`／`PoDraftLineItemsEditor`）；`schema/ai/po-draft` 品項欄位含 `productId`；**不重複**新增根層 `Product` 型別（沿用 `merchant-product` + `PoDraftProductSearchHit`）
- **多店面／多倉／IMEI／倉別庫存時間軸／調貨／AI 補貨建議**：已補 **Firestore 型別與服務層**（`companies/{companyId}` 下 `stores`、`warehouses`、`warehouseInventory`、`stockItems`、`inventoryLogs`、`transfers`）；`companyId` 為 canonical；倉別庫存 key 為 `warehouseId` + `productId`；**不重複**取代既有 `inventory/{productId}` 與 `inventoryMovements`（公司層異動），新倉別時間軸走 `inventoryLogs`；路由／UI 可後續接 `merchant/inventory-write.service` 之 re-export（`transferStock`、`logInventory`、`createStockItem`、`generateReorderSuggestion`）
- **權限 Lv1–Lv9／操作稽核／財務儀表**：`permissionLevels` + `DEFAULT_PERMISSION_MAP` 為種子；**稽核**讀取優先 **`merchant/audit-log-read-model.service`**（`queryCompanyAuditLogs`），設定頁 **`/settings/security/audit-logs`**；**毛利／估計 COGS** 純函式在 **`lib/reporting/financial-summary.ts`**，儀表板 tab=dashboard 已顯示（與既有營收趨勢並存）
- **商業化敘事與訂閱規劃（文件）**：`docs/saas-erp-ai-blueprint.md` 已收斂 **STARTER／PRO／BUSINESS／ENTERPRISE** 方案建議、**Stripe Checkout／webhook（metadata 用 `companyId`）規劃**、onboarding／白牌／AI 營運亮點與 **10 步提案 Demo Flow**；**Stripe 與線上收款閉環尚未在程式庫內建**，BossAdmin 公司列表之訂閱時間／金額欄位為營運展示，與實際金流整合前須另對齊

### 收據／採購 intake — 待辦與後續優化（備查）

以下為 **尚未做** 或 **可強化** 的項目，之後迭代可由此檢索；實作時仍須遵守 `project-rules.md`（多租戶 `companyId`、UI 不塞業務邏輯、AI 不逕寫正式資料須人工確認等）。

| 類型 | 項目 | 說明 |
| --- | --- | --- |
| 產品／流程 | PDF 上傳 | 目前僅支援影像（JPEG／PNG／WebP／GIF）；PDF 易有解析／效能問題，需另規劃（分頁 raster、或文件 AI）。 |
| 品質 | OCR → AI 誤差 | 現況為「OCR 錯則結構化易跟錯」；可評估影像前處理、重試、多模型、或欄位層信心閾值與人工標註回饋。 |
| 安全／營運 | API rate limit | `document-intake`／`po/confirm`／`po/draft` 尚未套全域節流；上線前建議依 IP／公司／使用者限制。 |
| 安全／營運 | Auth 與權限細化 | 目前為「商家 session + company scope」；可再對照 `PermissionLevel`／`StaffMember`，限制僅部分角色可確認採購單或刪除草稿。 |
| 稽核 | Audit log | 確認採購單時可寫入 `auditLogs`（誰、何時、`draftId`／`poId`），與既有刪除／安全稽核一致。 |
| 資料／整合 | Vendor matching | AI 抽出之 `vendorName` 與既有供應商主檔比對、建議或建立關聯。 |
| 資料／整合 | 庫存／品項連結 | Po 草稿已可選 `products` 或自訂行並帶 `productId`；**採購入庫／庫存 movement 自動沖銷**仍待後續接既有 inventory／入庫流程（勿另建與專案現有 `lib/schema/inventory.ts`、結帳扣庫重複的根目錄 inventory 服務）。 |
| 架構註記 | 庫存／預約／活動扣庫 | **結帳扣庫、寄存、促銷**等已存在於 checkout／`inventory` schema／merchant 服務；新需求應擴充既有路徑，**不要**依外部草稿再新增一組全域 `inventory`／`reservations` collection 命名與 GPT 式重複實作。 |
| 資料／整合 | 歷史訂單 RAG／檢索 | 以歷史採購／收據輔助建議或比對（向量庫／查詢策略另議）。 |
| 平台 | Firestore 規則 | 寫入目前走 Admin SDK（伺服器端）；若未來開客戶端直寫，需補 `companies/{companyId}` 規則與索引檢視。 |
| 工程 | `lib/ai` 與實作對齊 | `src/lib/ai/purchase-order-draft.ts` 仍為 placeholder 文案；可改為指向實際服務或移除重複語意，避免雙軌誤解。 |
| i18n | 框架字串 | `feature/receipt-po` 部分文案仍為元件內字典；長期可收斂至 `ui-text.ts` 與其他 merchant 頁一致。 |
| 維運 | Demo／種子 | `reset-firebase-data.mjs` 未強制種子 intake／PO 測試資料；需要時可選擇性加入示範 doc（不影響現有 demo 帳號流程）。 |

**刻意維持的產品決策（非 bug）：** 不支援 PDF（短期）、不自動建立正式採購單（必須人工確認後才寫入 `purchaseOrders`）。

### 未落地／待細修／第三方 API 對照（實作驗證用）

本節為 **實作前後對照清單**：後續細修、接第三方或收斂架構時，依此逐項驗證並補正；完成項目應回寫本節或上表敘述，並依 `DOCUMENTATION-VERSION.md` bump 版本。**收據／採購 intake 專項細目** 仍以上一節表格為主；**商業化敘事與 Stripe 規劃細節** 見 `docs/saas-erp-ai-blueprint.md`。

#### 商業與訂閱（程式未接或僅展示）

- **Stripe**（Checkout、Webhook、方案／entitlement）：**未內建**。
- **Pricing UI／依方案鎖功能**：**未做**（方案矩陣為產品建議，非程式強制）。
- **BossAdmin**：公司列表之訂閱時間／金額欄位為 **展示／營運**，與真實金流整合前須另對齊。

#### 第三方 API（連線狀態總覽）

| 服務 | 用途 | 狀態 |
| --- | --- | --- |
| Google Cloud Vision | 收據 OCR | 已接（需 `GOOGLE_CLOUD_*` 等） |
| OpenAI | Po 結構化、補貨建議等 | 已接（需 `OPENAI_API_KEY` 等） |
| Stripe | 訂閱收款 | **未接** |
| Firebase Admin SDK | 伺服器端寫 Firestore | 已接 |
| 客戶端 Firestore Security Rules | 若未來改為 client 直寫 | **待補**（規則與索引） |

#### 多倉／IMEI／調貨／AI 補貨

- **Firestore 型別與服務層** 已存在；**後台路由／UI 完整操作面** 可續接 `merchant/inventory-write.service` 之 re-export（`transferStock`、`logInventory`、`createStockItem`、`generateReorderSuggestion`）；實作細修時應對照 **已上線頁面** 與本段敘述是否一致。

#### 架構收斂與長期項目（非單一第三方）

- **`commerce.ts`／`types/commerce.ts`**：新功能優先 **focused services／`*-write.service.ts`**，相容層逐步內移（見 Phase 1 與 Safe Starting Point）。
- **Phase 7 i18n、部分 merchant 頁**：可續收斂至 `ui-text.ts` 等 shared pattern。
- **Showcase builder**：template 架構仍非完整 dynamic block registry（見 `project-rules.md` Storefront Builder Rule）。

---

## Phase Progress Map

### Phase 1

- 主題:
  - canonical naming
  - architecture / service boundary 收斂
  - compatibility layer 瘦身
- 已完成:
  - tenant / company normalization 已集中
  - customer shared type 已抽離成 canonical module
  - `cases` 已明確標成 ticket legacy bridge
  - `src/lib/types/commerce.ts` 已縮成 compatibility barrel
  - merchant / platform read-side import path 已開始從大型聚合 service 抽離
  - account settings canonical split 已建立：auth summary / `BusinessProfile` / `RegionalReceiptSettings` 不再混在單一 `companyProfile` route-local state
- 目前基線:
  - 新 work 不應擴散對 `src/lib/services/commerce.ts` 與 `src/lib/types/commerce.ts` 的直接依賴
  - account / company settings 新 work 應優先延續 `settings/businessProfile` + `settings/regionalReceiptSettings` 與 focused account-settings read/write services

### Phase 2

- 主題:
  - Firebase reset / seed / test accounts
  - stable demo baseline
  - tenant isolation baseline
- 已完成:
  - `scripts/reset-firebase-data.mjs` 已補齊 reset / seed 流程
  - Company A / B / C demo account 與 official homepage baseline 已整合
  - `docs/multi-tenant-data-flow.md` 已收斂 demo login matrix 與 route baseline
  - `BossAdmin` reset 邊界已固定為 hidden cookie login，不進 Firebase `users/{uid}`
- 目前基線:
  - demo reset 與 seed 規則不應再散落到其他 temp docs

### Phase 3

- 主題:
  - shared shell / layout unification
  - official / merchant / customer backend 對齊
  - shared topbar / sidebar / account area / page shell
- 已完成:
  - shared shell 已集中到 `src/components/merchant/shell`
  - official / merchant / customer backend 已開始共用同一套 topbar / sidebar / account area 結構
  - merchant operational index pages、settings/detail pages、workflow pages 已開始共用 shared shell / section baseline
  - customer dashboard routes 已對齊 shared shell + page shell
- 目前基線:
  - backend shell / page shell 新 work 一律優先收斂到 `src/components/merchant/shell`

### Phase 4

- 主題:
  - shared index / list UX
  - search / suggestions / filters / sort / pagination / empty state / list-detail consistency
- 已完成:
  - shared pagination / result bar 已進入 receipts / products / delete logs 與 dashboard customers / cases / activities
- inventory / marketing / dashboard activity sections 已開始共用 shared empty state baseline
- inventory search、product-management search/create、marketing brand search 已開始共用 `SearchToolbar` + `MerchantSectionCard`
- inventory `product-management`、marketing lookup / brand blocks 已開始共用 `MerchantListShell`
- inventory `settings` 與 `product-management` 已共用 product create / edit list helper
- inventory `settings` / `product-management` 與 `/dashboard/products` 已進一步共用 `ItemFormFields`，主分類 / 第二分類 / 自動命名欄位不再雙軌
- marketing category / supplier 已共用 create form 與 editable lookup list helper
- checkout customer lookup 已改成 walk-in 隱藏搜尋欄 + keyword-only suggestions；案件勾選卡只在 selected customer 有 checkout-eligible cases 時顯示，且 checkout UI 已拆到 `components/dashboard/checkout/*`
- dashboard cases create flow 已補 customer mode selector；新增客戶維持既有建立／合併客戶流程，加入現有客戶則要求選定 company-scoped `existingCustomerId`
- dashboard cases detail 的 repair info tab 會固定顯示；未 accepted quote 進入時先走報價狀態 gate，可不改狀態進入或更新為 accepted。維修資訊仍沿用 Ticket 欄位與既有 update action，但 repair edit mode 只暴露維修人員、維修狀態、維修配件、備註、歷史摘要、報價狀態；`repairParts[]` 以庫存商品 `productId` 為主鍵，可新增多筆並調整使用數量，server 以舊/新數量差額呼叫 focused inventory service 扣庫存或補回庫存；`quoteStatus` 新增 `requote`（再次報價），`resolved` 作為完成維修顯示。結帳守門由 case detail action 先完成 status transition，再讓 checkout 以 `caseId` 預選案件
- 目前基線:
  - operational list/index UX 新 work 應優先回到 shared toolbar / list shell / empty state / pagination pattern

### Phase 5

- 主題:
  - Firebase read/write optimization
  - duplicated relationship read flow 收斂
  - catalog read caching / invalidation baseline
- 已完成:
- merchant catalog categories / brands / models / name entries / suppliers 已開始共用 service-level warm cache，降低 repeated Firestore reads
- `getCatalogDimensionBundle(companyId)` 已對齊同一個 company override，不再混用 session scope
- category schema 已支援 `parentCategoryId` / `categoryLevel` / `fullPath`，主分類 rename 會同步維護第二分類顯示路徑
- `src/lib/schema/itemNamingSettings.ts` 與 `src/lib/services/item-naming-settings.service.ts` 已成為 merchant item naming 設定的 focused baseline
- customer relationship snapshot 已抽成 shared read-model，集中 customer / ticket / sale / activity / purchase 載入
  - `dashboard/relationships` 不再對每位 customer 各自重跑 `getCustomerRelationshipSnapshot`
  - customer detail page 已改為直接消費 shared relationship record，減少 route-load duplicated fetches
  - customer list page 已改為 shared summary read-model，customer/ticket/sale linkage 規則開始一致
  - customer detail page 已進一步收斂到 one-shot detail read-model，集中 relationship / entitlements / redemptions / pickup reservations
  - dashboard route load 已開始集中到 `dashboard-read-model.service.ts`，避免 page-local orchestration 漂移
  - cases tab route data 會透過 focused customer read-model 載入 customer lookup，供新增案件表單綁定現有客戶，不新增 route / component 對 `commerce.ts` 的直接依賴
  - `listActivityPurchases` 已抽到 focused read-model，避免 customer / relationship flow 直接依賴 `commerce.ts`
  - customer identity linkage 已移除最後的 plain-name fallback；僅以 `id` / `email` / `phone` 關聯，避免同名客戶誤併
  - activity purchase linkage 已優先帶 `activityId`；若缺 id，只在名稱唯一時才 fallback 到 `activityName`
  - predictive search / checkout item 綁定已優先用 `meta.productId`，名稱 fallback 僅允許唯一 match
  - sales / tickets / entitlements / pickup reservations / campaign-consignment 已補上 warm cache + write invalidation baseline
  - merchant customer / activity / product / inventory / catalog / marketing route actions 已開始透過 focused write wrappers 匯入
  - checkout route data 已集中到 `merchant/checkout-route-data.service.ts`；案件 eligibility 改由 `merchant/checkout-case-selector.service.ts`；地區化單據 preview / form parsing 改由 `services/checkout/document-service.ts`
  - checkout sale snapshot 已寫入 `checkoutDocument`，後續 Receipt Center / template renderer 可直接沿用，不必再從 route-local 表單字串重建
  - receipt / invoice document lifecycle 已集中到 focused services：invoice settings / track / draft / issue / void / platform adapter / logs / carriers / receipt documents；receipt center 與 invoice settings routes 已改走 merchant invoice-admin read/write wrapper，不再把單據邏輯塞回 page.tsx 或 raw sales list
- 目前基線:
  - relationship-heavy pages 應優先共用 shared read-model service，不要在 route layer 針對每筆資料 fan-out 查詢
  - catalog read-heavy pages 應優先依賴 service cache / invalidation baseline，不要在 route layer 自行重複抓 lookup lists
  - heavy workflow/list route data 應採 base + segmented deferred 策略；deferred 查詢需由使用者明確動作觸發，不要 page enter 時一次打包抓完
  - heavy tab/list links 預設關閉 prefetch（`prefetch={false}`）以避免切頁前預先觸發高成本 route-data 讀取
  - 新功能與日常維護一律預設納入 read-cost 設計（查詢範圍、觸發時機、快取與失效），在開發當下就降低資料庫讀取次數，避免累積到後期才做大規模成本優化
  - customer list / detail / relationship overview 應共用同一套 customer linkage helper，不要各自定義關聯規則
  - 新增案件若需綁現有客戶，應以 company-scoped `customerId` / `existingCustomerId` 作為關聯鍵；姓名／電話只作搜尋與顯示，不作唯一關聯來源
  - dashboard / workspace route 應優先收斂到 focused route-data service，再把結果交給 page / workspace
  - route action import 應優先走 `merchant/*-write.service.ts` wrappers，不要新增對 `commerce.ts` action 的直接依賴
  - item naming / catalog hierarchy 這類 merchant lookup 設定，應優先走 focused schema / service helper，不要回退成 page-local 字串拼接規則
  - checkout 後單據輸出、receipt center、作廢 / 重開與平台 adapter 狀態，應優先沿用 `receiptDocuments` + invoice focused services；不要回退成從 `sales` 臨時重建發票資料

### Phase 6

- 主題:
  - loading / processing UX
  - route change / page transition feedback
  - save / update / delete / builder save / async action visible state
- 已完成:
  - shared processing UI 已集中到 `src/components/ui/processing-indicator.tsx`、`src/components/ui/processing-state.tsx`、`src/components/ui/processing-overlay.tsx`
  - root layout 已補上 `src/components/layout/navigation-progress.tsx` route progress bar
  - `src/app/loading.tsx` 與 `src/app/(merchant)/loading.tsx` 已對齊 shared loading state baseline
  - `MerchantPageShell` 已統一路由切換 / form submit overlay，不再手寫 page-local processing modal
  - auth login / forgot password / reset password / Google link 已對齊 shared spinner feedback
  - sign out、theme sync、ticket attributes save、password change、staff Google binding、homepage/showcase builder save/upload 已補齊 visible processing state
- 目前基線:
  - 新的 async UX 應優先重用 shared processing helpers 與 route progress baseline，不要再長出 silent long-running actions 或散落 spinner 樣式

### Phase 7

- 主題:
  - i18n consistency
  - shared bilingual UI vocabulary
  - reusable shell / settings / builder chrome text alignment
- 已完成:
  - shared UI vocabulary 已集中到 `src/lib/i18n/ui-text.ts`
  - root layout 已透過 `src/components/layout/ui-language-provider.tsx` 提供 app-wide UI language context
  - shared shell / sign-out / loading / processing 文案已切到 shared translation keys
  - account security / account page / ticket attributes / delete control / delete logs 已開始共用同一套 bilingual UI text baseline
  - boss admin login / workspace / homepage builder 已對齊 shared bilingual vocabulary，減少中英混用的 builder chrome
- 目前基線:
  - reusable UI text 應優先放進 shared translation dictionary，不要再在 page / shared component 內散落 hard-coded framework copy
  - database-stored content 保持 content-driven；只把 UI chrome、status label、filter/pagination/empty-state 文案放進 i18n layer

### Phase 8

- 主題:
  - storefront builder template architecture
  - block registry / insertable template library
  - block instance order model / variant-aware preview
- 已完成:
  - showcase builder content model 已從固定 block map 轉成 instance id order + locale block record，相容舊資料並可新增多個 template instance
  - shared block registry 已集中到 `src/features/showcase/services/showBlockRegistry.ts`
  - showcase builder 已支援 template insertion / remove / reorder / preset content
  - hero 已支援 `left-copy` / `center-copy` / `split-screen` variants
  - ad 已支援 `single-banner` / `slider` / `card-rail` variants
  - preview renderer 已支援 `cta` / `promo` / variant-aware hero/ad section rendering
- 目前基線:
  - showcase builder 新增 template / variant 時，應優先回到 shared block registry 與 shared renderer，而不是在 builder component 內硬塞 page-local block 分支
  - content persistence 應繼續維持 normalize/serialize 相容層，避免既有 merchant showcase preferences 因 schema 升級而失效

## Implemented Naming / Boundary Decisions

### Tenant Scope

- `src/lib/tenant-scope.ts`
  - canonical normalization helper
  - 集中 `normalizeCompanyId`
  - 集中 `normalizeTenantId`
  - 集中 `normalizeAuthTenantId`

- `src/lib/services/user.service.ts`
  - 已有 `getUserCompanyId`
  - `getShowcaseTenantId` 保留 public alias 語意
  - 內部 company scope 不應再拿 `getShowcaseTenantId` 當 canonical helper

### Shared Types

- `src/lib/types/customer.ts`
- `src/lib/types/merchant-product.ts`
- `src/lib/types/promotion.ts`
- `src/lib/types/inventory.ts`
- `src/lib/types/repair-brand.ts`
- `src/lib/types/reporting.ts`

`src/lib/types/commerce.ts` 現在是 compatibility barrel，不應作為新 code 的第一選擇。

### Ticket / Case

- `src/lib/types/ticket.ts` 是 canonical ticket type
- `src/lib/schema/cases.ts` 是 legacy Firestore bridge
- 目前保留 `TicketCaseRecord` 與相容 alias

### Product / Item

- business record canonical name 是 `Product`
- Firestore collection path 維持 `products`
- merchant UI 中文顯示為「品項」
- merchant UI 英文顯示為 `Item`
- `product*` route / service / type naming 目前可保留作為 compatibility naming，不需要為了 UI 文案改動核心資料模型名稱

### Account / Business Profile / Receipt Settings

- auth account summary 目前只承載登入身分欄位，不再混公司資料或收據設定
- `src/lib/schema/business-profile.schema.ts` 是公司主資料 canonical schema
- `src/lib/schema/regional-receipt-settings.schema.ts` 是地區單據與稅務欄位 canonical schema
- `src/lib/schema/receipt-template.schema.ts` 負責 receipt / invoice preview model 推導
- `src/lib/services/merchant/account-settings-read-model.service.ts` 是 `/settings/account` route data 聚合入口
- `src/lib/services/merchant/account-settings-write.service.ts` 是 `/settings/account` write-side wrapper
- `src/lib/services/company-profile-compat.service.ts` 只負責舊 `settings/companyProfile` compatibility fallback / sync，不應再成為新 caller 的第一入口

### Focused Service Wrappers

- `src/lib/services/merchant/activity-read-model.service.ts`
- `src/lib/services/merchant/activity-purchase-read-model.service.ts`
- `src/lib/services/merchant/customer-directory-read-model.service.ts`
- `src/lib/services/merchant/customer-summary-read-model.service.ts`
- `src/lib/services/merchant/customer-detail-read-model.service.ts`
- `src/lib/services/merchant/customer-relationship-read-model.service.ts`
- `src/lib/services/merchant/customer-read-model.service.ts`
- `src/lib/services/merchant/inventory-read-model.service.ts`
- `src/lib/services/merchant/dashboard-read-model.service.ts`
- `src/lib/services/merchant/audit-log-read-model.service.ts`
- `src/lib/services/item-naming-settings.service.ts`
- `src/lib/services/platform/bossadmin-reporting.service.ts`

規則:

- 新的 read-side caller 優先從這些檔案 import
- 不要讓新 route / page / feature 直接依賴 `src/lib/services/commerce.ts`

## Merchant Catalog / Item Naming Baseline

- `src/lib/types/catalog.ts`
  - category 已支援 `categoryLevel`、`parentCategoryId`、`parentCategoryName`、`fullPath`
  - product naming token 已集中成 `brand` / `model` / `category` / `secondaryCategory`

- `src/lib/services/merchant/catalog-service.ts`
  - catalog category normalize / list / update 以階層分類為基線
  - 主分類與第二分類 display/search 應優先使用 `fullPath`

- `src/lib/services/productNaming.ts`
  - shared item auto-naming helper
  - 預設排序為 `brand -> model -> secondaryCategory`

- `src/lib/schema/itemNamingSettings.ts`
- `src/lib/services/item-naming-settings.service.ts`
  - merchant item naming settings canonical path 是 `companies/{companyId}/settings/itemNaming`
  - 品項快速命名排序應集中讀寫這裡，不要在多個 workspace 各自保存一份 page-local 規則

### Focused Write Wrappers

- `src/lib/services/merchant/customer-write.service.ts`
- `src/lib/services/merchant/activity-write.service.ts`
- `src/lib/services/merchant/product-write.service.ts`
- `src/lib/services/merchant/inventory-write.service.ts`
- `src/lib/services/merchant/catalog-write.service.ts`
- `src/lib/services/merchant/marketing-write.service.ts`

規則:

- merchant route / page action imports 優先從這些 focused write wrapper 進入
- 若 wrapper 已存在，後續不應再在 route layer 直接 import `src/lib/services/commerce.ts` action

## Compatibility Layers That Are Intentional

- `src/lib/types/commerce.ts`
- `src/lib/schema/customer-entitlements.ts`
- `src/lib/schema/pickup-reservations.ts`
- `src/app/(platform)/bosadmin/page.tsx`
- `src/lib/services/commerce.ts`

規則:

- 這些可以暫時保留
- 但不應擴散新的直接依賴

## Firebase Reset / Seed Baseline

- `scripts/reset-firebase-data.mjs`
  - clean reset Firestore demo baseline
  - recreate managed company/customer Firebase Auth demo accounts
  - seed stable `companies/{companyId}` data for Company A / B / C
  - seed official homepage baseline
  - remove stray `bossadmin@gmail.com` Firebase Auth account if present

- `docs/multi-tenant-data-flow.md`
  - reset preconditions
  - demo login matrix
  - official / merchant / customer route baseline
  - BossAdmin boundary notes

## Shared Shell / Layout Baseline

- `src/components/merchant/shell/merchant-app-shell.tsx`
  - shared backend app shell
  - official / merchant / customer backend 都以同一種 shell 結構為基礎

- `src/components/merchant/shell/merchant-page-shell.tsx`
  - shared page shell
  - overview / index / default page width 與 page header 結構已收斂

- `src/components/merchant/shell/merchant-account-menu.tsx`
- `src/components/merchant/shell/merchant-topbar-link-bar.tsx`
- `src/components/merchant/shell/merchant-shell-presets.ts`
  - topbar quick links
  - shared account area
  - grouped sidebar presets for official / merchant / customer
  - shell labels 與 customer dashboard copy 已集中，避免 official / merchant / customer 重複文案漂移

- result-heavy list pages
  - `src/lib/pagination/query-controls.ts`
  - `src/lib/ui/list-display.ts`
  - `src/app/(merchant)/dashboard/receipts/page.tsx`
  - `src/app/(merchant)/dashboard/products/page.tsx`
  - `src/app/(merchant)/settings/security/delete-logs/page.tsx`
  - `src/components/settings/DeleteLogsPanel.tsx`
  - receipts / products / delete logs 已開始共用 cursor stack、page-size baseline 與 shared list/search shell pattern，避免 page-local helper 漂移

- merchant operational index pages
  - `src/app/(merchant)/sales/page.tsx`
  - `src/components/sales/SalesWorkspace.tsx`
  - `src/app/(merchant)/products/used/page.tsx`
  - `src/components/used-products/used-products-management-panel.tsx`
  - `src/app/(merchant)/staff/page.tsx`
  - `src/components/staff/StaffManagementPanel.tsx`
  - `src/app/(merchant)/staff/deleted/page.tsx`
  - `src/components/staff/StaffDeletedRecordsPanel.tsx`
  - sales / used products / staff / deleted staff 已對齊 shared page shell 與 shared list/search toolbar pattern

- merchant settings / detail pages
  - `src/app/(merchant)/settings/account/page.tsx`
  - `src/app/(merchant)/settings/account/attributes/page.tsx`
  - `src/app/(merchant)/settings/dashboard/page.tsx`
  - `src/app/(merchant)/account/security/page.tsx`
  - `src/app/(merchant)/settings/security/delete-control/page.tsx`
  - `src/components/account/AccountSecurityPanel.tsx`
  - `src/components/account/BusinessProfileForm.tsx`
  - `src/components/account/RegionalReceiptSettingsCard.tsx`
  - `src/components/settings/ChangePasswordForm.tsx`
  - `src/components/settings/TicketAttributesSettingsPanel.tsx`
  - `src/components/settings/SecuritySettingsPanel.tsx`
  - `src/components/settings/DeleteControlSettingsForm.tsx`
  - account / dashboard settings / delete-control / ticket attributes 已開始對齊 shared page shell 與 shared section card pattern

- merchant workflow pages
  - `src/app/(merchant)/dashboard/checkout/page.tsx`
  - `src/components/dashboard/CheckoutWorkspace.tsx`
  - `src/components/dashboard/checkout/CheckoutCustomerCard.tsx`
  - `src/components/dashboard/checkout/CheckoutCaseSelectorCard.tsx`
  - `src/components/dashboard/checkout/CheckoutItemsCard.tsx`
  - `src/components/dashboard/checkout/CheckoutDocumentSettingsCard.tsx`
  - `src/components/dashboard/checkout/CheckoutReceiptPreviewCard.tsx`
  - checkout workflow 已對齊 shared section card pattern，並把案件 eligibility、TW/AU document settings 與 preview 拆到 focused child components / services

- shared index / list UX baseline
  - `src/components/merchant/shell/search-toolbar.tsx`
  - `src/components/merchant/shell/merchant-toolbar.tsx`
  - `src/components/merchant/shell/merchant-list-shell.tsx`
  - `src/components/merchant/shell/merchant-list-pagination.tsx`
  - `src/components/merchant/shell/empty-state-card.tsx`
  - `src/components/merchant/shell/merchant-section-card.tsx`
  - receipts / products / delete logs 已開始共用 shared pagination / result bar
  - `src/components/dashboard/CompanyDashboardWorkspace.tsx` 的 customers / cases / activities tabs 也已開始共用 shared pagination 與 empty state baseline
  - inventory / marketing / dashboard activity sections 也已開始共用 shared empty state baseline，避免散落的 page-local 空資料文案
  - inventory search、product-management search/create、marketing brand search 已開始共用 `SearchToolbar` + `MerchantSectionCard`
  - inventory `product-management` 與 marketing 的 lookup / brand blocks 已開始共用 `MerchantListShell` list/detail 容器
  - inventory `stock / product-management / stock-in / stock-out` 已開始共用 inventory logs detail panel，往一致的 list + detail shell 收斂
  - inventory `settings` 與 `product-management` 的 product create / edit list 已開始共用同一組 panel helper，降低 view-local duplication
  - marketing 的 category / supplier create forms 與 editable lookup lists 已開始共用 helper，避免兩條清單維護時漂移
  - Phase 4 目前先聚焦 operational list/index UX，不先擴散新的 service dependency

- customer dashboard routes
  - `src/app/(customer)/customer-dashboard/page.tsx`
  - `src/app/(customer)/[tenantId]/dashboard/layout.tsx`
  - `src/app/(customer)/[tenantId]/dashboard/page.tsx`
  - tenant-aware customer dashboard 也已對齊 shared shell + page shell

## Shared Processing Baseline

- `src/components/ui/processing-indicator.tsx`
  - canonical inline spinner + label

- `src/components/ui/processing-state.tsx`
  - canonical loading card / notice

- `src/components/ui/processing-overlay.tsx`
  - canonical blocking overlay for page transition / submit processing

- `src/components/layout/navigation-progress.tsx`
  - shared route progress bar for anchor / submit / imperative navigation feedback

- `src/app/loading.tsx`
- `src/app/(merchant)/loading.tsx`
- `src/components/merchant/shell/merchant-page-shell.tsx`
  - app / merchant route transition and submit feedback baseline

規則:

- important flows should expose visible processing feedback
- route change / page transition should prefer shared progress/loading baseline
- builder save / upload / theme sync / auth / async settings writes should not stay silent

## Shared i18n Baseline

- `src/lib/i18n/ui-text.ts`
  - canonical shared UI vocabulary / translation keys
  - shell / processing / settings / delete logs / boss admin builder 等 reusable UI text 以這裡為主

- `src/components/layout/ui-language-provider.tsx`
  - app-wide UI language context provider
  - shared client components 應優先透過這層取得 UI language，而不是各自重讀 cookie

規則:

- route-level page titles / subtitles 若屬於 reusable interface layer，應優先回到 shared i18n key
- shared shell / toolbar / empty state / loading state / builder chrome 應避免散落 duplicated bilingual ternary
- DB content 與 UI chrome 要分層，避免把 business content translation 跟 framework text 混在同一層

## Showcase Builder Template Baseline

- `src/features/showcase/services/showBlockRegistry.ts`
  - canonical block registry / preset content factory
  - builder 插入器與 normalize fallback 應優先共用這層

- `src/features/showcase/services/showContentPreferences.ts`
  - 舊 fixed-block 偏好設定與新 instance-order model 的相容 normalize / serialize 層

- `src/features/showcase/components/ShowcaseBuilder.tsx`
  - showcase builder 三欄工作台
  - 已支援 insert / remove / reorder / variant selection

- `src/features/showcase/components/companyHomeDefault/blockRenderer.tsx`
- `src/features/showcase/components/companyHomeDefault/sections.tsx`
  - preview renderer 已支援 variant-aware hero / ad，以及新的 CTA / promo sections

## Safe Starting Point For Future Work

如果下一輪繼續做，優先順序應該是:

1. 繼續把剩餘 merchant routes 的 action imports 切到 focused write wrappers，完成 route-layer boundary 收斂
2. 把 `src/lib/services/commerce.ts` 內仍在被 wrapper 承接的 product / catalog / marketing write-side 實作真正內移到 focused service，讓 item/category flow 脫離 compatibility 層
3. 視需要把 customer summary / activity purchases / consignments 下沉成更穩定的 aggregate doc 或 projection，進一步降低高流量頁面的即時計算成本
4. 把後續 MOF / VAC adapter payload mapping、response mapping、retry / webhook / reconciliation 補進 `invoice-platform.service.ts`，維持 mock / test / production 同一 adapter 邊界
5. 視需要補上 draft review / manual issue UI，讓 `autoIssueOnCheckout = false` 時可從後台完成審核與開立
6. 視需要讓 downstream receipt / checkout / invoice generation 直接吃 `BusinessProfile` + `RegionalReceiptSettings` + `receiptDocuments` / preview model，逐步移除對舊 `settings/companyProfile` compatibility doc 的需求
7. 視需要把 `src/components/dashboard/CompanyDashboardWorkspace.tsx` 內剩餘大型 tab 拆成 focused workspace；activities form 已抽成 `ActivityFormPanel`，後續可優先處理 customers / cases 與 list-detail orchestration
8. 繼續把剩餘 shared settings / list / builder framework text 收斂到 `ui-text.ts`，完成 Phase 7 邊角補漏
9. 視需要把 checkout / 活動 / 庫存報表 等 downstream flow 一起接上第二分類與 item naming settings，完成 merchant item baseline 擴散

## Validation Commands

每次收尾都要跑:

- `pnpm -s lint`
- `pnpm -s exec tsc --noEmit`
- `pnpm -s exec next build --webpack`
- `pnpm run verify`

## New Chat Starter

```text
請先讀 /home/leo/dev/ticket-core/docs/project-rules.md
以及 /home/leo/dev/ticket-core/docs/project-summary.md
再繼續工作，並延續其中的 canonical naming、architecture、shell 與 service boundary 規則。
新 work 不要新增對 src/lib/services/commerce.ts 或 src/lib/types/commerce.ts 的直接依賴，除非是在做 compatibility 收斂。
```
