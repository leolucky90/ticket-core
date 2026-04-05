# Multi-tenant Data Flow

> **Docs 版本／更正：** 見 [`DOCUMENTATION-VERSION.md`](./DOCUMENTATION-VERSION.md)

For canonical naming, role-boundary, architecture, and refactor glossary, see:

- `docs/project-rules.md`
- `docs/project-summary.md`

## Firestore hierarchy

- `companies/{companyId}`
  - Company root profile (`id`, `name`, `slug`, `subdomain`, owner info)
  - **Merchant account settings（canonical split）**
    - `settings/businessProfile` — 公司主資料（companyName、displayName、contactName、phone、email、website、address、country、region、postcode）
    - `settings/regionalReceiptSettings` — 地區單據設定（businessRegion、locale、currency、timezone、documentMode、TW/AU 稅務欄位與 notes）
    - `settings/invoiceSettings` — 單據整合模式（mock / mof-test / mof-production / vac-test / vac-production）、自動開立、作廢後重開與 mock failure flags
    - `settings/companyProfile` — **legacy compatibility bridge only**；新功能不應再直接依賴
  - **Invoice / receipt documents（TW 電子發票 + AU Receipt / Invoice / Tax Invoice）**
    - `invoiceTrackSettings/{trackId}` — 台灣合法字軌池與各模式文件號碼策略
    - `invoiceDrafts/{draftId}` — checkout 或後台建立的 draft，待後續 issue
    - `receiptDocuments/{documentId}` — canonical 已開立單據主資料（receipt / invoice / tax-invoice / electronic-invoice）
    - `invoiceVoids/{voidId}` — 作廢 request / response / operator / reason
    - `invoiceCarriers/{carrierId}` — TW 載具記錄與會員預設載具
    - `invoiceLogs/{logId}` — draft / track allocate / issue / void / reissue 流程 log
  - **Receipt / PO intake（OCR + AI，人工確認後寫入採購單）**
    - `intakeDocuments/{documentId}` — 檔名、MIME、狀態（`uploaded` → `draft_ready` → `confirmed`）
    - `ocrResults/{ocrId}` — `documentId`、`rawText`
    - `poDrafts/{draftId}` — 採購草稿（含 `poDraftSnapshot`、人工確認前不建立正式 PO）
    - `purchaseOrders/{poId}` — 確認後之採購單快照
  - 需 **Google Cloud Vision**（`GOOGLE_CLOUD_*`）與 **OpenAI**（`OPENAI_API_KEY`，選用 `OPENAI_PO_MODEL`，預設 `gpt-4o-mini`）。後台仍使用既有 `FIREBASE_ADMIN_JSON_BASE64`。
- `companies/{companyId}/customers/{customerId}`
  - Company customer profile (`emailLower`, `userUid`, `name`, `phone`, ...)
- `companies/{companyId}/cases/{caseId}`
  - Case data, must include `companyId` and `customerId`
- `companies/{companyId}/sales/{saleId}`
  - Sales data, must include `companyId`
  - checkout / POS sale 可附帶 `checkoutDocument` snapshot（businessRegion、documentMode、buyerType、TW/AU 單據欄位），作為後續 receipt center / template renderer 的 canonical 單據輸出來源
- `companies/{companyId}/categories/{categoryId}`
  - 商店營銷目錄分類（`CategoryDoc`）；支援 `categoryLevel: 1 | 2 | 3`
  - canonical naming：主分類 → 第一層子分類（第二層分類）→ 第二層子分類（第三層分類）
  - 維修配件零件等級（例如 `AMP` / `BQ7` / `Service Pack`）應落在第三層 category，不再用 model naming 冒充
- `companies/{companyId}/brands/{brandId}`
  - 商店營銷目錄品牌（`BrandDoc`）；`linkedCategoryNames` / `productTypes` 與 catalog-service normalize 規則對齊
  - `linkedCategoryNames` 只承接泛用主分類（例如 `手機` / `平板` / `手錶` / `維修配件`），`productTypes` 才承接 `iPhone` / `Galaxy S` / `iWatch` 等品牌家族
- `companies/{companyId}/models/{modelId}`
  - 商店營銷目錄型號（`ModelDoc`）；`categoryId` / `categoryName` 只承接泛用主分類，`productTypeName` 才承接品牌家族，`name` 只放家族下型號 suffix
  - 型號不承接維修配件零件等級；零件等級仍落在第三層 category
  - item create / filter selector 連動基線：`linkedCategoryNames` 決定分類可用品牌，`productTypes` / `productTypeName` 決定品牌家族可用範圍，`ModelDoc.categoryId/categoryName` + `productTypeName` 共同決定最終可選型號
  - 若主分類為 `維修配件`，第二／第三層 category 代表零件階層而非裝置家族；selector 在這條 flow 應以品牌可用 `productTypeName` 與其對應 model 為主，不可直接用 `Screen` / `Battery` / `AMP` / `BQ7` 等 category 去把 model list 篩成空
- `companies/{companyId}/usedProductTypeSettings/{settingId}`
  - 二手商品規格模板 baseline；canonical source 仍是品牌文件內的 `usedProductTypes`
  - 若 brand 已啟用 `usedProductTypes` 但此 collection 尚未建立，read-side 應自動回補 active settings，避免二手商品建立頁與規格模板頁顯示 0 類型
- `companies/{companyId}/permissionLevels/lv{1..9}`
  - 權限等級定義與 `permissions` 字串陣列（與 `StaffMember.roleLevel` 對應）
- `companies/{companyId}/auditLogs/{auditLogId}`
  - 操作稽核（module／action／targetId／operator）；寫入 `createAuditLog`，列表頁 `/settings/security/audit-logs`
- **Multi-store / warehouse inventory（optional；與既有 `inventory/{productId}` 公司彙總並存）**
  - `companies/{companyId}/stores/{storeId}` — 分店（`companyId`）
  - `companies/{companyId}/warehouses/{warehouseId}` — 倉（`companyId`, `storeId`）
  - `companies/{companyId}/warehouseInventory/{warehouseId_productId}` — 倉別 onHand／reserved／available
  - `companies/{companyId}/stockItems/{id}` — 逐件 IMEI／序號
  - `companies/{companyId}/inventoryLogs/{id}` — 倉別異動時間軸（`transfer_in` / `transfer_out` 等）
  - `companies/{companyId}/transfers/{id}` — 調貨單（選用，`createTransferDoc`）
- `users/{uid}`
  - Login identity and tenant binding (`role`, `companyId`, `customerId`)

## Access rules in app service layer

- Company pages (`/ticket`, `/sales`) only query and mutate data under current session's `companyId`.
- Customer ticket history (`/ticket/history`) only reads cases under current customer's `companyId` and matches customer email.
- Showcase / dashboard preferences read/write by tenant path `companies/{tenantId}/app_config/*`.
- Tenant preference lookup no longer falls back to global legacy docs when `tenantId` is present.

### 為何 `admina@gmail.com` 與 `adminb@gmail.com`（以及 `adminc@gmail.com`）看到的「商店／展示首頁」內容不同？

這是 **預期行為（租戶隔離）**，不是同步 bug。

- `admina@gmail.com` 的 `users/{uid}.companyId` 為 **`company_a`**；`adminb@gmail.com` 為 **`company_b`**；`adminc@gmail.com` 為 **`company_c`**。
- 公開租戶首頁（例如 `/company_a`、`/company_b`、`/company_c`）與商家預覽 **`/company-home`** 讀取的展示偏好，來自 **`companies/{companyId}/app_config/showcase`**（見 `getShowcasePreferences` / `saveShowcasePreferences`）。
- 在後台以 **某一公司管理員** 儲存的展示內容，只會寫入 **`companies/{該 companyId}/...`**，**不會**自動複製到其他租戶。因此「A 有同步到更正、B 沒有」代表 B（或 C）的 Firestore 文件仍是舊內容或種子基線，需在 **登入對應租戶** 後於 **`/settings/showcase`**（或同等 builder 流程）再存一次，或手動更新該文件／重跑 reset 種子。
- `/settings/showcase` 目前編輯的是租戶 storefront 的 `content`、`themeColors` 與 `storefront` 設定；後台 shell 的 `light` / `dark` / `custom` appearance toggle 仍在 `/settings/dashboard`，不是 storefront builder 內被隱藏的一組 mode switch。
- **官方入口首頁 `/`** 讀的是平台層 **`app_config/business_homepage`**（BossAdmin／官方 builder），與各租戶的 `app_config/showcase` **分開**；不要與 `/company_a`、`/company_b`、`/company_c` 混為同一資料來源。
- 租戶首頁上的 **結構化 Builder Hero／輪播**（`ShowHomePage` 預設 props）目前共用程式內 **`TENANT_BUILDER_HOMEPAGE_CONFIG`**；租戶間主要差異通常來自 **`showcase` 文件內的 `content`／`themeColors`／`storefront`** 等已持久化欄位。種子腳本亦為 A／B／C 寫入不同預設文案（例如 `heroTitle`:「A 公司首頁」、「B 公司首頁」、「C 公司首頁」）。
- `/settings/account` 應優先透過 focused account-settings read-model / write wrapper 讀寫 `settings/businessProfile` 與 `settings/regionalReceiptSettings`，不要在 route layer 直接拼 auth metadata 或舊 `companyProfile` 混合欄位
- 商店營銷目錄／品項建立若需分類維度，應優先延續 shared `DimensionPicker` 與 canonical product fields：`categoryId` / `categoryName`、`secondaryCategoryId` / `secondaryCategoryName`、`tertiaryCategoryId` / `tertiaryCategoryName`、`productTypeName`、`modelId` / `modelName`
- `/dashboard/checkout` 應優先透過 `merchant/checkout-route-data.service.ts` 讀取 customer / ticket / inventory / `settings/businessProfile` / `settings/regionalReceiptSettings`，並用 `merchant/checkout-case-selector.service.ts` 判斷是否顯示案件卡；checkout 不應自行複製一份獨立的地區設定
- `/dashboard/checkout` 完成結帳後，應優先沿用 sale snapshot 的 `checkoutDocument` 與 `settings/invoiceSettings` 走 `invoice-issue.service.ts` 建立 `invoiceDrafts` / `receiptDocuments`；不要在 checkout route layer 臨時重組 platform payload
- `/dashboard/receipts` 與 `/dashboard/receipts/[id]` 應以 `receiptDocuments` 為 canonical document master，透過 `merchant/invoice-admin-read-model.service.ts` / `merchant/invoice-admin-write.service.ts` 讀寫；作廢 / 重開不可刪除原單據
- `/settings/account/invoices` 與 `/settings/account/invoice-tracks` 應優先讀寫 `settings/invoiceSettings`、`invoiceTrackSettings`，不要把字軌或整合模式資訊塞回 `regionalReceiptSettings`

## Registration binding

- Company sign-up:
  - Public / official registration entry is `/register/company`.
  - Creates/updates `users/{uid}` with role `company_admin`, `companyId`.
  - Ensures `companies/{companyId}` exists.
- Customer sign-up:
  - Only available from a tenant/company-scoped merchant entry point (`/register/customer?tenant={companyId}` or equivalent storefront flow).
  - Requires tenant/company context.
  - Creates/updates `users/{uid}` with role `customer`, `companyId`, `customerId`.
  - Creates/updates `companies/{companyId}/customers/{customerId}`.

## Reset and test data

Run:

```bash
pnpm reset:firebase
```

Demo merchant/customer passwords always match `src/lib/demo-account-password.ts` (`DEMO_ACCOUNT_PASSWORD`). If sign-in fails because Auth passwords no longer match that constant (for example after manual changes), run `pnpm sync:demo-auth-passwords` to update only the six seeded Firebase Auth users (A/B/C 各 admin + customer), or run `pnpm reset:firebase` for a full Firestore + Auth baseline.

This script clears demo Firestore baseline and recreates:

- official homepage baseline at `app_config/business_homepage`
- Company A / Company B / Company C company roots under `companies/{companyId}`
- A/B/C admin and customer Firebase Auth accounts
- A/B/C user docs, customer docs, staff baseline, businessProfile / regionalReceiptSettings compatibility baseline, security settings
- one sample ticket and one sample sale per company
- marketing catalog suppliers / brands / categories / models are not part of the reset baseline; manage them directly in canonical company collections when needed
- Company A baseline
  - `companyId`: `company_a`
  - public route: `/company_a`
  - merchant login: `admina@gmail.com` / `123456`
  - customer login: `cxa@gmail.com` / `123456`
  - customer dashboard: `/company_a/dashboard`
- Company B baseline
  - `companyId`: `company_b`
  - public route: `/company_b`
  - merchant login: `adminb@gmail.com` / `123456`
  - customer login: `cxb@gmail.com` / `123456`
  - customer dashboard: `/company_b/dashboard`
- Company C baseline
  - `companyId`: `company_c`
  - public route: `/company_c`
  - merchant login: `adminc@gmail.com` / `123456`
  - customer login: `cxc@gmail.com` / `123456`
  - customer dashboard: `/company_c/dashboard`

Boundary note:

- `BossAdmin` remains hidden `/bossadmin` cookie auth and is not seeded as a Firebase `users/{uid}` role account

Environment note:

- emulator mode requires both `FIRESTORE_EMULATOR_HOST` and `FIREBASE_AUTH_EMULATOR_HOST`
- hosted Firebase mode requires `FIREBASE_ADMIN_JSON_BASE64`
- hybrid mode is not supported by the reset script
