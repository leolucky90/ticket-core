# Multi-tenant Data Flow

> **Docs 版本／更正：** 見 [`DOCUMENTATION-VERSION.md`](./DOCUMENTATION-VERSION.md)

For canonical naming, role-boundary, architecture, and refactor glossary, see:

- `docs/project-rules.md`
- `docs/project-summary.md`

## Firestore hierarchy

- `companies/{companyId}`
  - Company root profile (`id`, `name`, `slug`, `subdomain`, owner info)
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
- A/B user docs, customer docs, staff baseline, company profile, security settings
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
