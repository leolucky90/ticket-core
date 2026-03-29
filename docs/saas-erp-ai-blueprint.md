# SaaS ERP + AI 系統藍圖（ticket-core 完整版）

> **Docs 版本／更正：** 見 [`DOCUMENTATION-VERSION.md`](./DOCUMENTATION-VERSION.md)

本檔為 **提案／交接／Codex 微套用** 用的 **單一合併規格**：整合多輪草稿與 **實際程式庫**，並標註 **canonical 命名** 與 **勿重複實作** 邊界。  
細部規則仍以 `docs/project-rules.md`、`docs/project-summary.md` 為準；資料流與 demo 帳號見 `docs/multi-tenant-data-flow.md`。

---

## 一、專案定位與技術棧

| 項目 | 說明 |
| --- | --- |
| 框架 | Next.js 16 App Router |
| 資料 | Firestore（**多租戶隔離以 `companies/{companyId}` 為根**，非根層 `tenants/{id}`） |
| 原則 | UI 不含業務規則；schema 集中 `src/lib/schema`；寫入優先 `src/lib/services`（merchant focused wrappers） |
| AI | 不直接覆寫正式商業資料；需人工確認處（Po、OCR 草稿等） |

---

## 二、租戶隔離（草稿修正：勿用 `tenants/` 根 collection）

**❌ 草稿範例（不採用）：** `db.collection("tenants").doc(tenantId).collection(path)`  
**✅ ticket-core canonical：** 內部資料欄位與 Firestore 路徑一律以 **`companyId`** 為準；公開路由參數才可能稱 `tenantId`（語意常與 `companyId` 相同）。見 `src/lib/tenant-scope.ts` 之 `normalizeCompanyId`。

**對應心智模型：**

```text
「Tenant（租戶）」在文件敘述中 = 一家公司 = Firestore 的 companies/{companyId}
```

### 商業化 SaaS 視角（提案用「最終拼圖」）

對外敘事可採用下列 **平台 → 公司（租戶）** 樹狀結構；**實作上仍以 `companies/{companyId}` 為唯一資料根**，勿引入根層 `tenants/{id}` collection。

```text
Platform（營運方／BossAdmin 視角）
 └─ Companies（companies/{companyId}）— 客戶公司
     ├─ Subscription／Billing（建議：方案、Stripe customer id、狀態 — 見下文「Stripe」）
     ├─ Stores / Warehouses / warehouseInventory / stockItems / inventoryLogs / transfers
     ├─ Users：Firebase `users/{uid}` + `staffMembers`（Lv1～Lv9）
     ├─ ERP：inventory（公司層）／sales／cases／products
     ├─ AI：OCR → poDrafts → purchaseOrders；reorder 建議（不直寫庫存）
     └─ White-label：公司 profile、slug、subdomain、主題（CSS variables）
```

---

## 三、核心架構（合併樹）

```text
Company（companies/{companyId}）
 ├─ stores/{storeId}                    — 分店
 │   └─ （倉庫見下，與 store 以 storeId 關聯）
 ├─ warehouses/{warehouseId}          — 倉庫（含 storeId）
 │   ├─ warehouseInventory/{wh_product} — 倉別庫存（key：warehouseId + productId）
 │   ├─ stockItems/{id}                 — IMEI／序號逐件
 │   └─ inventoryLogs/{id}              — 倉別時間軸（transfer_in/out 等）
 ├─ transfers/{id}                      — 跨倉調貨單（選用）
 ├─ products/{productId}              — 品項（canonical：Product）
 ├─ sales/{saleId}                      — 銷售／POS 結帳紀錄
 ├─ inventory/{productId}               — 公司層庫存彙總（既有主線）
 ├─ inventoryMovements/{id}             — 公司層異動紀錄（既有）
 ├─ cases/{caseId}                      — 案件（UI：Ticket；legacy collection 名 cases）
 ├─ customers/{customerId}
 ├─ （活動／促銷／寄存等見既有 checkout／promotions／pickup…）
 ├─ intakeDocuments / ocrResults / poDrafts / purchaseOrders — OCR → AI → PO
 ├─ permissionLevels/lv1..lv9
 ├─ staffMembers/{id}
 └─ auditLogs/{id}
```

**勿重複實作：** 公司層 `inventory`／結帳扣庫／寄存／促銷已存在於既有 `inventory` 服務與 checkout；**多倉**為 **擴充**，與上列並存。見 `project-summary` 與 `inventory` 相關註記。

---

## 四、權限系統 Lv1～Lv9（完整設計對齊）

| 項目 | ticket-core 實作 |
| --- | --- |
| 資料模型 | `companies/{companyId}/permissionLevels/lv{1..9}`（`schema/permissionLevels.ts`） |
| 員工層級 | `StaffMember.roleLevel`（1～9），非草稿的 `Employee.tenantId` 型別 |
| 能力鍵 | `src/lib/permissionKeys.ts`（`staff.*`、`deleteLogs.*`、`dashboard.view` 等） |
| 預設種子 | `permission-level.service.ts` → **`DEFAULT_PERMISSION_MAP`**（Lv1 最窄、Lv9 含 hard delete／授權鍵） |
| UI | `/settings/staff/roles` |
| Guard | `access-control`／各 route action 內檢查；**勿**另起根目錄 `PERMISSIONS = { DELETE: 9 }` 雙軌，應擴充既有鍵與 level 對應 |

**Codex 微調建議：** 若需「數字門檻」輔助，在 **單一模組**內封裝並對照 `DEFAULT_PERMISSION_MAP`，避免與字串 permission 分裂為兩套真理來源。

---

## 五、庫存、預約、活動（與草稿流程對齊）

| 概念 | ticket-core |
| --- | --- |
| 公司層扣庫／預約 | `src/lib/services/inventory/index.ts`：`reserveInventory`、`releaseReservedInventory`、`completeReservedPickup` 等；寄存見 `pickupReservations` |
| 倉別預留／調撥 | `warehouseInventory` + `transferStock`（`services/inventory/transfer-service.ts`）+ `logInventory`（`inventoryLogs`） |
| Campaign 不扣庫 | 以 **checkout／promotion 規則** 實作為準；勿在 UI 用 `if (item.isCampaign) return` 單點硬塞，應服務層一致 |

---

## 六、IMEI／序號

- Schema：`src/lib/schema/stock-item.ts`
- 服務：`src/lib/services/inventory/imei-service.ts`（`createStockItem`）

---

## 七、庫存時間軸（強制記錄）

| 層級 | Collection | 用途 |
| --- | --- | --- |
| 公司層 | `inventoryMovements` | 既有：進銷存異動類型 |
| 倉別 | `inventoryLogs` | 調貨、倉別入出庫等（`services/inventory/timeline-service.ts`） |

---

## 八、跨店／跨倉調貨

- `transferStock`（transaction + `transfer_out` / `transfer_in` 兩筆 log）
- 路徑見 `services/inventory/transfer-service.ts`

---

## 九、OCR → AI → PO Draft → Confirm

**實際流程（與草稿一致但路徑為 company-scoped）：**

```text
Upload → document-intake（OCR）→ OpenAI 結構化 → poDrafts
→ 商家編輯（含品項／DimensionPicker／productId 連動）
→ Confirm → purchaseOrders
```

- 後台：`/dashboard/purchase-orders`
- Demo：`/demo/receipt-po`（API 需商家登入）
- 環境變數與集合名見 `project-summary`、`multi-tenant-data-flow`

---

## 十、老闆 Dashboard（營收／庫存／AI 建議）

| 能力 | 狀態 | 實作入口 |
| --- | --- | --- |
| 營收／筆數／趨勢 | ✅ | `getDashboardBundle` → `CompanyDashboardWorkspace`（`/dashboard?tab=dashboard`） |
| 估計 COGS／毛利 | ✅ | `lib/reporting/financial-summary.ts`（明細 × 品項成本） |
| 庫存 KPI／操作紀錄 | ✅ | 同頁庫存區塊、`inventory` 相關列表 |
| AI 補貨建議 | ✅ 服務層 | `services/ai/reorder-service.ts`（`generateReorderSuggestion`）；**不**直寫庫存 |
| 操作稽核 | ✅ | `/settings/security/audit-logs` |

**勿採用草稿的** `getDashboard(tenantId)` + 根層 `orders` **掃全檔**；本專案以 **session `companyId`** + 既有 **sales** 讀模為準。

---

## 十一、AI 補貨

- 實作：`openai.chat.completions`，模型預設 `gpt-4o-mini`，可選 `OPENAI_REORDER_MODEL`
- **勿**依賴草稿中的 `gpt-5.4-mini`／`responses.create` 除非產品明確升級 SDK 與模型名稱

---

## 十二、完整 Demo Flow（提案用，含建議路徑）

### A. 現有程式庫可跑通的演示順序

以下為 **可對外演示** 的建議順序（帳號見 `multi-tenant-data-flow.md`，密碼見 demo 常數）：

1. **商家登入** → 進入 `/dashboard?tab=dashboard`（營收、毛利估計、庫存 KPI）
2. **收據／發票** → 上傳與 OCR／AI 草稿（`document-intake` 或 `/demo/receipt-po`）
3. **採購草稿** → `/dashboard/purchase-orders` 編輯 Po Draft（品項連動 `productId`）
4. **確認採購單** → 寫入 `purchaseOrders`（人工確認後）
5. **品項／庫存** → `/dashboard?tab=inventory` 或 `/dashboard/products`（入庫／出庫／品項）
6. **結帳** → `/dashboard/checkout` → 銷售寫入 `sales`、扣庫走既有流程
7. **儀表板** → 再次檢視營收與毛利估計、庫存操作紀錄
8. **（選）稽核** → `/settings/security/audit-logs`
9. **（選）權限** → `/settings/staff/roles` 說明 Lv1～Lv9

### B. 「可商業化 SaaS 完整版」敘事流程（產品／提案用）

當需要對投資人或客戶描述 **訂閱 + 白牌 + 營運閉環** 時，可採用下列 **10 步**（其中 **方案選擇／Stripe 結帳** 為產品規劃，見第十六～十七節；其餘多數已可由現有後台路徑支撐）：

1. **註冊** → 建立公司（`register/company` → `companies/{companyId}` + `users/{uid}`）
2. **選擇方案** → Stripe Checkout（規劃中；見第十七節）
3. **進入 Dashboard** → `/dashboard?tab=dashboard`
4. **上傳收據** → OCR + 結構化草稿
5. **AI 生成 PO Draft** → `poDrafts`（人工可編）
6. **編輯 + Confirm** → `purchaseOrders`
7. **建立銷售／訂單** → 結帳 `/dashboard/checkout` → `sales`
8. **結帳** → 扣庫存（既有 inventory／checkout）
9. **Dashboard 更新** → 營收、估計 COGS／毛利、庫存 KPI
10. **AI 補貨建議** → `generateReorderSuggestion`（建議值，不逕寫庫存）

---

## 十三、Firestore「完整版」清單（對照草稿）

草稿列 `tenants`、`employees` 等 **根集合** — **不採用**。以下為 **ticket-core 語意對照**：

| 草稿名稱 | ticket-core |
| --- | --- |
| tenants | `companies/{companyId}` |
| employees | `staffMembers` + `users/{uid}` |
| orders | 主線為 **`sales`**（結帳／收據語意） |
| stores / warehouses / … | 見第二節樹狀結構 |
| inventory（根） | 公司層：`companies/.../inventory`；倉別：`warehouseInventory` |
| inventoryLogs | 倉別：`companies/.../inventoryLogs`（勿與 legacy `inventory_logs` 混淆） |

---

## 十四、給 Codex 的微調清單（避免重複／漂移）

1. **租戶：** 只信 `companyId` + `companies/{companyId}`，勿新增根層 `tenants` collection wrapper。
2. **庫存：** 擴充既有 `inventory` 服務與 write wrapper，勿第二套根層 `inventory` 服務。
3. **權限：** 擴充 `permissionKeys` + `DEFAULT_PERMISSION_MAP`，勿平行維護純數字 `PERMISSIONS` 物件。
4. **Dashboard：** 擴充 read-model／`financial-summary`，勿直連 `commerce.ts` 新依賴（除非收斂遷移）。
5. **文件：** 變更 `docs/` 任一支檔必 bump `DOCUMENTATION-VERSION.md` + `documentation-version.ts`。
6. **Billing：** 新增 Stripe 時，計費狀態寫入 **`companies/{companyId}`**（或專用子集合），與 **BossAdmin 報表** 欄位對齊；避免第三套「訂閱」真相來源。
7. **Onboarding：** 與 `reset-firebase-data.mjs`／註冊流程擇一為種子權威，避免 demo 與正式開帳漂移兩套。

---

## 十五、結論（能力總覽）

本倉庫已具備 **SaaS 多租戶、ERP 庫存／調貨、POS 銷售、OCR+AI 採購草稿、IMEI、權限 Lv1～Lv9、老闆儀表板與稽核** 等 **可提案／可商業化 MVP 基線**；**訂閱收款（Stripe）與白牌進階計費** 見第十六～二十一節之 **產品與整合規劃**，實作時仍須遵守 **`companyId` 隔離** 與 **勿重複實作** 邊界。

---

## 十六、Pricing 方案矩陣（建議，非程式硬編碼）

下列為 **go-to-market 建議**，實際 entitlements 應以單一設定來源（例如 Firestore `companies/{companyId}` 的 `plan` / `limits` 或子集合 `billing/*`）為準，並與 **Stripe Price / Product** 對齊。

| 方案 | 建議內容 | 建議月費（參考） |
| --- | --- | --- |
| **STARTER** | 1 店、少數使用者、無 AI 進階 | $0～$9 |
| **PRO** | 數間店、OCR + PO 草稿、較多使用者 | ~$29 |
| **BUSINESS** | 多店、AI 補貨建議、API／整合預留 | ~$99 |
| **ENTERPRISE** | 白牌、自訂網域、私有部署／SLA | 專案議價 |

**與現況對照：** 程式庫 **尚未** 內建 Stripe 或方案升降級 UI；BossAdmin 端可檢視公司資料上與訂閱相關之 **時間／金額欄位**（見 `BossAdminWorkspace`、型別 `reporting`），屬營運／展示用途，**不作為** 已完成的線上收款閉環。

---

## 十七、Stripe 訂閱整合（規劃藍圖）

**狀態：規劃文件；本 repo 目前無 `stripe` 依賴與 Checkout／Webhook 路由。**

整合時請遵守：

- **metadata 使用 `companyId`**（canonical），勿用僅在公開路由出現的 `tenantId` 字串當唯一內部鍵。
- **success / cancel URL** 指向自家 `APP_URL` 路徑。
- **webhook** 於 `checkout.session.completed` / `customer.subscription.*` 等事件更新 **`companies/{companyId}`**（或 `billing` 子文件）之 `plan`、`subscriptionStatus`、`stripeCustomerId` 等；**不要**寫入與租戶無關的全域集合。

示意（偽碼，實作時再建 API route 與環境變數）：

```ts
// metadata.companyId = canonical tenant key
await stripe.checkout.sessions.create({
  mode: "subscription",
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: `${process.env.APP_URL}/dashboard?checkout=success`,
  cancel_url: `${process.env.APP_URL}/pricing?checkout=cancel`,
  metadata: { companyId },
});
```

```ts
// webhook：依 event 更新 Firestore companies/{companyId}
if (event.type === "checkout.session.completed") {
  const companyId = event.data.object.metadata?.companyId;
  // await updateCompanyBilling(companyId, { plan: "PRO", status: "active" });
}
```

---

## 十八、Onboarding（新客戶開帳）

**現況對齊：** 公司註冊綁定見 `docs/multi-tenant-data-flow.md`（`users/{uid}` + `companies/{companyId}`）。

產品化 onboarding 可延伸為：

1. 註冊後引導填寫 **公司名稱／聯絡方式**（`settings/companyProfile` 等既有路徑）。
2. 選用：建立 **預設分店／倉**（`stores`、`warehouses`）— 與多倉 schema 一致時再自動 seed，避免與既有 demo reset 邏輯重複維護兩套。
3. 選用：導向 **採購／品項** 或 **Dashboard** 空態 CTA。

**勿**在文件或程式中另建根層 `tenants` collection；開帳 = **`companies/{companyId}` 文檔與關聯子集合**。

---

## 十九、白牌（White-label）

**現況對齊：** `project-rules.md` — 公司名稱、slug、subdomain、domain、showcase 對應存在於 **company profile** 與 app_config；客戶端 **`site/by-host`** 可依 host 解析租戶（見 `codebase-map.md`）。

| 面向 | 建議 |
| --- | --- |
| 品牌 | 公司顯示名稱、展示頁 builder 內容 |
| 主題 | 全站 **CSS variables**（`globals.css`），遵守 `project-rules` 色票，不硬編色碼於業務邏輯 |
| 網域 | 自訂網域／子網域為 **ENTERPRISE** 級產品敘事；實作時與 DNS、middleware host 解析一致 |

草稿中的 `getTenantFromHost` 僅示意；本專案應以 **既有 `normalizeCompanyId` / showcase 路由** 為準，避免平行第二套 host 規則。

---

## 二十、AI 自動營運（產品亮點與實作邊界）

| 能力 | 說明 | ticket-core |
| --- | --- | --- |
| **補貨建議** | 依庫存／銷售等輸出建議量 | `services/ai/reorder-service.ts`（**不**直寫庫存） |
| **自動建單（PO）** | 草稿 → 人工確認 → 正式採購單 | OCR → `poDrafts` → `purchaseOrders`；**無**自動寫入正式 PO 而不經人工 |
| **分析／洞察** | 老闆儀表板 | 營收、筆數、`financial-summary`（COGS／毛利估計）；進階敘事可再接 LLM，**不得**覆寫帳務真相來源 |

---

## 二十一、商業模式建議（可並存）

1. **月費 SaaS**（與第十六節方案矩陣、第十七節 Stripe 對齊）。
2. **交易手續費**（若未來內建金流代收，需另立合規與會計流程）。
3. **AI 使用量計費**（OCR／OpenAI token；可與方案配額或 overage 並列）。
4. **White-label／Enterprise** 專案費（自訂網域、私有部署、SLA）。

---

## 二十二、結論

本文件整合 **技術架構（companyId）、權限 Lv1～Lv9、老闆 Dashboard、OCR→PO、Demo Flow、Pricing／Stripe／Onboarding／白牌／AI 營運敘事**；**程式庫已落地者** 以 `project-summary.md` 為準，**商業收款與方案升降級** 以本檔第十六～十七節為 **規劃基線**，實作時同步更新本藍圖與 canonical docs。

**「未落地／第三方 API／待細修」實作驗證用對照表**（含 API 矩陣、多倉 UI、架構收斂）已集中於 **`project-summary.md`** 之 **「未落地／待細修／第三方 API 對照（實作驗證用）」** 小節，與 **「收據／採購 intake — 待辦與後續優化」** 並列。

---

END
