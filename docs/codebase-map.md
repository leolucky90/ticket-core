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
| `docs/` | Canonical 與補充文件；**文件集版本／更正日**見 `DOCUMENTATION-VERSION.md` |

---

## `src/app` — 路由層（僅組裝，避免厚重業務邏輯）

採 **Next.js App Router**；區段以 route groups 分區。

### 公開／平台 `(platform)`

| 區域 | 用途 |
| --- | --- |
| `(platform)/page.tsx` | 入口首頁（portfolio／敘事） |
| `(platform)/login`、`forgot-password`、`reset-password` | 認證流程頁 |
| `(platform)/register/company`、`register/customer` | 註冊 |
| `(platform)/business` | 商業／提案相關落地 |
| `(platform)/bossadmin` | **BossAdmin** 官方後台（hidden cookie login） |
| `(platform)/bosadmin` | 拼字相容路由，導向 bossadmin |

### 商家後台 `(merchant)`

主要營運後台；layout 內通常組 `MerchantAppShell`／`MerchantPageShell` 與對應 workspace／panel。

| 路徑片段 | 主題 |
| --- | --- |
| `dashboard/` | 儀表板、結帳、收據、客戶詳情、關聯總覽、寄售、品項列表等 |
| `sales/` | 銷售／結帳相關工作區 |
| `staff/`、`staff/new`、`staff/[id]/edit`、`staff/deleted` | 員工管理、軟刪待處理／歷史 |
| `products/used/` | 二手商品 |
| `settings/` | 帳戶、儀表板偏好、展示頁、安全、刪除控制、刪除紀錄、角色權限等 |
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
| `src/app/ai/chat` | AI 聊天入口（遵守 project-rules：AI 不直接覆寫正式資料） |
| `src/app/api/**` | Route Handlers（auth、bootstrap、merchant search、showcase upload、ticket-attributes 等） |

---

## `src/components` — UI 與功能區塊

| 目錄 | 職責 |
| --- | --- |
| `components/ui/` | **純展示**可重用元件（button、processing、overlay 等）；無業務規則 |
| `components/merchant/shell/` | **商家 shell 基線**：`MerchantPageShell`、`MerchantSectionCard`、`MerchantListShell`、`SearchToolbar`、sidebar／topbar 等 |
| `components/merchant/search/` | 商家預測／搜尋輸入 |
| `components/merchant/catalog/` | 目錄維度選擇等共用 UI |
| `components/layout/` | `ProtectedShell`、`ui-language-provider`、`navigation-progress` 等全站版面 |
| `components/dashboard/` | 儀表板大型 workspace（結帳、營銷設定、BossAdmin、品項等） |
| `components/staff/` | 員工列表、表單、軟刪／保險庫區塊等 |
| `components/settings/` | 刪除控制、刪除紀錄、票務屬性、密碼表單等 |
| `components/account/` | 帳戶／安全相關面板 |
| `components/auth/` | 登入、Google、重設密碼等表單 |
| `components/sales/` | 銷售工作區 |
| `components/used-products/` | 二手商品管理 UI |
| `components/ai/` | AI 相關 UI 包裝 |

---

## `src/features` — 垂直功能模組

| 目錄 | 說明 |
| --- | --- |
| `features/business/` | 首頁／商業落地內容與服務 |
| `features/showcase/` | 展示頁 builder：`ShowcaseBuilder`、block registry、preferences、預設 template／renderer |
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

常用 canonical 模組包含：`customer.ts`、`ticket.ts`、`merchant-product.ts`、`catalog.ts`、`promotion.ts`、`inventory.ts`、`repair-brand.ts`、`reporting.ts` 等。

### Schema `lib/schema/`

Firestore／資料形狀與 bridge；例如 `cases.ts`（ticket legacy）、`deleteLogs.ts`、`staffMembers.ts`、`itemNamingSettings.ts` 等。`schema/index.ts` 匯出索引。

### 服務 `lib/services/`

| 區域 | 說明 |
| --- | --- |
| 根層各 `*.service.ts` / 模組 | 跨域或尚未下沉之服務（`user`、`staff`、`delete-log`、`ticket`、`sales`、`company-profile` 等） |
| `services/merchant/` | **商家 read-model／catalog／write wrapper** 優先入口（`*-read-model.service.ts`、`*-write.service.ts`、`catalog-service.ts`、`product-service.ts` 等） |
| `services/platform/` | 平台層（如 `bossadmin-reporting.service.ts`） |
| `services/commerce.ts` | **Compatibility**：新程式碼勿新增直接依賴，除非做收斂遷移 |
| `checkout/`、`inventory/`、`entitlements/`、`pickupReservations/`、`promotions/` | 領域子模組 |

### 其他 `lib/`

| 路徑 | 說明 |
| --- | --- |
| `lib/i18n/` | `ui-text.ts` 為共用 UI 字串主檔；與 `ui-language-provider` 搭配 |
| `lib/pagination/query-controls.ts` | cursor 分頁控制共用邏輯 |
| `lib/ui/list-display.ts` | 列表 page-size 等共用常數 |
| `lib/format/` | 顯示用格式化（電話、日期時間等） |
| `lib/marketing/` | 營銷輔助（如品牌目錄） |
| `lib/ai/` | AI 輔助邏輯封裝 |
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
2. **改 Firestore 規則或寫入路徑**：對應 `lib/services`（優先 `merchant/*-write.service.ts`），並檢查 cache invalidation（若有 warm cache）。
3. **改展示頁 builder**：`features/showcase/`。
4. **改員工／刪除紀錄**：`staff.service.ts`、`delete-log.service.ts`、`app/(merchant)/staff/**`、`components/staff/**`。
5. **改 i18n 框架字串**：`lib/i18n/ui-text.ts`，避免在單一 page 硬編中英分支擴散。

---

## 維護

- 目錄大搬風、rename route group、抽出新 shared 模組時：更新本檔。
- 不必逐檔列出所有 `.tsx`；以 **目錄職責 + 關鍵入口** 為主，避免與 git 樹重複且易過時。
