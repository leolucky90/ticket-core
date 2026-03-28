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

This script clears old shared collections and recreates:

- Company A / Company B
- A/B admin and customer auth accounts
- A/B user docs and customer docs
- one sample case and one sample sale per company
