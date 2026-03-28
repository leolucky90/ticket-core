# Project Summary

## How To Use This File Set

之後新的對話、摘要更新、handoff 都以這兩個檔案為主:

- `docs/project-rules.md`
- `docs/project-summary.md`

如果要在新對話延續上下文，應先讀這兩個檔案，再開始工作。

## Current Status

目前已完成到適合交接的狀態:

- canonical naming rules 已文件化
- tenant / company normalization 已集中
- customer shared type 已抽離成 canonical module
- `cases` 已明確標成 ticket legacy bridge
- `types/commerce.ts` 已縮成 compatibility barrel
- merchant / platform read-side import path 已開始從大型聚合 service 抽離
- `lint` / `tsc` / `build` / `verify` 已通過
- 目前沒有 lint warning

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

### Focused Service Wrappers

- `src/lib/services/merchant/activity-read-model.service.ts`
- `src/lib/services/merchant/customer-read-model.service.ts`
- `src/lib/services/merchant/inventory-read-model.service.ts`
- `src/lib/services/merchant/dashboard-read-model.service.ts`
- `src/lib/services/platform/bossadmin-reporting.service.ts`

規則:

- 新的 read-side caller 優先從這些檔案 import
- 不要讓新 route / page / feature 直接依賴 `src/lib/services/commerce.ts`

## Compatibility Layers That Are Intentional

- `src/lib/types/commerce.ts`
- `src/lib/schema/customer-entitlements.ts`
- `src/lib/schema/pickup-reservations.ts`
- `src/app/(platform)/bosadmin/page.tsx`
- `src/lib/services/commerce.ts`

規則:

- 這些可以暫時保留
- 但不應擴散新的直接依賴

## Safe Starting Point For Future Work

如果下一輪繼續做，優先順序應該是:

1. 真正拆 `src/lib/services/commerce.ts` 內部實作，把 customer / inventory / activity / bossadmin reporting 分檔
2. 繼續把 mutation action 從 `commerce.ts` 抽到 focused service
3. 收斂 `campaign` / `promotion` / `activity` 的實作層命名
4. 進入 merchant shell/page 標準化的下一階段
5. 再往後才是 Firebase reset / reseed 與 builder block architecture 升級

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
