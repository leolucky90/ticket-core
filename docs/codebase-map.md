# Codebase Map（目錄與模組導航）

> **Docs 版本／更正：** 見 [`DOCUMENTATION-VERSION.md`](./DOCUMENTATION-VERSION.md)

本檔為 **補充導航**，不取代規格。Canonical 規則與 ground truth 仍以：

- `docs/project-rules.md`
- `docs/project-summary.md`

為準。資料流與 demo 帳號見 `docs/multi-tenant-data-flow.md`。

重構、新增 shared shell／service boundary／主要路由時，請同步更新本檔對應小節，避免路徑過時誤導後續開發與 AI 檢索。

---

## 專案根目錄

| 路徑 | 說明 |
| --- | --- |
| `src/` | 應用程式原始碼（App Router、元件、lib） |
| `scripts/` | 維運腳本（例如 `reset-firebase-data.mjs`） |
| `docs/` | Canonical 與補充文件；**文件集版本／更正日**見 `DOCUMENTATION-VERSION.md`；**提案／完整版藍圖**（技術 + Pricing／Stripe 規劃／onboarding／白牌／Demo Flow）見 `saas-erp-ai-blueprint.md` |

---

## `src/app` — 路由層（僅組裝，避免厚重業務邏輯）

採 **Next.js App Router**；區段以 route groups 分區。

### 公開／平台 `(platform)`

| 區域 | 用途 |
| --- | --- |
| `(platform)/page.tsx` | 入口首頁（portfolio／敘事） |
| `(platform)/login`、`forgot-password`、`reset-password` | 認證流程頁 |
| `(platform)/register/company`、`register/customer` | 註冊；前者為官方用戶／商家註冊，後者僅限 tenant-scoped 商家客戶註冊 |
| `(platform)/business` | 商業／提案相關落地 |
| `(platform)/bossadmin` | **BossAdmin** 官方後台（hidden cookie login） |
| `(platform)/bosadmin` | 拼字相容路由，導向 bossadmin |

### 商家後台 `(merchant)`

主要營運後台；layout 內通常組 `MerchantAppShell`／`MerchantPageShell` 與對應 workspace／panel。

| 路徑片段 | 主題 |
| --- | --- |
| `dashboard/` | 儀表板、結帳、收據／發票清單與詳情、`purchase-orders`（採購草稿／AI 預留）、客戶詳情、關聯總覽、寄售、品項列表等 |
| `sales/` | 銷售／結帳相關工作區 |
| `staff/`、`staff/new`、`staff/[id]/edit`、`staff/deleted` | 員工管理、軟刪待處理／歷史 |
| `products/used/` | 二手商品 |
| `settings/` | 帳戶、發票設定、字軌設定、儀表板偏好、展示頁、安全、刪除控制、刪除紀錄、**操作稽核**（`security/audit-logs`）、角色權限等 |
| `account/security` | 帳戶安全（與 settings 分工並存時以實際頁面為準） |
| `company-home/` | 商家前台相關（若與 showcase 並存，以路由為準） |

### 客戶端 `(customer)`

| 路徑片段 | 用途 |
| --- | --- |
| `customer-dashboard` | 客戶儀表入口 |
| `[tenantId]/`、`[tenantId]/dashboard`、`[tenantId]/shop` | 租戶別名路徑下的客戶流程 |
| `site/[tenantId]/` | 另一組客戶／站台路徑 |
| `site/by-host` | 依 host 解析 |

### 展示 `(showcase)`

| 路徑 | 用途 |
| --- | --- |
| `company-home/`、`company-home/shop` | 展示／商店展示頁 |

### 其他

| 路徑 | 用途 |
| --- | --- |
| `demo/receipt-po` | 收據 OCR → AI 草稿 Demo 頁（API 需商家 session） |
| `src/app/ai/chat` | AI 聊天入口（遵守 project-rules：AI 不直接覆寫正式資料） |
| `src/app/api/**` | Route Handlers（auth、bootstrap、merchant search、showcase upload、ticket-attributes、`document-intake` OCR+AI 收據、`products/search` 品項搜尋、`po/confirm`／`po/draft` 採購草稿確認 等） |
| `src/app/demo/builder` | Builder 模組預覽頁（官方／租戶 hero + carousel + 媒體欄位 URL／上傳預留 UI） |

---

## `src/components` — UI 與功能區塊

| 目錄 | 職責 |
| --- | --- |
| `components/ui/` | **純展示**可重用元件（button、processing、overlay 等）；無業務規則 |
| `components/ui/builder/` | 首頁 Builder 共用 UI：`HeroBackgroundMedia`、`AutoCarouselBanner`、`BuilderMediaField`（URL／上傳預留）、`BuilderUploadNotice`、輪播子元件與 `background/AnimatedBackground` |
| `components/merchant/shell/` | **商家 shell 基線**：`MerchantPageShell`、`MerchantSectionCard`、`MerchantListShell`、`SearchToolbar`、sidebar／topbar 等 |
| `components/merchant/search/` | 商家預測／搜尋輸入；dropdown loading / empty / error copy 已收斂到 `lib/i18n/ui-text.ts` |
| `components/merchant/catalog/` | 目錄維度選擇等共用 UI；`DimensionPicker` 已走 shared i18n，不在 page / form 內各自硬編欄位文案 |
| `components/layout/` | `ProtectedShell`、`ui-language-provider`、`navigation-progress` 等全站版面 |
| `components/dashboard/` | 儀表板大型 workspace（結帳、營銷設定、BossAdmin、品項等）；`components/dashboard/checkout/` 已拆出 checkout customer / case selector / items / document settings / preview cards |
| `components/staff/` | 員工列表、表單、軟刪／保險庫區塊等 |
| `components/settings/` | 刪除控制、刪除紀錄、**操作稽核**（`AuditLogsPanel`）、票務屬性、密碼表單等 |
| `components/account/` | 帳戶／安全相關面板；`AccountSummaryCard`、`BusinessProfileForm`、`RegionalReceiptSettingsCard`、`ReceiptTemplatePreview` 已將登入摘要、公司主資料、地區單據設定分離 |
| `components/invoices/` | 發票／單據模組 UI：checkout 共用欄位、狀態 badge、作廢 dialog、設定表單、字軌設定、document detail panel |
| `components/auth/` | 登入、Google、重設密碼等表單 |
| `components/sales/` | 銷售工作區 |
| `components/used-products/` | 二手商品管理 UI |
| `components/purchase-orders/` | 採購／訂購單草稿 UI（OCR+AI 上傳、`feature/receipt-po` 審核表單、人工建立、物流區塊預留） |
| `components/feature/receipt-po/` | 收據 intake 上傳、PoDraft 可編輯審核（`draft-editor`／目錄篩選 + 商品搜尋連動）；`components/feature/product/dimension-picker` 為 merchant DimensionPicker 之 re-export |
| `components/ai/` | AI 相關 UI 包裝 |

---

## `src/features` — 垂直功能模組

| 目錄 | 說明 |
| --- | --- |
| `features/business/` | 首頁／商業落地內容與服務 |
| `features/showcase/` | 展示頁 builder：`ShowcaseBuilder`、block registry、preferences、預設 template／renderer；builder 頂部引言、整套 editor labels 與 shell 文案已對齊 `lib/i18n/ui-text.ts`（`showcaseBuilderIntro`、`showcaseBuilderPage`、`merchantStandalonePages`）與 cookie `lang` |
| `features/dashboard/` | 儀表板相關 feature 服務（若與 `components/dashboard` 並用，讀取時注意邊界） |

Showcase 擴充時優先動：`showBlockRegistry.ts`、`showContentPreferences.ts`、`blockRenderer.tsx`（見 `project-rules.md` Storefront Builder Rule）。

---

## `src/lib` — 網域、服務、工具

| 檔案 | 說明 |
| --- | --- |
| `documentation-version.ts` | 首頁顯示之 **文件集版本** 字串；須與 `docs/DOCUMENTATION-VERSION.md` 同步 |

### 租戶與權限

| 檔案 | 說明 |
| --- | --- |
| `tenant-scope.ts` | **Canonical** `normalizeCompanyId` 等，勿在別處複製 normalize |
| `permissions.ts`、`permissionKeys.ts` | 權限鍵與規則輔助 |

### 型別 `lib/types/`

集中 **entity／業務型別**；新共用型別優先獨立模組，**不要**再擴散塞入 `types/commerce.ts`（該檔為 compatibility barrel）。

常用 canonical 模組包含：`customer.ts`、`ticket.ts`、`merchant-product.ts`、`catalog.ts`、`promotion.ts`、`inventory.ts`、`repair-brand.ts`、`reporting.ts`、`purchase-order.ts`（採購草稿，Firestore）、`builder.ts`（官方／租戶首頁 builder 結構化設定與媒體欄位語意）等。多店面／多倉：`merchant-store.ts`、`warehouse.ts`、`warehouse-inventory.ts`、`stock-item.ts`、`inventory-log.ts`（倉別時間軸）、`inventory-transfer.ts`。

### Schema `lib/schema/`

Firestore／資料形狀與 bridge；例如 `cases.ts`（ticket legacy）、`deleteLogs.ts`、`staffMembers.ts`、`itemNamingSettings.ts`、`business-profile.schema.ts`（公司主資料）、`regional-receipt-settings.schema.ts`（地區單據設定）、`receipt-template.schema.ts`（單據預覽 model）、`checkout-document.schema.ts`（checkout 單據欄位）、`invoice-settings.schema.ts`、`invoice-track-settings.schema.ts`、`invoice-draft.schema.ts`、`invoice.schema.ts`、`invoice-void.schema.ts`、`invoice-log.schema.ts`、`invoice-carrier.schema.ts`、`receipt-document.schema.ts`（單據主資料）、`ai/po-draft.ts`（OCR+AI 結構化草稿）、`receiptPoIntake.ts`（公司範圍 intake／po 路徑）等。`schema/index.ts` 匯出索引。

### 服務 `lib/services/`

| 區域 | 說明 |
| --- | --- |
| 根層各 `*.service.ts` / 模組 | 跨域或尚未下沉之服務（`user`、`staff`、`delete-log`、`ticket`、`sales`、`business-profile`、`regional-receipt-settings`、compat sync 等） |
| `services/merchant/` | **商家 read-model／catalog／write wrapper** 優先入口（`*-read-model.service.ts`、`*-write.service.ts`、`catalog-service.ts`、`product-service.ts`、`purchase-order-draft.service.ts` 採購草稿 Firestore 等）；`account-settings-read-model.service.ts` / `account-settings-write.service.ts` 已作為 `/settings/account` 的 canonical route-data / write 入口；`invoice-admin-read-model.service.ts` / `invoice-admin-write.service.ts` 已作為 `/settings/account/invoices`、`/settings/account/invoice-tracks`、`/dashboard/receipts*` 的 canonical route-data / write 入口；`checkout-route-data.service.ts` / `checkout-case-selector.service.ts` 已作為 `/dashboard/checkout` 的 canonical route-data / case eligibility 入口；`inventory-write.service.ts` 另 re-export 多倉調貨／倉別 log／IMEI／AI 補貨建議（實作於 `services/inventory/*`、`services/ai/reorder-service`）；**`audit-log-read-model.service.ts`** 讀取 `auditLogs`；customer/activity linkage 與 activity purchase read-model 也優先集中在此層，避免 route/page 直接用名稱比對資料流 |
| `invoice-*.service.ts`、`receipt-document.service.ts` | 單據核心流程：settings / tracks / drafts / issue / void / carriers / logs / platform adapter / receipt document persistence |
| `services/documents/` | 收據 intake、Po 確認／更新（`intake-document`、`save-document`、`confirm-po`、`update-po-draft`） |
| `services/ocr/`、`services/ai/` | Google Vision OCR、`extract-po-draft`（OpenAI JSON） |
| `services/db/firestore.ts` | Firestore 共用寫入／查詢 helper（`fbAdminDb`） |
| `services/platform/` | 平台層（如 `bossadmin-reporting.service.ts`） |
| `services/commerce.ts` | **Compatibility**：新程式碼勿新增直接依賴，除非做收斂遷移 |
| `checkout/`、`inventory/`（含 `inventory/timeline-service`、`transfer-service`、`imei-service`）、`services/ai/reorder-service`（補貨建議，不直寫庫存）、`entitlements/`、`pickupReservations/`、`promotions/` | 領域子模組；`services/checkout/document-service.ts` 提供 checkout document default / form parse / preview model，避免 TW/AU 規則散落在 UI |

### 其他 `lib/`

| 路徑 | 說明 |
| --- | --- |
| `lib/i18n/` | `ui-text.ts` 為共用 UI 字串主檔；與 `ui-language-provider` 搭配；含儀表板分頁抬頭（`dashboardWorkspaceTabs`）、dashboard flash、dashboard customers / cases / campaigns workspace（`dashboardCustomerCaseWorkspace`）、商店營銷 workspace（`marketingSettingsWorkspace`、`itemFormFields`、`dimensionPicker`、`predictiveSearchInput` 等）、獨立 merchant 路由 shell（`merchantStandalonePages`）、寄店總覽（`consignmentsOverview`）、Showcase 引言／editor labels（`showcaseBuilderIntro`、`showcaseBuilderPage`）等 |
| `lib/reporting/financial-summary.ts` | 儀表板用估計 COGS／毛利（銷售明細 × 品項成本） |
| `lib/pagination/query-controls.ts` | cursor 分頁控制共用邏輯 |
| `lib/ui/list-display.ts` | 列表 page-size 等共用常數 |
| `lib/format/` | 顯示用格式化（電話、日期時間等） |
| `lib/marketing/` | 營銷輔助（如品牌目錄） |
| `lib/ai/` | AI 輔助邏輯封裝（例如 `purchase-order-draft.ts` 採購草稿抽取 placeholder） |
| `lib/auth-enterprise/`、`lib/firebase*` | 伺服器／客戶端 Firebase 初始化與 CRUD 輔助 |

---

## `scripts/`

| 檔案 | 說明 |
| --- | --- |
| `reset-firebase-data.mjs` | Firebase 清空與 demo 種子；細節見 `multi-tenant-data-flow.md` |

---

## 樣式與全域

| 路徑 | 說明 |
| --- | --- |
| `src/styles/globals.css` | 主題 CSS variables（僅用專案規範之色票，見 `project-rules.md`） |

---

## 開發時快速對照

1. **改列表／工具列／分頁**：`components/merchant/shell`、`lib/pagination`、`lib/ui/list-display`。
2. **改 Firestore 規則或寫入路徑**：對應 `lib/services`（優先 `merchant/*-write.service.ts`）；若是單據模組則先看 `invoice-*.service.ts` / `receipt-document.service.ts`，並檢查 cache invalidation（若有 warm cache）。
3. **改展示頁 builder**：`features/showcase/`。
4. **改員工／刪除紀錄**：`staff.service.ts`、`delete-log.service.ts`、`app/(merchant)/staff/**`、`components/staff/**`。
5. **改 i18n 框架字串**：`lib/i18n/ui-text.ts`，避免在單一 page 硬編中英分支擴散。

---

## 維護

- 目錄大搬風、rename route group、抽出新 shared 模組時：更新本檔。
- 不必逐檔列出所有 `.tsx`；以 **目錄職責 + 關鍵入口** 為主，避免與 git 樹重複且易過時。
- **收據 OCR／採購 intake** 未來待辦與優化備註（PDF、rate limit、稽核、供應商比對等）集中於 `docs/project-summary.md` 的 **「收據／採購 intake — 待辦與後續優化」** 小節。
