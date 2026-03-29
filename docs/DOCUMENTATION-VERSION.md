# Documentation 版本與更正日（single source of truth）

本檔為 `docs/` 資料夾內 **文件集版本** 與 **最後更正日** 的規格依據。  
其他 `docs/*.md` 頂部僅需保留連結至本檔，**不必**在各檔重複寫版本數字（避免漂移）。

**首頁 `/` 顯示的版本字串** 與 **執行時常數** 必須與下方表格一致：

- `src/lib/documentation-version.ts` → `DOCUMENTATION_VERSION_DISPLAY`

變更文件集版本時：**先**更新本檔表格與「最後更正」，**再**將同一版本字串寫入 `documentation-version.ts`（兩邊需完全相同）。

---

## 目前狀態

| 項目 | 值 |
| --- | --- |
| **版本** | **V1.11** |
| **最後更正** | **2026-03-30** |

---

## 版本與日期規則（AI／開發者必遵守）

1. **觸發條件：** 凡 **新增、刪除或修改** `docs/` 目錄下**任一**檔案（含本檔），收尾時必須更新本檔。
2. **版本號：** 自 **V1.00** 起，每次符合上述條件時，將版本**數值**加 **0.01**（例：V1.00 → V1.01 → V1.02）。
3. **最後更正：** 設為執行該次變更之**當日日期**（以工作階段或提交時之「今日」為準；跨時區專案建議與團隊約定一種日期欄位格式，本專案使用 `YYYY-MM-DD`）。
4. **執行時對齊：** 只要本檔 **版本** 欄位變更，必須同步更新 `src/lib/documentation-version.ts` 內 `DOCUMENTATION_VERSION_DISPLAY`，使首頁與本檔一致。
5. **不必**在每次變更時修改其他 docs 檔內的版本數字——除非該檔為展示用而刻意寫死（不建議）；以本檔與 `documentation-version.ts` 為準即可。

---

## 變更紀錄（可選，重大改版時簡記）

| 版本 | 日期 | 摘要 |
| --- | --- | --- |
| V1.11 | 2026-03-30 | **`project-rules.md`** 補充：未落地／第三方 API 對照指向 `project-summary` 專節 |
| V1.10 | 2026-03-30 | **`project-summary.md`** 新增「未落地／待細修／第三方 API 對照（實作驗證用）」；**`saas-erp-ai-blueprint.md`** 結論交叉引用該節與 intake 待辦表 |
| V1.09 | 2026-03-30 | 擴充 **`saas-erp-ai-blueprint.md`**：商業化平台樹、Pricing 矩陣、Stripe（規劃／`companyId` metadata）、Onboarding、白牌、`project-rules`／`project-summary`／`codebase-map` 交叉引用；標註 Stripe 未內建 |
| V1.08 | 2026-03-30 | 新增 **`docs/saas-erp-ai-blueprint.md`**：SaaS ERP+AI 完整版藍圖（租戶=`companyId`、架構樹、Lv1–9、Dashboard／OCR／Demo Flow、Codex 微調清單）；合併多輪草稿與實作對照 |
| V1.07 | 2026-03-30 | 權限 Lv1–9 文件化；操作稽核讀取（`audit-log-read-model`）與 `/settings/security/audit-logs`；儀表板估計 COGS／毛利（`lib/reporting/financial-summary`）；Safe import 與資料流文件更新 |
| V1.06 | 2026-03-30 | 多店面／多倉／IMEI／倉別庫存時間軸（`inventoryLogs`）／調貨／AI 補貨建議：schema + `services/inventory/*`、`services/ai/reorder-service`；Firestore 路徑與 `companyId` canonical 對齊 |
| V1.05 | 2026-03-30 | Po 草稿：`DimensionPicker` + 商品搜尋 API + `productId` 連動；`draft-editor`；`schema/poDraftProduct`；註記不重複新建 inventory 服務（沿用既有 schema／結帳） |
| V1.04 | 2026-03-30 | `project-summary` 新增「收據／採購 intake」待辦與後續優化備註；`codebase-map` 維護區加索引連結 |
| V1.03 | 2026-03-30 | 收據／發票 OCR（Google Vision）→ OpenAI 結構化 PoDraft → Firestore（intakeDocuments／ocrResults／poDrafts／purchaseOrders）；API `document-intake`、`po/confirm`、`po/draft`；`/demo/receipt-po`；採購頁人工確認 UI |
| V1.02 | 2026-03-29 | 新增商家 `/dashboard/purchase-orders` 採購草稿頁（AI 預留 + 人工建立）；型別／stub service／`lib/ai` placeholder；更新側欄與 codebase-map |
| V1.01 | 2026-03-29 | 首頁 `/` 顯示 ©、年份與文件集版本；版本與 `documentation-version.ts` 對齊；新增 `docs/ai-chat-starter.md` |
| V1.00 | 2026-03-29 | 初版文件集版本號與 docs 更新流程 |
