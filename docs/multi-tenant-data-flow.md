# Multi-tenant Data Flow

For canonical naming, role-boundary, architecture, and refactor glossary, see:

- `docs/project-rules.md`
- `docs/project-summary.md`

## Firestore hierarchy

- `companies/{companyId}`
  - Company root profile (`id`, `name`, `slug`, `subdomain`, owner info)
- `companies/{companyId}/customers/{customerId}`
  - Company customer profile (`emailLower`, `userUid`, `name`, `phone`, ...)
- `companies/{companyId}/cases/{caseId}`
  - Case data, must include `companyId` and `customerId`
- `companies/{companyId}/sales/{saleId}`
  - Sales data, must include `companyId`
- `users/{uid}`
  - Login identity and tenant binding (`role`, `companyId`, `customerId`)

## Access rules in app service layer

- Company pages (`/ticket`, `/sales`) only query and mutate data under current session's `companyId`.
- Customer ticket history (`/ticket/history`) only reads cases under current customer's `companyId` and matches customer email.
- Showcase / dashboard preferences read/write by tenant path `companies/{tenantId}/app_config/*`.
- Tenant preference lookup no longer falls back to global legacy docs when `tenantId` is present.

## Registration binding

- Company sign-up:
  - Creates/updates `users/{uid}` with role `company_admin`, `companyId`.
  - Ensures `companies/{companyId}` exists.
- Customer sign-up:
  - Requires tenant/company context.
  - Creates/updates `users/{uid}` with role `customer`, `companyId`, `customerId`.
  - Creates/updates `companies/{companyId}/customers/{customerId}`.

## Reset and test data

Run:

```bash
pnpm reset:firebase
```

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
