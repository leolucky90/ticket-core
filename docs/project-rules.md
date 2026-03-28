# Project Rules

## Purpose

`ticket-core` 是 Leo SaaS + AI 的核心專案。

它是多租戶 ERP + Repair System + POS + Commerce platform，現階段先聚焦手機 / 裝置維修商家，後續再擴展到其他產業。

目前定位:

- proposal-ready portfolio project
- resume-ready product showcase
- future SaaS + AI product foundation
- current business context starts from mobile / device repair operations

這份文件是之後所有新對話、規則更新、實作決策的 canonical 規格來源之一。
新的工作在開始前，應先讀:

- `docs/project-rules.md`
- `docs/project-summary.md`

## Core Stack

- Next.js 16 App Router
- TypeScript strict mode
- pnpm
- Tailwind CSS v4
- CSS variables theme only
- lucide-react

## Validation

所有工作都必須通過:

- `pnpm -s lint`
- `pnpm -s exec tsc --noEmit`
- `pnpm -s exec next build --webpack`
- `pnpm run verify`

不可留下:

- broken imports
- dead code
- duplicated shell/layout markup
- invalid types
- outdated routes
- unused components/services/types
- lint warnings

## Architecture Rules

### UI Layer

Path: `src/components/ui`

- reusable presentational components only
- no business logic

### Domain Layer

Path: `src/lib/types`

- centralize all schemas, enums, and types
- keep entity definitions aligned and reusable
- new shared types should prefer focused modules over compatibility barrels

### Service Layer

Path: `src/lib/services`

- CRUD logic
- business rules
- relationship sync logic
- no heavy business logic inside `page.tsx`
- new read-side callers should prefer focused service modules over `src/lib/services/commerce.ts`

### AI Layer

Path: `src/lib/ai`

- encapsulate AI helper logic only
- AI must not directly overwrite production data
- human-in-the-loop is required

### Route Layer

Path: `src/app`

- compose pages only
- keep route responsibilities light
- avoid large Tailwind-heavy page files
- prefer reusable sections/components/hooks/services

## Coding And UI Rules

- functional components only
- `page.tsx` may default export
- other files should prefer named export
- no hard-coded colors
- no `text-white`
- no inline styles unless clearly necessary for controlled dynamic sizing
- theme colors only use:
  - `rgb(var(--bg))`
  - `rgb(var(--panel))`
  - `rgb(var(--panel2))`
  - `rgb(var(--text))`
  - `rgb(var(--muted))`
  - `rgb(var(--border))`
  - `rgb(var(--accent))`

## Authentication And Demo Accounts

Planned validation / reset target after Firebase rebuild:

- password for all demo accounts: `123456`

Official hidden login:

- `http://localhost:3000/bossadmin`
- `bossadmin@gmail.com`

User login entry:

- `http://localhost:3000`

Company A:

- `admina@gmail.com`

Company A customer:

- `cxa@gmail.com`

Company B:

- `adminb@gmail.com`

Company B customer:

- `cxb@gmail.com`

## Canonical Naming Rules

### Tenant / Company

- internal tenant key 一律用 `companyId`
- public route param / domain alias 才用 `tenantId`
- Firestore root canonical path 是 `companies/{companyId}`
- 不要把 `tenantId` 當 internal DB canonical field name

### Ticket / Case

- business model canonical name 是 `Ticket`
- Firestore collection path 暫時維持 `cases`
- 新 code 不要再擴散新的 `case*` 主型別
- UI 中文可顯示為「案件」，英文可顯示為 `Tickets`

### Customer

- customer business record canonical name 是 `CustomerProfile`
- auth identity 不等於 customer business record
- `users/{uid}` 保存登入身分與租戶關聯
- `companies/{companyId}/customers/{customerId}` 保存客戶商業資料

### Marketing

- merchant 管理主體長期 canonical name 是 `Campaign`
- checkout pricing / entitlement snapshot canonical name 是 `Promotion`
- `Activity` 目前只當 legacy dashboard/read-model 名詞

### Official Backend

- official backend canonical name 是 `BossAdmin`
- `bosadmin` 只當 typo compatibility route

## Current Ground Truth

目前穩定資料中心仍然是 Firestore `companies/{companyId}` 多租戶模型。

主要路徑:

- `users/{uid}`
- `companies/{companyId}`
- `companies/{companyId}/customers/{customerId}`
- `companies/{companyId}/cases/{caseId}`
- `companies/{companyId}/sales/{saleId}`
- `companies/{companyId}/staffMembers/{staffMemberId}`
- `companies/{companyId}/settings/*`
- `companies/{companyId}/app_config/*`

現況主要問題不是沒有模型，而是同一概念在不同層被叫成不同名字:

- `tenantId` 和 `companyId` 經常其實是同一個值
- `case` 和 `ticket` 指向同一條主線
- `activity` / `campaign` / `promotion` 混用
- `bossadmin` 不屬於一般 Firebase 使用者角色語意

## Role Boundary Map

| Zone | Who | Auth Source | Data Scope | Allowed Writes | Must Not Own |
| --- | --- | --- | --- | --- | --- |
| Official / `BossAdmin` | 平台營運者 | `bossadmin` cookie | cross-company read, official homepage settings | official homepage content, platform query views | merchant company operational data flow |
| Merchant | owner / admin / manager / staff / viewer | Firebase session + `users/{uid}` + optional `staffMembers` record | single `companyId` | company-scoped CRUD, settings, staff, inventory, campaigns, showcase prefs | cross-tenant reads, platform admin |
| Customer | 終端客戶 | Firebase session + `users/{uid}` + bound `customerId` | single `companyId`, own customer record | own profile-adjacent actions, customer dashboard interactions | merchant settings, staff, other customers' data |
| Public Showcase | 匿名訪客或分享流量 | none or public host mapping | public-facing content for one tenant | none | authenticated operational mutations |

### Merchant Role Layering

- Firebase account role layer: `owner`, `company_admin`, `manager`, `staff`, `viewer`, `customer`
- merchant permission layer: `PermissionLevel` + `StaffMember.roleLevel`

規則:

- `UserDoc.role` 解決帳號類型
- `PermissionLevel` 解決公司內授權能力

## Entity Relationship Map

### Identity And Tenancy

```text
users/{uid}
  -> role
  -> companyId
  -> customerId?

companies/{companyId}
  -> ownerUid
  -> slug / subdomain / public domain
```

### Merchant Operator Side

```text
companies/{companyId}
  -> staffMembers/{staffMemberId}
  -> permissionLevels/lv{n}
  -> settings/companyProfile
  -> settings/delete-control
  -> deleteLogs/{logId}
  -> auditLogs/{logId}
```

### Customer And Repair Flow

```text
companies/{companyId}
  -> customers/{customerId}
  -> cases/{caseId}
  -> sales/{saleId}
  -> app_config/showcase
```

主要關聯:

- `UserDoc.companyId` -> `companies/{companyId}`
- `UserDoc.customerId` -> `companies/{companyId}/customers/{customerId}`
- `Ticket.customerId` -> `customers/{customerId}`
- `Sale.customerId` -> `customers/{customerId}`
- `Sale.caseId` / `Sale.caseRefs[*].caseId` -> `cases/{caseId}`
- `StaffMember.uid` -> `users/{uid}`

### Derived Read Models

下列內容目前屬於 aggregate / snapshot / read model，不應被視為 source of truth:

- `customer360.ts` 組出的 `Order`, `Receipt`, `Payment`, `Warranty`, `DiagnosticReport`
- `merchantOverview.ts` 的 relationship overview rows
- boss admin revenue stats

## Database Content Vs UI / i18n Text

### Must Be Stored In DB

- 公司名稱、商店顯示名稱、聯絡資訊
- 客戶名稱、電話、地址、Email
- ticket / case 標題、備註、維修原因、維修建議
- product / used product / campaign 商業內容
- homepage/showcase builder 區塊內容
- slug、subdomain、domain、public homepage mapping
- 狀態碼與 enum code

### Must Stay In UI / i18n Layer

- shell text
- sidebar / topbar 導航文案
- page title / subtitle
- toolbar labels
- button text
- empty state title / description
- filter label / pagination label / result count label
- status code 的翻譯字串
- settings labels

### Status Storage Rule

DB 儲存 code:

- `company_admin`
- `customer`
- `new`
- `in_progress`
- `inspection_estimate`
- `active`

UI 再翻譯顯示:

- 管理員 / Customer
- 新案件 / In Progress
- 初步報價 / Active

## Current Implemented UI State

### Homepage

`/` 已經升級成比較專業的 portfolio / proposal / product narrative page。

已完成:

- stronger SaaS + AI positioning
- proposal-friendly and resume-friendly copy
- tech stack section
- AI roadmap / progress wording
- repair-business context framing
- personal background integration
- demo/test account section
- more modern visual treatment
- motion / animation support
- improved first-screen spacing and reduced blank-gap issue

主要相關檔案:

- `src/features/business/components/BusinessLandingPage.tsx`
- `src/features/business/services/businessHomepageContent.ts`
- `src/styles/globals.css`
- `src/app/layout.tsx`

### Official / Merchant / Customer Shell Alignment

三個 backend zone 應盡量共用 shell logic:

- official backend
- merchant backend
- customer backend

目前方向:

- company side 用 `ProtectedShell -> MerchantAppShell`
- customer side 也走相同 shell path
- official backend 雖然 auth 不同，但 UI 結構應對齊 `MerchantAppShell` / `MerchantPageShell`

已完成:

- official backend 已與 merchant shell 結構對齊
- grouped sidebar + topbar pattern 已更接近 merchant/company
- page shell usage 已更接近 merchant pages

主要檔案:

- `src/components/merchant/shell/*`
- `src/components/layout/ProtectedShell.tsx`
- `src/app/(platform)/bossadmin/page.tsx`
- `src/components/dashboard/BossAdminWorkspace.tsx`

## Merchant Zone Target

merchant zone 要重構成 unified page shell system。

規則:

- 不要再持續做 page-by-page ad hoc layout
- 不要把 CRUD/list page 做成自由排序 card builder
- 重複 UI pattern 應優先收斂成 shell / shared components

## Required Merchant Shell Types

### 1. Merchant App Shell

- topbar
- grouped sidebar navigation
- consistent main content container
- responsive layout
- shared spacing and shell structure

### 2. Overview Shell

適用:

- dashboard
- relation overview
- inventory summary homepage
- receipt summary homepage if needed

結構:

- page header
- action area
- KPI stat grid
- trend/chart area
- recent activity
- secondary cards / alerts

### 3. Index Shell

適用:

- tickets
- customers
- receipts
- inventory list
- products
- campaigns

結構:

- page header
- toolbar
- list/table section
- expand row / drawer / detail panel
- pagination or secondary actions

這些 operational page 必須保持 list-first，不是 freeform builder。

### 4. Builder / Settings Shell

適用:

- storefront content settings
- storefront style settings
- section enable/disable
- section ordering
- page builder-like editing

結構:

- section list
- selected section editor
- preview and/or style controls

只有 builder/settings experience 才把 sortable order 當 primary UX。

## Merchant Sidebar Rules

建議群組:

### 總覽

- 首頁
- 儀表板
- 開聯總覽

### 交易

- 結帳
- 收據

### 客戶服務

- 案件
- 客戶

### 商品與營運

- 庫存管理
- 產品管理
- 二手商品
- 活動促銷
- 寄店總覽

### 商店

- 商店營銷設定
- 展示頁設定
- 樣式設定

### 管理

- 員工管理
- 角色權限
- 刪除控制 / 刪除紀錄
- 帳戶設定 / 安全設定

要求:

- clearer active state
- better visual grouping
- less stack-of-large-buttons feeling
- preserve current style language but make it scalable

## Standard Shared Merchant Components

`src/components/merchant/shell/`

- `merchant-app-shell.tsx`
- `merchant-topbar.tsx`
- `merchant-sidebar.tsx`
- `merchant-sidebar-group.tsx`
- `merchant-page-shell.tsx`
- `merchant-page-header.tsx`
- `merchant-section-card.tsx`
- `merchant-toolbar.tsx`
- `merchant-stat-grid.tsx`
- `merchant-stat-card.tsx`
- `merchant-list-shell.tsx`
- `merchant-empty-state.tsx`
- `merchant-builder-shell.tsx`
- `merchant-widget-grid.tsx`
- `merchant-widget-card.tsx`
- `merchant-content-layout.tsx`

規則:

- reuse existing components when possible
- do not duplicate shell markup

## Shared Page Rules

### Page Header

每個 merchant page 應支援:

- title
- subtitle
- actions
- optional tabs

### Section Card

共用 section card 應支援:

- title
- optional description
- optional right-side actions
- body content
- empty state support

### Toolbar

所有 index pages 應共用:

- search
- filters
- sort
- optional bulk actions
- primary CTA

### Empty States

不要只顯示 plain empty text。

應使用 reusable empty state:

- icon
- title
- description
- CTA if applicable

### KPI Cards

共用 stat card 應支援:

- label
- value
- hint
- optional trend / status text

## Page Type Mapping

- dashboard -> Overview Shell
- checkout -> workflow page built on `MerchantPageShell`
- receipts -> Index Shell
- tickets -> Index Shell
- customers -> Index Shell
- inventory -> split into Overview + Index patterns where appropriate
- products -> Index Shell
- campaigns -> Index Shell + editor panel
- relation overview -> Overview Shell
- storefront content settings -> Builder Shell
- storefront style settings -> Builder Shell
- official homepage builder -> Builder Shell aligned with storefront builder

## Current UI Problems To Solve

- layout is repetitive but not truly standardized
- some pages use card-like structures where list shells would be better
- page headers are inconsistent
- list pages lack shared toolbar logic
- builder pages are mixed with CRUD patterns
- sidebar structure is too flat
- content density and spacing are inconsistent
- empty states are too plain
- page relationships are not surfaced consistently
- loading / processing states are not fully standardized
- pagination / filter UX is inconsistent
- smart suggestion UX is not yet fully available in all search fields

## Showcase / Storefront Builder State

目前 storefront builder 已有較好的 UI，但 data model 仍是 fixed-block based。

已完成:

- modern 3-column builder UI
- synchronized official and merchant builder visual language
- preview viewport controls
- browser-like preview zoom control
- zoom steps `50 60 70 80 90 100 110 120`
- default preview zoom = `70%`
- nested-button hydration bug fixed
- preview identity selector removed from merchant showcase builder

目前限制:

- fixed blocks 仍是 `hero`, `about`, `services`, `contact`, `ad`
- 還不是真正的 dynamic block registry

## Builder Expansion Plan

### Stage 1: Template Insertion MVP

允許插入 reusable predefined sections:

- Hero
- CTA
- Promo Banner
- Ad Slider

支援:

- add
- remove
- reorder
- apply preset copy/content

### Stage 2: Block Variants

例如:

- hero: `left-copy`, `center-copy`, `split-screen`
- ad: `single banner`, `slider`, `card rail`

為了做到這點，fixed-block schema 要進化成:

- block registry
- block instance array
- variant-based render system
- reusable section template library

主要可能涉及:

- `src/features/showcase/types/showContent.ts`
- `src/features/showcase/services/showContentPreferences.ts`
- `src/features/showcase/components/ShowcaseBuilder.tsx`

## Data / Firebase Refactor Goals

### Firebase Reset And Reseed

- clear and rebuild Firebase data
- create demo/test accounts
- rebuild data with cleaner tenant boundaries

### Read / Write Optimization

- minimize Firebase reads/writes
- reduce duplicate queries
- reduce repeated page-load fetches
- centralize relationship sync logic
- keep same-name entities linked consistently

### Naming Cleanup

- align duplicated names across schema, services, routes, UI
- rename where necessary to reduce ambiguity
- ensure shared entities stay linked semantically

## Platform-Wide UX Rules

Across official / merchant / customer backends:

- same shell/layout where possible
- same account info area
- same sign-out pattern
- same settings access pattern
- same loading/processing feedback pattern
- same search/filter/list UX language
- same pagination/filter exposure for result views
- same visual rules for similar actions

Required checks:

- page changes should show visible processing state where appropriate
- login / route change / form submit / data fetch should have clear feedback
- searchable list pages should support smart suggestion where feasible
- result-heavy pages should support page count and filter options
- same entity names should remain linked across flows

## i18n Rule

除了 raw database-stored content，visible UI 應可切換中英文。

包含:

- shell text
- toolbar text
- page headers
- shared actions
- empty states
- result labels
- settings labels

## Recommended Implementation Order

1. define data model, naming rules, role boundaries first
2. rebuild / reseed Firebase with test accounts
3. finish shared shell/layout extraction across official / merchant / customer
4. align shared list/search/filter/pagination patterns
5. optimize Firebase read/write flow and reduce duplication
6. standardize loading / processing UX
7. complete i18n consistency pass
8. upgrade storefront builder from fixed blocks to insertable template architecture

## Important Architectural Notes

- preserve the existing project architecture
- do not blindly rewrite the whole app
- prefer improving and extracting shared structure
- remove repeated layout markup when safe
- keep business logic out of page components
- keep components composable and reusable
- keep builder flexibility limited to dashboard / storefront / builder contexts
- CRUD pages should remain stable operational pages, not freeform layout editors

## Shared Types / Prop Contracts

至少應明確定義與維持:

- `MerchantPageShellProps`
- `MerchantSectionCardProps`
- `MerchantToolbarProps`
- `MerchantStatItem`
- `BuilderSectionItem`

## Deliverables Direction

merchant zone 長期目標是完整 shared shell system 與 page refactor。

要求:

- no broken imports
- no dead code
- no duplicated shell markup
- route connectivity still works
- lint / tsc / build / verify all pass

維護註解只在必要處補上，特別是:

- shell type decisions matter
- sortable builder behavior is intentionally limited to dashboard / storefront / builder contexts
- CRUD pages intentionally use fixed operational structures

## Compatibility Layer Rules

下列檔案目前是刻意保留的 compatibility layers:

- `src/lib/types/commerce.ts`
- `src/lib/schema/customer-entitlements.ts`
- `src/lib/schema/pickup-reservations.ts`
- `src/app/(platform)/bosadmin/page.tsx`
- `src/lib/services/commerce.ts`

規則:

- 可以保留
- 但新程式碼不要再擴散對它們的直接依賴

## Safe Import Rules

新 work 優先使用:

- customer type: `@/lib/types/customer`
- merchant product read-model: `@/lib/types/merchant-product`
- promotion/activity read-model: `@/lib/types/promotion`
- reporting stats: `@/lib/types/reporting`
- inventory log: `@/lib/types/inventory`
- repair brand: `@/lib/types/repair-brand`
- merchant activity reads: `@/lib/services/merchant/activity-read-model.service`
- merchant customer reads: `@/lib/services/merchant/customer-read-model.service`
- merchant inventory reads: `@/lib/services/merchant/inventory-read-model.service`
- dashboard aggregate read: `@/lib/services/merchant/dashboard-read-model.service`
- boss admin reporting: `@/lib/services/platform/bossadmin-reporting.service`

## Things To Avoid

- 不要新增新的 local `normalizeTenantId` / `normalizeCompanyId`
- 不要把 `tenantId` 當 internal DB canonical field name
- 不要新增新的 `case` 主型別與 `Ticket` 並存
- 不要把 `Activity` 當長期 canonical merchant entity 名詞
- 不要讓 page / route 直接塞 heavy business logic
- 不要把新的 shared type 再塞回 `types/commerce.ts`
- 不要把 official / merchant / customer auth boundary 混進同一套 role semantics
