# Project Summary

## How To Use This File Set

之後新的對話、摘要更新、handoff 都以這兩個檔案為主:

- `docs/project-rules.md`
- `docs/project-summary.md`

如果要在新對話延續上下文，應先讀這兩個檔案，再開始工作。

## Iteration Update Rules

之後迭代更新時，為了避免越做越散，固定遵守這些規則:

- 不新增新的 phase recap / handoff / temp docs；優先只更新這兩份 canonical docs
- 有新的 shared helper、shared shell、service boundary、route baseline、demo baseline 變動時，同一輪必須同步更新 docs
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
- Firebase reset / seed baseline 已補齊到 `scripts/reset-firebase-data.mjs`
- demo account / tenant baseline 已整合到 `docs/multi-tenant-data-flow.md`
- `BossAdmin` reset 邊界已明確維持在 hidden cookie login，不進 `users/{uid}`
- shared shell / layout baseline 已集中到 `src/components/merchant/shell`
- official / merchant / customer backend 已開始共用同一套 topbar / sidebar / account area 結構
- merchant result-heavy pages 已開始共用 `query-controls` + `LIST_DISPLAY_OPTIONS` pagination baseline
- merchant operational index pages 已開始共用 `MerchantPageShell` + `SearchToolbar` + `MerchantListShell` + `MerchantSectionCard`
- merchant settings/detail pages 已開始共用 `MerchantPageShell` + `MerchantSectionCard` section baseline
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
- builder save / image upload / theme sync 已補齊 visible processing state，避免 silent async actions
- Phase 7 i18n consistency baseline 已開始收斂到 shared UI vocabulary 與 UI language provider
- shared shell / processing / settings / delete logs / boss admin builder 已開始共用同一套 bilingual UI keys，減少 page-local hard-coded framework text
- Phase 8 builder template baseline 已開始收斂到 showcase block registry、instance order model 與 variant-aware preview renderer
- storefront builder 不再只綁死固定 block map；已支援 template insertion / remove / reorder 與 hero / ad variants
- merchant catalog 已支援主分類 / 第二分類階層與 `fullPath` 顯示基線，marketing / item management 共用同一套分類語意
- 商店營銷分類設定已改為左側樹狀清單（主分類可展開第二分類）+ 右側新增／編輯／刪除面板；品項自動命名支援選填「副品名」接在自動帶入名稱後（`customLabel` 在 structured 模式下僅存副品名）；品項快速命名設置預設以 `<details>` 收起
- 儀表板「商店營銷設定」分頁已改為頂部區塊選單（分類／供應來源／品牌／二手商品）+ `MerchantBuilderShell` 左清單右編輯區；已移除重複的「商店營銷設置 · 維修品牌型號」搜尋工具列；品牌編輯與型號邏輯收斂至 `MarketingBrandEditor` + `src/lib/marketing/brand-catalog-helpers.ts`
- 「二手商品」子區塊與供應來源／品牌對齊：`UsedProductTypeSettingsCard` 使用 `MerchantBuilderShell`，左欄為啟用中的二手類型清單（搜尋、清單顯示筆數、可點選列），右欄為該類型之規格模板列表與新增／編輯規格表單（不再用整頁 `<details>` 摺疊列表）
- merchant item naming baseline 已集中到 `companies/{companyId}/settings/itemNaming` 與 shared helper，支援品牌 / 型號 / 主分類 / 第二分類排序
- dashboard inventory `settings` / `product-management` 與 `/dashboard/products` 已共用同一套 `ItemFormFields`，避免第二分類與自動命名只存在單一路徑
- merchant item management UI 中文已統一用「品項」，英文用 `Item`；canonical data model 仍維持 `Product`
- shared processing state spinner 已對齊真正置中，staff 帳號登入也會正確回補 `staffProfile`
- iteration guardrails 已文件化到 canonical docs，之後 phase 收斂與 docs 更新應只回到 `project-rules.md` / `project-summary.md`
- `lint` / `tsc` / `build` / `verify` 已通過
- 目前沒有 lint warning

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
- 目前基線:
  - 新 work 不應擴散對 `src/lib/services/commerce.ts` 與 `src/lib/types/commerce.ts` 的直接依賴

### Phase 2

- 主題:
  - Firebase reset / seed / test accounts
  - stable demo baseline
  - tenant isolation baseline
- 已完成:
  - `scripts/reset-firebase-data.mjs` 已補齊 reset / seed 流程
  - Company A / B demo account 與 official homepage baseline 已整合
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
  - `listActivityPurchases` 已抽到 focused read-model，避免 customer / relationship flow 直接依賴 `commerce.ts`
  - sales / tickets / entitlements / pickup reservations / campaign-consignment 已補上 warm cache + write invalidation baseline
  - merchant customer / activity / product / inventory / catalog / marketing route actions 已開始透過 focused write wrappers 匯入
- 目前基線:
  - relationship-heavy pages 應優先共用 shared read-model service，不要在 route layer 針對每筆資料 fan-out 查詢
  - catalog read-heavy pages 應優先依賴 service cache / invalidation baseline，不要在 route layer 自行重複抓 lookup lists
  - customer list / detail / relationship overview 應共用同一套 customer linkage helper，不要各自定義關聯規則
  - dashboard / workspace route 應優先收斂到 focused route-data service，再把結果交給 page / workspace
- route action import 應優先走 `merchant/*-write.service.ts` wrappers，不要新增對 `commerce.ts` action 的直接依賴
- item naming / catalog hierarchy 這類 merchant lookup 設定，應優先走 focused schema / service helper，不要回退成 page-local 字串拼接規則

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
  - seed stable `companies/{companyId}` data for Company A / B
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
  - `src/components/account/company-profile-settings-form.tsx`
  - `src/components/settings/ChangePasswordForm.tsx`
  - `src/components/settings/TicketAttributesSettingsPanel.tsx`
  - `src/components/settings/SecuritySettingsPanel.tsx`
  - `src/components/settings/DeleteControlSettingsForm.tsx`
  - account / dashboard settings / delete-control / ticket attributes 已開始對齊 shared page shell 與 shared section card pattern

- merchant workflow pages
  - `src/app/(merchant)/dashboard/checkout/page.tsx`
  - `src/components/dashboard/CheckoutWorkspace.tsx`
  - checkout workflow 的客戶 / promotions / cases / line items / receipt preview 區塊已開始對齊 shared section card pattern

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
4. 視需要把 `src/components/dashboard/CompanyDashboardWorkspace.tsx` 內的大型 tab 拆成 focused workspace，降低 shared list UX 與 item form 後續維護成本
5. 繼續把剩餘 shared settings / list / builder framework text 收斂到 `ui-text.ts`，完成 Phase 7 邊角補漏
6. 視需要把 checkout / 活動 / 庫存報表 等 downstream flow 一起接上第二分類與 item naming settings，完成 merchant item baseline 擴散

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
