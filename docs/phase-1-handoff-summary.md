# Moved

Canonical docs 已改成:

- `docs/project-rules.md`
- `docs/project-summary.md`

這個檔案只保留相容提醒，不再作為主摘要來源。

## Canonical Naming Rules

- internal tenant key 一律用 `companyId`
- public route / host alias 才用 `tenantId`
- business model 一律用 `Ticket`
- Firestore collection path 暫時維持 `cases`
- customer business record 用 `CustomerProfile`
- auth identity 不等於 customer business record
- merchant activity 主體長期目標叫 `Campaign`
- checkout pricing / entitlement snapshot 叫 `Promotion`
- `Activity` 目前只當 legacy dashboard/read-model 名詞
- official backend canonical name 是 `BossAdmin`
- `bosadmin` 只當 typo compatibility route

## Implemented Phase 1 Decisions

### Tenant / Company Scope

- `src/lib/tenant-scope.ts`
  - canonical normalization helper
  - 集中 `normalizeCompanyId`
  - 集中 `normalizeTenantId`
  - 集中 `normalizeAuthTenantId`

- `src/lib/services/user.service.ts`
  - 已有 `getUserCompanyId`
  - `getShowcaseTenantId` 保留 public alias 語意，不應再拿來做內部 company scope

### Shared Types

- `src/lib/types/customer.ts`
  - canonical customer shared type

- `src/lib/types/merchant-product.ts`
  - merchant product read-model

- `src/lib/types/promotion.ts`
  - legacy activity / promotion read-model

- `src/lib/types/inventory.ts`
  - inventory log read-model

- `src/lib/types/repair-brand.ts`
  - repair brand / model grouping

- `src/lib/types/reporting.ts`
  - boss admin reporting / revenue stats

- `src/lib/types/commerce.ts`
  - 現在是 compatibility barrel
  - 新 code 不應優先 import 這裡

### Ticket / Case Boundary

- `src/lib/types/ticket.ts`
  - canonical ticket type

- `src/lib/schema/cases.ts`
  - 已明確標成 legacy Firestore bridge
  - 目前保留 `TicketCaseRecord` / compatibility alias

### Service Boundary Progress

- `src/lib/services/merchant/activity-read-model.service.ts`
- `src/lib/services/merchant/customer-read-model.service.ts`
- `src/lib/services/merchant/inventory-read-model.service.ts`
- `src/lib/services/merchant/dashboard-read-model.service.ts`
- `src/lib/services/platform/bossadmin-reporting.service.ts`

規則:

- 新的 read-side caller 優先從上述 focused service import
- 不要讓新 route / page / feature 再直接依賴 `src/lib/services/commerce.ts`
- `commerce.ts` 目前仍是 compatibility-heavy service，不是理想終點

## Files That Are Intentionally Compatibility Layers

- `src/lib/types/commerce.ts`
- `src/lib/schema/customer-entitlements.ts`
- `src/lib/schema/pickup-reservations.ts`
- `src/app/(platform)/bosadmin/page.tsx`
- `src/lib/services/commerce.ts`

規則:

- 可保留
- 但新程式碼不要再擴散對這些 compatibility layer 的依賴

## Safe Import Rules For New Work

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

## Things To Avoid In New Work

- 不要新增新的 local `normalizeTenantId` / `normalizeCompanyId`
- 不要把 `tenantId` 當 internal DB canonical field name
- 不要新增新的 `case` 主型別來跟 `Ticket` 並存
- 不要把 `Activity` 當長期 canonical marketing entity 名詞
- 不要讓 page / route 直接塞 heavy business logic
- 不要再把新的 shared type 塞回 `commerce.ts`
- 不要把 official / merchant / customer auth boundary 混在同一套 role semantics

## Next Best Work After Phase 1

如果下一輪要繼續，不要重做 Phase 1 文件；直接做下列其中一項:

1. 真正拆 `src/lib/services/commerce.ts` 內部實作，把 customer / inventory / activity / bossadmin reporting 分檔
2. 繼續把 mutation action 也從 `commerce.ts` 抽到 focused service
3. 收斂 `campaign` / `promotion` / `activity` 的實作層命名
4. 進入 shell/page 標準化的下一階段

## Validation Commands

每次收尾都要跑:

- `pnpm -s lint`
- `pnpm -s exec tsc --noEmit`
- `pnpm -s exec next build --webpack`
- `pnpm run verify`

## Suggested New-Chat Starter

可直接在新對話貼這段:

```text
請延續 ticket-core 的 Phase 1 規則，不要重做已完成的命名收斂。
目前 canonical 規則是 companyId 內部、tenantId 公開路由、Ticket 主模型 / cases legacy path、CustomerProfile 與 auth identity 分離、commerce.ts 只當 compatibility layer。
新的 read-side 請優先使用 merchant/platform focused service wrappers，不要新增對 commerce.ts 或 types/commerce.ts 的直接依賴。
先讀 docs/phase-1-data-model-boundaries.md 與 docs/phase-1-handoff-summary.md，再接著做下一步。
```
