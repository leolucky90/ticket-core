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
- `/settings/account` 應優先透過 focused account-settings read-model / write wrapper 讀寫 `settings/businessProfile` 與 `settings/regionalReceiptSettings`，不要在 route layer 直接拼 auth metadata 或舊 `companyProfile` 混合欄位
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

Demo merchant/customer passwords always match `src/lib/demo-account-password.ts` (`DEMO_ACCOUNT_PASSWORD`). If sign-in fails because Auth passwords no longer match that constant (for example after manual changes), run `pnpm sync:demo-auth-passwords` to update only the four seeded Firebase Auth users, or run `pnpm reset:firebase` for a full Firestore + Auth baseline.

This script clears demo Firestore baseline and recreates:

- official homepage baseline at `app_config/business_homepage`
- Company A / Company B company roots under `companies/{companyId}`
- A/B admin and customer Firebase Auth accounts
- A/B user docs, customer docs, staff baseline, businessProfile / regionalReceiptSettings compatibility baseline, security settings
- one sample ticket and one sample sale per company
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

Boundary note:

- `BossAdmin` remains hidden `/bossadmin` cookie auth and is not seeded as a Firebase `users/{uid}` role account

Environment note:

- emulator mode requires both `FIRESTORE_EMULATOR_HOST` and `FIREBASE_AUTH_EMULATOR_HOST`
- hosted Firebase mode requires `FIREBASE_ADMIN_JSON_BASE64`
- hybrid mode is not supported by the reset script
