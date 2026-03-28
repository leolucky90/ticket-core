# Moved

Canonical docs 已改成:

- `docs/project-rules.md`
- `docs/project-summary.md`

這個檔案只保留相容提醒，不再作為主規格來源。

## Current Ground Truth

目前真正穩定的資料中心仍然是 Firestore 的 `companies/{companyId}` 多租戶模型，已存在的主要路徑如下:

- `users/{uid}`
- `companies/{companyId}`
- `companies/{companyId}/customers/{customerId}`
- `companies/{companyId}/cases/{caseId}`
- `companies/{companyId}/sales/{saleId}`
- `companies/{companyId}/staffMembers/{staffMemberId}`
- `companies/{companyId}/settings/*`
- `companies/{companyId}/app_config/*`

現況問題不是「沒有多租戶模型」，而是同一個概念在不同層被叫成不同名字:

- `tenantId` 和 `companyId` 常常其實是同一個值
- `case` 和 `ticket` 指向同一條維修案件主線
- `activity`、`campaign`、`promotion` 在不同模組交錯使用
- `bossadmin` 是官方後台，但不屬於一般 Firebase 使用者角色

## Phase 1 Progress Snapshot

目前 repo 內已經先落地的收斂方向:

- `companyId` / `tenantId` / auth tenant normalization 已集中到 `src/lib/tenant-scope.ts`
- `CustomerProfile` 已抽成 `src/lib/types/customer.ts` 作為 canonical shared type
- `cases` schema 已明確標成 ticket legacy bridge，避免再把 `case` 當主模型名詞擴散
- `src/lib/types/commerce.ts` 已縮成 compatibility barrel，product / promotion / reporting / inventory / repair-brand 型別開始拆回 focused modules
- merchant read-side 已新增 focused service wrappers，頁面與 feature code 開始改走 `merchant/*-read-model.service.ts`

這表示後續 Firebase reset 前的命名工作，已經從「只有文件」進入「文件 + 實作同步收斂」階段。

## Canonical Naming Map

| Concept | Canonical Name | Allowed Alias | Use In | Do Not Use As Canonical |
| --- | --- | --- | --- | --- |
| Tenant root | `companyId` | `tenantId` | DB schema, services, internal types, relationship logic | 把 `tenantId` 當成 DB 主欄位名稱 |
| Public tenant route param | `tenantId` | `companyId` | URL、domain、showcase route params、auth query context | 在 service 層全面改叫 `tenantId` |
| Merchant company entity | `Company` | `Tenant Company` | `companies/{companyId}` root doc | `tenant` 單獨表示 DB entity |
| Repair job | `Ticket` | `Case` | Type name、service name、UI capability name | 新檔案再用 `CaseRecord` 當主模型 |
| Firestore ticket collection | `cases` | none | 現有 collection path | 在新 code 再擴散 `case*` 型別命名 |
| Customer business record | `CustomerProfile` | `CompanyCustomer` | `companies/{companyId}/customers/{customerId}` | 用 `Customer` 同時表示登入帳號與商業資料 |
| Customer login binding | `CustomerAccountMembership` | `customer account` | `users/{uid}` 與 customer profile 之間的關聯 | 直接把 customer profile 當 auth identity |
| Merchant staff record | `StaffMember` | `operator` | `companies/{companyId}/staffMembers/*` | 用 `user` 代替門市人員資料 |
| Permission tier | `PermissionLevel` | `role level` | staff authorization settings | 把 Firebase `role` 和門市權限等級混成同一層 |
| Merchant marketing entity | `Campaign` | `activity` | CRUD page、商家營運/活動資料 | 新 service 再用 `Activity` 當主名詞 |
| Checkout rule snapshot | `Promotion` | none | pricing engine、結帳套用結果、entitlement creation | 把 merchant 活動頁主模型全部叫 promotion |
| Catalog product | `Product` | `CatalogProduct` | inventory / checkout / merchant product domain | `ProductDoc` 在多個檔案各自定義不同 shape |
| Used device inventory | `UsedProduct` | 二手商品 | used device workflow | 用 `Product` 混指二手與一般商品 |
| Official backend | `BossAdmin` | official backend | platform-only UI and services | `bosadmin` 這個拼字 |

## Naming Decisions

### 1. `companyId` is the canonical internal tenant key

規則:

- Firestore 文件欄位一律以 `companyId` 為主
- service / schema / shared type 一律以 `companyId` 為主
- `tenantId` 只保留在 public routing、domain resolution、登入上下文 query string

原因:

- 現有 DB path 已經是 `companies/{companyId}`
- `register-profile`、`user.service`、`homepage-url.service` 實際都在把 `tenantId` 正規化後寫回 `companyId`
- 這表示 `tenantId` 現況本質上是 public alias，不是另一個獨立實體

### 2. `Ticket` is the canonical business model, `cases` stays as the legacy collection path

規則:

- Type / service / UI capability 以 `Ticket` 為主
- Firestore collection 仍維持 `companies/{companyId}/cases`
- UI 中文可顯示為「案件」，英文可顯示為 `Tickets`

原因:

- 現有主服務已經是 `src/lib/services/ticket.ts`
- 現有主型別已經是 `src/lib/types/ticket.ts`
- 但資料實際寫入路徑仍是 `/cases`

這代表後續重構應該優先做「命名對齊」，不是先做高風險 collection rename。

### 3. Separate `Campaign` from `Promotion`

規則:

- 商家可管理、可列表、可查詢的活動主體統一叫 `Campaign`
- 結帳引擎中用來計價或產生權益的規則/快照統一叫 `Promotion`
- `Activity` 視為舊 UI/service 名詞，逐步退場

原因:

- `commerce.ts` 目前以 `Activity` 表示商家活動
- `schema/promotions.ts` 以 `Promotion*` 表示結帳規則與套用結果
- `types/entities.ts`、`types/campaign.ts` 又以 `Campaign` 表示較正式的商業名詞

如果不拆清楚，後面 builder、campaign editor、checkout pricing 會持續混用。

### 4. Separate customer profile from auth binding

規則:

- `users/{uid}` 只保存登入身分與租戶關聯
- `companies/{companyId}/customers/{customerId}` 保存客戶商業資料
- 不再把「客戶登入帳號」和「商家客戶資料」視為同一個模型

建議標準詞彙:

- `UserDoc`
- `CustomerProfile`
- `CustomerAccountMembership`

### 5. Boss admin must stay outside merchant/customer role semantics

規則:

- `BossAdmin` 是 platform-only 管理入口
- 不應寫進 `UserDoc.role`
- 不應依賴 merchant `companyId` / `staffMembers` 權限規則

原因:

- 目前 `bossadmin` 走獨立 cookie 驗證，不走 Firebase session role gate
- 這已經說明它不是 company tenant member，而是 platform operator

## Role Boundary Map

| Zone | Who | Auth Source | Data Scope | Allowed Writes | Must Not Own |
| --- | --- | --- | --- | --- | --- |
| Official / `BossAdmin` | 平台營運者 | `bossadmin` cookie | cross-company read, official homepage settings | official homepage content, platform query views | merchant company operational data flow |
| Merchant | 公司 owner / admin / manager / staff / viewer | Firebase session + `users/{uid}` + optional `staffMembers` record | single `companyId` | company-scoped CRUD, settings, staff, inventory, campaigns, showcase prefs | cross-tenant reads, global platform admin |
| Customer | 終端客戶 | Firebase session + `users/{uid}` + bound `customerId` | single `companyId`, own customer record | own profile-adjacent actions, customer dashboard interactions | merchant settings, staff, other customers' data |
| Public Showcase | 匿名訪客或分享流量 | none or public host mapping | public-facing content for one tenant | none | authenticated operational mutations |

### Merchant role layering

商家端至少應拆成兩層，不要混成一個欄位:

- Firebase account role layer: `owner`, `company_admin`, `manager`, `staff`, `viewer`, `customer`
- Merchant permission layer: `PermissionLevel` + `StaffMember.roleLevel`

規則:

- `UserDoc.role` 解決「你是哪一類帳號」
- `PermissionLevel` 解決「你在這家公司裡可以做什麼」

## Entity Relationship Map

### Identity and tenancy

```text
users/{uid}
  -> role
  -> companyId
  -> customerId?

companies/{companyId}
  -> ownerUid
  -> slug / subdomain / public domain
```

### Merchant operator side

```text
companies/{companyId}
  -> staffMembers/{staffMemberId}
  -> permissionLevels/lv{n}
  -> settings/companyProfile
  -> settings/delete-control
  -> deleteLogs/{logId}
  -> auditLogs/{logId}
```

### Customer and repair flow

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

### Derived read models

下列內容目前比較像 read model / aggregate，不應直接當 source of truth:

- `customer360.ts` 組出的 `Order`, `Receipt`, `Payment`, `Warranty`, `DiagnosticReport`
- `merchantOverview.ts` 的 relationship overview rows
- boss admin revenue stats

規則:

- 這些衍生模型可以存在
- 但命名上要明確標成 aggregate / snapshot / read model
- 不要再讓它們看起來像真正已落庫的正式主模型

## Database Content vs UI / i18n Text

### Must be stored in DB

- 公司名稱、商店顯示名稱、聯絡資訊
- 客戶名稱、電話、地址、Email
- ticket / case 的標題、備註、維修原因、維修建議
- product / used product / campaign 的商業內容
- homepage/showcase builder 的區塊內容
- slug、subdomain、domain、public homepage mapping
- 狀態碼與 enum code

### Must stay in UI / i18n layer

- sidebar 與 topbar 導航文案
- page title / subtitle
- toolbar labels
- button text
- empty state 標題與說明
- filter label / pagination label / result count label
- status code 的翻譯顯示字串

### Storage rule for status-like fields

DB 裡存:

- `company_admin`
- `customer`
- `new`
- `in_progress`
- `inspection_estimate`
- `active`

UI 顯示才翻譯成:

- 管理員 / Customer
- 新案件 / In Progress
- 初步報價 / Active

規則:

- DB 不存中英文 UI 字串
- UI 不自己硬寫商業資料欄位內容

## Duplicated or Conflicting Areas to Refactor

### Schema layer

| Area | Files | Problem | Phase 1 Decision |
| --- | --- | --- | --- |
| ticket vs case | `src/lib/schema/cases.ts`, `src/lib/types/ticket.ts`, `src/lib/services/ticket.ts` | collection path 用 `cases`，型別/service 用 `ticket`，shape 也不完全一致 | 以 `Ticket` 為主名，`cases` 當 legacy path |
| plural compatibility wrappers | `src/lib/schema/customer-entitlements.ts`, `src/lib/schema/pickup-reservations.ts` | 檔名像正式 schema，但其實只是轉 export 相容層 | 保留短期相容，後續 import 全部收斂到 singular canonical files |
| product model duplication | `src/lib/types/product.ts`, `src/lib/types/merchant-product.ts`, `src/lib/types/commerce.ts` | canonical catalog product 與 merchant read-model product shape 不同，舊聚合型別容易讓 import 誤用 | 先分成 focused modules，`commerce.ts` 只保留 compatibility barrel |
| campaign naming duplication | `src/lib/types/campaign.ts`, `src/lib/types/promotion.ts`, `src/lib/schema/promotions.ts`, `src/lib/types/commerce.ts` | `campaign` / `activity` / `promotion` 分不清責任 | campaign = merchant entity, promotion/activity = legacy checkout or dashboard read-model，逐步退出 `commerce.ts` |
| company root duplication | `src/lib/types/entities.ts`, `src/lib/schema/companyProfile.ts`, auth/register types | `Company`, `CompanyProfile`, `tenantId`/`companyId` 混用 | company root 與 profile 拆開，內部統一 `companyId` |

### Service layer

| Area | Files | Problem | Phase 1 Decision |
| --- | --- | --- | --- |
| tenant alias leakage | `src/lib/services/user.service.ts`, `src/lib/services/homepage-url.service.ts` | `getShowcaseTenantId` 實際回傳的是 company key，但名字像獨立概念 | 後續改成明確 alias helper，避免 service 語意模糊 |
| oversized commerce service | `src/lib/services/commerce.ts` | 同時管 customers, products, activities, bossadmin stats, security settings | 型別與 read-side import path 已先拆出 focused modules / wrappers；後續再拆為 customer, campaign, product, bossadmin read-model services |
| derived read models mixed with source models | `src/lib/services/customer360.ts`, `src/lib/services/customerRelationships.ts`, `src/lib/services/merchantOverview.ts` | aggregate 和 source entity 邊界不清楚 | 這類服務命名明確標示 snapshot / overview |
| used product writes to cases | `src/lib/services/used-products.service.ts` | 二手商品流程直接寫 `/cases`，更強化 case/ticket 混名 | 保留 path，但文件與型別改以 ticket 語意統一 |

### Route layer

| Area | Files | Problem | Phase 1 Decision |
| --- | --- | --- | --- |
| boss admin typo route | `src/app/(platform)/bosadmin/page.tsx`, `src/app/(platform)/bossadmin/page.tsx` | 存在拼字錯誤 alias route | `bossadmin` 為 canonical，`bosadmin` 只保留 redirect shim 或移除 |
| public tenant route duplication | `src/app/(customer)/[tenantId]/*`, `src/app/(customer)/site/[tenantId]/*`, `src/app/(customer)/site/by-host/page.tsx` | 同一個公開 tenant 展示有兩套路徑 | `/:tenantId` 作 canonical，`/site/*` 視為相容或 host resolver 專用 |
| customer dashboard duplication | `src/app/(customer)/customer-dashboard/*`, `src/app/(customer)/[tenantId]/dashboard/page.tsx` | 既有 tenant-aware dashboard，也有 generic dashboard | tenant-aware route 優先，generic route 留作 fallback |
| merchant dashboard tabs vs dedicated routes | `src/app/(merchant)/dashboard/page.tsx`, `src/app/(merchant)/dashboard/*`, `src/app/(merchant)/products/*`, `src/app/(merchant)/staff/*` | 有些功能在 dashboard tab，有些在獨立 CRUD route，命名和責任未完全收斂 | 後續配合 shell refactor 收斂成 overview / index / builder 路由策略 |

## Recommended Refactor Order After This Phase

1. 先建立 canonical domain glossary，讓 `companyId / tenantId`、`ticket / case`、`campaign / promotion` 有唯一定義。
2. 再整理 shared types，先處理最容易發散的 `Ticket`、`CustomerProfile`、`Product`、`Campaign`。
3. 然後收斂相容層 import，減少 plural wrapper 與重複 type file。
4. 之後才做 Firebase reset / reseed，避免 seed 新資料時繼續使用舊命名。
5. 最後再做 route rename 與 shell/page 層標準化。

## Immediate Refactor Targets

最適合在 Firebase reset 前先動手的檔案:

- `src/lib/services/user.service.ts`
- `src/lib/services/homepage-url.service.ts`
- `src/lib/types/ticket.ts`
- `src/lib/schema/cases.ts`
- `src/lib/types/product.ts`
- `src/lib/types/commerce.ts`
- `src/lib/types/campaign.ts`
- `src/lib/schema/customer-entitlements.ts`
- `src/lib/schema/pickup-reservations.ts`
- `src/app/(platform)/bosadmin/page.tsx`

## Phase 1 Exit Criteria

進入 Firebase rebuild 前，至少要達成:

- 所有內部 shared types 以 `companyId` 為 canonical tenant key
- `ticket` / `case` 的責任分工有明確文件與 import 方向
- `campaign` / `promotion` 的責任分工有明確文件與 import 方向
- customer profile 與 auth identity 被視為兩個模型
- official / merchant / customer 的 auth boundary 有明確切割
- route alias 與 legacy wrapper 都有清楚退場計畫
